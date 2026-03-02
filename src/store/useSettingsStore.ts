import { create } from 'zustand';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  enableVoiceInput: boolean;
  voiceLanguage: string;
  autoSubmitVoiceAfterSilence: boolean;
  silenceDurationMs: number;
  aiProvider: 'openai' | 'anthropic' | 'ollama' | 'custom' | 'none';
  aiModel: string;
  aiApiKey: string;
  aiCustomEndpoint: string;
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
}

interface SettingsActions {
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  getSettings: () => AppSettings;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  enableVoiceInput: true,
  voiceLanguage: 'en-US',
  autoSubmitVoiceAfterSilence: true,
  silenceDurationMs: 3000,
  aiProvider: 'none',
  aiModel: '',
  aiApiKey: '',
  aiCustomEndpoint: '',
  autoSaveEnabled: true,
  autoSaveIntervalMs: 5000,
};

export const useSettingsStore = create<AppSettings & SettingsActions>((set, get) => ({
  ...defaultSettings,

  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    set({ [key]: value } as Partial<AppSettings>);
  },

  setSettings: (settings: Partial<AppSettings>) => {
    set(settings);
  },

  getSettings: () => {
    return {
      theme: get().theme,
      language: get().language,
      enableVoiceInput: get().enableVoiceInput,
      voiceLanguage: get().voiceLanguage,
      autoSubmitVoiceAfterSilence: get().autoSubmitVoiceAfterSilence,
      silenceDurationMs: get().silenceDurationMs,
      aiProvider: get().aiProvider,
      aiModel: get().aiModel,
      aiApiKey: get().aiApiKey,
      aiCustomEndpoint: get().aiCustomEndpoint,
      autoSaveEnabled: get().autoSaveEnabled,
      autoSaveIntervalMs: get().autoSaveIntervalMs,
    };
  },
}));
