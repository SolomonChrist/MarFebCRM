/**
 * Simple localStorage-based contact storage
 * Provides reliable persistence and easy export/import
 */

import { Contact } from '../contacts/contactService';

const CONTACTS_KEY = 'marfebcrm_contacts';
const LAST_EXPORT_KEY = 'marfebcrm_last_export';

export interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface NextStep {
  id: string;
  content: string;
  createdAt: string;
  completed: boolean;
}

export interface ExportedContact extends Contact {
  notes?: ContactNote[];
  nextSteps?: NextStep[];
}

export interface StorageData {
  contacts: ExportedContact[];
  exportedAt: string;
  version: string;
}

/**
 * Save contacts to localStorage
 */
export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts:', error);
    throw error;
  }
}

/**
 * Load contacts from localStorage
 */
export async function loadContacts(): Promise<Contact[]> {
  try {
    const data = localStorage.getItem(CONTACTS_KEY);
    if (!data) {
      return [];
    }
    const contacts = JSON.parse(data) as Contact[];
    return contacts;
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
}

/**
 * Export all data as JSON file
 */
export function exportData(contacts: Contact[]): StorageData {
  const exportedContacts: ExportedContact[] = contacts.map(contact => {
    const notes = loadContactNotes(contact.id);
    const nextSteps = loadContactNextSteps(contact.id);
    return {
      ...contact,
      notes: notes.length > 0 ? notes : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
    };
  });

  const data: StorageData = {
    contacts: exportedContacts,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return data;
}

/**
 * Load notes for a specific contact
 */
function loadContactNotes(contactId: string): ContactNote[] {
  try {
    const notes = localStorage.getItem(`contact_${contactId}_notes`);
    if (!notes) return [];

    // Try to parse as JSON
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    // Gracefully handle corrupted data by removing it
    try {
      localStorage.removeItem(`contact_${contactId}_notes`);
    } catch (e) {
      // Ignore removal errors
    }
    return [];
  }
}

/**
 * Load next steps for a specific contact
 */
function loadContactNextSteps(contactId: string): NextStep[] {
  try {
    const nextSteps = localStorage.getItem(`contact_${contactId}_nextSteps`);
    if (!nextSteps) return [];

    // Try to parse as JSON
    const parsed = JSON.parse(nextSteps);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    // Gracefully handle corrupted data by removing it
    try {
      localStorage.removeItem(`contact_${contactId}_nextSteps`);
    } catch (e) {
      // Ignore removal errors
    }
    return [];
  }
}

/**
 * Download data as JSON file
 */
export function downloadDataAsJSON(contacts: Contact[]): void {
  const data = exportData(contacts);
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `marfebcrm-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download contacts as CSV file
 */
export function downloadDataAsCSV(contacts: Contact[]): void {
  // Define CSV headers
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Company',
    'Tags',
    'HQ Score',
    'Relationship Type',
    'Relationship Level',
    'Relational Value Type',
    'Created Date',
    'Last Updated',
    'Last Contacted',
    'Next Scheduled',
    'Favorite',
    'Archived',
  ];

  // Convert contacts to CSV rows
  const rows = contacts.map(contact => [
    contact.firstName,
    contact.lastName || '',
    contact.email || '',
    contact.phone || '',
    contact.company || '',
    (contact.tags || []).join(';'),
    contact.hqScore.toFixed(1),
    contact.relationshipType || '',
    (contact.relationshipLevel || '').replace(/_/g, ' '),
    (contact.relationalValueType || '').replace(/_/g, ' '),
    new Date(contact.createdAt).toLocaleDateString(),
    new Date(contact.updatedAt).toLocaleDateString(),
    contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString() : '',
    contact.nextScheduledContact ? new Date(contact.nextScheduledContact).toLocaleDateString() : '',
    contact.isFavorite ? 'Yes' : 'No',
    contact.isArchived ? 'Yes' : 'No',
  ]);

  // Create CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `marfebcrm-contacts-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
export async function importDataFromFile(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as StorageData;
        if (!json.contacts || !Array.isArray(json.contacts)) {
          throw new Error('Invalid backup file format');
        }

        // Load existing contacts
        const existingContacts = await loadContacts();

        // Extract contact data without notes/nextSteps from import
        const importedContacts = json.contacts.map(({ notes, nextSteps, ...contact }) => contact);

        // Merge contacts: update existing ones by ID, add new ones
        const mergedContacts = [...existingContacts];
        const existingIds = new Set(existingContacts.map(c => c.id));

        importedContacts.forEach(importedContact => {
          if (existingIds.has(importedContact.id)) {
            // Update existing contact
            const index = mergedContacts.findIndex(c => c.id === importedContact.id);
            if (index !== -1) {
              mergedContacts[index] = importedContact;
            }
          } else {
            // Add new contact
            mergedContacts.push(importedContact);
          }
        });

        // Save merged contacts
        await saveContacts(mergedContacts);

        // Restore notes and next steps for each imported contact
        json.contacts.forEach(exportedContact => {
          if (exportedContact.notes && exportedContact.notes.length > 0) {
            localStorage.setItem(
              `contact_${exportedContact.id}_notes`,
              JSON.stringify(exportedContact.notes)
            );
          }
          if (exportedContact.nextSteps && exportedContact.nextSteps.length > 0) {
            localStorage.setItem(
              `contact_${exportedContact.id}_nextSteps`,
              JSON.stringify(exportedContact.nextSteps)
            );
          }
        });

        resolve(mergedContacts);
      } catch (error) {
        console.error('Error importing data:', error);
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  // Remove contacts
  localStorage.removeItem(CONTACTS_KEY);

  // Remove all contact-specific notes and next steps
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('_notes') || key.includes('_nextSteps'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
