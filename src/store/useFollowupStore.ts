import { create } from 'zustand';

export interface Followup {
  id: string;
  contactId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FollowupState {
  followups: Followup[];
  loading: boolean;
  error: string | null;
}

interface FollowupActions {
  setFollowups: (followups: Followup[]) => void;
  addFollowup: (followup: Followup) => void;
  updateFollowup: (id: string, updates: Partial<Followup>) => void;
  deleteFollowup: (id: string) => void;
  completeFollowup: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFollowupStore = create<FollowupState & FollowupActions>((set) => ({
  followups: [],
  loading: false,
  error: null,

  setFollowups: (followups) => set({ followups }),

  addFollowup: (followup) => set((state) => ({ followups: [...state.followups, followup] })),

  updateFollowup: (id, updates) =>
    set((state) => ({
      followups: state.followups.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  deleteFollowup: (id) =>
    set((state) => ({
      followups: state.followups.filter((f) => f.id !== id),
    })),

  completeFollowup: (id) =>
    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === id ? { ...f, isCompleted: true, completedAt: new Date().toISOString() } : f,
      ),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
