/**
 * useListeningIntelligence — Loop's AI personalization brain
 *
 * Tracks all listening behavior locally (localStorage via Zustand persist).
 * Derives mood, genre preferences, session patterns, and smart query seeds
 * that drive personalized recommendations.
 *
 * Data collected:
 *  - Play events: track, artist, genre, timestamp, duration listened
 *  - Skip events: how far through a track before skipping
 *  - Repeat events: how many times a track was replayed
 *  - Like events: pulled from useUserProfile
 *
 * Derived signals:
 *  - topGenres: weighted by listen time, skips negative
 *  - topArtists: ranked by play + repeat count
 *  - sessionMood: detected from time-of-day + recent genre patterns
 *  - vibeQuery: ready-to-use search query for recommendations
 *  - weekdayProfile: genre distribution per day-of-week
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────

export interface PlayEvent {
  trackId: string;
  title: string;
  artist: string;
  genres: string[];          // inferred from title/artist
  timestamp: number;         // ms since epoch
  listenMs: number;          // how long user listened before skip/end
  completed: boolean;        // did they listen past 80%?
  skipped: boolean;
  repeated: boolean;
  liked: boolean;
}

export type MoodLabel =
  | 'focus'
  | 'chill'
  | 'night-drive'
  | 'party'
  | 'emotional'
  | 'gym'
  | 'underground'
  | 'morning'
  | 'discovery'
  | 'balanced';

export interface ListeningStats {
  totalTracks: number;
  totalListenMs: number;
  skips: number;
  repeats: number;
  completionRate: number; // 0–1
}

// ── Genre inference from title/artist strings ─────────────────────

const GENRE_PATTERNS: [RegExp, string][] = [
  [/lo-?fi|lofi|study|focus|sleep|ambient/i,       'lofi'],
  [/phonk|drift|dark\s*trap|aggressive/i,           'phonk'],
  [/trap|drill|street|hood/i,                       'trap'],
  [/house|techno|edm|dance|club|rave/i,             'house'],
  [/r&b|rnb|soul|neo\s*soul|smooth/i,               'rnb'],
  [/jazz|blues|bebop|swing/i,                       'jazz'],
  [/indie|alt(?:ernative)?|emo|bedroom\s*pop/i,     'indie'],
  [/hip.?hop|rap|freestyle|bars|verse/i,            'hiphop'],
  [/pop|mainstream|viral|trending/i,                'pop'],
  [/classical|orchestral|piano|symphony/i,          'classical'],
  [/metal|rock|punk|hardcore|grunge/i,              'rock'],
  [/bollywood|hindi|punjabi|desi|filmi/i,           'bollywood'],
  [/kpop|k-pop|bts|blackpink/i,                    'kpop'],
  [/slowed|reverb|reverbed/i,                       'slowed'],
  [/synthwave|retrowave|vaporwave|outrun/i,         'synthwave'],
  [/acoustic|unplugged|folk|country|singer|writer/i,'acoustic'],
  [/afrobeats?|afropop|amapiano/i,                  'afrobeats'],
  [/latin|reggaeton|salsa|bachata/i,                'latin'],
];

export function inferGenres(title: string, artist: string): string[] {
  const s = `${title} ${artist}`;
  const found = GENRE_PATTERNS.filter(([re]) => re.test(s)).map(([, g]) => g);
  return found.length > 0 ? found : ['pop'];
}

// ── Mood detection from context ────────────────────────────────────

export function detectMood(
  recentGenres: string[],
  hourOfDay: number,
  dayOfWeek: number,       // 0=Sun … 6=Sat
  recentSkipRate: number,  // 0–1
): MoodLabel {
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;
  const isLateNight = hourOfDay >= 23 || hourOfDay < 4;
  const isNight    = hourOfDay >= 20 || hourOfDay < 4;
  const isMorning  = hourOfDay >= 5 && hourOfDay < 10;
  const isAfternoon = hourOfDay >= 10 && hourOfDay < 17;

  const genreSet = new Set(recentGenres);

  // Genre-based overrides
  if (genreSet.has('lofi') || genreSet.has('classical') || genreSet.has('jazz'))
    return recentSkipRate > 0.5 ? 'discovery' : 'focus';
  if (genreSet.has('phonk') || genreSet.has('trap') || genreSet.has('metal'))
    return isWeekend ? 'party' : 'gym';
  if (genreSet.has('slowed') || genreSet.has('indie'))
    return isNight ? 'emotional' : 'chill';
  if (genreSet.has('synthwave') || genreSet.has('house'))
    return isLateNight ? 'night-drive' : isWeekend ? 'party' : 'chill';
  if (genreSet.has('rnb') && isNight) return 'emotional';

  // Time-based fallbacks
  if (isLateNight) return 'night-drive';
  if (isMorning)   return 'morning';
  if (isAfternoon && recentSkipRate > 0.4) return 'discovery';
  if (recentGenres.some(g => ['underground', 'phonk', 'slowed'].includes(g)))
    return 'underground';

  return 'balanced';
}

// ── Mood → search query vocabulary ────────────────────────────────

const MOOD_QUERIES: Record<MoodLabel, string[]> = {
  focus:       ['lofi beats study focus', 'ambient instrumental focus', 'piano concentration music'],
  chill:       ['chill vibes playlist', 'relaxing melodic music', 'smooth evening music'],
  'night-drive':['night drive synthwave', 'late night dark music', 'midnight drive playlist'],
  party:       ['party hits 2024', 'club bangers playlist', 'high energy dance music'],
  emotional:   ['emotional songs playlist', 'sad indie music', 'heartfelt music'],
  gym:         ['gym motivation playlist', 'workout bangers', 'high energy rap gym'],
  underground: ['underground music gems', 'obscure hidden tracks', 'underground artists 2024'],
  morning:     ['morning energy playlist', 'uplifting morning music', 'positive start day'],
  discovery:   ['new music 2024 discovery', 'emerging artists playlist', 'underground finds'],
  balanced:    ['top songs playlist', 'popular music 2024', 'feel good music'],
};

export function moodToQuery(mood: MoodLabel, topGenre?: string): string {
  const queries = MOOD_QUERIES[mood];
  const base = queries[Math.floor(Math.random() * queries.length)];
  if (topGenre && !base.includes(topGenre)) return `${topGenre} ${base}`;
  return base;
}

// ── EQ preset suggestions based on mood ────────────────────────────

export const MOOD_EQ_PRESETS: Record<MoodLabel, string> = {
  focus:        'vocal',
  chill:        'acoustic',
  'night-drive':'night-drive',
  party:        'club',
  emotional:    'vocal',
  gym:          'bass-boost',
  underground:  'midnight',
  morning:      'pop',
  discovery:    'spatial',
  balanced:     'flat',
};

// ── Zustand store ─────────────────────────────────────────────────

interface IntelligenceState {
  events: PlayEvent[];             // rolling 200-event log
  genreWeights: Record<string, number>; // weighted genre scores
  artistWeights: Record<string, number>;

  // Actions
  recordPlay: (event: Omit<PlayEvent, 'genres'> & { title: string; artist: string }) => void;
  markSkip: (trackId: string) => void;
  markRepeat: (trackId: string) => void;
  markCompleted: (trackId: string) => void;
  reset: () => void;

  // Derived (computed getters)
  getTopGenres: (n?: number) => string[];
  getTopArtists: (n?: number) => string[];
  getCurrentMood: () => MoodLabel;
  getVibeQuerySeed: () => { artist: string; genre: string; mood: MoodLabel; moodQuery: string };
  getStats: () => ListeningStats;
  getRecentArtists: (n?: number) => string[];
}

const MAX_EVENTS = 200;

export const useListeningIntelligence = create<IntelligenceState>()(
  persist(
    (set, get) => ({
      events: [],
      genreWeights: {},
      artistWeights: {},

      recordPlay: (raw) => {
        const genres = inferGenres(raw.title, raw.artist);
        const event: PlayEvent = { ...raw, genres };

        set((s) => {
          // Update genre weights: listen time positive, skip negative
          const gw = { ...s.genreWeights };
          const listenScore = raw.completed ? 2 : raw.listenMs > 30_000 ? 1 : 0.3;
          const skipPenalty = raw.skipped ? -0.5 : 0;
          for (const g of genres) {
            gw[g] = (gw[g] ?? 0) + listenScore + skipPenalty;
          }

          // Update artist weights
          const aw = { ...s.artistWeights };
          const artistKey = raw.artist.split(/[,&]/)[0].trim().toLowerCase();
          aw[artistKey] = (aw[artistKey] ?? 0) + listenScore;

          const events = [event, ...s.events].slice(0, MAX_EVENTS);
          return { events, genreWeights: gw, artistWeights: aw };
        });
      },

      markSkip: (trackId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.trackId === trackId && !e.skipped ? { ...e, skipped: true } : e
          ),
        })),

      markRepeat: (trackId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.trackId === trackId ? { ...e, repeated: true } : e
          ),
        })),

      markCompleted: (trackId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.trackId === trackId ? { ...e, completed: true } : e
          ),
        })),

      reset: () => set({ events: [], genreWeights: {}, artistWeights: {} }),

      getTopGenres: (n = 5) => {
        const w = get().genreWeights;
        return Object.entries(w)
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
          .map(([g]) => g);
      },

      getTopArtists: (n = 5) => {
        const w = get().artistWeights;
        return Object.entries(w)
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
          .map(([a]) => a);
      },

      getRecentArtists: (n = 3) => {
        const seen = new Set<string>();
        const result: string[] = [];
        for (const e of get().events) {
          const a = e.artist.split(/[,&]/)[0].trim();
          if (!seen.has(a)) { seen.add(a); result.push(a); }
          if (result.length >= (n ?? 3)) break;
        }
        return result;
      },

      getCurrentMood: () => {
        const { events } = get();
        const now = new Date();
        const recentGenres = events
          .slice(0, 10)
          .flatMap((e) => e.genres);
        const recentSkips = events.slice(0, 10).filter((e) => e.skipped).length;
        const skipRate = events.slice(0, 10).length > 0
          ? recentSkips / events.slice(0, 10).length : 0;
        return detectMood(recentGenres, now.getHours(), now.getDay(), skipRate);
      },

      getVibeQuerySeed: () => {
        const s = get();
        const mood    = s.getCurrentMood();
        const topG    = s.getTopGenres(1)[0] ?? 'pop';
        const topA    = s.getTopArtists(1)[0] ?? '';
        return {
          artist:     topA,
          genre:      topG,
          mood,
          moodQuery:  moodToQuery(mood, topG),
        };
      },

      getStats: () => {
        const { events } = get();
        const totalListenMs = events.reduce((sum, e) => sum + e.listenMs, 0);
        const completed = events.filter((e) => e.completed).length;
        return {
          totalTracks:    events.length,
          totalListenMs,
          skips:          events.filter((e) => e.skipped).length,
          repeats:        events.filter((e) => e.repeated).length,
          completionRate: events.length > 0 ? completed / events.length : 0,
        };
      },
    }),
    {
      name: 'loop-listening-intelligence',
      partialize: (s) => ({
        events:         s.events,
        genreWeights:   s.genreWeights,
        artistWeights:  s.artistWeights,
      }),
    }
  )
);

// ── Wire to usePlayback ────────────────────────────────────────────
// Call once at app root to auto-record listening events.

let _playStartMs = 0;
let _currentId   = '';

export function initListeningIntelligence() {
  import('./usePlayback').then(({ usePlayback }) => {
    import('@/functions/profile').then(({ saveProfileFn }) => {
      let prevTrack: any = undefined;
      usePlayback.subscribe((state) => {
        const track = state.currentTrack;
        if (track !== prevTrack) {
          const prev = prevTrack;
          prevTrack = track;
          const intel = useListeningIntelligence.getState();
          if (prev && _currentId === prev.id) {
            const listenMs = Date.now() - _playStartMs;
            const durationMs = prev.durationMs ?? 180_000;
            const completed = listenMs >= durationMs * 0.80;
            const skipped   = listenMs < durationMs * 0.25;
            intel.recordPlay({
              trackId: prev.id, title: prev.title, artist: prev.artist,
              timestamp: _playStartMs, listenMs, completed, skipped, repeated: false, liked: false,
            });
            // Sync to Supabase
            saveProfileFn();
          }
          if (track) { _currentId = track.id; _playStartMs = Date.now(); }
        }
      });
    });
  });
}
