import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { Contact } from '../services/contacts/contactService';
import { loadContacts, saveContacts } from '../services/storage/localStorageService';

interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
}

interface NextStep {
  id: string;
  content: string;
  createdAt: string;
  completed: boolean;
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNextStep, setNewNextStep] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    tags: [] as string[],
    hqScore: 5.0,
  });
  const [newTag, setNewTag] = useState('');

  // Load contact on mount
  useEffect(() => {
    const loadContact = async () => {
      try {
        setLoading(true);
        const contacts = await loadContacts();
        const found = contacts.find(c => c.id === id);

        if (!found) {
          addToast({ message: 'Contact not found', type: 'error' });
          navigate('/contacts');
          return;
        }

        setContact(found);
        setFormData({
          firstName: found.firstName,
          lastName: found.lastName || '',
          email: found.email || '',
          phone: found.phone || '',
          company: found.company || '',
          tags: found.tags || [],
          hqScore: found.hqScore,
        });

        // Load notes
        try {
          const savedNotes = localStorage.getItem(`contact_${found.id}_notes`);
          if (savedNotes) {
            const parsed = JSON.parse(savedNotes);
            if (Array.isArray(parsed)) {
              setNotes(parsed);
            }
          }
        } catch (error) {
          // Remove corrupted notes data
          localStorage.removeItem(`contact_${found.id}_notes`);
        }

        // Load next steps
        try {
          const savedNextSteps = localStorage.getItem(`contact_${found.id}_nextSteps`);
          if (savedNextSteps) {
            const parsed = JSON.parse(savedNextSteps);
            if (Array.isArray(parsed)) {
              setNextSteps(parsed);
            }
          }
        } catch (error) {
          // Remove corrupted next steps data
          localStorage.removeItem(`contact_${found.id}_nextSteps`);
        }
      } catch (error) {
        console.error('Error loading contact:', error);
        addToast({ message: 'Failed to load contact', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, [id, navigate, addToast]);

  const handleSave = async () => {
    if (!contact) return;

    try {
      setIsSaving(true);

      // Update contact
      const contacts = await loadContacts();
      const updated = contacts.map(c =>
        c.id === contact.id
          ? {
              ...c,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              company: formData.company,
              tags: formData.tags,
              hqScore: formData.hqScore,
              updatedAt: new Date().toISOString(),
            }
          : c
      );

      await saveContacts(updated);

      setContact(updated.find(c => c.id === contact.id) || contact);
      setIsEditing(false);
      addToast({ message: 'Contact updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving contact:', error);
      addToast({ message: 'Failed to save contact', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!contact || !newNote.trim()) return;

    try {
      const note: ContactNote = {
        id: crypto.randomUUID(),
        content: newNote,
        createdAt: new Date().toISOString(),
      };

      const updatedNotes = [note, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem(`contact_${contact.id}_notes`, JSON.stringify(updatedNotes));
      setNewNote('');
      addToast({ message: 'Note added', type: 'success' });
    } catch (error) {
      console.error('Error adding note:', error);
      addToast({ message: 'Failed to add note', type: 'error' });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!contact) return;

    // Ask for confirmation before deleting
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      localStorage.setItem(`contact_${contact.id}_notes`, JSON.stringify(updatedNotes));
      addToast({ message: 'Note deleted', type: 'success' });
    } catch (error) {
      console.error('Error deleting note:', error);
      addToast({ message: 'Failed to delete note', type: 'error' });
    }
  };

  const handleAddNextStep = async () => {
    if (!contact || !newNextStep.trim()) return;

    try {
      const step: NextStep = {
        id: crypto.randomUUID(),
        content: newNextStep,
        createdAt: new Date().toISOString(),
        completed: false,
      };

      const updatedSteps = [step, ...nextSteps];
      setNextSteps(updatedSteps);
      localStorage.setItem(`contact_${contact.id}_nextSteps`, JSON.stringify(updatedSteps));
      setNewNextStep('');
      addToast({ message: 'Next step added', type: 'success' });
    } catch (error) {
      console.error('Error adding next step:', error);
      addToast({ message: 'Failed to add next step', type: 'error' });
    }
  };

  const handleToggleNextStep = async (stepId: string) => {
    if (!contact) return;

    try {
      const updatedSteps = nextSteps.map(s =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );
      setNextSteps(updatedSteps);
      localStorage.setItem(`contact_${contact.id}_nextSteps`, JSON.stringify(updatedSteps));
      addToast({
        message: updatedSteps.find(s => s.id === stepId)?.completed ? 'Step completed' : 'Step reopened',
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling next step:', error);
      addToast({ message: 'Failed to update step', type: 'error' });
    }
  };

  const handleDeleteNextStep = async (stepId: string) => {
    if (!contact) return;

    if (!window.confirm('Are you sure you want to delete this next step?')) {
      return;
    }

    try {
      const updatedSteps = nextSteps.filter(s => s.id !== stepId);
      setNextSteps(updatedSteps);
      localStorage.setItem(`contact_${contact.id}_nextSteps`, JSON.stringify(updatedSteps));
      addToast({ message: 'Next step deleted', type: 'success' });
    } catch (error) {
      console.error('Error deleting next step:', error);
      addToast({ message: 'Failed to delete step', type: 'error' });
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const trimmedTag = newTag.trim();

    if (formData.tags.includes(trimmedTag)) {
      addToast({ message: 'Tag already added', type: 'error' });
      return;
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, trimmedTag]
    });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Contact not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/contacts')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Contacts
        </button>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            isEditing
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isEditing ? (
            <>
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </>
          ) : (
            <>
              <Edit2 size={18} />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Information */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Contact Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{contact.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{contact.lastName || '-'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{contact.email || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{contact.phone || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{contact.company || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HQ Score ({formData.hqScore.toFixed(1)})
                </label>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={formData.hqScore}
                    onChange={(e) => setFormData({ ...formData, hqScore: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                ) : (
                  <div className="w-full bg-gray-200 dark:bg-[#2d2d2d] rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(contact.hqScore / 10) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (Friends, Business, Family, etc.)
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <div
                          key={tag}
                          className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No tags yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline - Notes & Next Steps */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              📋 Activity Timeline
            </h3>

            {/* Add Note & Next Step */}
            <div className="space-y-4 mb-8 pb-6 border-b border-gray-200 dark:border-[#2d2d2d]">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Note
                </label>
                <div className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Quick note about this contact..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
                  >
                    <Plus size={18} />
                    Add Note
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Next Step
                </label>
                <div className="space-y-2">
                  <textarea
                    value={newNextStep}
                    onChange={(e) => setNewNextStep(e.target.value)}
                    placeholder="What's the next action? Follow-up call, send proposal, etc..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    onClick={handleAddNextStep}
                    disabled={!newNextStep.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
                  >
                    <Plus size={18} />
                    Add Next Step
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3">
              {notes.length === 0 && nextSteps.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activity yet. Add notes or next steps!</p>
              ) : (
                <>
                  {/* Next Steps */}
                  {nextSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-4 rounded-lg border transition ${
                        step.completed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={() => handleToggleNextStep(step.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">📌 Next Step</span> • {formatDate(step.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNextStep(step.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className={`text-gray-900 dark:text-white whitespace-pre-wrap ${step.completed ? 'line-through opacity-60' : ''}`}>
                        {step.content}
                      </p>
                    </div>
                  ))}

                  {/* Notes */}
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">📝 Note</span> • {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Status */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Favorite</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contact.isFavorite ? '⭐ Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contact.isArchived ? '📦 Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(contact.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(contact.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
