/**
 * Webhook service for triggering external actions (e.g., n8n workflows)
 */

export interface WebhookPayload {
  name: string;
  email?: string;
  phone?: string;
  notes: string;
  location?: string; // "BNI Meeting", "Coffee Chat", etc.
  timestamp: string;
}

/**
 * Trigger webhook for new contact creation
 * Expects webhook URL to be configured in settings
 */
export async function triggerNewContactWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
): Promise<boolean> {
  if (!webhookUrl) {
    console.warn('Webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook failed with status ${response.status}`);
      return false;
    }

    console.log('Webhook triggered successfully');
    return true;
  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
}

/**
 * Validate webhook URL is properly formatted
 */
export function isValidWebhookUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
