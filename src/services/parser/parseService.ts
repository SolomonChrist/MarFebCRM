/**
 * Simple regex-based contact parser
 * Extracts: name, email, phone, company from unstructured text blocks
 * NO AI - pure pattern matching
 */

export interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes: string;
  isNew?: boolean;
}

/**
 * Regex patterns for common contact data
 */
const PATTERNS = {
  // Email: simple pattern for email addresses
  email: /[\w\.-]+@[\w\.-]+\.\w+/g,

  // Phone: multiple formats
  // (XXX) XXX-XXXX, XXX-XXX-XXXX, +1-XXX-XXX-XXXX, etc.
  phone: /(\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g,

  // URL: simple pattern
  url: /https?:\/\/[^\s]+/g,

  // Common company markers
  companyMarkers: /(?:CEO|Founder|Co-founder|President|Director|Manager|VP|CTO|CFO|COO|at|@)\s+([A-Z][A-Za-z\s&\.]+?)(?:\s*[-–]|$)/,
};

export function parseContactsFromText(text: string): ExtractedContact[] {
  if (!text.trim()) return [];

  // Split by double newlines or obvious contact separators
  const blocks = text
    .split(/\n\s*\n+/)
    .filter(block => block.trim().length > 0);

  const contacts: ExtractedContact[] = [];

  for (const block of blocks) {
    const contact = parseContactBlock(block);
    if (contact.name) {
      contacts.push(contact);
    }
  }

  return contacts;
}

function parseContactBlock(block: string): ExtractedContact {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length === 0) {
    return { name: '', notes: '' };
  }

  // First line is usually the name
  const name = extractNameFromLine(lines[0]);

  // Extract company from all lines
  let company = '';
  for (const line of lines) {
    const companyMatch = line.match(PATTERNS.companyMarkers);
    if (companyMatch) {
      company = companyMatch[1].trim();
      break;
    }
  }

  // Extract email from all lines
  let email = '';
  for (const line of lines) {
    const emailMatch = line.match(PATTERNS.email);
    if (emailMatch && emailMatch[0]) {
      email = emailMatch[0];
      break;
    }
  }

  // Extract phone from all lines
  let phone = '';
  for (const line of lines) {
    const phoneMatch = line.match(PATTERNS.phone);
    if (phoneMatch && phoneMatch[0]) {
      phone = phoneMatch[0];
      break;
    }
  }

  // Everything else is notes
  const notes = block
    .replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(new RegExp(phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l !== name)
    .join('\n')
    .trim();

  return {
    name,
    email: email || undefined,
    phone: phone || undefined,
    company: company || undefined,
    notes,
  };
}

function extractNameFromLine(line: string): string {
  // Remove common prefixes
  line = line
    .replace(/^(Hi|Hey|Hello|Hi everyone)\s*,?\s*/i, '')
    .replace(/^(CEO|Founder|Co-founder|President|Director|Manager|VP|CTO|CFO|COO|Agent|Coach|Professional|Consultant)\s+/i, '')
    .trim();

  // Extract the name part (usually before any special characters or additional info)
  const nameMatch = line.match(/^([A-Za-z\s\.]+?)(?:\s*[,–-]|\s+(?:of|at|from|the)|$)/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  // Fallback: take first few words
  const words = line.split(/[\s,–-]+/).filter(w => /^[A-Za-z]/.test(w));
  return words.slice(0, 3).join(' ').trim();
}

/**
 * Format contact for display
 */
export function formatContactForDisplay(contact: ExtractedContact): string {
  const parts = [];
  if (contact.name) parts.push(`📇 ${contact.name}`);
  if (contact.company) parts.push(`🏢 ${contact.company}`);
  if (contact.email) parts.push(`📧 ${contact.email}`);
  if (contact.phone) parts.push(`📱 ${contact.phone}`);
  return parts.join(' | ');
}

/**
 * Validate extracted contact has minimum required info
 */
export function isValidContact(contact: ExtractedContact): boolean {
  return contact.name && contact.name.trim().length > 0;
}
