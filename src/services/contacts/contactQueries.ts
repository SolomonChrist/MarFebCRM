/**
 * Contact queries - fetch, update, delete contacts
 */

import { runQuery, runSelect, saveDatabase } from '../database/db';
import { Contact } from './contactService';

/**
 * Get all contacts for a user (excluding archived)
 */
export async function getAllContacts(userId: string): Promise<Contact[]> {
  try {
    const results = await runSelect(
      `SELECT * FROM contacts
       WHERE user_id = ? AND is_archived = 0
       ORDER BY updated_at DESC`,
      [userId],
    );
    return results.map(rowToContact);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

/**
 * Get contact with all timeline entries
 */
export async function getContactWithTimeline(
  userId: string,
  contactId: string,
): Promise<{
  contact: Contact | null;
  timeline: any[];
}> {
  try {
    // Get contact
    const contactResults = await runSelect(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, userId],
    );

    if (contactResults.length === 0) {
      return { contact: null, timeline: [] };
    }

    const contact = rowToContact(contactResults[0]);

    // Get timeline entries
    const timeline = await runSelect(
      `SELECT * FROM timeline_entries
       WHERE contact_id = ? AND user_id = ?
       ORDER BY occurred_at DESC`,
      [contactId, userId],
    );

    return { contact, timeline };
  } catch (error) {
    console.error('Error fetching contact with timeline:', error);
    throw error;
  }
}

/**
 * Update contact basic info
 */
export async function updateContactInfo(
  userId: string,
  contactId: string,
  data: Partial<Contact>,
): Promise<Contact | null> {
  try {
    const contact = await getContactById(userId, contactId);
    if (!contact) return null;

    const updated = { ...contact, ...data, updatedAt: new Date().toISOString() };

    await runQuery(
      `UPDATE contacts
       SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?,
           hq_score = ?, is_favorite = ?, is_archived = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        updated.firstName,
        updated.lastName || null,
        updated.email || null,
        updated.phone || null,
        updated.company || null,
        updated.hqScore,
        updated.isFavorite ? 1 : 0,
        updated.isArchived ? 1 : 0,
        updated.updatedAt,
        contactId,
        userId,
      ],
    );

    return updated;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

/**
 * Update HQ score with history
 */
export async function updateHQScore(
  userId: string,
  contactId: string,
  newScore: number,
  reason: string,
): Promise<boolean> {
  try {
    const contact = await getContactById(userId, contactId);
    if (!contact) return false;

    const oldScore = contact.hqScore;

    // Update contact
    await runQuery(
      'UPDATE contacts SET hq_score = ?, updated_at = ? WHERE id = ?',
      [newScore, new Date().toISOString(), contactId],
    );

    // Log history
    const id = crypto.randomUUID();
    await runQuery(
      `INSERT INTO hq_score_history (id, contact_id, old_score, new_score, reason, changed_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, contactId, oldScore, newScore, reason, 'manual', new Date().toISOString()],
    );

    await saveDatabase();
    return true;
  } catch (error) {
    console.error('Error updating HQ score:', error);
    return false;
  }
}

/**
 * Get contact by ID
 */
async function getContactById(userId: string, contactId: string): Promise<Contact | null> {
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
    hqScore: row.hq_score,
    isFavorite: row.is_favorite === 1,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
