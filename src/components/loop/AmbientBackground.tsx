/**
 * AmbientBackground — ULTRA premium dark gradient aesthetic
 *
 * Design intent: "It should feel like you're inside the music."
 *
 * Very dark navy base + VIVID, punchy gradient orbs.
 * Heavy chroma + high opacity = gradient you can FEEL, not just see.
 * Animated breathing motion keeps it alive.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* ── Base: Deep navy — NOT pitch black ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 100% at 15% 10%,
              oklch(0.22 0.10 268) 0%,
              oklch(0.12 0.05 265) 45%,
              oklch(0.082 0.030 268) 100%)
          `,
        }}
      />

      {/* ── Orb 1: Electric blue-violet — top-left dominant ── */}
      <div
        className="absolute"
        style={{
          width: '130vw',
          height: '120vh',
          top: '-25%',
          left: '-18%',
          background: 'radial-gradient(circle at center, oklch(0.45 0.22 262 / 0.65) 0%, oklch(0.32 0.16 268 / 0.35) 42%, transparent 65%)',
          animation: 'amb-a 24s infinite alternate ease-in-out',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Orb 2: Deep violet — right side ── */}
      <div
        className="absolute"
        style={{
          width: '120vw',
          height: '120vh',
          top: '-5%',
          right: '-22%',
          background: 'radial-gradient(circle at center, oklch(0.38 0.20 288 / 0.58) 0%, oklch(0.26 0.13 285 / 0.28) 44%, transparent 65%)',
          animation: 'amb-b 31s infinite alternate-reverse ease-in-out',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Orb 3: Cyan teal accent — bottom-left ── */}
      <div
        className="absolute"
        style={{
          width: '90vw',
          height: '85vh',
          bottom: '-20%',
          left: '-5%',
          background: 'radial-gradient(circle at center, oklch(0.35 0.18 240 / 0.48) 0%, oklch(0.22 0.10 245 / 0.22) 48%, transparent 68%)',
          animation: 'amb-c 19s infinite alternate ease-in-out',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Orb 4: Purple — bottom-right corner ── */}
      <div
        className="absolute"
        style={{
          width: '80vw',
          height: '70vh',
          bottom: '-15%',
          right: '-8%',
          background: 'radial-gradient(circle at center, oklch(0.30 0.16 292 / 0.45) 0%, transparent 62%)',
          animation: 'amb-a 22s 5s infinite alternate-reverse ease-in-out',
        }}
      />

      {/* ── Center bloom: Subtle mid-screen glow ── */}
      <div
        className="absolute"
        style={{
          width: '100vw',
          height: '80vh',
          top: '30%',
          left: '15%',
          background: 'radial-gradient(ellipse at center, oklch(0.25 0.11 275 / 0.32) 0%, transparent 65%)',
          animation: 'amb-c 28s 2s infinite alternate ease-in-out',
        }}
      />

      {/* ── Vignette: Pull edges to dark ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, oklch(0.04 0.02 265 / 0.55) 80%, oklch(0.04 0.02 265 / 0.85) 100%)',
        }}
      />

      {/* ── Dot grid (very subtle) ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.055) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 75% 55% at 50% 32%, black 10%, transparent 78%)',
        }}
      />

      {/* ── Film grain ── */}
      <div
        className="absolute inset-0 opacity-[0.040] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.90' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <style>{`
        @keyframes amb-a {
          0%   { transform: scale(1)    translate(0, 0)      rotate(0deg);   opacity: 0.70; }
          50%  { transform: scale(1.12) translate(4%, 3%)    rotate(5deg);   opacity: 0.90; }
          100% { transform: scale(1.25) translate(9%, 6%)    rotate(12deg);  opacity: 1.0;  }
        }
        @keyframes amb-b {
          0%   { transform: scale(1.1)  translate(0, 0)      rotate(0deg);   opacity: 0.75; }
          50%  { transform: scale(0.95) translate(-6%, -4%)  rotate(-4deg);  opacity: 0.92; }
          100% { transform: scale(0.85) translate(-13%, -9%) rotate(-9deg);  opacity: 1.0;  }
        }
        @keyframes amb-c {
          0%   { transform: scale(0.88) translate(7%, -9%);  opacity: 0.55; }
          50%  { transform: scale(1.08) translate(0%, 0%);   opacity: 0.80; }
          100% { transform: scale(1.32) translate(-7%, 9%);  opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}