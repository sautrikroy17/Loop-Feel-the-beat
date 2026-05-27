import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Settings, User, ListMusic } from 'lucide-react';
import { useListeningIntelligence } from '@/hooks/useListeningIntelligence';
import { useAuth } from '@/hooks/useAuth';
import { LoopLogo } from './LoopLogo';

const MOOD_BADGES: Record<string, string> = {
  focus: '🎯 Focus', chill: '🌊 Chill', 'night-drive': '🌙 Night',
  party: '🔥 Party', emotional: '💙 Feels', gym: '⚡ Gym',
  underground: '💎 Underground', morning: '☀️ Morning',
  discovery: '✨ Explore', balanced: '',
};

interface NavbarProps {
  onSearchOpen: () => void;
  onSettingsOpen: () => void;
  onProfileOpen: () => void;
  onLibraryOpen: () => void;
}

export function Navbar({ onSearchOpen, onSettingsOpen, onProfileOpen, onLibraryOpen }: NavbarProps) {
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 80],
    ['oklch(0.04 0.024 258 / 0)', 'oklch(0.05 0.022 260 / 0.95)'],
  );
  const borderOp = useTransform(scrollY, [40, 80], [0, 1]);

  const intel     = useListeningIntelligence();
  const mood      = intel.getCurrentMood();
  const moodBadge = MOOD_BADGES[mood] ?? '';
  const hasData   = intel.events.length > 0;
  const { user } = useAuth();

  return (
    <motion.header
      style={{ background: bg }}
      className="fixed inset-x-0 top-0 z-40 backdrop-blur-2xl"
    >
      <motion.div
        style={{ opacity: borderOp }}
        className="absolute inset-x-0 bottom-0 h-px bg-white/[0.07]"
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-0">
          <LoopLogo size={30} showText={true} textSize="text-[17px]" />
        </a>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="#top">Home</NavLink>
          <NavLink href="#discover">Discover</NavLink>
          {/* Mood badge — shows current detected vibe */}
          {hasData && moodBadge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full px-3 py-1 text-[11px] font-medium"
              style={{
                background: 'oklch(0.72 0.26 248 / 0.10)',
                color: 'oklch(0.82 0.20 248)',
                border: '1px solid oklch(0.72 0.26 248 / 0.20)',
              }}
            >
              {moodBadge}
            </motion.span>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search pill */}
          <button
            onClick={onSearchOpen}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/50 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-white/80"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:block">Search</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/35 sm:inline-block">
              ⌘K
            </kbd>
          </button>

          {/* Library */}
          <button
            onClick={onLibraryOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/80"
            title="Your Library"
          >
            <ListMusic className="h-4 w-4" />
          </button>

          {/* Profile — glows when intelligence data exists */}
          <button
            onClick={onProfileOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white/80"
            style={{
              borderColor: hasData ? 'oklch(0.72 0.26 248 / 0.35)' : 'oklch(1 0 0 / 0.10)',
              background:  hasData ? 'oklch(0.72 0.26 248 / 0.10)' : 'oklch(1 0 0 / 0.05)',
              color:       hasData ? 'oklch(0.82 0.22 248)'          : 'oklch(1 0 0 / 0.45)',
            }}
            title="Profile & Stats"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
            {hasData && !user && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                style={{ background: 'oklch(0.72 0.26 248)' }}
              />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/80"
            title="Settings (,)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}


function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-3 py-2 text-sm text-white/45 transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}