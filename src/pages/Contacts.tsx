import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Archive, Eye, Trash2, Download, Upload, Clock, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useContactStore } from '../store/useContactStore';
import { useUIStore } from '../store/useUIStore';
import { Contact } from '../services/contacts/contactService';
import { loadContacts, saveContacts, downloadDataAsJSON, importDataFromFile } from '../services/storage/localStorageService';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { contacts, filters, setContacts, setFilters } = useContactStore();
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all contacts from localStorage on mount
  useEffect(() => {
    const loadContactsFromStorage = async () => {
      try {
        setLocalLoading(true);
        setError(null);
        console.log('Loading contacts from localStorage...');
        const data = await loadContacts();
        console.log('Contacts loaded:', data.length);
        setContacts(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load contacts';
        console.error('Error loading contacts:', err);
        setError(message);
        addToast({ message, type: 'error' });
      } finally {
        setLocalLoading(false);
      }
    };

    loadContactsFromStorage();
  }, [setContacts, addToast]);

  const handleExportData = () => {
    try {
      downloadDataAsJSON(contacts);
      addToast({
        message: `Exported ${contacts.length} contact(s) successfully`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        message: 'Failed to export data',
        type: 'error',
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      setLocalLoading(true);
      const importedContacts = await importDataFromFile(file);
      setContacts(importedContacts);
      addToast({
        message: `Imported ${importedContacts.length} contact(s) successfully`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        message: 'Failed to import data: ' + (err instanceof Error ? err.message : 'Unknown error'),
        type: 'error',
      });
    } finally {
      setLocalLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    // Exclude archived by default (show archived only if filter is active)
    if (contact.isArchived && !filters.showArchived) return false;

    // Search filter
    const searchLower = filters.search.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName || ''}`.toLowerCase();
    if (searchLower && !fullName.includes(searchLower)) return false;

    // Favorites filter
    if (filters.isFavorite && !contact.isFavorite) return false;

    return true;
  });

  const handleToggleFavorite = async (contact: Contact) => {
    const updated = { ...contact, isFavorite: !contact.isFavorite };
    const updatedContacts = contacts.map((c) => (c.id === contact.id ? updated : c));
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    addToast({
      message: updated.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      type: 'success',
    });
  };

  const handleViewContact = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  const handleArchiveContact = async (contact: Contact) => {
    const updated = { ...contact, isArchived: !contact.isArchived };
    const updatedContacts = contacts.map((c) => (c.id === contact.id ? updated : c));
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    addToast({
      message: updated.isArchived ? 'Contact archived' : 'Contact restored',
      type: 'success',
    });
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      const updatedContacts = contacts.filter((c) => c.id !== contactId);
      saveContacts(updatedContacts);
      setContacts(updatedContacts);
      addToast({
        message: 'Contact deleted',
        type: 'success',
      });
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Archive ${selectedIds.size} contact(s)?`)) return;

    const updatedContacts = contacts.map(c =>
      selectedIds.has(c.id) ? { ...c, isArchived: true } : c
    );
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setSelectedIds(new Set());
    addToast({ message: `Archived ${selectedIds.size} contact(s)`, type: 'success' });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} contact(s)? This cannot be undone.`)) return;

    const updatedContacts = contacts.filter(c => !selectedIds.has(c.id));
    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setSelectedIds(new Set());
    addToast({ message: `Deleted ${selectedIds.size} contact(s)`, type: 'success' });
  };

  const handleBulkTag = async () => {
    if (selectedIds.size === 0 || !bulkTag.trim()) return;

    const tag = bulkTag.trim();
    const updatedContacts = contacts.map(c => {
      if (selectedIds.has(c.id)) {
        const tags = c.tags || [];
        if (!tags.includes(tag)) {
          return { ...c, tags: [...tags, tag] };
        }
      }
      return c;
    });

    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setBulkTag('');
    setSelectedIds(new Set());
    addToast({ message: `Tagged ${selectedIds.size} contact(s) with "${tag}"`, type: 'success' });
  };

  const formatDate = (dateString: string) => {
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
  };

  const displayCount = filteredContacts.length;
  const totalCount = contacts.length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Contacts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {displayCount} of {totalCount} contact{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search Bar & Actions */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search contacts by name..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Filter buttons */}
          <button
            onClick={() => setFilters({ isFavorite: !filters.isFavorite })}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${
              filters.isFavorite
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3d3d3d]'
            }`}
          >
            <Star size={18} />
            Favorites
          </button>

          <button
            onClick={() => setFilters({ showArchived: !filters.showArchived })}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${
              filters.showArchived
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3d3d3d]'
            }`}
          >
            📦 Archived
          </button>
        </div>

        {/* Export/Import buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExportData}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            <Download size={18} />
            Export Data ({contacts.length})
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            <Upload size={18} />
            Import Data
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportData(file);
              }
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Loading State */}
      {localLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading contacts...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !localLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!localLoading && filteredContacts.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search ? 'No contacts match your search' : 'No contacts yet'}
          </p>
          {!filters.search && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Use the Quick Paste feature on the dashboard to add your first contact
            </p>
          )}
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-indigo-900 dark:text-indigo-300">
              {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Add tag..."
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBulkTag()}
              className="px-3 py-1 border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              onClick={handleBulkTag}
              disabled={!bulkTag.trim()}
              className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition text-sm"
            >
              Tag
            </button>
            <button
              onClick={handleBulkArchive}
              className="px-4 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition text-sm"
            >
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-1 bg-gray-300 dark:bg-[#2d2d2d] hover:bg-gray-400 dark:hover:bg-[#3d3d3d] text-gray-900 dark:text-white font-medium rounded-lg transition text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {!localLoading && filteredContacts.length > 0 && (
        <div className="space-y-3">
          {/* Select All Row */}
          {filteredContacts.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select All ({filteredContacts.length})
              </span>
            </div>
          )}

          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white dark:bg-[#1a1a1a] rounded-lg border transition flex items-center justify-between group ${
                selectedIds.has(contact.id)
                  ? 'border-indigo-400 dark:border-indigo-600 shadow-md'
                  : 'border-gray-200 dark:border-[#2d2d2d] hover:shadow-md'
              }`}
            >
              {/* Checkbox */}
              <div className="p-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(contact.id)}
                  onChange={() => handleSelectContact(contact.id)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Contact Info */}
              <div
                onClick={() => handleViewContact(contact.id)}
                className="flex-1 cursor-pointer p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {contact.firstName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {contact.firstName} {contact.lastName || ''}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {contact.lastContactedAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                          <span>{formatDate(contact.lastContactedAt)}</span>
                        </div>
                      )}
                      {contact.nextScheduledContact && (
                        <div className="flex items-center gap-1">
                          <CalendarCheck size={14} className="text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-semibold">{formatDate(contact.nextScheduledContact)}</span>
                        </div>
                      )}
                      {!contact.lastContactedAt && !contact.nextScheduledContact && (
                        <span>No interactions yet</span>
                      )}
                    </div>
                  </div>

                  {/* HQ Score */}
                  <div className="text-right mr-6">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {contact.hqScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">HQ Score</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pr-4">
                {/* View Button */}
                <button
                  onClick={() => handleViewContact(contact.id)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d3d] transition"
                  title="View contact details"
                >
                  <Eye size={18} />
                </button>

                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite(contact)}
                  className={`p-2 rounded-lg transition ${
                    contact.isFavorite
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d3d]'
                  }`}
                  title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={18} fill={contact.isFavorite ? 'currentColor' : 'none'} />
                </button>

                {/* Archive Button */}
                <button
                  onClick={() => handleArchiveContact(contact)}
                  className={`p-2 rounded-lg transition ${
                    contact.isArchived
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d3d3d]'
                  }`}
                  title={contact.isArchived ? 'Restore contact' : 'Archive contact'}
                >
                  <Archive size={18} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  title="Delete contact"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
