import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { isValidWebhookUrl } from '../services/webhook/webhookService';

export default function SettingsPage() {
  const { addToast } = useUIStore();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Load webhook URL from localStorage
    const saved = localStorage.getItem('webhook_url') || '';
    setWebhookUrl(saved);
  }, []);

  const handleWebhookChange = (value: string) => {
    setWebhookUrl(value);
    setIsValid(value === '' || isValidWebhookUrl(value));
  };

  const handleSave = async () => {
    if (!isValid) {
      addToast({
        message: 'Invalid webhook URL',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem('webhook_url', webhookUrl);
      addToast({
        message: 'Webhook settings saved successfully!',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <SettingsIcon className="text-indigo-600" size={32} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure your MarFebCRM preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Webhook Configuration */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            n8n Webhook Configuration
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>When a new contact is created,</strong> MarFebCRM will send a webhook request to your n8n instance with:
              </p>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">name</code> - Contact's name</li>
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">email</code> - Email (if available)</li>
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">phone</code> - Phone (if available)</li>
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">notes</code> - Captured notes</li>
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">location</code> - Where you met (e.g., "BNI Meeting")</li>
                <li>• <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">timestamp</code> - ISO timestamp</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => handleWebhookChange(e.target.value)}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      !isValid && webhookUrl
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-[#2d2d2d] focus:ring-indigo-600'
                    }`}
                  />
                  {webhookUrl && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValid ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!isValid && webhookUrl && (
                <p className="mt-2 text-sm text-red-600">Invalid URL format</p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Leave blank to disable webhook integration
              </p>
            </div>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2d2d2d] p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Integration Example
          </h3>

          <div className="bg-gray-50 dark:bg-[#0f0f0f] p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-700 dark:text-gray-300 space-y-2">
            <p>POST {webhookUrl || 'https://your-webhook-url'}</p>
            <p>{'{'}</p>
            <p className="ml-4">"name": "Carlos Dario M.",</p>
            <p className="ml-4">"email": "carlos@example.com",</p>
            <p className="ml-4">"phone": "+1-234-567-8900",</p>
            <p className="ml-4">"notes": "Wants to explore AI adoption in Mexico...",</p>
            <p className="ml-4">"location": "BNI Meeting",</p>
            <p className="ml-4">"timestamp": "2026-03-02T12:00:00Z"</p>
            <p>{'}'}</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
