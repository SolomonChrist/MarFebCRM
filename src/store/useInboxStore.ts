import { create } from 'zustand';

export interface InboxItem {
  id: string;
  userId: string;
  entryId: string;
  status: 'needs_review' | 'assigned' | 'archived';
  suggestedContactId?: string;
  suggestedMatchConfidence?: number;
  createdAt: string;
  reviewedAt?: string;
}

interface InboxState {
  items: InboxItem[];
  loading: boolean;
  error: string | null;
}

interface InboxActions {
  setItems: (items: InboxItem[]) => void;
  addItem: (item: InboxItem) => void;
  updateItem: (id: string, updates: Partial<InboxItem>) => void;
  deleteItem: (id: string) => void;
  assignItem: (id: string, contactId: string) => void;
  archiveItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInboxStore = create<InboxState & InboxActions>((set) => ({
  items: [],
  loading: false,
  error: null,

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  assignItem: (id, contactId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status: 'assigned', suggestedContactId: contactId } : i,
      ),
    })),

  archiveItem: (id) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, status: 'archived' } : i)),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
