import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Reminder } from '../../services/contacts/contactService';
import { v4 as uuidv4 } from 'uuid';

interface ReminderModalProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onAddReminder: (reminder: Reminder) => void;
}

export default function ReminderModal({
  contactId,
  contactName,
  onClose,
  onAddReminder,
}: ReminderModalProps) {
  const [reminderType, setReminderType] = useState<'date' | 'days_from_now'>('days_from_now');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderDays, setReminderDays] = useState('7');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Reminder title is required');
      return;
    }

    if (reminderType === 'date' && !reminderDate) {
      alert('Please select a date');
      return;
    }

    if (reminderType === 'days_from_now' && !reminderDays) {
      alert('Please enter number of days');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalReminderDate = reminderDate;
      if (reminderType === 'days_from_now') {
        const days = parseInt(reminderDays, 10);
        const date = new Date();
        date.setDate(date.getDate() + days);
        finalReminderDate = date.toISOString().split('T')[0];
      }

      const reminder: Reminder = {
        id: uuidv4(),
        contactId,
        contactName,
        reminderType,
        reminderDate: finalReminderDate,
        reminderDays: reminderType === 'days_from_now' ? parseInt(reminderDays, 10) : undefined,
        title,
        description: description || undefined,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      onAddReminder(reminder);
      onClose();
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2d2d2d] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Set Reminder</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reminder Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              What should you do? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call John, Send proposal, Follow up"
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Reminder Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              When? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReminderType('days_from_now')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                  reminderType === 'days_from_now'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d3d]'
                }`}
              >
                In X Days
              </button>
              <button
                type="button"
                onClick={() => setReminderType('date')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                  reminderType === 'date'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d3d]'
                }`}
              >
                Specific Date
              </button>
            </div>
          </div>

          {/* Days Input */}
          {reminderType === 'days_from_now' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                How many days from now? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reminder will be set for {new Date(new Date().getTime() + (parseInt(reminderDays || '7') * 24 * 60 * 60 * 1000)).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Date Input */}
          {reminderType === 'date' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Select date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#252525] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Setting...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
