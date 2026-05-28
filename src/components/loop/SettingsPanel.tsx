/**
 * SettingsPanel — Loop Control Center (redesigned)
 *
 * Removed: Theme picker, Track Canvas
 * Sections:
 *  1. Visuals — Immersive Effects, Karaoke Auto-open, Effect Intensity
 *  2. Playback — Autoplay, Audio Quality, Crossfade, Normalize, Sleep Timer
 *  3. Equalizer — 5-band sliders + presets (actually applied to visualizer)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sliders, Zap, Headphones, Lightbulb, RotateCcw,
  Moon, Volume2, Infinity, Mic2, Eye,
} from 'lucide-react';
import { useSettings, EQ_PRESETS } from '@/hooks/useSettings';
import { useListeningIntelligence, MOOD_EQ_PRESETS } from '@/hooks/useListeningIntelligence';
import { usePlayback } from '@/hooks/usePlayback';

// ── EQ band labels ─────────────────────────────────────────────────

const EQ_BAND_LABELS: { key: keyof import('@/hooks/useSettings').EQBands; label: string; freq: string }[] = [
  { key: 'subBass', label: 'Sub',    freq: '60Hz' },
  { key: 'bass',    label: 'Bass',   freq: '250Hz' },
  { key: 'mid',     label: 'Mid',    freq: '1kHz' },
  { key: 'highMid', label: 'Hi-Mid', freq: '4kHz' },
  { key: 'treble',  label: 'Air',    freq: '8kHz' },
];

const PRESETS = Object.keys(EQ_PRESETS).map((k) => ({
  id: k,
  label: k.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const AUDIO_QUALITY_OPTIONS = [
  { id: 'low',    label: 'Low',    sub: '48kbps'  },
  { id: 'normal', label: 'Normal', sub: '128kbps' },
  { id: 'high',   label: 'High',   sub: '256kbps' },
  { id: 'max',    label: 'Max',    sub: '320kbps' },
] as const;

const SLEEP_TIMER_OPTIONS = [
  { id: 0,  label: 'Off' },
  { id: 15, label: '15 min' },
  { id: 30, label: '30 min' },
  { id: 45, label: '45 min' },
  { id: 60, label: '1 hour' },
  { id: 90, label: '1.5 hr' },
];

// ── Sub-components ─────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-white/35">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/40">{title}</span>
    </div>
  );
}

function Toggle({ label, sub, checked, onToggle }: {
  label: string; sub?: string; checked: boolean; onToggle: () => void;
}) {
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

function EQSlider({ label, freq, value, disabled, onChange }: {
  label: string; freq: string; value: number; disabled?: boolean; onChange: (v: number) => void;
}) {
  const pct = ((value + 12) / 24) * 100;
  return (
    <div className={`flex flex-col items-center gap-1.5 transition-opacity ${disabled ? 'opacity-25 pointer-events-none' : ''}`}>
      <div className="relative h-28 w-6 flex items-center justify-center">
        {/* Track */}
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-white/[0.08]" />
        {/* Zero line */}
        <div className="absolute top-1/2 left-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1/2 rounded bg-white/15" />
        {/* Positive fill */}
        {value > 0 && (
          <div
            className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              background: 'linear-gradient(to top, oklch(0.72 0.26 248), oklch(0.80 0.20 210))',
              bottom: '50%',
              height: `${(value / 12) * 50}%`,
            }}
          />
        )}
        {/* Negative fill */}
        {value < 0 && (
          <div
            className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              background: 'oklch(0.55 0.18 30)',
              top: '50%',
              height: `${(Math.abs(value) / 12) * 50}%`,
            }}
          />
        )}
        {/* Thumb */}
        <div
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-md ring-2 ring-white/20"
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
      <span
        className="text-[9px] tabular-nums font-medium"
        style={{ color: value > 0 ? 'oklch(0.72 0.26 248)' : value < 0 ? 'oklch(0.65 0.20 30)' : 'oklch(0.45 0.04 260)' }}
      >
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

// ── Sleep timer logic ──────────────────────────────────────────────

