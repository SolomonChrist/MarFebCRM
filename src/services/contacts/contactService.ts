/**
 * Contact service for CRUD operations
 */

import { v4 as uuidv4 } from 'uuid';
import { triggerNewContactWebhook, WebhookPayload } from '../webhook/webhookService';
import { ExtractedContact } from '../parser/parseService';
import { loadContacts, saveContacts } from '../storage/localStorageService';

export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  hqScore: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntry {
  id: string;
  contactId: string;
  userId: string;
  entryType: string;
  plainTextContent: string;
  source: string;
  createdAt: string;
  occurredAt: string;
}

/**
 * Find contact by email or phone (case-insensitive)
 */
export async function findContactByEmailOrPhone(
  userId: string,
  email?: string,
  phone?: string,
): Promise<Contact | null> {
  let query = 'SELECT * FROM contacts WHERE user_id = ? AND is_archived = 0 AND (';
  const params = [userId];

  const conditions = [];
  if (email) {
    conditions.push('LOWER(email) = LOWER(?)');
    params.push(email);
  }
  if (phone) {
    conditions.push('phone = ?');
    params.push(phone);
  }

  if (conditions.length === 0) return null;

  query += conditions.join(' OR ') + ')';

  try {
    const results = await runSelect(query, params);
    if (results.length > 0) {
      return rowToContact(results[0]);
    }
  } catch (error) {
    console.error('Error finding contact:', error);
  }

  return null;
}

/**
 * Get contact by ID
 */
export async function getContactById(userId: string, contactId: string): Promise<Contact | null> {
  try {
    const results = await runSelect(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
    );
    if (results.length > 0) {
      return rowToContact(results[0]);
    }
  } catch (error) {
    console.error('Error getting contact:', error);
  }

  return null;
}

/**
 * Create new contact
 */
export async function createContact(
  userId: string,
  data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
  },
): Promise<Contact> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const contact: Contact = {
    id,
    userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    company: data.company,
    tags: [],
    hqScore: 5.0,
    isFavorite: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  console.log('Created contact object:', contact);
  return contact;
}

/**
 * Add timeline entry for contact
 */
export async function addTimelineEntry(
  userId: string,
  contactId: string,
  data: {
    plainTextContent: string;
    entryType?: string;
    source?: string;
    occurredAt?: string;
  },
): Promise<TimelineEntry> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const occurredAt = data.occurredAt || now;

  try {
    await runQuery(
      `INSERT INTO timeline_entries (id, contact_id, user_id, entry_type, plain_text_content, visibility, is_encrypted, source, created_at, updated_at, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contactId,
        userId,
        data.entryType || 'note',
        data.plainTextContent,
        'normal', // visibility
        0, // not encrypted in v1
        data.source || 'pasted',
        now,
        now,
        occurredAt,
      ],
    );

    return {
      id,
      contactId,
      userId,
      entryType: data.entryType || 'note',
      plainTextContent: data.plainTextContent,
      source: data.source || 'pasted',
      createdAt: now,
      occurredAt,
    };
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    throw error;
  }
}

/**
 * Process extracted contacts: create new or update existing
 */
export async function processExtractedContacts(
  userId: string,
  extractedContacts: ExtractedContact[],
  location: string,
  webhookUrl?: string,
): Promise<void> {
  // Load existing contacts
  const existingContacts = await loadContacts();

  const newContacts: Contact[] = [];

  for (const extracted of extractedContacts) {
    try {
      // Check if contact exists by email or phone
      const existing = existingContacts.find((c) =>
        (extracted.email && c.email?.toLowerCase() === extracted.email.toLowerCase()) ||
        (extracted.phone && c.phone === extracted.phone)
      );

      let contact: Contact;
      let isNewContact = false;

      if (existing) {
        // Update existing contact
        contact = existing;
      } else {
        // Create new contact
        const names = extracted.name.split(/\s+/);
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : undefined;

        contact = await createContact(userId, {
          firstName,
          lastName,
          email: extracted.email,
          phone: extracted.phone,
          company: extracted.company,
        });

        newContacts.push(contact);
        isNewContact = true;
      }

      // Trigger webhook for new contacts
      if (isNewContact && webhookUrl) {
        const payload: WebhookPayload = {
          name: extracted.name,
          email: extracted.email,
          phone: extracted.phone,
          notes: extracted.notes,
          location,
          timestamp: new Date().toISOString(),
        };

        await triggerNewContactWebhook(webhookUrl, payload).catch((err) => {
          console.error('Webhook error:', err);
          // Don't fail if webhook fails
        });
      }
    } catch (error) {
      console.error(`Error processing contact "${extracted.name}":`, error);
      // Continue with next contact instead of throwing
    }
  }

  // Save all contacts (existing + new)
  const allContacts = [...existingContacts, ...newContacts];
  await saveContacts(allContacts);
  console.log('All contacts saved:', allContacts.length);
}

/**
 * Helper: convert database row to Contact object
 */
function rowToContact(row: any): Contact {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    tags: [],
    hqScore: row.hq_score,
    isFavorite: row.is_favorite === 1,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
