import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  user: User | null;
  isUnlocked: boolean;
  encryptionKey: CryptoKey | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  unlock: (encryptionKey: CryptoKey) => void;
  lock: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  restoreSession: () => void;
}

// Helper to restore auth state from localStorage
const getPersistedAuth = (): Partial<AuthSession> => {
  try {
    const stored = localStorage.getItem('marfebcrm_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isLoggedIn: parsed.isLoggedIn || false,
        user: parsed.user || null,
      };
    }
  } catch (error) {
    console.error('Error restoring auth state:', error);
  }
  return {};
};

// Helper to persist auth state to localStorage
const persistAuth = (user: User | null, isLoggedIn: boolean) => {
  try {
    if (isLoggedIn && user) {
      localStorage.setItem('marfebcrm_auth', JSON.stringify({ user, isLoggedIn: true }));
    } else {
      localStorage.removeItem('marfebcrm_auth');
    }
  } catch (error) {
    console.error('Error persisting auth state:', error);
  }
};

const initialAuth = getPersistedAuth();

export const useAuthStore = create<AuthSession & AuthActions>((set) => ({
  isLoggedIn: initialAuth.isLoggedIn || false,
  user: initialAuth.user || null,
  isUnlocked: false,
  encryptionKey: null,
  loading: false,
  error: null,

  login: (user: User) => {
    persistAuth(user, true);
    set({ isLoggedIn: true, user, error: null });
  },

  logout: () => {
    persistAuth(null, false);
    set({ isLoggedIn: false, user: null, isUnlocked: false, encryptionKey: null });
  },

  unlock: (encryptionKey: CryptoKey) => {
    set({ isUnlocked: true, encryptionKey });
  },

  lock: () => {
    set({ isUnlocked: false, encryptionKey: null });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  restoreSession: () => {
    const auth = getPersistedAuth();
    set({ isLoggedIn: auth.isLoggedIn || false, user: auth.user || null });
  },
}));
