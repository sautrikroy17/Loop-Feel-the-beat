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

  // Pill fills in with background on scroll
  const pillBg = useTransform(
    scrollY,
    [0, 60],
    ['oklch(0.07 0.028 260 / 0.3)', 'oklch(0.07 0.028 260 / 0.88)'],
  );
  const pillBorder = useTransform(
    scrollY,
    [0, 60],
    ['oklch(1 0 0 / 0.05)', 'oklch(1 0 0 / 0.10)'],
  );
  const pillBlur = useTransform(
    scrollY,
    [0, 60],
    ['blur(12px) saturate(140%)', 'blur(24px) saturate(180%)'],
  );

  const intel     = useListeningIntelligence();
  const mood      = intel.getCurrentMood();
  const moodBadge = MOOD_BADGES[mood] ?? '';
  const hasData   = intel.events.length > 0;
  const { user } = useAuth();

  return (
    /* Fixed container that spans full width but only to position the pill */
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <motion.nav
        style={{
          background: pillBg,
          borderColor: pillBorder,
          backdropFilter: pillBlur,
          WebkitBackdropFilter: pillBlur as unknown as string,
        }}
        className="flex w-full max-w-4xl items-center justify-between rounded-2xl border px-4 py-2.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
      >
        {/* Logo */}
        <a href="#top" className="flex items-center gap-0 shrink-0">
          <LoopLogo size={28} showText={true} textSize="text-[15px]" />
        </a>

        {/* Center nav links */}
        <nav className="hidden items-center gap-0.5 md:flex">
          <NavLink href="#top">Home</NavLink>
          <NavLink href="#discover">Discover</NavLink>
          {hasData && moodBadge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-1 rounded-full px-3 py-1 text-[11px] font-medium"
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
        <div className="flex items-center gap-1.5">
          {/* Search pill */}
          <button
            onClick={onSearchOpen}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-sm text-white/50 transition-all hover:bg-white/[0.10] hover:text-white/80"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:block text-xs">Search</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/35 sm:inline-block">
              ⌘K
            </kbd>
          </button>

          {/* Library */}
          <button
            onClick={onLibraryOpen}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/45 transition-all hover:bg-white/[0.09] hover:text-white/80"
            title="Your Library"
          >
            <ListMusic className="h-3.5 w-3.5" />
          </button>

          {/* Profile */}
          <button
            onClick={onProfileOpen}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all hover:text-white/80 overflow-hidden"
            style={{
              borderColor: hasData ? 'oklch(0.72 0.26 248 / 0.35)' : 'oklch(1 0 0 / 0.08)',
              background:  hasData ? 'oklch(0.72 0.26 248 / 0.10)' : 'oklch(1 0 0 / 0.04)',
              color:       hasData ? 'oklch(0.82 0.22 248)'          : 'oklch(1 0 0 / 0.45)',
            }}
            title="Profile & Stats"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            {hasData && !user && (
              <span
                className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
                style={{ background: 'oklch(0.72 0.26 248)' }}
              />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsOpen}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/45 transition-all hover:bg-white/[0.09] hover:text-white/80"
            title="Settings (,)"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.nav>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white"
    >
      {children}
    </a>
  );
}