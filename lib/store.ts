'use client';

import { create } from 'zustand';

const STORAGE_KEY = 'sidebar_open';

function readPersisted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  /** Whether historical event annotations are shown on time-series charts. */
  showEvents: boolean;
  toggleEvents: () => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  showEvents: false,
  toggleEvents: () => set((s) => ({ showEvents: !s.showEvents })),
  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    set({ sidebarOpen: next });
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* localStorage unavailable -- ignore, state still works in-session */
    }
  },
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      /* ignore */
    }
  },
}));

/** Call once on mount (client only) to hydrate from localStorage. */
export function hydrateSidebarFromStorage() {
  useUIStore.setState({ sidebarOpen: readPersisted() });
}
