/**
 * useSettings — Global app settings store
 *
 * Persisted to localStorage via Zustand persist middleware.
 * Changes are applied immediately: theme vars injected into :root,
 * EQ band multipliers read by useAudioData each RAF frame.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Premium Modes ──────────────────────────────────────────────────

export type PremiumMode = 'none' | 'aura' | 'midnight' | 'focus' | 'party';

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

// ── Store ───────────────────────────────────────────────────────────

interface SettingsState {
  // Theme
  theme: ThemeName;

  // Premium Modes
  premiumMode: PremiumMode;

  // Feature toggles
  canvasEnabled: boolean;
  immersiveEffects: boolean;
  reducedMotion: boolean;
  autoplay: boolean;
  karaokeAutoOpen: boolean;

  // Visual
  effectIntensity: number;   // 0–1

  // Timers
  sleepTimerTarget: number | null; // Timestamp (ms) when music should pause

  // Actions
  setTheme: (t: ThemeName) => void;
  setPremiumMode: (mode: PremiumMode) => void;
  toggle: (key: 'canvasEnabled' | 'immersiveEffects' | 'reducedMotion' | 'autoplay' | 'karaokeAutoOpen') => void;
  setEffectIntensity: (v: number) => void;
  setSleepTimer: (minutes: number | null) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'midnight',
      premiumMode: 'none',
      canvasEnabled: true,
      immersiveEffects: true,
      reducedMotion: false,
      autoplay: true,
      karaokeAutoOpen: false,
      effectIntensity: 0.75,
      sleepTimerTarget: null,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setPremiumMode: (premiumMode) => {
        set({ premiumMode });
        // Handle side-effects of premium modes
        if (premiumMode === 'midnight') {
          get().setTheme('midnight');
        } else if (premiumMode === 'focus') {
          get().setTheme('minimal');
        } else if (premiumMode === 'party') {
          get().setTheme('neon');
          set({ effectIntensity: 1.0 });
        }
      },

      toggle: (key) => set((s) => ({ [key]: !s[key as keyof SettingsState] } as any)),

      setEffectIntensity: (v) => set({ effectIntensity: v }),

      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerTarget: null });
        } else {
          set({ sleepTimerTarget: Date.now() + minutes * 60 * 1000 });
        }
      },
    }),
    {
      name: 'loop-settings',
      partialize: (s) => ({
        theme: s.theme,
        premiumMode: s.premiumMode,
        canvasEnabled: s.canvasEnabled,
        immersiveEffects: s.immersiveEffects,
        reducedMotion: s.reducedMotion,
        autoplay: s.autoplay,
        karaokeAutoOpen: s.karaokeAutoOpen,
        effectIntensity: s.effectIntensity,
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
