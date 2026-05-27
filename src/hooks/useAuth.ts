import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Initialize auth listener
export const initAuthListener = () => {
  const { setUser, setSession, setLoading } = useAuth.getState();
  
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => {
    subscription.unsubscribe();
  };
};
