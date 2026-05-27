import { motion, AnimatePresence } from 'framer-motion';

export function SpotifyCanvas({ albumArt }: { albumArt?: string }) {
  return (
    <AnimatePresence mode="wait">
      {albumArt && (
        <motion.div
          key={albumArt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          {/* Main blurred background */}
          <motion.div
            className="absolute inset-[-10%]"
            style={{
              backgroundImage: `url(${albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(70px) saturate(200%) brightness(0.5)',
            }}
            animate={{
              scale: [1.1, 1.25, 1.1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
            }}
          />

          {/* Overlay gradient orb 1 */}
          <motion.div
            className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full mix-blend-screen"
            style={{
              backgroundImage: `url(${albumArt})`,
              backgroundSize: 'cover',
              filter: 'blur(100px) saturate(300%) opacity(0.4)',
            }}
            animate={{
              x: ['0%', '20%', '0%'],
              y: ['0%', '30%', '0%'],
            }}
            transition={{ duration: 15, ease: 'linear', repeat: Infinity }}
          />

          {/* Overlay gradient orb 2 */}
          <motion.div
            className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full mix-blend-screen"
            style={{
              backgroundImage: `url(${albumArt})`,
              backgroundSize: 'cover',
              filter: 'blur(100px) saturate(300%) opacity(0.3)',
            }}
            animate={{
              x: ['0%', '-30%', '0%'],
              y: ['0%', '-20%', '0%'],
            }}
            transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
