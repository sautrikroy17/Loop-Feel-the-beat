import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useListeningIntelligence } from '@/hooks/useListeningIntelligence';
import { usePlayback } from '@/hooks/usePlayback';
import { hybridSearchFn, getRecommendationsFn } from '@/functions/search';

export async function saveProfileFn() {
  const { session } = useAuth.getState();
  if (!session?.user) return;

  const intel = useListeningIntelligence.getState();
  const topArtists = intel.getTopArtists(10);
  const topGenres = intel.getTopGenres(10);
  const moodHistory = intel.getCurrentMood(); // storing current as basic history for now

  try {
    await (supabase as any).from('user_profiles').upsert({
      id: session.user.id,
      display_name: session.user.user_metadata.full_name,
      avatar_url: session.user.user_metadata.avatar_url,
      top_artists: topArtists,
      top_genres: topGenres,
      mood_history: moodHistory,
    }, { onConflict: 'id' });
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export async function loadProfileFn() {
  const { session } = useAuth.getState();
  if (!session?.user) return;

  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('top_artists, top_genres')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    if (data) {
      const intel = useListeningIntelligence.getState();
      const currentArtists = intel.getTopArtists();
      
      if (currentArtists.length === 0 && data.top_artists) {
        const aw: Record<string, number> = {};
        (data.top_artists as string[]).forEach((a, i) => {
          aw[a] = 10 - i;
        });
        useListeningIntelligence.setState({ artistWeights: aw });
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

export async function getDailyMixFn() {
  const { session } = useAuth.getState();
  if (!session?.user) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('daily_mix, daily_mix_date')
      .eq('id', session.user.id)
      .single();

    if (profile?.daily_mix_date === today && profile.daily_mix) {
      return profile.daily_mix as any[];
    }

    const intel = useListeningIntelligence.getState();
    const topArtists = intel.getTopArtists(3);
    const seeds = topArtists.length > 0 ? topArtists : ['Justin Bieber', 'The Kid Laroi'];
    
    let mixedTracks: any[] = [];
    
    for (const artist of seeds) {
      // Use RPC to search for artist tracks
      const searchData = await hybridSearchFn({ data: `${artist} official audio` });
      if (searchData && searchData.length > 0) {
        // Use RPC to get recommendations based on first result
        const related = await getRecommendationsFn({ data: searchData[0].id || searchData[0].youtubeId || searchData[0].title });
        if (related) mixedTracks = [...mixedTracks, ...related];
      }
    }

    const unique = Array.from(new Map(mixedTracks.map(t => [t.id || t.youtubeId, t])).values());
    const shuffled = unique.sort(() => 0.5 - Math.random()).slice(0, 25);

    await (supabase as any).from('user_profiles').upsert({
      id: session.user.id,
      daily_mix: shuffled,
      daily_mix_date: today,
    }, { onConflict: 'id' });

    return shuffled;
  } catch (error) {
    console.error('Error generating daily mix:', error);
    return null;
  }
}


