/**
 * ProfileModal — Premium user profile experience
 *
 * Tabs: Liked · Recent · Playlists · Stats
 *
 * Stats tab shows:
 *  - Total listen time (formatted as hours/minutes)
 *  - Genre breakdown bar chart (from intelligence weights)
 *  - Top artists ranked list
 *  - Current mood badge
 *  - Completion vs skip rate
 *
 * All data is 100% local — from useUserProfile + useListeningIntelligence.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Clock, ListMusic, Play, Trash2, Music2,
  BarChart2, Mic, Plus, RefreshCw, User,
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

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

function TrackRow({ track, onPlay, index, children }: { track: Track; onPlay: () => void; index?: number; children?: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.04] transition-colors">
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
      <LikeButton track={track} size="sm" />
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

// ── Profile tab ─────────────────────────────────────────────────────

function ProfileTab({ onClose }: { onClose: () => void }) {
  const intel = useListeningIntelligence();
  const topArtists = intel.getTopArtists(5);
  const topGenre = intel.getTopGenres(1)[0] || 'Unknown';
  const mood = intel.getCurrentMood();
  const { user } = useAuth();
  const { recentlyPlayed } = useUserProfile();
  const { playTrack } = usePlayback();

  // Compute top 5 tracks based on events
  const topTracksMap = intel.events.reduce((acc, event) => {
    acc[event.trackId] = (acc[event.trackId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topTracks = Object.entries(topTracksMap)
    .sort((a, b) => b[1] - a[1])
    .map(([trackId]) => recentlyPlayed.find(t => t.id === trackId))
    .filter(Boolean)
    .slice(0, 5) as Track[];

  const handleUpdateAvatar = async () => {
    if (!user) return;
    const url = prompt('Enter new profile picture URL:');
    if (url && url.startsWith('http')) {
      const { supabase } = await import('@/lib/supabase/client');
      await supabase.auth.updateUser({ data: { avatar_url: url } });
    }
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
          onClick={handleUpdateAvatar}
          title={user ? "Click to change profile picture" : ""}
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="h-20 w-20 rounded-full border border-white/10 object-cover transition-opacity group-hover:opacity-50" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06] transition-opacity group-hover:opacity-50">
              <User className="h-8 w-8 text-white/30" />
            </div>
          )}
          {user && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
            </div>
          )}
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

      {/* Top artists */}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {isEditingName ? (
          <input 
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={() => {
              if (nameInput.trim() && nameInput !== playlist.name) renamePlaylist(playlist.id, nameInput.trim());
              setIsEditingName(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="flex-1 bg-white/[0.05] rounded-md px-3 py-1.5 text-[18px] font-bold text-white outline-none ring-1 ring-[oklch(0.72_0.26_248)]"
          />
        ) : (
          <h2 className="flex-1 text-[18px] font-bold text-white cursor-text hover:text-white/80 transition-colors" onClick={() => setIsEditingName(true)} title="Click to rename">
            {playlist.name}
          </h2>
        )}
      </div>
      
      <div className="px-1">
        {playlist.tracks.length === 0 ? (
          <EmptyState icon={<ListMusic className="h-8 w-8" />} text="This playlist is empty" />
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

// ── Main ─────────────────────────────────────────────────────────

export function ProfileModal({ isOpen, onClose, mode = 'library' }: { isOpen: boolean; onClose: () => void; mode?: 'library' | 'profile' }) {
  const [tab, setTab] = useState<ProfileTab>(mode === 'profile' ? 'stats' : 'liked');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const { likedTrackIds, recentlyPlayed, playlists, deletePlaylist, createPlaylist } = useUserProfile();
  const { playTrack } = usePlayback();
  const intel = useListeningIntelligence();

  useEffect(() => {
    if (isOpen) {
      setTab(mode === 'profile' ? 'stats' : 'liked');
      setActivePlaylistId(null);
    }
  }, [isOpen, mode]);

  const likedTracks = recentlyPlayed.filter((t) => likedTrackIds.includes(t.id));
  const stats = intel.getStats();

  const ALL_TABS: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'liked',     label: 'Liked',     icon: <Heart className="h-3.5 w-3.5" />,     count: likedTracks.length },
    { id: 'recent',    label: 'Recent',    icon: <Clock className="h-3.5 w-3.5" />,     count: recentlyPlayed.length },
    { id: 'playlists', label: 'Playlists', icon: <ListMusic className="h-3.5 w-3.5" />, count: playlists.length },
    { id: 'stats',     label: 'Profile',   icon: <User className="h-3.5 w-3.5" /> },
  ];

  const TABS = mode === 'library' 
    ? ALL_TABS.filter(t => t.id !== 'stats')
    : ALL_TABS.filter(t => t.id === 'stats');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/65 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="w-full max-w-lg overflow-hidden rounded-t-3xl border-t border-white/[0.08] shadow-2xl"
            style={{ background: 'oklch(0.055 0.022 260)', maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className="text-[16px] font-bold text-white">Your Library</h2>
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
            <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: '68vh', scrollbarWidth: 'none' }}>
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
                            <TrackRow key={t.id} track={t} index={i} onPlay={() => { playTrack(t); onClose(); }} />
                          ))}
                        </div>
                      : <EmptyState icon={<Heart className="h-8 w-8" />} text="Like songs to save them here" />
                  )}

                  {/* Recent */}
                  {tab === 'recent' && (
                    recentlyPlayed.length > 0
                      ? <div className="space-y-0.5">
                          {recentlyPlayed.map((t, i) => (
                            <TrackRow key={t.id} track={t} index={i} onPlay={() => { playTrack(t); onClose(); }} />
                          ))}
                        </div>
                      : <EmptyState icon={<Clock className="h-8 w-8" />} text="Your listening history appears here" />
                  )}

                  {/* Playlists */}
                  {tab === 'playlists' && (
                    <div>
                      <button
                        onClick={() => {
                          const name = prompt('Playlist name:');
                          if (name?.trim()) createPlaylist(name.trim());
                        }}
                        className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.10] py-3.5 text-[12px] text-white/30 transition-colors hover:border-white/20 hover:text-white/55"
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
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                                <ListMusic className="h-5 w-5 text-white/30" />
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

                  {/* Stats (Now Profile) */}
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
