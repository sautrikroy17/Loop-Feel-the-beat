/**
 * useSettings — Global app settings store
 *
 * Persisted to localStorage via Zustand persist middleware.
 * Changes are applied immediately: theme vars injected into :root,
 * EQ band multipliers read by useAudioData each RAF frame.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── EQ ─────────────────────────────────────────────────────────────

export interface EQBands {
  subBass: number;   // 60 Hz  — dB-like scale –12…+12
  bass: number;      // 250 Hz
  mid: number;       // 1 kHz
  highMid: number;   // 4 kHz
  treble: number;    // 8 kHz
}

export const EQ_PRESETS: Record<string, EQBands> = {
  flat:           { subBass: 0,   bass: 0,   mid: 0,   highMid: 0,   treble: 0 },
  'pop':          { subBass: -1,  bass: 3,   mid: 5,   highMid: 4,   treble: 3 },
  'bass-boost':   { subBass: 9,   bass: 7,   mid: 0,   highMid: -2,  treble: -1 },
  'vocal':        { subBass: -3,  bass: -2,  mid: 7,   highMid: 6,   treble: 3 },
  'club':         { subBass: 8,   bass: 6,   mid: -1,  highMid: 1,   treble: 2 },
  'spatial':      { subBass: 4,   bass: 2,   mid: -1,  highMid: 3,   treble: 7 },
  'night-drive':  { subBass: 6,   bass: 4,   mid: -2,  highMid: 0,   treble: 4 },
  'acoustic':     { subBass: -4,  bass: 2,   mid: 4,   highMid: 3,   treble: 2 },
  'cinema':       { subBass: 8,   bass: 5,   mid: 0,   highMid: -1,  treble: 5 },
  'ultra-clarity':{ subBass: -2,  bass: -1,  mid: 3,   highMid: 8,   treble: 9 },
  'midnight':     { subBass: 10,  bass: 8,   mid: -2,  highMid: -4,  treble: -3 },
};

// ── Themes ─────────────────────────────────────────────────────────

export type ThemeName = 'midnight' | 'neon' | 'minimal' | 'deep-space' | 'aurora';

interface ThemeTokens {
  bg: string;
  surface: string;
  accent: string;
  accentGlow: string;
  orbA: string;
  orbB: string;
  orbC: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  midnight: {
    bg: 'oklch(0.045 0.024 258)',
    surface: 'oklch(0.08 0.022 262)',
    accent: 'oklch(0.72 0.26 248)',
    accentGlow: 'oklch(0.72 0.26 248 / 0.55)',
    orbA: 'oklch(0.44 0.22 252 / 0.30)',
    orbB: 'oklch(0.42 0.20 286 / 0.20)',
    orbC: 'oklch(0.44 0.18 210 / 0.14)',
  },
  neon: {
    bg: 'oklch(0.04 0.02 280)',
    surface: 'oklch(0.07 0.025 282)',
    accent: 'oklch(0.85 0.34 290)',
    accentGlow: 'oklch(0.85 0.34 290 / 0.70)',
    orbA: 'oklch(0.60 0.32 295 / 0.38)',
    orbB: 'oklch(0.55 0.28 240 / 0.28)',
    orbC: 'oklch(0.55 0.30 330 / 0.22)',
  },
  minimal: {
    bg: 'oklch(0.03 0.005 270)',
    surface: 'oklch(0.06 0.008 272)',
    accent: 'oklch(0.82 0.00 0)',
    accentGlow: 'oklch(0.82 0.00 0 / 0.40)',
    orbA: 'oklch(0.30 0.04 280 / 0.20)',
    orbB: 'oklch(0.28 0.03 260 / 0.14)',
    orbC: 'oklch(0.28 0.03 310 / 0.10)',
  },
  'deep-space': {
    bg: 'oklch(0.04 0.022 235)',
    surface: 'oklch(0.07 0.025 238)',
    accent: 'oklch(0.72 0.22 220)',
    accentGlow: 'oklch(0.72 0.22 220 / 0.55)',
    orbA: 'oklch(0.42 0.18 240 / 0.30)',
    orbB: 'oklch(0.40 0.20 200 / 0.22)',
    orbC: 'oklch(0.38 0.16 280 / 0.18)',
  },
  aurora: {
    bg: 'oklch(0.045 0.020 168)',
    surface: 'oklch(0.08 0.022 170)',
    accent: 'oklch(0.78 0.24 158)',
    accentGlow: 'oklch(0.78 0.24 158 / 0.55)',
    orbA: 'oklch(0.50 0.22 162 / 0.32)',
    orbB: 'oklch(0.48 0.20 290 / 0.24)',
    orbC: 'oklch(0.52 0.24 120 / 0.18)',
  },
};

// ── Apply theme to :root ────────────────────────────────────────────

export function applyTheme(name: ThemeName) {
  if (typeof document === 'undefined') return;
  const t = THEMES[name];
  const r = document.documentElement.style;
  r.setProperty('--color-background', t.bg);
  r.setProperty('--color-surface', t.surface);
  r.setProperty('--color-accent', t.accent);
  r.setProperty('--color-accent-glow', t.accentGlow);
  r.setProperty('--orb-a-color', t.orbA);
  r.setProperty('--orb-b-color', t.orbB);
  r.setProperty('--orb-c-color', t.orbC);
}

// Convert dB-like band value (–12…+12) to linear multiplier (0.25…4)
export function bandToMultiplier(db: number): number {
  return Math.pow(10, db / 20);
}

// ── Store ───────────────────────────────────────────────────────────

interface SettingsState {
  // Theme
  theme: ThemeName;

  // Feature toggles
  canvasEnabled: boolean;
  immersiveEffects: boolean;
  reducedMotion: boolean;
  autoplay: boolean;
  karaokeAutoOpen: boolean;

  // Visual
  effectIntensity: number;   // 0–1

  // EQ
  eq: EQBands;
  eqPreset: string;
  eqEnabled: boolean;

  // Actions
  setTheme: (t: ThemeName) => void;
  setEQ: (bands: EQBands) => void;
  setEQBand: (band: keyof EQBands, value: number) => void;
  applyEQPreset: (preset: string) => void;
  toggle: (key: 'canvasEnabled' | 'immersiveEffects' | 'reducedMotion' | 'autoplay' | 'karaokeAutoOpen' | 'eqEnabled') => void;
  setEffectIntensity: (v: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'midnight',
      canvasEnabled: true,
      immersiveEffects: true,
      reducedMotion: false,
      autoplay: true,
      karaokeAutoOpen: false,
      effectIntensity: 0.75,
      eq: EQ_PRESETS.flat,
      eqPreset: 'flat',
      eqEnabled: false,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setEQ: (eq) => set({ eq, eqPreset: 'custom' }),

      setEQBand: (band, value) => set((s) => ({
        eq: { ...s.eq, [band]: value },
        eqPreset: 'custom',
      })),

      applyEQPreset: (preset) => {
        const bands = EQ_PRESETS[preset];
        if (bands) set({ eq: bands, eqPreset: preset });
      },

      toggle: (key) => set((s) => ({ [key]: !s[key as keyof SettingsState] } as any)),

      setEffectIntensity: (v) => set({ effectIntensity: v }),
    }),
    {
      name: 'loop-settings',
      partialize: (s) => ({
        theme: s.theme,
        canvasEnabled: s.canvasEnabled,
        immersiveEffects: s.immersiveEffects,
        reducedMotion: s.reducedMotion,
        autoplay: s.autoplay,
        karaokeAutoOpen: s.karaokeAutoOpen,
        effectIntensity: s.effectIntensity,
        eq: s.eq,
        eqPreset: s.eqPreset,
        eqEnabled: s.eqEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-apply theme after hydration from localStorage
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);

/** Call once at app root to init theme from persisted settings */
export function initSettings() {
  const { theme } = useSettings.getState();
  applyTheme(theme);
}
