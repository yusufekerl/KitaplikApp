import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n'

type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  language: Language
  toggleTheme: () => void
  setLanguage: (lang: Language) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'tr',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'kitaplik-settings' }
  )
)
