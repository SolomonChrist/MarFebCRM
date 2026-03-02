import { create } from 'zustand';

export interface TimelineEntry {
  id: string;
  contactId?: string;
  userId: string;
  entryType: 'note' | 'call' | 'meeting' | 'chat' | 'email' | 'work_log' | 'voice_transcript' | 'task_completion';
  plainTextContent: string;
  richTextContent?: string;
  visibility: 'normal' | 'private_locked';
  isEncrypted: boolean;
  source: 'typed' | 'voice' | 'pasted' | 'upload' | 'import' | 'system';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  occurredAt: string;
}

interface TimelineState {
  entries: TimelineEntry[];
  selectedEntry: TimelineEntry | null;
  loading: boolean;
  error: string | null;
}

interface TimelineActions {
  setEntries: (entries: TimelineEntry[]) => void;
  addEntry: (entry: TimelineEntry) => void;
  updateEntry: (id: string, updates: Partial<TimelineEntry>) => void;
  deleteEntry: (id: string) => void;
  setSelectedEntry: (entry: TimelineEntry | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
  entries: [],
  selectedEntry: null,
  loading: false,
  error: null,

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      selectedEntry: state.selectedEntry?.id === id ? { ...state.selectedEntry, ...updates } : state.selectedEntry,
    })),

  deleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
    })),

  setSelectedEntry: (entry) => set({ selectedEntry: entry }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
