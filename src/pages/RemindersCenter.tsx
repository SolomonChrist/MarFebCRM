import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Calendar, Clock } from 'lucide-react';
import { Reminder, loadReminders, saveReminders } from '../services/contacts/contactService';
import { useUIStore } from '../store/useUIStore';

export default function RemindersCenter() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    const loadAllReminders = async () => {
      try {
        setLoading(true);
        const allReminders = loadReminders();
        // Sort by date (closest first)
        const sorted = allReminders.sort((a, b) =>
          new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
        );
        setReminders(sorted);
      } catch (error) {
        console.error('Error loading reminders:', error);
        addToast({ message: 'Failed to load reminders', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadAllReminders();
  }, [addToast]);

  const filteredReminders = reminders.filter(r => {
    if (filterType === 'pending') return !r.completed;
    if (filterType === 'completed') return r.completed;
    return true;
  });

  const handleCompleteReminder = (reminderId: string) => {
    try {
      const updated = reminders.map(r =>
        r.id === reminderId ? { ...r, completed: !r.completed } : r
      );
      saveReminders(updated);
      setReminders(updated);
      const reminder = updated.find(r => r.id === reminderId);
      addToast({
        message: reminder?.completed ? 'Reminder completed' : 'Reminder reopened',
        type: 'success'
      });
    } catch (error) {
      addToast({ message: 'Failed to update reminder', type: 'error' });
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (!window.confirm('Delete this reminder?')) return;

    try {
      const updated = reminders.filter(r => r.id !== reminderId);
      saveReminders(updated);
      setReminders(updated);
      addToast({ message: 'Reminder deleted', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to delete reminder', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const now = new Date();
    const reminderDate = new Date(dateString);
    const diffTime = reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDateBadgeColor = (daysUntil: number, completed: boolean) => {
    if (completed) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (daysUntil <= 0) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    if (daysUntil <= 3) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
    if (daysUntil <= 7) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
  };

  const getDateBadgeLabel = (daysUntil: number) => {
    if (daysUntil <= 0) return 'Overdue';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 3) return `In ${daysUntil} days`;
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return `In ${daysUntil} days`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reminders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage all your contact reminders in one place.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Reminders" value={reminders.length.toString()} color="indigo" />
        <StatCard label="Pending" value={reminders.filter(r => !r.completed).length.toString()} color="orange" />
        <StatCard label="Completed" value={reminders.filter(r => r.completed).length.toString()} color="green" />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilterType('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'pending'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3d3d3d]'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterType('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'completed'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3d3d3d]'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3d3d3d]'
          }`}
        >
          All
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {filterType === 'pending' ? 'No pending reminders' : filterType === 'completed' ? 'No completed reminders' : 'No reminders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const daysUntil = getDaysUntil(reminder.reminderDate);
            const badgeColor = getDateBadgeColor(daysUntil, reminder.completed);

            return (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-[#1a1a1a] rounded-lg border p-4 hover:shadow-md transition flex items-start gap-4 ${
                  reminder.completed
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-gray-200 dark:border-[#2d2d2d]'
                }`}
              >
                {/* Checkbox */}
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => handleCompleteReminder(reminder.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>

                {/* Content */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/contacts/${reminder.contactId}`)}
                >
                  <h3 className={`font-semibold text-gray-900 dark:text-white ${reminder.completed ? 'line-through opacity-60' : ''}`}>
                    {reminder.title}
                  </h3>
                  {reminder.description && (
                    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${reminder.completed ? 'line-through opacity-60' : ''}`}>
                      {reminder.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={14} />
                      {reminder.contactName}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
                      <Calendar className="inline mr-1" size={12} />
                      {reminder.completed ? 'Completed' : getDateBadgeLabel(daysUntil)}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(reminder.reminderDate)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {daysUntil === 0 ? 'Today' : `${Math.abs(daysUntil)} ${daysUntil < 0 ? 'days ago' : 'days'}`}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'indigo' | 'orange' | 'green';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
