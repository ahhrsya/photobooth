import { create } from "zustand";
import { Format, Template } from "../types";

interface PhotoboothState {
  format: Format | null;
  template: Template | null;
  capturedPhotos: string[];
  composedImageUri: string | null;
  isProcessing: boolean;
  caption: string;
  expectedCount: number;

  setFormat: (format: Format) => void;
  setTemplate: (template: Template) => void;
  addPhoto: (uri: string) => void;
  removeLastPhoto: () => void;
  resetPhotos: () => void;
  setComposedImage: (uri: string | null) => void;
  setProcessing: (val: boolean) => void;
  setCaption: (val: string) => void;
  setExpectedCount: (n: number) => void;
  resetAll: () => void;
}

const DEFAULT_STRIP_CAPTION = "made today";
const DEFAULT_POLAROID_CAPTION = "say cheese!";

export const usePhotoboothStore = create<PhotoboothState>((set) => ({
  format: null,
  template: null,
  capturedPhotos: [],
  composedImageUri: null,
  isProcessing: false,
  caption: DEFAULT_STRIP_CAPTION,
  expectedCount: 3,

  setFormat: (format) =>
    set({
      format,
      caption: format === "polaroid" ? DEFAULT_POLAROID_CAPTION : DEFAULT_STRIP_CAPTION,
    }),
  setTemplate: (template) => set({ template }),
  addPhoto: (uri) =>
    set((state) => ({ capturedPhotos: [...state.capturedPhotos, uri] })),
  removeLastPhoto: () =>
    set((state) => ({
      capturedPhotos: state.capturedPhotos.slice(0, -1),
    })),
  resetPhotos: () => set({ capturedPhotos: [] }),
  setComposedImage: (uri) => set({ composedImageUri: uri }),
  setProcessing: (val) => set({ isProcessing: val }),
  setCaption: (val) => set({ caption: val }),
  setExpectedCount: (n) => set({ expectedCount: n }),
  resetAll: () =>
    set({
      format: null,
      template: null,
      capturedPhotos: [],
      composedImageUri: null,
      isProcessing: false,
      caption: DEFAULT_STRIP_CAPTION,
      expectedCount: 3,
    }),
}));
