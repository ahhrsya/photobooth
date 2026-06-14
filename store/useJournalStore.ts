"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Journal, JournalPage, PageItem } from "@/types";
import {
  saveJournal,
  loadJournal,
  deleteJournal,
  listJournalIds,
} from "@/lib/platform/storage";

interface JournalState {
  journals: Journal[];
  isLoaded: boolean;
  isEditMode: boolean;
  selectedItemId: string | null;

  loadAll: () => Promise<void>;
  createJournal: (title: string, coverId: string) => Journal;
  deleteOne: (id: string) => Promise<void>;
  getJournal: (id: string) => Journal | undefined;

  // page ops
  addPage: (journalId: string) => string;
  removePage: (journalId: string, pageId: string) => void;
  updatePageBackground: (
    journalId: string,
    pageId: string,
    bg: JournalPage["background"]
  ) => void;

  // item ops
  addItem: (journalId: string, pageId: string, item: PageItem) => void;
  updateItem: (
    journalId: string,
    pageId: string,
    itemId: string,
    patch: Partial<PageItem>
  ) => void;
  removeItem: (journalId: string, pageId: string, itemId: string) => void;

  setEditMode: (on: boolean) => void;
  setSelected: (id: string | null) => void;

  persist: (journalId: string) => Promise<void>;
}

function blankPage(): JournalPage {
  return {
    id: nanoid(8),
    background: { type: "color", value: "#FBF6EE" },
    items: [],
  };
}

export const useJournalStore = create<JournalState>((set, get) => ({
  journals: [],
  isLoaded: false,
  isEditMode: false,
  selectedItemId: null,

  loadAll: async () => {
    if (get().isLoaded) return;
    // Snapshot any journals already in memory (e.g. just created before IDB save completes)
    const inMemory = get().journals;
    try {
      const ids = await listJournalIds();
      const loaded: Journal[] = [];
      for (const id of ids) {
        const j = await loadJournal<Journal>(String(id));
        if (j) loaded.push(j);
      }
      // Merge: keep in-memory journals not yet persisted to IDB (race condition guard)
      const loadedIds = new Set(loaded.map((j) => j.id));
      const merged = [
        ...loaded,
        ...inMemory.filter((j) => !loadedIds.has(j.id)),
      ];
      merged.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ journals: merged, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  createJournal: (title, coverId) => {
    const now = Date.now();
    const j: Journal = {
      id: nanoid(10),
      title: title || "Untitled",
      cover: coverId,
      createdAt: now,
      updatedAt: now,
      pages: [blankPage()],
    };
    set((s) => ({ journals: [j, ...s.journals] }));
    void saveJournal(j.id, j);
    return j;
  },

  deleteOne: async (id) => {
    await deleteJournal(id);
    set((s) => ({ journals: s.journals.filter((j) => j.id !== id) }));
  },

  getJournal: (id) => get().journals.find((j) => j.id === id),

  addPage: (journalId) => {
    const page = blankPage();
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? { ...j, updatedAt: Date.now(), pages: [...j.pages, page] }
          : j
      ),
    }));
    void get().persist(journalId);
    return page.id;
  },

  removePage: (journalId, pageId) => {
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? {
              ...j,
              updatedAt: Date.now(),
              pages:
                j.pages.length > 1
                  ? j.pages.filter((p) => p.id !== pageId)
                  : j.pages,
            }
          : j
      ),
    }));
    void get().persist(journalId);
  },

  updatePageBackground: (journalId, pageId, bg) => {
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? {
              ...j,
              updatedAt: Date.now(),
              pages: j.pages.map((p) =>
                p.id === pageId ? { ...p, background: bg } : p
              ),
            }
          : j
      ),
    }));
    void get().persist(journalId);
  },

  addItem: (journalId, pageId, item) => {
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? {
              ...j,
              updatedAt: Date.now(),
              pages: j.pages.map((p) =>
                p.id === pageId ? { ...p, items: [...p.items, item] } : p
              ),
            }
          : j
      ),
    }));
    void get().persist(journalId);
  },

  updateItem: (journalId, pageId, itemId, patch) => {
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? {
              ...j,
              updatedAt: Date.now(),
              pages: j.pages.map((p) =>
                p.id === pageId
                  ? {
                      ...p,
                      items: p.items.map((it) =>
                        it.id === itemId
                          ? ({ ...it, ...patch } as PageItem)
                          : it
                      ),
                    }
                  : p
              ),
            }
          : j
      ),
    }));
    void get().persist(journalId);
  },

  removeItem: (journalId, pageId, itemId) => {
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === journalId
          ? {
              ...j,
              updatedAt: Date.now(),
              pages: j.pages.map((p) =>
                p.id === pageId
                  ? { ...p, items: p.items.filter((it) => it.id !== itemId) }
                  : p
              ),
            }
          : j
      ),
    }));
    void get().persist(journalId);
  },

  setEditMode: (on) => set({ isEditMode: on, selectedItemId: null }),
  setSelected: (id) => set({ selectedItemId: id }),

  persist: async (journalId) => {
    const j = get().journals.find((x) => x.id === journalId);
    if (j) await saveJournal(j.id, j);
  },
}));
