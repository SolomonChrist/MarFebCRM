import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { parseContactsFromText, ExtractedContact } from '../../services/parser/parseService';
import PasteConfirmation from './PasteConfirmation';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contacts: ExtractedContact[], location: string) => Promise<void>;
  defaultLocation?: string;
}

const COMMON_LOCATIONS = [
  'BNI Meeting',
  'Coffee Chat',
  'Intro Call',
  'Networking Event',
  'Conference',
  'Workshop',
  'Meetup',
  'Phone Call',
  'Email',
  'Other',
];

export default function QuickPasteModal({
  isOpen,
  onClose,
  onConfirm,
  defaultLocation = 'Meeting',
}: QuickPasteModalProps) {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [pastedText, setPastedText] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleParse = () => {
    if (!pastedText.trim()) return;

    setIsLoading(true);
    try {
      const contacts = parseContactsFromText(pastedText);
      setExtractedContacts(contacts);
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (
    finalContacts: ExtractedContact[],
    finalLocation: string,
  ) => {
    setIsLoading(true);
    try {
      await onConfirm(finalContacts, finalLocation);
      // Reset and close
      setPastedText('');
      setExtractedContacts([]);
      setStep('input');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPastedText('');
    setExtractedContacts([]);
    setStep('input');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-[#2d2d2d]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2d2d2d]">
            <div className="flex items-center gap-2">
              <Zap className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quick Paste
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'input' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste your notes here
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste event notes, contact details, interaction logs..."
                    className="w-full h-64 p-4 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Where did you meet them?
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {COMMON_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="">--- Custom ---</option>
                  </select>

                  {location === '' && (
                    <input
                      type="text"
                      placeholder="Enter custom location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full mt-2 p-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Separate different people by blank lines. Include emails, phones, company info where available.
                </p>
              </div>
            )}

            {step === 'confirm' && (
              <PasteConfirmation
                contacts={extractedContacts}
                location={location}
                onConfirm={handleConfirm}
                onBack={() => setStep('input')}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Footer */}
          {step === 'input' && (
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-[#2d2d2d]">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={!pastedText.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {isLoading ? 'Parsing...' : 'Parse & Review'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
