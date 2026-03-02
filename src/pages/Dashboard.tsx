import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import QuickPasteModal from '../components/paste/QuickPasteModal';
import { processExtractedContacts } from '../services/contacts/contactService';
import { ExtractedContact } from '../services/parser/parseService';
import { loadContacts, ContactNote, NextStep } from '../services/storage/localStorageService';
import { Contact } from '../services/contacts/contactService';

interface ActivityItem {
  id: string;
  contactId: string;
  contactName: string;
  type: 'note' | 'nextStep';
  content: string;
  createdAt: string;
  completed?: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [contactCount, setContactCount] = useState(0);
  const [favoriteContacts, setFavoriteContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Load contact count, favorites, and recent activity on mount
  useEffect(() => {
    const loadContactsData = async () => {
      try {
        const contacts = await loadContacts();
        setContactCount(contacts.length);
        setAllContacts(contacts);
        const favorites = contacts.filter(c => c.isFavorite);
        setFavoriteContacts(favorites);

        // Load recent activity from all contacts
        const activity: ActivityItem[] = [];
        contacts.forEach(contact => {
          // Load notes
          try {
            const notesData = localStorage.getItem(`contact_${contact.id}_notes`);
            if (notesData) {
              const parsed = JSON.parse(notesData);
              if (Array.isArray(parsed)) {
                const notes = parsed as ContactNote[];
                notes.forEach(note => {
                  activity.push({
                    id: note.id,
                    contactId: contact.id,
                    contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                    type: 'note',
                    content: note.content,
                    createdAt: note.createdAt,
                  });
                });
              }
            }
          } catch (error) {
            // Remove corrupted notes data
            localStorage.removeItem(`contact_${contact.id}_notes`);
          }

          // Load next steps
          try {
            const stepsData = localStorage.getItem(`contact_${contact.id}_nextSteps`);
            if (stepsData) {
              const parsed = JSON.parse(stepsData);
              if (Array.isArray(parsed)) {
                const steps = parsed as NextStep[];
                steps.forEach(step => {
                  activity.push({
                    id: step.id,
                    contactId: contact.id,
                    contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                    type: 'nextStep',
                    content: step.content,
                    createdAt: step.createdAt,
                    completed: step.completed,
                  });
              });
              }
            }
          } catch (error) {
            // Remove corrupted next steps data
            localStorage.removeItem(`contact_${contact.id}_nextSteps`);
          }
        });

        // Sort activity by date descending (most recent first)
        activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentActivity(activity.slice(0, 10)); // Show top 10 recent items
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };
    loadContactsData();
  }, []);

  const handlePasteConfirm = async (
    contacts: ExtractedContact[],
    location: string,
  ) => {
    try {
      // TODO: Get webhook URL from settings
      const webhookUrl = localStorage.getItem('webhook_url') || '';

      await processExtractedContacts(user?.id || '', contacts, location, webhookUrl);

      addToast({
        message: `Added ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} successfully!`,
        type: 'success',
      });

      // Refresh contact count, favorites, and activity
      const updatedContacts = await loadContacts();
      setContactCount(updatedContacts.length);
      setAllContacts(updatedContacts);
      const favorites = updatedContacts.filter(c => c.isFavorite);
      setFavoriteContacts(favorites);

      // Reload recent activity
      const activity: ActivityItem[] = [];
      updatedContacts.forEach(contact => {
        try {
          const notesData = localStorage.getItem(`contact_${contact.id}_notes`);
          if (notesData) {
            const parsed = JSON.parse(notesData);
            if (Array.isArray(parsed)) {
              const notes = parsed as ContactNote[];
              notes.forEach(note => {
                activity.push({
                  id: note.id,
                  contactId: contact.id,
                  contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                  type: 'note',
                  content: note.content,
                  createdAt: note.createdAt,
                });
              });
            }
          }
        } catch (error) {
          // Remove corrupted notes data
          localStorage.removeItem(`contact_${contact.id}_notes`);
        }

        try {
          const stepsData = localStorage.getItem(`contact_${contact.id}_nextSteps`);
          if (stepsData) {
            const parsed = JSON.parse(stepsData);
            if (Array.isArray(parsed)) {
              const steps = parsed as NextStep[];
              steps.forEach(step => {
                activity.push({
                  id: step.id,
                  contactId: contact.id,
                  contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                  type: 'nextStep',
                  content: step.content,
                  createdAt: step.createdAt,
                  completed: step.completed,
                });
              });
            }
          }
        } catch (error) {
          // Remove corrupted next steps data
          localStorage.removeItem(`contact_${contact.id}_nextSteps`);
        }
      });

      activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentActivity(activity.slice(0, 10));

      setIsPasteModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contacts';
      addToast({ message, type: 'error' });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.email}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your personal relationship hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Contacts" value={contactCount.toString()} color="indigo" />
        <StatCard label="This Week" value="0" color="blue" />
        <StatCard label="Overdue" value="0" color="red" />
        <StatCard label="Due Today" value="0" color="green" />
      </div>

      {/* Favorite Contacts Section */}
      {favoriteContacts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">⭐ Favorite Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-4 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {contact.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {contact.firstName} {contact.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company || 'No company'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {contact.hqScore.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">HQ Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      {recentActivity.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Recent Activity</h2>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d]">
            <div className="divide-y divide-gray-200 dark:divide-[#2d2d2d]">
              {recentActivity.map((item) => (
                <div
                  key={`${item.id}-${item.type}`}
                  onClick={() => navigate(`/contacts/${item.contactId}`)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition cursor-pointer flex items-start gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.contactName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.type === 'note'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : item.completed
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {item.type === 'note' ? '📝 Note' : item.completed ? '✅ Next Step' : '📌 Next Step'}
                      </span>
                    </div>
                    <p className={`text-sm text-gray-700 dark:text-gray-300 ${item.completed ? 'line-through opacity-50' : ''}`}>
                      {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Contacts Section */}
      {allContacts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">👥 All Contacts</h2>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d]">
            <div className="divide-y divide-gray-200 dark:divide-[#2d2d2d] max-h-96 overflow-y-auto">
              {allContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition cursor-pointer flex items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {contact.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {contact.firstName} {contact.lastName || ''}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company || 'No company'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {contact.hqScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">HQ Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {allContacts.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Started</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Paste your notes to quickly capture contacts and interactions.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Quick Paste
            </button>
            <button className="bg-gray-200 dark:bg-[#2d2d2d] hover:bg-gray-300 dark:hover:bg-[#3d3d3d] text-gray-900 dark:text-white font-semibold py-2 px-6 rounded-lg transition">
              View Docs
            </button>
          </div>
        </div>
      )}

      <QuickPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onConfirm={handlePasteConfirm}
        defaultLocation="Meeting"
      />
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'indigo' | 'blue' | 'red' | 'green';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
