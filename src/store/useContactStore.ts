import { create } from 'zustand';

export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  hqScore: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilters {
  search: string;
  tags: string[];
  isFavorite?: boolean;
  showArchived?: boolean;
}

interface ContactState {
  contacts: Contact[];
  filters: ContactFilters;
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
}

interface ContactActions {
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  setSelectedContact: (contact: Contact | null) => void;
  setFilters: (filters: Partial<ContactFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContactStore = create<ContactState & ContactActions>((set) => ({
  contacts: [],
  filters: { search: '', tags: [] },
  selectedContact: null,
  loading: false,
  error: null,

  setContacts: (contacts) => set({ contacts }),

  addContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),

  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      selectedContact: state.selectedContact?.id === id ? { ...state.selectedContact, ...updates } : state.selectedContact,
    })),

  deleteContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
    })),

  setSelectedContact: (contact) => set({ selectedContact: contact }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
