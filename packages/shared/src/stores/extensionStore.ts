import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExtensionState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  settings: {
    model: 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-1.0-pro';
    temperature: number;
    autoSummarize: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  updateSettings: (settings: Partial<ExtensionState['settings']>) => void;
}

export const useExtensionStore = create<ExtensionState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: '' }),
      settings: {
        model: 'gemini-1.5-flash',
        temperature: 0.3,
        autoSummarize: false,
        theme: 'system',
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'wikisense-extension-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        settings: state.settings,
      }),
    }
  )
);
