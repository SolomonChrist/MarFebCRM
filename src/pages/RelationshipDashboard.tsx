import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../services/contacts/contactService';
import { loadContacts } from '../services/storage/localStorageService';

interface RelationshipStats {
  type: string;
  count: number;
  percentage: number;
  contacts: Contact[];
}

interface LevelStats {
  level: string;
  count: number;
  percentage: number;
  contacts: Contact[];
}

interface ValueStats {
  value: string;
  count: number;
  percentage: number;
  contacts: Contact[];
}

export default function RelationshipDashboard() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeStats, setTypeStats] = useState<RelationshipStats[]>([]);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [valueStats, setValueStats] = useState<ValueStats[]>([]);
  const [topContacts, setTopContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allContacts = await loadContacts();
        setContacts(allContacts);

        // Calculate relationship type breakdown
        const typeMap = new Map<string, Contact[]>();
        allContacts.forEach(c => {
          const type = c.relationshipType || 'business';
          if (!typeMap.has(type)) typeMap.set(type, []);
          typeMap.get(type)!.push(c);
        });

        const types = Array.from(typeMap.entries()).map(([type, contacts]) => ({
          type,
          count: contacts.length,
          percentage: (contacts.length / allContacts.length) * 100,
          contacts,
        }));
        setTypeStats(types);

        // Calculate relationship level breakdown
        const levelMap = new Map<string, Contact[]>();
        allContacts.forEach(c => {
          const level = c.relationshipLevel || 'acquaintance';
          if (!levelMap.has(level)) levelMap.set(level, []);
          levelMap.get(level)!.push(c);
        });

        const levels = Array.from(levelMap.entries())
          .map(([level, contacts]) => ({
            level: level.replace(/_/g, ' ').charAt(0).toUpperCase() + level.slice(1).replace(/_/g, ' '),
            count: contacts.length,
            percentage: (contacts.length / allContacts.length) * 100,
            contacts,
          }))
          .sort((a, b) => b.count - a.count);
        setLevelStats(levels);

        // Calculate relational value type breakdown
        const valueMap = new Map<string, Contact[]>();
        allContacts.forEach(c => {
          const value = c.relationalValueType || 'gainer';
          if (!valueMap.has(value)) valueMap.set(value, []);
          valueMap.get(value)!.push(c);
        });

        const values = Array.from(valueMap.entries())
          .map(([value, contacts]) => ({
            value: value.replace(/_/g, ' ').charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' '),
            count: contacts.length,
            percentage: (contacts.length / allContacts.length) * 100,
            contacts,
          }))
          .sort((a, b) => b.count - a.count);
        setValueStats(values);

        // Find top contacts by HQ score and interaction count
        const topByScore = [...allContacts]
          .sort((a, b) => b.hqScore - a.hqScore)
          .slice(0, 5);
        setTopContacts(topByScore);
      } catch (error) {
        console.error('Error loading relationship data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading relationship data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Relationship Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Analyze your contacts by relationship type, level, and value.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Contacts" value={contacts.length.toString()} color="indigo" />
        <StatCard label="Avg HQ Score" value={
          contacts.length > 0
            ? (contacts.reduce((sum, c) => sum + c.hqScore, 0) / contacts.length).toFixed(1)
            : '0'
        } color="blue" />
        <StatCard label="Relationship Types" value={typeStats.length.toString()} color="green" />
      </div>

      {/* Relationship Type Breakdown */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 By Relationship Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {typeStats.map((stat) => (
            <div
              key={stat.type}
              className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{stat.type}</h3>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-[#2d2d2d] rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.percentage.toFixed(1)}% of total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Level Breakdown */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎯 By Relationship Level</h2>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d]">
          <div className="divide-y divide-gray-200 dark:divide-[#2d2d2d]">
            {levelStats.map((stat) => (
              <div key={stat.level} className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stat.level}</h3>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stat.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#2d2d2d] rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relational Value Type Breakdown */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">💎 By Relational Value Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueStats.map((stat) => (
            <div
              key={stat.value}
              className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{stat.value}</h3>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stat.count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-[#2d2d2d] rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contacts by HQ Score */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">⭐ Top Contacts by HQ Score</h2>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2d2d2d]">
          <div className="divide-y divide-gray-200 dark:divide-[#2d2d2d]">
            {topContacts.map((contact, idx) => (
              <div
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {contact.firstName} {contact.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company || 'No company'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {contact.hqScore.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">HQ Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'indigo' | 'blue' | 'green';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
