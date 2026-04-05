import { create } from 'zustand';

import catalogMock from '../../data/catalog.json';
import { CatalogItem } from './types';

type CatalogState = {
  items: CatalogItem[];
  isLoading: boolean;
};

type CatalogActions = {
  init: () => void;
};

type CatalogStore = CatalogState & CatalogActions;

const initialItems = catalogMock as CatalogItem[];

export const useCatalogStore = create<CatalogStore>((set) => ({
  items: [],
  isLoading: false,
  init: () => {
    set({ isLoading: true });
    // эмуляция загрузки с бэкенда
    setTimeout(() => {
      if (import.meta.env.VITE_IS_MOCK_ACTIVE) {
        set({ items: initialItems, isLoading: true });
      }
    }, 600);
  },
}));
