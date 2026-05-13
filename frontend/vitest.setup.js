import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

// Proper localStorage mock
const store = {}
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => {
    store[key] = value.toString()
  },
  removeItem: (key) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach(key => delete store[key])
  },
  key: (index) => Object.keys(store)[index] || null,
  get length() {
    return Object.keys(store).length
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch if needed
global.fetch = vi.fn()

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('useAuth doit être utilisé dans AuthProvider'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// ───────────────────────────────────────────────────────────────
// i18next — initialisation minimale pour environnement de test
// Évite "i18n.changeLanguage is not a function" dans App.test.jsx
// Pas de HttpBackend : aucun appel réseau pendant les tests.
// ───────────────────────────────────────────────────────────────
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      lng: 'fr',
      fallbackLng: 'fr',
      interpolation: { escapeValue: false },
      resources: {
        fr: { translation: {} },
        en: { translation: {} },
      },
    })
}
