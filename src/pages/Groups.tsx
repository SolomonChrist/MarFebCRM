import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Search, Plus, Trash2 } from 'lucide-react';
import { loadContacts, saveContacts } from '../services/storage/localStorageService';
import { Contact } from '../services/contacts/contactService';
import { useUIStore } from '../store/useUIStore';

interface TagStats {
  name: string;
  count: number;
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [tags, setTags] = useState<TagStats[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');

  // Load contacts and extract unique tags
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadContacts();
        setContacts(data);

        // Extract unique tags with counts
        const tagMap = new Map<string, number>();
        data.forEach(contact => {
          contact.tags?.forEach(tag => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          });
        });

        const tagStats = Array.from(tagMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setTags(tagStats);
      } catch (error) {
        console.error('Error loading data:', error);
        addToast({ message: 'Failed to load tags', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [addToast]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const trimmedTag = newTag.trim();
    if (tags.some(t => t.name.toLowerCase() === trimmedTag.toLowerCase())) {
      addToast({ message: 'Tag already exists', type: 'error' });
      return;
    }

    // Add tag to a new contact or message
    setTags([...tags, { name: trimmedTag, count: 0 }]);
    setNewTag('');
    addToast({ message: `Created tag "${trimmedTag}"`, type: 'success' });
  };

  const handleDeleteTag = async (tagName: string) => {
    if (!confirm(`Remove tag "${tagName}" from all contacts?`)) return;

    try {
      const updatedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.tags?.filter(t => t !== tagName) || [],
      }));

      await saveContacts(updatedContacts);
      setContacts(updatedContacts);
      setTags(tags.filter(t => t.name !== tagName));
      addToast({ message: `Tag "${tagName}" removed from all contacts`, type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to delete tag', type: 'error' });
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Groups & Tags</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Organize contacts with tags like Friends, Business, Family, etc.
        </p>
      </div>

      {/* Create New Tag */}
      <div className="mb-8 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Tag</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Enter tag name (e.g., Friends, Business, Family)..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            onClick={handleAddTag}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Add Tag
          </button>
        </div>
      </div>

      {/* Search Tags */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading tags...</p>
          </div>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-8 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {tags.length === 0 ? 'No tags yet' : 'No tags match your search'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create a tag above to organize your contacts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <div
              key={tag.name}
              className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Tag size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tag.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tag.count} contact{tag.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTag(tag.name)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title={`Delete tag "${tag.name}"`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Show sample contacts with this tag */}
              {tag.count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2d2d2d]">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                    Sample Contacts
                  </p>
                  <div className="space-y-2">
                    {contacts
                      .filter(c => c.tags?.includes(tag.name))
                      .slice(0, 3)
                      .map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          className="block w-full text-left text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 truncate"
                        >
                          {contact.firstName} {contact.lastName || ''}
                        </button>
                      ))}
                    {tag.count > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{tag.count - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