function useSleepTimer(minutes: number) {
  const { setPlaying } = usePlayback();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (minutes === 0) {
      setRemaining(null);
      return;
    }
    const end = Date.now() + minutes * 60 * 1000;
    setRemaining(minutes * 60);

    const tick = setInterval(() => {
      const secs = Math.round((end - Date.now()) / 1000);
      if (secs <= 0) {
        setPlaying(false);
        setRemaining(null);
        clearInterval(tick);
      } else {
        setRemaining(secs);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [minutes, setPlaying]);

  return remaining;
}

// ── Main panel ─────────────────────────────────────────────────────

export function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    immersiveEffects, autoplay, karaokeAutoOpen,
    eqEnabled, effectIntensity,
    eq, setEQBand, applyEQPreset, eqPreset,
    toggle, setEffectIntensity,
  } = useSettings();

  const { toggleAutoplay, isAutoplay } = usePlayback();

  const intel       = useListeningIntelligence();
  const mood        = intel.getCurrentMood();
  const suggestedEQ = MOOD_EQ_PRESETS[mood] ?? 'flat';
  const showSuggest = eqEnabled && suggestedEQ !== eqPreset && suggestedEQ !== 'flat';

  // Local UI state for settings not yet in the store
  const [audioQuality, setAudioQuality] = useState<'low' | 'normal' | 'high' | 'max'>('high');
  const [crossfade, setCrossfade] = useState(0);
  const [normalizeVol, setNormalizeVol] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(0);

  const sleepRemaining = useSleepTimer(sleepMinutes);

  const handleAutoplayToggle = () => {
    toggleAutoplay(); // updates usePlayback + syncs useSettings
  };

  const resetEQ = () => applyEQPreset('flat');

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
            className="fixed right-0 top-0 bottom-0 z-[56] flex flex-col overflow-hidden border-l border-white/[0.07] shadow-2xl w-full sm:w-[22rem]"
            style={{ background: 'oklch(0.055 0.022 260)' }}
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

              {/* ── Visuals ────────────────────────────────────── */}
              <section>
                <SectionHeader icon={<Eye className="h-4 w-4" />} title="Visuals" />
                <div className="divide-y divide-white/[0.05]">
                  <Toggle
                    label="Immersive Effects"
                    sub="Audio-reactive background glows and pulsing"
                    checked={immersiveEffects}
                    onToggle={() => toggle('immersiveEffects')}
                  />
                  <Toggle
                    label="Karaoke Auto-open"
                    sub="Jump to lyrics fullscreen when a track starts"
                    checked={karaokeAutoOpen}
                    onToggle={() => toggle('karaokeAutoOpen')}
                  />
                </div>

                {/* Effect intensity */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] text-white/50">Visual Intensity</span>
                    <span className="text-[11px] tabular-nums text-white/28">{Math.round(effectIntensity * 100)}%</span>
                  </div>
                  <div className="group relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${effectIntensity * 100}%`,
                        background: 'linear-gradient(90deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286))',
                      }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.05} value={effectIntensity}
                    onChange={(e) => setEffectIntensity(Number(e.target.value))}
                    className="w-full cursor-pointer opacity-0 h-0 mt-0"
                    style={{ marginTop: '-6px' }}
                  />
                </div>
              </section>

              <div className="h-px bg-white/[0.06]" />

              {/* ── Playback ───────────────────────────────────── */}
              <section>
                <SectionHeader icon={<Headphones className="h-4 w-4" />} title="Playback" />
                <div className="divide-y divide-white/[0.05]">
                  <Toggle
                    label="Autoplay"
                    sub="Keep the music going after your queue ends"
                    checked={isAutoplay}
                    onToggle={handleAutoplayToggle}
                  />
                  <Toggle
                    label="Normalize Volume"
                    sub="Match loudness across tracks"
                    checked={normalizeVol}
                    onToggle={() => setNormalizeVol(v => !v)}
                  />
                </div>

                {/* Audio Quality */}
                <div className="mt-4">
                  <div className="mb-2 text-[12px] text-white/50">Audio Quality</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {AUDIO_QUALITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setAudioQuality(opt.id)}
                        className={`flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 border transition-all ${
                          audioQuality === opt.id
                            ? 'border-[oklch(0.72_0.26_248_/_0.40)] bg-[oklch(0.72_0.26_248_/_0.10)]'
                            : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className={`text-[12px] font-semibold ${audioQuality === opt.id ? 'text-[oklch(0.85_0.22_248)]' : 'text-white/55'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[9px] text-white/25">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crossfade */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] text-white/50">Crossfade</span>
                    <span className="text-[11px] tabular-nums text-white/28">
                      {crossfade === 0 ? 'Off' : `${crossfade}s`}
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(crossfade / 12) * 100}%`,
                        background: 'linear-gradient(90deg, oklch(0.72 0.26 248), oklch(0.68 0.24 286))',
                      }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={12} step={1} value={crossfade}
                    onChange={(e) => setCrossfade(Number(e.target.value))}
                    className="w-full cursor-pointer opacity-0 h-0"
                    style={{ marginTop: '-6px' }}
                  />
                </div>

                {/* Sleep Timer */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] text-white/50 flex items-center gap-1.5">
                      <Moon className="h-3 w-3" /> Sleep Timer
                    </span>
                    {sleepRemaining !== null && (
                      <span className="text-[10px] tabular-nums text-[oklch(0.72_0.26_248)]">
                        {Math.floor(sleepRemaining / 60)}:{(sleepRemaining % 60).toString().padStart(2, '0')} left
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SLEEP_TIMER_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSleepMinutes(sleepMinutes === opt.id ? 0 : opt.id)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all border ${
                          sleepMinutes === opt.id
                            ? 'bg-[oklch(0.72_0.26_248_/_0.18)] text-[oklch(0.85_0.22_248)] border-[oklch(0.72_0.26_248_/_0.35)]'
                            : 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/[0.06]" />

              {/* ── Equalizer ──────────────────────────────────── */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <SectionHeader icon={<Sliders className="h-4 w-4" />} title="Equalizer" />
                  <div className="flex items-center gap-2">
                    {eqEnabled && (
                      <button
                        onClick={resetEQ}
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                        title="Reset to flat"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => toggle('eqEnabled')}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors"
                      style={{
                        background: eqEnabled ? 'oklch(0.72 0.26 248 / 0.20)' : 'oklch(0.18 0.02 260)',
                        color:      eqEnabled ? 'oklch(0.82 0.22 248)'         : 'oklch(0.45 0.04 260)',
                      }}
                    >
                      {eqEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Mood suggestion */}
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
                <div className="flex justify-between gap-0">
                  {EQ_BAND_LABELS.map(({ key, label, freq }) => (
                    <EQSlider
                      key={key}
                      label={label}
                      freq={freq}
                      value={eq[key]}
                      disabled={!eqEnabled}
                      onChange={(v) => setEQBand(key, v)}
                    />
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-white/20 text-center">
                  Affects visualizer &amp; audio simulation
                </p>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
