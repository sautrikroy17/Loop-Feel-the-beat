/**
 * ProfileModal — Premium full-screen library & profile experience
 *
 * Library mode: full-screen slide-in from right
 * Profile mode: full-screen centered
 *
 * Features:
 *  - Liked, Recent, Playlists, Profile tabs
 *  - Create Playlist full-page modal with file picker for cover art
 *  - Profile avatar upload via file picker (no URL prompt)
 *  - Full drag-and-drop reorder in playlist editor
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Clock, ListMusic, Play, Trash2, Music2,
  User, Plus, Camera, Image as ImageIcon, ChevronLeft,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlayback, type Track } from '@/hooks/usePlayback';
import { useListeningIntelligence } from '@/hooks/useListeningIntelligence';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase/auth';
import { LikeButton } from './LikeButton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from '@tanstack/react-router';

type ProfileTab = 'liked' | 'recent' | 'playlists' | 'stats';

// ── Helpers ────────────────────────────────────────────────────────

function fmtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── File picker helper ────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Stat card ─────────────────────────────────────────────────────

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4 flex-1">
      <span className="text-[22px] font-bold text-white">{value}</span>
      <span className="mt-0.5 text-[11px] font-medium text-white/45">{label}</span>
      {sub && <span className="mt-0.5 text-[10px] text-white/22">{sub}</span>}
    </div>
  );
}

// ── Track row ─────────────────────────────────────────────────────

function TrackRow({ track, onPlay, index, onAddToPlaylist, children }: {
  track: Track;
  onPlay: () => void;
  index?: number;
  onAddToPlaylist?: () => void;
  children?: React.ReactNode;
}) {
  const { playlists, addTrackToPlaylist } = useUserProfile();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="group relative flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.04] transition-colors">
      {children}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
        {track.albumArt
          ? <img src={track.albumArt} alt="" className="h-full w-full object-cover" />
          : <Music2 className="m-auto h-5 w-5 text-white/20" />
        }
        <button
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Play className="h-4 w-4 fill-white text-white" />
        </button>
      </div>
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPlay}>
        <div className="truncate text-[13px] font-medium text-white/90">{track.title}</div>
        <div className="truncate text-[11px] text-white/38">{track.artist}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onAddToPlaylist && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowPicker(v => !v); }}
              className="p-1.5 rounded-full text-white/20 opacity-0 group-hover:opacity-100 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              title="Add to playlist"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/[0.08] shadow-xl overflow-hidden"
                  style={{ background: 'oklch(0.09 0.025 260)' }}
                >
                  <div className="px-2 py-1.5 text-[9px] uppercase tracking-wider text-white/30 border-b border-white/[0.06]">
                    Add to playlist
                  </div>
                  {playlists.length === 0
                    ? <div className="px-3 py-3 text-xs text-white/30 text-center">No playlists</div>
                    : playlists.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { addTrackToPlaylist(p.id, track); setShowPicker(false); }}
                          className="flex items-center gap-2 w-full px-2.5 py-2 hover:bg-white/[0.06] transition-colors"
                        >
                          <div className="h-7 w-7 shrink-0 rounded-md overflow-hidden bg-white/[0.05] flex items-center justify-center">
                            {p.coverArt
                              ? <img src={p.coverArt} alt="" className="h-full w-full object-cover" />
                              : <span className="text-[9px] text-white/25">♪</span>
                            }
                          </div>
                          <span className="truncate text-[11px] text-white/75">{p.name}</span>
                        </button>
                      ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <LikeButton track={track} size="sm" />
      </div>
    </div>
  );
}

// ── Sortable Track Row ────────────────────────────────────────────

function SortableTrackRow({ track, id, onPlay, onRemove }: { track: Track; id: string; onPlay: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 group/row pr-2">
      <div {...attributes} {...listeners} className="cursor-grab p-1.5 text-white/10 hover:text-white/40 touch-none active:cursor-grabbing">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      <div className="flex-1">
        <TrackRow track={track} onPlay={onPlay} />
      </div>
      <button onClick={onRemove} className="p-2 opacity-0 group-hover/row:opacity-100 text-white/20 hover:text-red-400 transition-all">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Create Playlist Full-Page Modal ───────────────────────────────

function CreatePlaylistModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, coverArt?: string) => void;
}) {
  const [name, setName] = useState('');
  const [coverArt, setCoverArt] = useState<string | undefined>();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await readFileAsDataUrl(file);
    setCoverArt(dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), coverArt);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col"
      style={{ background: 'oklch(0.055 0.022 260)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[17px] font-bold text-white flex-1">New Playlist</h2>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: name.trim()
              ? 'linear-gradient(135deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286))'
              : undefined,
          }}
        >
          Create
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Cover Art Picker */}
        <div>
          <label className="mb-3 block text-[11px] font-medium uppercase tracking-[0.3em] text-white/35">
            Cover Art
          </label>
          <div
            className={`relative flex h-48 w-48 mx-auto cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
              dragOver ? 'border-[oklch(0.72_0.26_248)] bg-[oklch(0.72_0.26_248_/_0.08)]' : 'border-white/[0.12] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {coverArt ? (
              <>
                <img src={coverArt} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white mb-1.5" />
                  <span className="text-xs text-white font-medium">Change Photo</span>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-white/25 mb-2" />
                <span className="text-xs text-white/40 font-medium">Click or drag to upload</span>
                <span className="mt-1 text-[10px] text-white/22">JPG, PNG, WEBP</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Playlist Name */}
        <div>
          <label className="mb-3 block text-[11px] font-medium uppercase tracking-[0.3em] text-white/35">
            Playlist Name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="My Playlist"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3.5 text-[15px] font-medium text-white placeholder:text-white/25 outline-none focus:border-[oklch(0.72_0.26_248_/_0.5)] focus:ring-1 focus:ring-[oklch(0.72_0.26_248_/_0.3)] transition-all"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Playlist Editor ────────────────────────────────────────────────

function PlaylistEditor({ playlistId, onBack }: { playlistId: string; onBack: () => void }) {
  const { playlists, renamePlaylist, reorderPlaylist, removeTrackFromPlaylist } = useUserProfile();
  const { playTrack } = usePlayback();
  const playlist = playlists.find((p) => p.id === playlistId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playlist?.name ?? '');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!playlist) return null;

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = playlist!.tracks.findIndex((t) => t.id === active.id);
      const newIndex = playlist!.tracks.findIndex((t) => t.id === over.id);
      reorderPlaylist(playlist!.id, oldIndex, newIndex);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4 px-2 mb-2">
        <button onClick={onBack} className="p-1.5 rounded-full text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Cover art + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
            {playlist.coverArt
              ? <img src={playlist.coverArt} alt="" className="h-full w-full object-cover" />
              : <ListMusic className="h-5 w-5 m-auto text-white/30" />
            }
          </div>
          {isEditingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={() => {
                if (nameInput.trim() && nameInput !== playlist.name) renamePlaylist(playlist.id, nameInput.trim());
                setIsEditingName(false);
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="flex-1 min-w-0 bg-white/[0.05] rounded-md px-3 py-1.5 text-[16px] font-bold text-white outline-none ring-1 ring-[oklch(0.72_0.26_248)]"
            />
          ) : (
            <h2 className="flex-1 min-w-0 truncate text-[16px] font-bold text-white cursor-text hover:text-white/80 transition-colors" onClick={() => setIsEditingName(true)} title="Click to rename">
              {playlist.name}
            </h2>
          )}
        </div>
      </div>

      <div className="px-1">
        {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-white/18">
            <ListMusic className="h-8 w-8" />
            <p className="text-[13px]">This playlist is empty</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {playlist.tracks.map(track => (
                  <SortableTrackRow
                    key={track.id}
                    id={track.id}
                    track={track}
                    onPlay={() => playTrack(track)}
                    onRemove={() => removeTrackFromPlaylist(playlist.id, track.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </motion.div>
  );
}

// ── Profile tab ─────────────────────────────────────────────────────

function ProfileTab({ onClose }: { onClose: () => void }) {
  const intel = useListeningIntelligence();
  const topArtists = intel.getTopArtists(5);
  const topGenre = intel.getTopGenres(1)[0] || 'Unknown';
  const mood = intel.getCurrentMood();
  const { user } = useAuth();
  const { recentlyPlayed } = useUserProfile();
  const { playTrack } = usePlayback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topTracksMap = intel.events.reduce((acc, event) => {
    acc[event.trackId] = (acc[event.trackId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTracks = Object.entries(topTracksMap)
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => recentlyPlayed.find(t => t.id === trackId))
    .filter(Boolean)
    .slice(0, 5) as Track[];

  const handleUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const dataUrl = await readFileAsDataUrl(file);
    const { supabase } = await import('@/lib/supabase/client');
    await supabase.auth.updateUser({ data: { avatar_url: dataUrl } });
  };

  const MOOD_LABELS: Record<string, string> = {
    focus: '🎯 Focus Mode', chill: '🌊 Chill Vibes', 'night-drive': '🌙 Night Drive',
    party: '🔥 Party Mode', emotional: '💙 Emotional', gym: '⚡ Gym Mode',
    underground: '💎 Underground', morning: '☀️ Morning Energy', discovery: '✨ Discovery',
    balanced: '🎵 Balanced',
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
        <div
          className="relative mb-4 group cursor-pointer"
          onClick={() => user && fileInputRef.current?.click()}
          title={user ? 'Click to change profile picture' : ''}
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="h-20 w-20 rounded-full border border-white/10 object-cover transition-opacity group-hover:opacity-50" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06] transition-opacity group-hover:opacity-50">
              <User className="h-8 w-8 text-white/30" />
            </div>
          )}
          {user && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="h-6 w-6 text-white mb-0.5" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
            </div>
          )}
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpdateAvatar}
          />
        </div>
        <h3 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || 'Guest User'}</h3>
        <p className="text-sm text-white/40">{user?.email || 'Sign in to sync your profile'}</p>

        {user ? (
          <button
            onClick={() => signOut()}
            className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="mt-6 flex items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign In with Google
          </Link>
        )}
      </div>

      {/* Music Taste */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/25 mb-3">Music Taste</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-white/40 mb-1">Current Vibe</div>
            <div className="text-[14px] font-medium text-white">{MOOD_LABELS[mood] ?? mood}</div>
          </div>
          <div>
            <div className="text-[11px] text-white/40 mb-1">Top Genre</div>
            <div className="text-[14px] font-medium text-white capitalize">{topGenre}</div>
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      {topTracks.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/25 mb-3">Top Tracks</div>
          <div className="space-y-1">
            {topTracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} onPlay={() => { playTrack(track); onClose(); }}>
                <span className="w-4 text-center text-[10px] font-bold text-white/30">{i + 1}</span>
              </TrackRow>
            ))}
          </div>
        </div>
      )}

      {/* Top Artists */}
      {topArtists.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/25 mb-3">Top Artists</div>
          <div className="space-y-2">
            {topArtists.map((artist, i) => (
              <div key={artist} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, oklch(0.72 0.26 ${248 + i * 15}), oklch(0.68 0.24 ${286 + i * 10}))` }}
                >
                  {i + 1}
                </div>
                <span className="text-[13px] text-white/75 capitalize">{artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-white/18">
      {icon}
      <p className="text-[13px]">{text}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export function ProfileModal({ isOpen, onClose, mode = 'library' }: { isOpen: boolean; onClose: () => void; mode?: 'library' | 'profile' }) {
  const [tab, setTab] = useState<ProfileTab>(mode === 'profile' ? 'stats' : 'liked');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const { likedTrackIds, recentlyPlayed, playlists, deletePlaylist, createPlaylist } = useUserProfile();
  const { playTrack } = usePlayback();

  useEffect(() => {
    if (isOpen) {
      setTab(mode === 'profile' ? 'stats' : 'liked');
      setActivePlaylistId(null);
      setShowCreatePlaylist(false);
    }
  }, [isOpen, mode]);

  const likedTracks = recentlyPlayed.filter((t) => likedTrackIds.includes(t.id));

  const ALL_TABS: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'liked',     label: 'Liked',     icon: <Heart className="h-3.5 w-3.5" />,     count: likedTracks.length },
    { id: 'recent',    label: 'Recent',    icon: <Clock className="h-3.5 w-3.5" />,     count: recentlyPlayed.length },
    { id: 'playlists', label: 'Playlists', icon: <ListMusic className="h-3.5 w-3.5" />, count: playlists.length },
    { id: 'stats',     label: 'Profile',   icon: <User className="h-3.5 w-3.5" /> },
  ];

  const TABS = mode === 'library'
    ? ALL_TABS.filter(t => t.id !== 'stats')
    : ALL_TABS.filter(t => t.id === 'stats');

  // Slide in from right for library, center for profile
  const slideVariants = mode === 'library'
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={onClose}
        >
          <motion.div
            {...slideVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={`relative flex flex-col overflow-hidden shadow-2xl ${
              mode === 'library'
                ? 'ml-auto h-full w-full max-w-md border-l border-white/[0.06]'
                : 'mx-auto mt-auto h-[92vh] w-full max-w-lg rounded-t-3xl border-t border-white/[0.08]'
            }`}
            style={{ background: 'oklch(0.055 0.022 260)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Create Playlist overlay */}
            <AnimatePresence>
              {showCreatePlaylist && (
                <CreatePlaylistModal
                  onClose={() => setShowCreatePlaylist(false)}
                  onCreate={(name, coverArt) => createPlaylist(name, coverArt)}
                />
              )}
            </AnimatePresence>

            {/* Handle (profile mode) */}
            {mode !== 'library' && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-[17px] font-bold text-white">
                  {mode === 'library' ? 'Your Library' : 'Profile'}
                </h2>
                {mode === 'library' && (
                  <p className="text-xs text-white/30 mt-0.5">
                    {likedTracks.length} liked · {playlists.length} playlists
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            {!activePlaylistId && (
              <div className="flex gap-0 border-b border-white/[0.06] px-4">
                {TABS.map(({ id, label, icon, count }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                      tab === id
                        ? 'border-[oklch(0.72_0.26_248)] text-white'
                        : 'border-transparent text-white/30 hover:text-white/55'
                    }`}
                    style={{ marginBottom: '-1px' }}
                  >
                    {icon}
                    {label}
                    {count !== undefined && count > 0 && (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                {activePlaylistId ? (
                  <PlaylistEditor
                    key="editor"
                    playlistId={activePlaylistId}
                    onBack={() => setActivePlaylistId(null)}
                  />
                ) : (
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Liked */}
                    {tab === 'liked' && (
                      likedTracks.length > 0
                        ? <div className="space-y-0.5">
                            {likedTracks.map((t, i) => (
                              <TrackRow
                                key={t.id}
                                track={t}
                                index={i}
                                onPlay={() => { playTrack(t); onClose(); }}
                                onAddToPlaylist={() => {}}
                              />
                            ))}
                          </div>
                        : <EmptyState icon={<Heart className="h-8 w-8" />} text="Like songs to save them here" />
                    )}

                    {/* Recent */}
                    {tab === 'recent' && (
                      recentlyPlayed.length > 0
                        ? <div className="space-y-0.5">
                            {recentlyPlayed.map((t, i) => (
                              <TrackRow
                                key={t.id}
                                track={t}
                                index={i}
                                onPlay={() => { playTrack(t); onClose(); }}
                                onAddToPlaylist={() => {}}
                              />
                            ))}
                          </div>
                        : <EmptyState icon={<Clock className="h-8 w-8" />} text="Your listening history appears here" />
                    )}

                    {/* Playlists */}
                    {tab === 'playlists' && (
                      <div>
                        {/* Create new button */}
                        <button
                          onClick={() => setShowCreatePlaylist(true)}
                          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.10] py-3.5 text-[12px] text-white/30 transition-colors hover:border-white/20 hover:text-white/55"
                        >
                          <Plus className="h-4 w-4" />
                          New Playlist
                        </button>

                        {playlists.length > 0
                          ? playlists.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setActivePlaylistId(p.id)}
                                className="group mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                              >
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] flex items-center justify-center">
                                  {p.coverArt
                                    ? <img src={p.coverArt} alt="" className="h-full w-full object-cover" />
                                    : <ListMusic className="h-5 w-5 text-white/30" />
                                  }
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] font-medium text-white/85">{p.name}</div>
                                  <div className="text-[11px] text-white/35">{p.tracks.length} tracks</div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                                  className="opacity-0 group-hover:opacity-100 rounded-full p-1.5 text-white/25 hover:bg-red-500/10 hover:text-red-400/60 transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          : <EmptyState icon={<ListMusic className="h-8 w-8" />} text="Create your first playlist" />
                        }
                      </div>
                    )}

                    {/* Profile */}
                    {tab === 'stats' && <ProfileTab onClose={onClose} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
