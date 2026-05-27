/**
 * SettingsPanel — Premium control center
 *
 * Sections:
 *  1. Theme picker (5 themes)
 *  2. Visuals — canvas, immersive effects, wave intensity, motion, karaoke
 *  3. Playback — autoplay, audio quality, crossfade
 *  4. Equalizer — 5 band sliders + 11 presets + mood suggestion
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Palette, Zap, Eye, Headphones, Lightbulb } from 'lucide-react';
import { useSettings, type ThemeName, EQ_PRESETS, THEMES } from '@/hooks/useSettings';
import { useListeningIntelligence, MOOD_EQ_PRESETS } from '@/hooks/useListeningIntelligence';

const THEME_NAMES: { id: ThemeName; label: string; emoji: string }[] = [
  { id: 'midnight',   label: 'Midnight',   emoji: '🌙' },
  { id: 'neon',       label: 'Neon',       emoji: '⚡' },
  { id: 'minimal',    label: 'Minimal',    emoji: '◻️' },
  { id: 'deep-space', label: 'Space',      emoji: '🪐' },
  { id: 'aurora',     label: 'Aurora',     emoji: '🌿' },
];

const EQ_BAND_LABELS: { key: keyof import('@/hooks/useSettings').EQBands; label: string; freq: string }[] = [
  { key: 'subBass', label: 'Sub',    freq: '60Hz' },
  { key: 'bass',    label: 'Bass',   freq: '250Hz' },
  { key: 'mid',     label: 'Mid',    freq: '1kHz' },
  { key: 'highMid', label: 'Hi-Mid', freq: '4kHz' },
  { key: 'treble',  label: 'Treble', freq: '8kHz' },
];

const PRESETS = Object.keys(EQ_PRESETS).map((k) => ({
  id: k,
  label: k.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

// ── Section header ─────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-white/35">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/40">{title}</span>
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────

function Toggle({
  label, sub, checked, onToggle,
}: { label: string; sub?: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between py-3">
      <div>
        <div className="text-[13px] text-white/80">{label}</div>
        {sub && <div className="mt-0.5 text-[10px] text-white/28">{sub}</div>}
      </div>
      <button
        onClick={onToggle}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? 'oklch(0.72 0.26 248)' : 'oklch(0.18 0.02 260)' }}
      >
        <motion.div
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

// ── Slider with track ──────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-white/50">{label}</span>
        <span className="text-[11px] tabular-nums text-white/28">{format(value)}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286))',
          }}
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-0 h-0 w-full cursor-pointer opacity-0"
        style={{ marginTop: '-6px' }}
      />
    </div>
  );
}

// ── EQ vertical slider ─────────────────────────────────────────────

function EQSlider({ label, freq, value, onChange }: {
  label: string; freq: string; value: number; onChange: (v: number) => void;
}) {
  const pct = ((value + 12) / 24) * 100;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-28 w-6 flex items-center justify-center">
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-white/[0.08]" />
        {/* Zero line */}
        <div className="absolute top-1/2 left-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1/2 rounded bg-white/15" />
        {/* Fill above/below zero */}
        {value > 0 && (
          <div
            className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              background: 'linear-gradient(to top, oklch(0.72 0.26 248), oklch(0.68 0.24 286))',
              bottom: '50%',
              height: `${(value / 12) * 50}%`,
            }}
          />
        )}
        {value < 0 && (
          <div
            className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              background: 'oklch(0.60 0.22 30)',
              top: '50%',
              height: `${(Math.abs(value) / 12) * 50}%`,
            }}
          />
        )}
        {/* Thumb */}
        <div
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-md"
          style={{ top: `${100 - pct}%`, marginTop: '-8px' }}
        />
        <input
          type="range" min={-12} max={12} step={0.5} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ns-resize"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
      </div>
      <span className="text-[10px] font-medium text-white/40">{label}</span>
      <span className="text-[9px] tabular-nums text-white/20">{freq}</span>
      <span className="text-[9px] tabular-nums text-white/30">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    theme, setTheme,
    canvasEnabled, immersiveEffects, reducedMotion, autoplay,
    eqEnabled, karaokeAutoOpen,
    toggle,
    eq, setEQBand, applyEQPreset, eqPreset,
    effectIntensity, setEffectIntensity,
  } = useSettings();

  const intel       = useListeningIntelligence();
  const mood        = intel.getCurrentMood();
  const suggestedEQ = MOOD_EQ_PRESETS[mood] ?? 'flat';
  const showSuggest = eqEnabled && suggestedEQ !== eqPreset && suggestedEQ !== 'flat';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[56] flex w-84 flex-col overflow-hidden border-l border-white/[0.07] shadow-2xl"
            style={{ width: '22rem', background: 'oklch(0.055 0.022 260)' }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-[14px] font-bold text-white">Settings</h2>
                <p className="text-[10px] text-white/28 mt-0.5">Loop Control Center</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8" style={{ scrollbarWidth: 'none' }}>

              {/* ── Theme ─────────────────────────────────────── */}
              <section>
                <SectionHeader icon={<Palette className="h-4 w-4" />} title="Theme" />
                <div className="grid grid-cols-5 gap-1.5">
                  {THEME_NAMES.map(({ id, label, emoji }) => {
                    const t = THEMES[id];
                    const active = theme === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        title={label}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                          active ? 'bg-white/[0.10] ring-1 ring-white/20' : 'hover:bg-white/[0.05]'
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full transition-transform ${
                            active ? 'scale-110 ring-2 ring-white/35 ring-offset-1 ring-offset-transparent' : 'group-hover:scale-105'
                          }`}
                          style={{ background: `radial-gradient(circle at 35% 35%, ${t.accent}, ${t.bg})` }}
                        />
                        <span className="text-[9px] text-white/35 truncate w-full text-center">{emoji}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-center text-[10px] text-white/25 capitalize">{theme.replace('-', ' ')}</div>
              </section>

              <div className="h-px bg-white/[0.06]" />

              {/* ── Visuals ───────────────────────────────────── */}
              <section>
                <SectionHeader icon={<Eye className="h-4 w-4" />} title="Visuals" />
                <div className="divide-y divide-white/[0.05]">
                  <Toggle
                    label="Immersive Effects"
                    sub="Audio-reactive background glows"
                    checked={immersiveEffects}
                    onToggle={() => toggle('immersiveEffects')}
                  />
                  <Toggle
                    label="Track Canvas"
                    sub="Spotify-like ambient art visuals"
                    checked={canvasEnabled}
                    onToggle={() => toggle('canvasEnabled')}
                  />
                  <Toggle
                    label="Karaoke Auto-open"
                    sub="Show lyrics fullscreen when playing"
                    checked={karaokeAutoOpen}
                    onToggle={() => toggle('karaokeAutoOpen')}
                  />
                </div>
              </section>

              <div className="h-px bg-white/[0.06]" />

              {/* ── Playback ──────────────────────────────────── */}
              <section>
                <SectionHeader icon={<Headphones className="h-4 w-4" />} title="Playback" />
                <div className="divide-y divide-white/[0.05]">
                  <Toggle
                    label="Autoplay"
                    sub="Continue playing after queue ends"
                    checked={autoplay}
                    onToggle={() => toggle('autoplay')}
                  />
                </div>
              </section>

              <div className="h-px bg-white/[0.06]" />

              {/* ── EQ ────────────────────────────────────────── */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <SectionHeader icon={<Sliders className="h-4 w-4" />} title="Equalizer" />
                  <button
                    onClick={() => toggle('eqEnabled')}
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors"
                    style={{
                      background: eqEnabled ? 'oklch(0.72 0.26 248 / 0.20)' : 'oklch(0.18 0.02 260)',
                      color:      eqEnabled ? 'oklch(0.82 0.22 248)'          : 'oklch(0.45 0.04 260)',
                    }}
                  >
                    {eqEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Mood EQ suggestion */}
                {showSuggest && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden rounded-xl border border-[oklch(0.72_0.26_248_/_0.20)] bg-[oklch(0.72_0.26_248_/_0.06)] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[oklch(0.82_0.22_248)]" />
                      <span className="text-[11px] text-white/60">
                        For your <span className="text-white/80">{mood}</span> mood:
                      </span>
                    </div>
                    <button
                      onClick={() => applyEQPreset(suggestedEQ)}
                      className="mt-1.5 text-[11px] font-medium text-[oklch(0.80_0.22_248)] hover:underline"
                    >
                      Try {suggestedEQ.replace(/-/g, ' ')} preset →
                    </button>
                  </motion.div>
                )}

                {/* Presets */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {PRESETS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => applyEQPreset(id)}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-all"
                      style={{
                        background: eqPreset === id ? 'oklch(0.72 0.26 248 / 0.22)' : 'oklch(0.12 0.02 260)',
                        color:      eqPreset === id ? 'oklch(0.85 0.22 248)'          : 'oklch(0.45 0.04 260)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: eqPreset === id ? 'oklch(0.72 0.26 248 / 0.30)' : 'transparent',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* EQ sliders */}
                <div
                  className={`flex justify-between gap-0 transition-opacity ${
                    eqEnabled ? 'opacity-100' : 'opacity-25 pointer-events-none'
                  }`}
                >
                  {EQ_BAND_LABELS.map(({ key, label, freq }) => (
                    <EQSlider
                      key={key}
                      label={label}
                      freq={freq}
                      value={eq[key]}
                      onChange={(v) => setEQBand(key, v)}
                    />
                  ))}
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
