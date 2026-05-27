/**
 * AmbientBackground — sautrikroy.me-inspired minimal navy atmosphere
 *
 * Design:
 *  · Very dark navy base — not pure black, closer to #07090f
 *  · Single large radial glow at bottom-center (blue, subtle)
 *  · A smaller secondary glow upper-left (violet, very faint)
 *  · Ultra-fine dot grid for spatial depth
 *  · Film grain at 4% opacity for premium feel
 *  · All CSS only — zero JS, GPU composited via will-change: transform
 *
 * This matches the clean, spacious, premium dark style of sautrikroy.me:
 *   dark navy → barely visible blue ambient glow → black
 *   Not overdone, not neon — restrained luxury.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 15% 20%,
            oklch(0.14 0.04 260) 0%,
            oklch(0.08 0.02 260) 50%,
            oklch(0.05 0.01 260) 100%)
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

      {/* ── Extremely subtle moving slate highlights ── */}
      <div
        className="absolute"
        style={{
          width: '120vw',
          height: '120vh',
          top: '-10%',
          left: '-10%',
          background: 'radial-gradient(circle at center, oklch(0.16 0.05 260 / 0.25) 0%, transparent 60%)',
          animation: 'amb-mesh-a 25s infinite alternate ease-in-out',
          willChange: 'transform',
        }}
      />
      
      <div
        className="absolute"
        style={{
          width: '100vw',
          height: '100vh',
          bottom: '-20%',
          right: '-10%',
          background: 'radial-gradient(circle at center, oklch(0.12 0.03 260 / 0.20) 0%, transparent 60%)',
          animation: 'amb-mesh-b 30s infinite alternate-reverse ease-in-out',
          willChange: 'transform',
        }}
      />

      <div
        className="absolute"
        style={{
          width: '80vw',
          height: '80vh',
          top: '30%',
          left: '25%',
          background: 'radial-gradient(circle at center, oklch(0.14 0.04 260 / 0.15) 0%, transparent 70%)',
          animation: 'amb-mesh-c 20s infinite alternate ease-in-out',
          willChange: 'transform, opacity',
        }}
      />

      <style>{`
        @keyframes amb-mesh-a {
          0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 0.5; }
          100% { transform: scale(1.2) translate(10%, 5%) rotate(15deg); opacity: 0.8; }
        }
        @keyframes amb-mesh-b {
          0% { transform: scale(1.1) translate(0, 0) rotate(0deg); opacity: 0.6; }
          100% { transform: scale(0.9) translate(-15%, -10%) rotate(-10deg); opacity: 0.9; }
        }
        @keyframes amb-mesh-c {
          0% { transform: scale(0.8) translate(10%, -10%); opacity: 0.3; }
          100% { transform: scale(1.4) translate(-10%, 10%); opacity: 0.6; }
        }
      `}</style>

      {/* ── Fine dot grid ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, oklch(1 0 0 / 0.09) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage:
            'radial-gradient(ellipse 75% 55% at 50% 35%, black 10%, transparent 80%)',
        }}
      />

      {/* ── Film grain ── */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}