/**
 * AmbientBackground — deep cinematic atmosphere
 *
 * Design:
 *  · Very dark navy base with seamless gradient (no hard black cutoff)
 *  · Multiple radial glows cover full viewport at all scroll positions
 *  · Bottom region has a subtle violet/teal glow to prevent pure black
 *  · Ultra-fine dot grid for spatial depth
 *  · Film grain at 4% opacity for premium feel
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 15% 20%,
            oklch(0.15 0.04 265) 0%,
            oklch(0.09 0.025 260) 45%,
            oklch(0.065 0.02 260) 100%)
        `,
      }}
    >
      {/* ── Subtle CSS Dot Grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(oklch(1 1 1 / 0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          backgroundPosition: 'center center',
          maskImage: 'radial-gradient(ellipse 100% 100% at center, black 10%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at center, black 10%, transparent 85%)',
        }}
      />

      {/* ── Top-left blue-violet glow ── */}
      <div
        className="absolute"
        style={{
          width: '120vw',
          height: '120vh',
          top: '-10%',
          left: '-10%',
          background: 'radial-gradient(circle at center, oklch(0.18 0.06 265 / 0.30) 0%, transparent 60%)',
          animation: 'amb-mesh-a 25s infinite alternate ease-in-out',
          willChange: 'transform',
        }}
      />

      {/* ── Bottom-right coverage — prevents black cutoff ── */}
      <div
        className="absolute"
        style={{
          width: '110vw',
          height: '110vh',
          bottom: '-15%',
          right: '-5%',
          background: 'radial-gradient(circle at center, oklch(0.13 0.04 260 / 0.28) 0%, transparent 55%)',
          animation: 'amb-mesh-b 30s infinite alternate-reverse ease-in-out',
          willChange: 'transform',
        }}
      />

      {/* ── Center violet accent ── */}
      <div
        className="absolute"
        style={{
          width: '80vw',
          height: '80vh',
          top: '30%',
          left: '25%',
          background: 'radial-gradient(circle at center, oklch(0.16 0.05 280 / 0.18) 0%, transparent 70%)',
          animation: 'amb-mesh-c 20s infinite alternate ease-in-out',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Bottom center glow — fills the dark gap ── */}
      <div
        className="absolute"
        style={{
          width: '100vw',
          height: '60vh',
          bottom: '-10%',
          left: '0',
          background: 'radial-gradient(ellipse at 50% 100%, oklch(0.12 0.03 270 / 0.35) 0%, transparent 70%)',
        }}
      />

      <style>{`
        @keyframes amb-mesh-a {
          0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 0.55; }
          100% { transform: scale(1.2) translate(10%, 5%) rotate(15deg); opacity: 0.85; }
        }
        @keyframes amb-mesh-b {
          0% { transform: scale(1.1) translate(0, 0) rotate(0deg); opacity: 0.65; }
          100% { transform: scale(0.9) translate(-15%, -10%) rotate(-10deg); opacity: 0.95; }
        }
        @keyframes amb-mesh-c {
          0% { transform: scale(0.8) translate(10%, -10%); opacity: 0.35; }
          100% { transform: scale(1.4) translate(-10%, 10%); opacity: 0.65; }
        }
      `}</style>

      {/* ── Fine dot grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, oklch(1 0 0 / 0.07) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage:
            'radial-gradient(ellipse 75% 55% at 50% 35%, black 10%, transparent 80%)',
        }}
      />

      {/* ── Film grain ── */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}