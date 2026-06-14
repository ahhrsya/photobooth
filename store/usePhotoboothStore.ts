"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Format, Template } from "@/types";

interface PhotoboothState {
  format: Format | null;
  templateId: string | null;
  capturedPhotos: string[]; // dataURLs
  composedImage: string | null;
  setFormat: (f: Format) => void;
  setTemplate: (t: Template) => void;
  setPhotos: (photos: string[]) => void;
  addPhoto: (photo: string) => void;
  resetPhotos: () => void;
  setComposed: (uri: string | null) => void;
  reset: () => void;
}

export const usePhotoboothStore = create<PhotoboothState>()(
  persist(
    (set) => ({
      format: null,
      templateId: null,
      capturedPhotos: [],
      composedImage: null,
      setFormat: (f) => set({ format: f }),
      setTemplate: (t) => set({ templateId: t.id }),
      setPhotos: (photos) => set({ capturedPhotos: photos }),
      addPhoto: (photo) =>
        set((s) => ({ capturedPhotos: [...s.capturedPhotos, photo] })),
      resetPhotos: () => set({ capturedPhotos: [], composedImage: null }),
      setComposed: (uri) => set({ composedImage: uri }),
      reset: () =>
        set({
          format: null,
          templateId: null,
          capturedPhotos: [],
          composedImage: null,
        }),
    }),
    {
      name: "photobooth-current",
      // sessionStorage so big dataURLs don't fill localStorage
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.sessionStorage : (undefined as never)
      ),
      partialize: (s) => ({
        format: s.format,
        templateId: s.templateId,
        capturedPhotos: s.capturedPhotos,
        composedImage: s.composedImage,
      }),
    }
  )
);
