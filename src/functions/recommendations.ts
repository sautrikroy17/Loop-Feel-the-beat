/**
 * Loop Recommendation Engine — Intelligence-powered discovery
 *
 * This server function accepts rich personalization seeds derived from
 * useListeningIntelligence and builds targeted YTM search queries.
 *
 * Section strategy:
 *  For You       → YTM "Up Next" from current track (best signal)
 *  More Like X   → Artist-seeded search
 *  [Mood] Mix    → Time-of-day + mood-based query
 *  Trending Now  → Always-fresh trending query
 *  Underground   → Genre-specific underground discovery
 *  Deep Cuts     → Same artist, rare/hidden tracks
 *  Based On You  → Top genre × top artist combination
 */

import { createServerFn } from '@tanstack/react-start';
import { searchYouTubeMusic, getRelatedTracks } from '../server/services/youtubeMusic';

interface PersonalizedSeed {
  // Current track context
  trackId?: string;
  title?: string;
  artist?: string;

  // Intelligence-derived signals (from useListeningIntelligence)
  topGenres?: string[];      // e.g. ['lofi', 'phonk', 'bollywood']
  topArtists?: string[];     // e.g. ['arijit singh', 'the weeknd']
  recentArtists?: string[];
  genre?: string;            // single primary genre hint
}

interface DiscoveryTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  youtubeId: string;
  durationMs?: number;
}

interface DiscoverySection {
  id: string;
  title: string;
  tracks: DiscoveryTrack[];
  icon?: string;
}

function toTrack(t: any): DiscoveryTrack {
  return {
    id:        t.videoId ?? t.id,
    title:     t.title,
    artist:    t.artist ?? 'Unknown',
    albumArt:  t.albumArt ?? '',
    youtubeId: t.videoId ?? t.id,
    durationMs: t.durationMs,
  };
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export const getDiscoverySectionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PersonalizedSeed) => data)
  .handler(async ({ data }): Promise<DiscoverySection[]> => {
    const {
      trackId, artist, topGenres = [], topArtists = [],
      recentArtists = []
    } = data;

    const g1 = topGenres[0] ?? 'Pop';
    const g2 = topGenres[1] ?? 'Hip Hop';
    const g3 = topGenres[2] ?? 'R&B';
    const primaryArtist = artist ?? topArtists[0] ?? recentArtists[0] ?? '';

    // Build contextual "More Like" label
    const artistLabel = primaryArtist
      ? primaryArtist.split(/[,&]/)[0].trim()
      : null;
    const moreLikeLabel = artistLabel ? `More Like ${toTitleCase(artistLabel)}` : 'Similar Artists';

    // Queries based entirely on user's pure taste
    const qForYou = trackId
      ? '' // We use getRelatedTracks if trackId exists
      : `${primaryArtist} ${g1} mix playlist`;

    const qSimilar = primaryArtist
      ? `${primaryArtist} similar artists ${g1}`
      : `${g1} similar artists mix`;

    const qGenre1Trending = `${g1} top songs trending 2024 hits`;
    const qGenre2Classics = `${g2} best songs classics playlist`;
    const qGenre3Hidden   = `${g3} underground hidden gems rare tracks`;
    
    const qBasedOn = topArtists.length > 0
      ? `${topArtists[0]} ${g1} best playlist`
      : `global top songs viral playlist`;

    // Fetch all in parallel
    const [forYou, similar, g1Trending, g2Classics, g3Hidden, basedOn] =
      await Promise.allSettled([
        // For You: best signal from YTM related
        trackId
          ? getRelatedTracks(trackId, 20).then(t => t.map(toTrack))
          : searchYouTubeMusic(qForYou, 20).then(t => t.map(toTrack)),

        // More Like X
        searchYouTubeMusic(qSimilar, 18).then(t => t.map(toTrack)),

        // Genre 1 Trending
        searchYouTubeMusic(qGenre1Trending, 18).then(t => t.map(toTrack)),

        // Genre 2 Classics
        searchYouTubeMusic(qGenre2Classics, 18).then(t => t.map(toTrack)),

        // Genre 3 Hidden Gems
        searchYouTubeMusic(qGenre3Hidden, 16).then(t => t.map(toTrack)),

        // Based on Top Artist
        searchYouTubeMusic(qBasedOn, 18).then(t => t.map(toTrack)),
      ]);

    function unwrap(r: PromiseSettledResult<DiscoveryTrack[]>): DiscoveryTrack[] {
      return r.status === 'fulfilled' ? r.value : [];
    }

    const sections: DiscoverySection[] = [
      { id: 'for-you',     title: 'For You',                               icon: '❤️', tracks: unwrap(forYou) },
      { id: 'similar',     title: moreLikeLabel,                           icon: '🎵', tracks: unwrap(similar) },
      { id: 'g1-trending', title: `Trending ${toTitleCase(g1)}`,           icon: '🔥', tracks: unwrap(g1Trending) },
      { id: 'g2-classics', title: `Top ${toTitleCase(g2)}`,                icon: '👑', tracks: unwrap(g2Classics) },
      { id: 'g3-hidden',   title: `Hidden ${toTitleCase(g3)} Gems`,        icon: '💎', tracks: unwrap(g3Hidden) },
      { id: 'based-on',    title: `Based on ${toTitleCase(primaryArtist || g1)}`, icon: '🧠', tracks: unwrap(basedOn) },
    ];

    return sections.filter(s => s.tracks.length > 0);
  });
