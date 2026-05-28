/**
 * User Profile Store
 *
 * Persists to localStorage via Zustand persist middleware.
 * No backend auth required — all local to the browser session.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './usePlayback';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  coverArt?: string; // base64 data URL from desktop file picker
}

interface UserProfileState {
  likedTrackIds: string[];
  recentlyPlayed: Track[];     // LIFO, max 50
  playlists: Playlist[];

  // Actions
  likeTrack: (track: Track) => void;
  unlikeTrack: (id: string) => void;
  isLiked: (id: string) => boolean;
  addToRecentlyPlayed: (track: Track) => void;
  createPlaylist: (name: string, coverArt?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  renamePlaylist: (id: string, newName: string) => void;
  reorderPlaylist: (id: string, startIndex: number, endIndex: number) => void;
  clearHistory: () => void;
}

export const useUserProfile = create<UserProfileState>()(
  persist(
    (set, get) => ({
      likedTrackIds: [],
      recentlyPlayed: [],
      playlists: [],

      likeTrack: (track) =>
        set((s) => ({
          likedTrackIds: s.likedTrackIds.includes(track.id)
            ? s.likedTrackIds
            : [track.id, ...s.likedTrackIds],
        })),

      unlikeTrack: (id) =>
        set((s) => ({
          likedTrackIds: s.likedTrackIds.filter((i) => i !== id),
        })),

      isLiked: (id) => get().likedTrackIds.includes(id),

      addToRecentlyPlayed: (track) =>
        set((s) => {
          const filtered = s.recentlyPlayed.filter((t) => t.id !== track.id);
          return { recentlyPlayed: [track, ...filtered].slice(0, 50) };
        }),

      createPlaylist: (name, coverArt) => {
        const playlist: Playlist = {
          id: `pl_${Date.now()}`,
          name,
          tracks: [],
          createdAt: Date.now(),
          ...(coverArt ? { coverArt } : {}),
        };
        set((s) => ({ playlists: [playlist, ...s.playlists] }));
        return playlist;
      },

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addTrackToPlaylist: (playlistId, track) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.tracks.find((t) => t.id === track.id)
              ? { ...p, tracks: [...p.tracks, track] }
              : p
          ),
        })),

      removeTrackFromPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
              : p
          ),
        })),

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map(p => p.id === id ? { ...p, name } : p)
        })),

      reorderPlaylist: (id, startIndex, endIndex) =>
        set((s) => ({
          playlists: s.playlists.map(p => {
            if (p.id !== id) return p;
            const result = Array.from(p.tracks);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...p, tracks: result };
          })
        })),

      clearHistory: () => set({ recentlyPlayed: [] }),
    }),
    {
      name: 'loop-user-profile',
      // Only persist the data, not the actions
      partialize: (s) => ({
        likedTrackIds: s.likedTrackIds,
        recentlyPlayed: s.recentlyPlayed,
        playlists: s.playlists,
      }),
    }
  )
);

/**
 * Wire usePlayback → useUserProfile.
 * Call this once at app root to auto-record recently played tracks.
 */
export function initProfileSync() {
  // Lazy import to avoid circular dep at module init time
  import('./usePlayback').then(({ usePlayback }) => {
    let prevTrackId: string | undefined = undefined;
    usePlayback.subscribe((state) => {
      if (state.currentTrack && state.currentTrack.id !== prevTrackId) {
        prevTrackId = state.currentTrack.id;
        useUserProfile.getState().addToRecentlyPlayed(state.currentTrack);
      }
    });
  });
}
