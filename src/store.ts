import { create } from 'zustand';
import type { Card, Settings } from './types';
import { gasApi, gasPost } from './api';

export function computeQueue(cards: Card[], settings: Settings | null): Card[] {
  const now = new Date();
  const dueCards = cards.filter(c => {
    const state = Number(c.state);
    return state !== 0 && c.due && new Date(c.due) <= now;
  });
  if (dueCards.length > 0) return dueCards;
  const remaining = Math.max(0, 20 - Number(settings?.daily_new_count || 0));
  return cards.filter(c => Number(c.state) === 0).slice(0, remaining);
}

const LS = {
  CARDS: 'flashcard_cards',
  SETTINGS: 'flashcard_settings',
} as const;

function saveToLocal(cards: Card[], settings: Settings) {
  localStorage.setItem(LS.CARDS, JSON.stringify(cards));
  localStorage.setItem(LS.SETTINGS, JSON.stringify(settings));
}

function loadFromLocal(): { cards: Card[] | null; settings: Settings | null } {
  try {
    const cards = JSON.parse(localStorage.getItem(LS.CARDS) || 'null') as Card[] | null;
    const settings = JSON.parse(localStorage.getItem(LS.SETTINGS) || 'null') as Settings | null;
    return { cards, settings };
  } catch {
    return { cards: null, settings: null };
  }
}

interface FlashcardState {
  cards: Card[];
  settings: Settings | null;
  gasUrl: string | null;
  isLoading: boolean;

  setGasUrl: (url: string) => void;
  fetchEverything: () => Promise<void>;
  syncToGAS: () => void;
  addCardToStore: (card: Card) => void;
  updateCardInStore: (id: string, updatedFields: Partial<Card>) => void;
  updateSettingsInStore: (updatedFields: Partial<Settings>) => void;
  removeCardFromStore: (id: string) => void;
  clearLocalCache: () => void;
  logout: () => void;
  setCards: (cards: Card[]) => void;
}

export const useStore = create<FlashcardState>((set, get) => ({
  cards: [],
  settings: null,
  gasUrl: localStorage.getItem('gas_url'),
  isLoading: false,

  setGasUrl: (url: string) => {
    localStorage.setItem('gas_url', url);
    set({ gasUrl: url });
  },

  clearLocalCache: () => {
    localStorage.removeItem(LS.CARDS);
    localStorage.removeItem(LS.SETTINGS);
    set({ cards: [], settings: null });
  },

  logout: () => {
    localStorage.removeItem('gas_url');
    localStorage.removeItem(LS.CARDS);
    localStorage.removeItem(LS.SETTINGS);
    set({ gasUrl: null, cards: [], settings: null });
  },

  setCards: (cards: Card[]) => {
    const { settings } = get();
    if (settings) saveToLocal(cards, settings);
    set({ cards });
  },

  fetchEverything: async () => {
    const { gasUrl, isLoading } = get();
    if (!gasUrl || isLoading) return;

    // Show local data immediately if available
    const local = loadFromLocal();
    if (local.cards && local.settings) {
      set({ cards: local.cards, settings: local.settings });
    } else {
      set({ isLoading: true });
    }

    try {
      const gasSettings = await gasApi.getSettings(gasUrl) as Settings;
      const gasTime = new Date(gasSettings.last_modified || 0).getTime();
      const localTime = new Date(local.settings?.last_modified || 0).getTime();

      if (!local.settings || gasTime > localTime) {
        // No local data, or GAS is newer — fetch full cards and overwrite local
        const gasCards = await gasApi.getAll(gasUrl);
        saveToLocal(gasCards, gasSettings);
        set({ cards: gasCards, settings: gasSettings });
      } else if (localTime > gasTime) {
        // Local is ahead — push to GAS
        get().syncToGAS();
      }
      // Equal timestamps with local data present: already in sync, nothing to do
    } catch (e) {
      console.error('Fetch failed', e);
      // Falls back to whatever local data was already set above
    }

    set({ isLoading: false });
  },

  syncToGAS: () => {
    const { gasUrl, cards, settings } = get();
    if (!gasUrl || !settings) return;
    gasPost(gasUrl, { action: 'syncAll', cards, settings });
  },

  addCardToStore: (card: Card) => {
    set(state => {
      const newCards = [card, ...state.cards];
      const newSettings = state.settings
        ? { ...state.settings, last_modified: new Date().toISOString() }
        : state.settings;
      if (newSettings) saveToLocal(newCards, newSettings);
      return { cards: newCards, settings: newSettings };
    });
  },

  updateCardInStore: (id: string, updatedFields: Partial<Card>) => {
    set(state => {
      const newCards = state.cards.map(c => c.id === id ? { ...c, ...updatedFields } : c);
      const newSettings = state.settings
        ? { ...state.settings, last_modified: new Date().toISOString() }
        : state.settings;
      if (newSettings) saveToLocal(newCards, newSettings);
      return { cards: newCards, settings: newSettings };
    });
  },

  updateSettingsInStore: (updatedFields: Partial<Settings>) => {
    set(state => {
      const newSettings = state.settings
        ? { ...state.settings, ...updatedFields, last_modified: new Date().toISOString() }
        : ({ ...updatedFields, last_modified: new Date().toISOString() } as Settings);
      saveToLocal(state.cards, newSettings);
      return { settings: newSettings };
    });
  },

  removeCardFromStore: (id: string) => {
    set(state => {
      const newCards = state.cards.filter(c => c.id !== id);
      if (state.settings) saveToLocal(newCards, state.settings);
      return { cards: newCards };
    });
  },
}));
