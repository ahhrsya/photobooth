// Web: IndexedDB via idb-keyval. Native (Capacitor) uses same IDB.
//
// Stores are lazy-initialized so that importing this module during Next.js
// static export (Node.js, no IndexedDB) doesn't throw "indexedDB is not defined".

import { get, set, del, keys, createStore } from "idb-keyval";

type IdbStore = ReturnType<typeof createStore>;

let _media: IdbStore | null = null;
let _journal: IdbStore | null = null;
let _settings: IdbStore | null = null;

const media = () => (_media ??= createStore("photobooth-db", "media"));
const journal = () => (_journal ??= createStore("photobooth-db", "journals"));
const settings = () => (_settings ??= createStore("photobooth-db", "settings"));

// --- Media (photo blobs / dataURLs) ---
export const saveMedia = (id: string, value: string | Blob) =>
  set(id, value, media());
export const loadMedia = (id: string) =>
  get<string | Blob>(id, media());
export const deleteMedia = (id: string) => del(id, media());

// --- Journals ---
export const saveJournal = <T>(id: string, journalData: T) =>
  set(id, journalData, journal());
export const loadJournal = <T>(id: string) => get<T>(id, journal());
export const deleteJournal = (id: string) => del(id, journal());
export const listJournalIds = () => keys(journal());

// --- Settings ---
export const saveSetting = <T>(key: string, value: T) =>
  set(key, value, settings());
export const loadSetting = <T>(key: string) => get<T>(key, settings());
