// Web: IndexedDB via idb-keyval. Native (Capacitor) uses same IDB.

import { get, set, del, keys, createStore } from "idb-keyval";

const mediaStore = createStore("photobooth-db", "media");
const journalStore = createStore("photobooth-db", "journals");
const settingsStore = createStore("photobooth-db", "settings");

// --- Media (photo blobs / dataURLs) ---
export const saveMedia = (id: string, value: string | Blob) =>
  set(id, value, mediaStore);
export const loadMedia = (id: string) =>
  get<string | Blob>(id, mediaStore);
export const deleteMedia = (id: string) => del(id, mediaStore);

// --- Journals ---
export const saveJournal = <T>(id: string, journal: T) =>
  set(id, journal, journalStore);
export const loadJournal = <T>(id: string) => get<T>(id, journalStore);
export const deleteJournal = (id: string) => del(id, journalStore);
export const listJournalIds = () => keys(journalStore);

// --- Settings ---
export const saveSetting = <T>(key: string, value: T) =>
  set(key, value, settingsStore);
export const loadSetting = <T>(key: string) => get<T>(key, settingsStore);
