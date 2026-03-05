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
  // Relationship Context
  relationshipType: 'business' | 'personal' | 'both';
  relationshipLevel: 'acquaintance' | 'friend' | 'best_friend' | 'family' | 'student' | 'soulmate' | 'blacklisted' | 'fan' | 'custom';
  customRelationshipLevel?: string;
  relationalValueType: 'gainer' | 'connector' | 'helper' | 'drainer' | 'custom';
  customRelationalValue?: string;
  // Business metrics
  revenue: number; // lifetime value
  // Last contact tracking
  lastContactedAt?: string;
  nextScheduledContact?: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  userId: string;
  interactionType: 'call' | 'email' | 'message' | 'meeting' | 'event' | 'custom';
  customInteractionType?: string;
  // Outcome/Energy tracking
  outcomeType: string; // user-defined
  energyLevel?: 'high' | 'medium' | 'low'; // personal side
  // Use case (custom text)
  potentialUseCase: string;
  // Notes
  notableMemories?: string;
  growthOpportunity?: string;
  quickNote: string;
  createdAt: string;
  occurredAt: string;
}

export interface Reminder {
  id: string;
  contactId: string;
  contactName: string;
  reminderType: 'date' | 'days_from_now';
  reminderDate: string; // ISO date string
  reminderDays?: number; // days from now (if reminderType === 'days_from_now')
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
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
    relationshipType?: 'business' | 'personal' | 'both';
    relationshipLevel?: 'acquaintance' | 'friend' | 'best_friend' | 'family' | 'student' | 'soulmate' | 'blacklisted' | 'fan' | 'custom';
    customRelationshipLevel?: string;
    relationalValueType?: 'gainer' | 'connector' | 'helper' | 'drainer' | 'custom';
    customRelationalValue?: string;
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
    relationshipType: data.relationshipType || 'business',
    relationshipLevel: data.relationshipLevel || 'acquaintance',
    customRelationshipLevel: data.customRelationshipLevel,
    relationalValueType: data.relationalValueType || 'gainer',
    customRelationalValue: data.customRelationalValue,
    revenue: 0,
    lastContactedAt: undefined,
    nextScheduledContact: undefined,
  };

  console.log('Created contact object:', contact);
  return contact;
}

/**
 * Add interaction for contact with full details
 */
export async function addInteraction(
  userId: string,
  contactId: string,
  data: {
    interactionType: 'call' | 'email' | 'message' | 'meeting' | 'event' | 'custom';
    customInteractionType?: string;
    outcomeType: string;
    energyLevel?: 'high' | 'medium' | 'low';
    potentialUseCase: string;
    quickNote: string;
    notableMemories?: string;
    growthOpportunity?: string;
    occurredAt?: string;
  },
): Promise<Interaction> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const occurredAt = data.occurredAt || now;

  const interaction: Interaction = {
    id,
    contactId,
    userId,
    interactionType: data.interactionType,
    customInteractionType: data.customInteractionType,
    outcomeType: data.outcomeType,
    energyLevel: data.energyLevel,
    potentialUseCase: data.potentialUseCase,
    quickNote: data.quickNote,
    notableMemories: data.notableMemories,
    growthOpportunity: data.growthOpportunity,
    createdAt: now,
    occurredAt,
  };

  return interaction;
}

/**
 * Update contact's lastContactedAt and optionally adjust HQ score
 */
export async function logContactInteraction(
  userId: string,
  contactId: string,
  interaction: Interaction,
  adjustHQScore: number = 0.5, // default +0.5 for any positive interaction
): Promise<Contact | null> {
  try {
    const contact = await getContactById(userId, contactId);
    if (!contact) return null;

    // Store interaction in localStorage
    const interactions = loadContactInteractions(contactId);
    interactions.push(interaction);
    saveContactInteractions(contactId, interactions);

    // Update contact's lastContactedAt
    const updatedContact: Contact = {
      ...contact,
      lastContactedAt: new Date().toISOString(),
      hqScore: Math.min(10.0, contact.hqScore + adjustHQScore), // max 10.0
      updatedAt: new Date().toISOString(),
    };

    return updatedContact;
  } catch (error) {
    console.error('Error logging contact interaction:', error);
    throw error;
  }
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

  const entry: TimelineEntry = {
    id,
    contactId,
    userId,
    entryType: data.entryType || 'note',
    plainTextContent: data.plainTextContent,
    source: data.source || 'pasted',
    createdAt: now,
    occurredAt,
  };

  return entry;
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
 * Load interactions for a contact
 */
export function loadContactInteractions(contactId: string): Interaction[] {
  try {
    const data = localStorage.getItem(`contact_${contactId}_interactions`);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading interactions:', error);
    return [];
  }
}

/**
 * Save interactions for a contact
 */
export function saveContactInteractions(contactId: string, interactions: Interaction[]): void {
  try {
    localStorage.setItem(`contact_${contactId}_interactions`, JSON.stringify(interactions));
  } catch (error) {
    console.error('Error saving interactions:', error);
  }
}

/**
 * Load reminders for all contacts
 */
export function loadReminders(): Reminder[] {
  try {
    const data = localStorage.getItem('marfebcrm_reminders');
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

/**
 * Save all reminders
 */
export function saveReminders(reminders: Reminder[]): void {
  try {
    localStorage.setItem('marfebcrm_reminders', JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving reminders:', error);
  }
}

/**
 * Create a new reminder
 */
export function createReminder(
  contactId: string,
  contactName: string,
  data: {
    reminderType: 'date' | 'days_from_now';
    reminderDate?: string;
    reminderDays?: number;
    title: string;
    description?: string;
  }
): Reminder {
  const id = uuidv4();
  const now = new Date();
  let reminderDate = data.reminderDate || '';

  if (data.reminderType === 'days_from_now' && data.reminderDays) {
    const date = new Date(now.getTime() + data.reminderDays * 24 * 60 * 60 * 1000);
    reminderDate = date.toISOString().split('T')[0];
  }

  return {
    id,
    contactId,
    contactName,
    reminderType: data.reminderType,
    reminderDate,
    reminderDays: data.reminderDays,
    title: data.title,
    description: data.description,
    completed: false,
    createdAt: now.toISOString(),
  };
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
    relationshipType: 'business',
    relationshipLevel: 'acquaintance',
    relationalValueType: 'gainer',
    revenue: 0,
  };
}
