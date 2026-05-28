import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Volume2, VolumeX, Loader2, Mic2, Shuffle, Repeat, Repeat1, Infinity, ListPlus, FolderPlus, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePlayback } from '@/hooks/usePlayback';
import { useUserProfile } from '@/hooks/useUserProfile';

function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

/** Mini playlist picker popup */
function PlaylistPickerPopup({ onClose }: { onClose: () => void }) {
  const { playlists, addTrackToPlaylist } = useUserProfile();
  const { currentTrack } = usePlayback();
  const [added, setAdded] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAdd = (playlistId: string) => {
    if (!currentTrack) return;
    addTrackToPlaylist(playlistId, currentTrack);
    setAdded(playlistId);
    setTimeout(() => { onClose(); }, 800);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full right-0 mb-2 w-52 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl"
      style={{ background: 'oklch(0.08 0.025 260 / 0.97)', backdropFilter: 'blur(24px)' }}
    >
      <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.3em] text-white/30 border-b border-white/[0.06]">
        Add to Playlist
      </div>
      {playlists.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-white/30">
          No playlists yet
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto py-1" style={{ scrollbarWidth: 'none' }}>
          {playlists.map(p => (
            <button
              key={p.id}
              onClick={() => handleAdd(p.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/[0.06] flex items-center justify-center">
                {p.coverArt
                  ? <img src={p.coverArt} alt="" className="h-full w-full object-cover" />
                  : <span className="text-[10px] text-white/30">♪</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-white/80">{p.name}</div>
                <div className="text-[10px] text-white/35">{p.tracks.length} tracks</div>
              </div>
              {added === p.id && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[oklch(0.72_0.26_248)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function PlayerBar({ onExpand, onKaraoke }: { onExpand: () => void; onKaraoke: () => void }) {
  const {
    currentTrack, isPlaying, progress, duration, volume, isLoadingTrack,
    isShuffle, repeatMode, isAutoplay,
    togglePlayPause, nextTrack, prevTrack, seekTo, setVolume,
    toggleShuffle, toggleRepeat, toggleAutoplay,
    addToQueue,
  } = usePlayback();

  const [isDragging, setIsDragging] = useState(false);
  const [dragVal, setDragVal] = useState(0);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [queueAdded, setQueueAdded] = useState(false);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const displayTime = isDragging ? dragVal : progress;

  const handleAddToQueue = () => {
    if (!currentTrack) return;
    addToQueue(currentTrack);
    setQueueAdded(true);
    setTimeout(() => setQueueAdded(false), 1200);
  };

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="player-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06]"
          style={{ background: 'oklch(0.06 0.024 260 / 0.97)', backdropFilter: 'blur(32px) saturate(180%)' }}
        >
          {/* Thin progress line at very top edge */}
          <div className="h-[2px] w-full bg-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <div
              className="h-full transition-none"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286), oklch(0.80 0.18 208))',
              }}
            />
          </div>

          <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3 sm:gap-4">
            {/* Album art + track info → click to expand */}
            <button
              onClick={onExpand}
              className="group flex min-w-0 flex-1 items-center gap-3 text-left sm:flex-none sm:w-52"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/8">
                {currentTrack.albumArt && (
                  <img src={currentTrack.albumArt} alt="" className="h-full w-full object-cover" />
                )}
                {isLoadingTrack && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <div className="truncate text-sm font-medium text-white">{currentTrack.title}</div>
                <div className="truncate text-xs text-white/45">{currentTrack.artist}</div>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
            </button>

            {/* Quick action: Add to Queue + Add to Playlist */}
            <div className="hidden shrink-0 items-center gap-1 sm:flex relative">
              <button
                onClick={handleAddToQueue}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-white/5 ${queueAdded ? 'text-[oklch(0.72_0.26_248)]' : 'text-white/30 hover:text-white/70'}`}
                title="Add to Queue"
              >
                {queueAdded ? <Check className="h-3.5 w-3.5" /> : <ListPlus className="h-4 w-4" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowPlaylistPicker(v => !v)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-white/5 ${showPlaylistPicker ? 'text-[oklch(0.72_0.26_248)] bg-white/5' : 'text-white/30 hover:text-white/70'}`}
                  title="Add to Playlist"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {showPlaylistPicker && (
                    <PlaylistPickerPopup onClose={() => setShowPlaylistPicker(false)} />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
              <button
                onClick={toggleShuffle}
                className={`hidden sm:flex rounded-full p-2 transition-colors hover:bg-white/5 ${isShuffle ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                title="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </button>

              <button
                onClick={prevTrack}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              
              <button
                onClick={togglePlayPause}
                disabled={isLoadingTrack}
                className="mx-1 flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286))',
                  boxShadow: '0 0 30px -4px oklch(0.72 0.26 248 / 0.65)',
                }}
              >
                {isLoadingTrack
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : isPlaying
                  ? <Pause className="h-5 w-5 fill-current" />
                  : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>
              
              <button
                onClick={nextTrack}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`hidden sm:flex rounded-full p-2 transition-colors hover:bg-white/5 ${repeatMode !== 'none' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                title="Repeat"
              >
                {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>

            {/* Seekbar (hidden on mobile) */}
            <div className="hidden flex-1 items-center gap-2 sm:flex">
              <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/30">
                {fmt(displayTime)}
              </span>
              <div className="group relative flex-1">
                {/* Track */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/25 shadow-inner">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${isDragging && duration > 0 ? (dragVal / duration) * 100 : pct}%`,
                      background: 'linear-gradient(90deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286), oklch(0.80 0.18 208))',
                    }}
                  />
                </div>
                {/* Invisible range input overlaid */}
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.5}
                  value={displayTime}
                  onChange={(e) => { setIsDragging(true); setDragVal(Number(e.target.value)); }}
                  onMouseUp={(e) => { seekTo(Number((e.target as HTMLInputElement).value)); setIsDragging(false); }}
                  onTouchEnd={(e) => { seekTo(Number((e.target as HTMLInputElement).value)); setIsDragging(false); }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {/* Thumb dot */}
                <div
                  className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ left: `calc(${pct}% - 6px)` }}
                />
              </div>
              <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/30">{fmt(duration)}</span>
            </div>

            {/* Volume (hidden on mobile) */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                onClick={() => setVolume(volume === 0 ? 75 : 0)}
                className="text-white/30 transition-colors hover:text-white/70"
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 cursor-pointer accent-[oklch(0.75_0.22_290)]"
              />
            </div>

            {/* Right controls (Karaoke & Autoplay) */}
            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              <button
                onClick={toggleAutoplay}
                title="Autoplay (Infinite Mix)"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5 ${isAutoplay ? 'text-white' : 'text-white/30 hover:text-white/70'}`}
              >
                <Infinity className="h-4 w-4" />
              </button>
              <button
                onClick={onKaraoke}
                title="Karaoke Mode (K)"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                <Mic2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
