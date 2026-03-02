import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import QuickPasteModal from './paste/QuickPasteModal';
import { processExtractedContacts } from '../services/contacts/contactService';
import { ExtractedContact } from '../services/parser/parseService';
import { loadContacts, saveContacts } from '../services/storage/localStorageService';

export default function FloatingPasteButton() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  const handlePasteConfirm = async (
    contacts: ExtractedContact[],
    location: string,
  ) => {
    try {
      const webhookUrl = localStorage.getItem('webhook_url') || '';
      await processExtractedContacts(user?.id || '', contacts, location, webhookUrl);

      addToast({
        message: `Added ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}!`,
        type: 'success',
      });

      setIsPasteModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contacts';
      addToast({ message, type: 'error' });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsPasteModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition z-40 flex items-center justify-center"
        title="Quick Paste (Ctrl+Shift+P)"
        aria-label="Quick Paste"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      <QuickPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onConfirm={handlePasteConfirm}
        defaultLocation="Meeting"
      />
    </>
  );
}
