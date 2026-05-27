import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Waveform } from "./Waveform";
import { SectionShell } from "./SectionShell";
import { useTactileHover } from "@/hooks/useTactileHover";
import { usePlayback } from "@/hooks/usePlayback";

function formatDuration(ms?: number) {
  if (!ms) return "--:--";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const lyrics = [
  "I got my peaches out in Georgia",
  "I get my weed from California",
  "I took my chick up to the North, yeah",
  "I get my light right from the source, yeah",
];

export function PlayerSection() {
  const { 
    currentTrack, queue, isPlaying, progress, 
    isShuffle, repeatMode, 
    togglePlayPause, nextTrack, prevTrack, toggleShuffle, toggleRepeat 
  } = usePlayback();

  return (
    <SectionShell id="player" tone="violet" className="py-32 sm:py-48">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl">
          <Reveal>
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              The player
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.02]">
              Not an interface. <span className="text-gradient">An atmosphere.</span>
            </h2>
          </Reveal>
        </div>

        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-[2rem] p-6 shadow-[0_40px_120px_-30px_oklch(0_0_0_/_0.8),0_0_120px_-40px_oklch(0.7_0.22_290_/_0.4)] sm:p-10">
            {/* ambient glow inside player */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full blur-[120px]"
              style={{ background: "oklch(0.55 0.22 290 / 0.4)" }} />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr]">
              {/* album + waveform */}
              <div>
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative mx-auto aspect-square w-full max-w-md"
                >
                  <div
                    className="absolute inset-0 rounded-[2rem] blur-2xl opacity-80"
                    style={{
                      background:
                        "conic-gradient(from 0deg, oklch(0.7 0.22 290), oklch(0.72 0.2 240), oklch(0.82 0.15 200), oklch(0.7 0.22 290))",
                    }}
                  />
                  <div
                    className="relative h-full w-full rounded-[2rem] ring-1 ring-white/15"
                    style={{
                      background: currentTrack?.albumArt
                        ? `url(${currentTrack.albumArt}) center/cover`
                        : "radial-gradient(circle at 30% 30%, oklch(0.55 0.22 290), oklch(0.18 0.05 280) 70%)",
                    }}
                  >
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="font-display text-xl font-semibold truncate">
                        {currentTrack?.title || "Peaches"}
                      </div>
                      <div className="text-sm text-white/70 truncate">
                        {currentTrack?.artist || "Justin Bieber"}
                      </div>
                    </div>
                    <div className="absolute right-6 top-6 h-3 w-3 rounded-full bg-white/80 shadow-[0_0_18px_white]" />
                  </div>
                </motion.div>

                <div className="mt-8">
                  <Waveform bars={64} height={80} isPlaying={isPlaying} />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Ctrl onClick={prevTrack}>⏮</Ctrl>
                  <Ctrl onClick={toggleShuffle} active={isShuffle}>🔀</Ctrl>
                  <PlayBtn isPlaying={isPlaying} onClick={togglePlayPause} />
                  <Ctrl onClick={toggleRepeat} active={repeatMode !== 'none'}>
                    {repeatMode === 'one' ? '🔂' : '🔁'}
                  </Ctrl>
                  <Ctrl onClick={nextTrack}>⏭</Ctrl>
                </div>
              </div>

              {/* lyrics + queue */}
              <div className="flex flex-col gap-6">
                <div className="glass rounded-2xl p-6">
                  <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Live lyrics
                  </div>
                  <div className="space-y-3">
                    {lyrics.map((l, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          opacity: i === 1 ? 1 : 0.35,
                          x: i === 1 ? 6 : 0,
                        }}
                        transition={{ duration: 0.8 }}
                        className={`font-display text-lg ${i === 1 ? "text-foreground" : "text-muted-foreground"}`}
                        style={
                          i === 1
                            ? { textShadow: "0 0 24px oklch(0.7 0.22 290 / 0.6)" }
                            : undefined
                        }
                      >
                        {l}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <span>Up next</span>
                    <span>Queue</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {queue.length === 0 && (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        Queue is empty. Autoplay will pick the next song.
                      </div>
                    )}
                    {queue.slice(0, 10).map((track, i) => (
                      <QueueItem key={`${track.id}-${i}`} track={track} i={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

function Ctrl({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  const tactile = useTactileHover({
    maxTilt: 8,
    spotlightStrength: 0.28,
    stiffness: 260,
    damping: 20,
  });
  return (
    <motion.button
      onClick={onClick}
      {...tactile.bind}
      style={{
        ...tactile.transformStyle,
        rotateX: tactile.rx,
        rotateY: tactile.ry,
      }}
      whileHover={{ scale: 1.12, y: -3 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`glass flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs relative overflow-hidden transition-colors ${active ? 'text-white bg-white/10' : 'text-foreground/80'}`}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{
          background: tactile.spotlightBg,
          opacity: tactile.spotlightOpacity,
        }}
      />
      {children}
    </motion.button>
  );
}

function PlayBtn({ isPlaying, onClick }: { isPlaying?: boolean; onClick?: () => void }) {
  const tactile = useTactileHover({
    maxTilt: 9,
    spotlightStrength: 0.34,
    stiffness: 260,
    damping: 20,
  });
  return (
    <motion.button
      onClick={onClick}
      {...tactile.bind}
      style={{
        ...tactile.transformStyle,
        rotateX: tactile.rx,
        rotateY: tactile.ry,
        background:
          "linear-gradient(135deg, oklch(0.78 0.22 290), oklch(0.72 0.2 240))",
        boxShadow: "0 0 60px -5px oklch(0.7 0.22 290 / 0.85)",
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.94 }}
      className="relative flex h-16 w-16 items-center justify-center rounded-full"
      transition={{ type: "spring", stiffness: 270, damping: 20 }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{
          background: tactile.spotlightBg,
          opacity: tactile.spotlightOpacity,
        }}
      />
      <span className={isPlaying ? "text-xl text-primary-foreground" : "ml-1 text-xl text-primary-foreground"}>
        {isPlaying ? '⏸' : '▶'}
      </span>
    </motion.button>
  );
}

function QueueItem({
  track,
  i,
}: {
  track: any;
  i: number;
}) {
  const tactile = useTactileHover({
    maxTilt: 6,
    spotlightStrength: 0.22,
    stiffness: 240,
    damping: 20,
  });

  return (
    <motion.div
      {...tactile.bind}
      style={{
        ...tactile.transformStyle,
        rotateX: tactile.rx,
        rotateY: tactile.ry,
      }}
      whileHover={{ x: 4, y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex items-center gap-3 py-3 relative overflow-hidden"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: tactile.spotlightBg,
          opacity: tactile.spotlightOpacity,
        }}
      />
      <div
        className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-white/10"
        style={{
          background: track.albumArt 
            ? `url(${track.albumArt}) center/cover`
            : `linear-gradient(135deg, oklch(0.5 0.2 ${260 + i * 25}), oklch(0.25 0.06 280))`
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{track.title}</div>
        <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
      </div>
      <div className="text-xs tabular-nums text-muted-foreground">{formatDuration(track.durationMs)}</div>
    </motion.div>
  );
}