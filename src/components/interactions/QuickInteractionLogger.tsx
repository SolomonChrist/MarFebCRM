import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Interaction } from '../../services/contacts/contactService';
import { v4 as uuidv4 } from 'uuid';

interface QuickInteractionLoggerProps {
  contactId: string;
  contactName: string;
  relationshipType: 'business' | 'personal' | 'both';
  onClose: () => void;
  onLogInteraction: (interaction: Interaction, nextScheduledContact?: string) => void;
}

export default function QuickInteractionLogger({
  contactId,
  contactName,
  relationshipType,
  onClose,
  onLogInteraction,
}: QuickInteractionLoggerProps) {
  const [quickNote, setQuickNote] = useState('');
  const [interactionType, setInteractionType] = useState<'call' | 'email' | 'message' | 'meeting' | 'event' | 'custom'>('call');
  const [customInteractionType, setCustomInteractionType] = useState('');
  const [outcomeType, setOutcomeType] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low' | undefined>(undefined);
  const [potentialUseCase, setPotentialUseCase] = useState('');
  const [notableMemories, setNotableMemories] = useState('');
  const [growthOpportunity, setGrowthOpportunity] = useState('');
  const [nextScheduledContact, setNextScheduledContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickNote.trim()) {
      alert('Quick note is required');
      return;
    }

    if (!outcomeType.trim()) {
      alert('Outcome type is required');
      return;
    }

    if (!potentialUseCase.trim()) {
      alert('Potential use case is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const interaction: Interaction = {
        id: uuidv4(),
        contactId,
        userId: '', // Will be set by parent component
        interactionType,
        customInteractionType: interactionType === 'custom' ? customInteractionType : undefined,
        outcomeType,
        energyLevel: relationshipType === 'personal' || relationshipType === 'both' ? energyLevel : undefined,
        potentialUseCase,
        quickNote,
        notableMemories: notableMemories || undefined,
        growthOpportunity: growthOpportunity || undefined,
        createdAt: new Date().toISOString(),
        occurredAt: new Date().toISOString(),
      };

      onLogInteraction(interaction, nextScheduledContact || undefined);
      onClose();
    } catch (error) {
      console.error('Error logging interaction:', error);
      alert('Failed to log interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Log Interaction</h2>
            <p className="text-sm text-gray-600">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Note - MOST IMPORTANT */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quick Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="What happened? Key points, outcomes, decisions made..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
          </div>

          {/* Interaction Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Interaction Type
              </label>
              <select
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="message">Message</option>
                <option value="meeting">Meeting</option>
                <option value="event">Event</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {interactionType === 'custom' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Custom Type
                </label>
                <input
                  type="text"
                  value={customInteractionType}
                  onChange={(e) => setCustomInteractionType(e.target.value)}
                  placeholder="e.g., Coffee, Dinner..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Outcome Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Outcome Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={outcomeType}
              onChange={(e) => setOutcomeType(e.target.value)}
              placeholder={
                relationshipType === 'business'
                  ? 'e.g., Closed deal, Qualified lead, Follow-up needed, Not interested'
                  : 'e.g., Great conversation, Need to follow up, Planning next hangout'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Energy Level - Personal Side */}
          {(relationshipType === 'personal' || relationshipType === 'both') && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Energy Level
              </label>
              <div className="flex gap-3">
                {(['high', 'medium', 'low'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      energyLevel === level
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Potential Use Case */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Potential Use Case <span className="text-red-500">*</span>
            </label>
            <textarea
              value={potentialUseCase}
              onChange={(e) => setPotentialUseCase(e.target.value)}
              placeholder={
                relationshipType === 'business'
                  ? 'e.g., Customer source, Partnership, Collaboration, etc.'
                  : 'e.g., Fun memories, Growth through mentoring, Love interest, Connector, etc.'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Notable Memories */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notable Memories
            </label>
            <textarea
              value={notableMemories}
              onChange={(e) => setNotableMemories(e.target.value)}
              placeholder="What made this interaction special? Any funny moments or deep conversations?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Growth Opportunity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Growth Opportunity
            </label>
            <textarea
              value={growthOpportunity}
              onChange={(e) => setGrowthOpportunity(e.target.value)}
              placeholder="How did you grow from this interaction? What did you learn?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Next Scheduled Contact */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Next Scheduled Contact
            </label>
            <input
              type="date"
              value={nextScheduledContact}
              onChange={(e) => setNextScheduledContact(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">Optional: When do you plan to contact them next?</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Logging...' : 'Log Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
