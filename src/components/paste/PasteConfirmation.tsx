import { useState } from 'react';
import { ChevronLeft, AlertCircle, Mail, Phone, Building2 } from 'lucide-react';
import { ExtractedContact } from '../../services/parser/parseService';

interface PasteConfirmationProps {
  contacts: ExtractedContact[];
  location: string;
  onConfirm: (contacts: ExtractedContact[], location: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export default function PasteConfirmation({
  contacts,
  location,
  onConfirm,
  onBack,
  isLoading,
}: PasteConfirmationProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContacts, setEditedContacts] = useState<ExtractedContact[]>(contacts);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(
    new Set(contacts.map((_, i) => i)),
  );

  const handleToggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  const handleEditContact = (index: number, field: keyof ExtractedContact, value: string) => {
    const updated = [...editedContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEditedContacts(updated);
  };

  const handleSave = async () => {
    const contactsToSave = editedContacts.filter((_, i) => selectedContacts.has(i));
    await onConfirm(contactsToSave, location);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <AlertCircle className="text-blue-600" size={20} />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Found {contacts.length} contact{contacts.length !== 1 ? 's' : ''}. Review and select which to save.
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {editedContacts.map((contact, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition ${
              selectedContacts.has(index)
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#0f0f0f]'
            }`}
          >
            {/* Checkbox & Name */}
            <div className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={selectedContacts.has(index)}
                onChange={() => handleToggleContact(index)}
                className="mt-1 w-4 h-4 accent-indigo-600"
              />
              <div className="flex-1">
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleEditContact(index, 'name', e.target.value)}
                    className="w-full text-lg font-bold p-2 border border-indigo-600 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                ) : (
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {contact.name}
                  </h3>
                )}
              </div>
              <button
                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-[#2d2d2d] hover:bg-gray-300 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300 transition"
              >
                {editingIndex === index ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Company */}
            {(contact.company || editingIndex === index) && (
              <div className="flex items-center gap-2 mb-2 text-sm">
                <Building2 size={16} className="text-gray-500" />
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={contact.company || ''}
                    onChange={(e) => handleEditContact(index, 'company', e.target.value)}
                    placeholder="Company"
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-[#2d2d2d] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="text-gray-700 dark:text-gray-300">{contact.company}</span>
                )}
              </div>
            )}

            {/* Email */}
            {(contact.email || editingIndex === index) && (
              <div className="flex items-center gap-2 mb-2 text-sm">
                <Mail size={16} className="text-gray-500" />
                {editingIndex === index ? (
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => handleEditContact(index, 'email', e.target.value)}
                    placeholder="Email"
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-[#2d2d2d] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-xs"
                  />
                ) : (
                  <span className="text-gray-700 dark:text-gray-300 break-all">{contact.email}</span>
                )}
              </div>
            )}

            {/* Phone */}
            {(contact.phone || editingIndex === index) && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <Phone size={16} className="text-gray-500" />
                {editingIndex === index ? (
                  <input
                    type="tel"
                    value={contact.phone || ''}
                    onChange={(e) => handleEditContact(index, 'phone', e.target.value)}
                    placeholder="Phone"
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-[#2d2d2d] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="text-gray-700 dark:text-gray-300">{contact.phone}</span>
                )}
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="text-sm">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Notes
                </label>
                {editingIndex === index ? (
                  <textarea
                    value={contact.notes}
                    onChange={(e) => handleEditContact(index, 'notes', e.target.value)}
                    className="w-full h-20 p-2 border border-gray-300 dark:border-[#2d2d2d] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-xs resize-none"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0f0f0f] p-2 rounded whitespace-pre-wrap text-xs max-h-24 overflow-hidden">
                    {contact.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={selectedContacts.size === 0 || isLoading}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : `Save ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
