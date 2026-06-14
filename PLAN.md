# Photobooth + Journal — Project Plan (v2, Web-First)

> Next.js + React | Web App | Photo Strip / Polaroid dengan Print Animation + Journal Book swipeable

---

## Table of Contents

1. [Overview](#overview)
2. [Strategy: Web-First, App-Ready](#strategy-web-first-app-ready)
3. [Tech Stack](#tech-stack)
4. [App Architecture](#app-architecture)
5. [Screen / Route Breakdown](#screen--route-breakdown)
6. [Print Animation — Web Implementation](#print-animation--web-implementation)
7. [Journal Book — Deep Dive](#journal-book--deep-dive)
8. [Template System](#template-system)
9. [State & Storage](#state--storage)
10. [File Structure](#file-structure)
11. [Assets Required (dari user)](#assets-required-dari-user)
12. [Phase Plan](#phase-plan)
13. [App Port Path (Future)](#app-port-path-future)
14. [Open Questions](#open-questions)

---

## Overview

Web app dua-fitur-utama:

1. **Photobooth** — buka kamera, pilih format (strip / polaroid), pilih template, ambil foto, lalu hasilnya keluar dengan animasi print-out seperti foto fisik keluar dari mesin photobooth.
2. **Journal** — buku digital yang halamannya bisa di-swipe (3D page flip), tiap halaman bebas diisi foto-foto (dari photobooth atau upload), tulisan tangan, sticker, washi tape, doodle, dan background paper bisa diganti. Jurnal bisa di-share.

**Main Menu (entry point):**
- `Mulai Foto` → flow photobooth
- `Buka Jurnal` → buku jurnal
- Setelah print di photobooth, ada CTA opsional: `Tambah ke Jurnal` atau `Selesai`.

**Core experience yang harus terjaga:**
- Animasi print-out yang terasa fisik (kartu slide keluar dari slot printer, sedikit miring, settle dengan micro-wobble).
- Page flip jurnal yang realistis (3D, ada bayangan, edge curl saat di-drag).

---

## Strategy: Web-First, App-Ready

Aturan supaya nanti gampang di-wrap jadi app native (iOS/Android/desktop):

| Aturan | Alasan |
|---|---|
| Semua media (foto, jurnal) disimpan **lokal dulu** via IndexedDB. Cloud sync opsional belakangan. | Capacitor / Tauri / PWA semuanya kompatibel dengan IndexedDB. Logic gak perlu ditulis ulang. |
| Akses kamera lewat `getUserMedia` standar Web API. | Capacitor punya plugin `camera` yang API-nya mirip, gampang di-swap dengan adapter tipis. |
| Animasi pakai **Framer Motion** + CSS transforms (GPU-friendly), bukan canvas-heavy hacks. | Sama performance-nya di mobile browser dan WebView native (Capacitor). |
| Routing pakai **Next.js App Router** dengan client components untuk halaman interaktif. | Bisa di-static-export untuk Capacitor / Electron / Tauri tanpa server. |
| Semua interaksi touch-first (gesture handler, drag, pinch). | Mouse-friendly otomatis kalau touch-first dibuat benar. Siap untuk app. |
| Tidak boleh pakai API yang web-only tanpa fallback (mis. WebUSB, File System Access tanpa fallback `<input type=file>`). | App webview kadang gak punya. |
| Folder `lib/platform/` jadi tempat semua hal yang bisa beda antara web dan native (storage, share, kamera). | Saat porting, cukup ganti implementasi di sini. |

**Target output build:**
- Web: Next.js static export → deploy ke Vercel / Cloudflare Pages.
- PWA: tambah service worker + manifest (Phase 3), install-able dari Safari/Chrome.
- iOS/Android app: wrap dengan **Capacitor** (Phase 4), pakai native kamera plugin.
- Desktop app: wrap dengan **Tauri** kalau perlu (Phase 4 opsional).

---

## Tech Stack

### Core
| Package | Kegunaan |
|---|---|
| `next` (v15+) | Framework React, App Router, static export friendly |
| `react` / `react-dom` (v19) | UI |
| `typescript` | Type safety |
| `tailwindcss` | Styling utility |
| `framer-motion` | Animasi print-out, page flip, drag-resize-rotate |

### Photobooth
| Package | Kegunaan |
|---|---|
| Browser `getUserMedia` (native) | Buka kamera |
| `html2canvas` atau `html-to-image` | Capture composited photo (foto + frame) → PNG |
| `react-easy-crop` (opsional) | Crop foto sebelum compose |

### Journal
| Package | Kegunaan |
|---|---|
| `react-pageflip` | 3D page-flip animation (realistis, ada shadow + curl) |
| `framer-motion` | Drag-resize-rotate sticker/foto di halaman |
| `perfect-freehand` | Tulisan tangan / doodle yang halus (stylus-aware) |
| `react-dnd` *atau* gesture handler manual | Drop foto ke halaman |

### Storage & Share
| Package | Kegunaan |
|---|---|
| `idb-keyval` atau `dexie` | IndexedDB wrapper untuk simpan foto & jurnal |
| `zustand` | State management |
| Web Share API (native) | Share PNG/PDF ke Instagram/WA/etc., fallback ke download |
| `jspdf` (opsional) | Export jurnal jadi PDF untuk download/share |

### Audio & Feedback
| Package | Kegunaan |
|---|---|
| `<audio>` element native | Print sound effect |
| Web Vibration API (kalau ada) | Haptic di mobile browser |

**Kenapa Framer Motion vs Reanimated:**
Framer Motion adalah standar de-facto animasi React di web. Performanya bagus karena pakai CSS `transform` + `will-change`. Reanimated dropped — itu khusus React Native.

**Kenapa react-pageflip:**
Library matang untuk efek 3D book flipping di web (StPageFlip). Touch + mouse, support shadow & corner curl, persis vibe yang user mau.

---

## App Architecture

```
Next.js App Router
│
├── /                       → MainMenu (Mulai Foto / Buka Jurnal)
│
├── /photobooth
│   ├── /format             → pilih strip atau polaroid
│   ├── /template           → pilih design frame
│   ├── /capture            → kamera + countdown + flash
│   └── /print              → compose + print animation + save/share/add-to-journal
│
├── /journal                → daftar jurnal yang dimiliki user
│   ├── /journal/new        → buat jurnal baru (pilih cover)
│   └── /journal/[id]       → buka 1 jurnal, page-flip view + edit mode
│
└── /shared/[token]         → public read-only view untuk jurnal yang di-share

State (Zustand, persisted ke IndexedDB):
├── photobooth: { format, template, capturedPhotos, composedImage }
├── journals: Journal[]                  → list semua jurnal user
├── currentJournal: Journal | null       → yang lagi dibuka
└── ui: { isProcessing, isEditMode }
```

---

## Screen / Route Breakdown

### 1. MainMenu `/`

**Fungsi:** Entry. Pilih mau ngapain.

**UI:**
- Hero header dengan title + ilustrasi kecil (foto+buku ditumpuk).
- Dua kartu besar:
  - **Mulai Foto** — ilustrasi kamera/printer, hover effect.
  - **Buka Jurnal** — ilustrasi buku terbuka, hover effect.
- Bagian bawah: thumbnail jurnal terakhir yang dibuka (recent), klik → langsung buka.

**Behavior:**
- Hover/tap kartu → scale 1.03 + shadow.
- Tap → routing.

---

### 2. Photobooth Flow

#### 2a. FormatPicker `/photobooth/format`
- Dua opsi besar: Photo Strip vs Polaroid, dengan animated preview (subtle shimmer).
- Lanjut → `/photobooth/template`.

#### 2b. TemplatePicker `/photobooth/template`
- Horizontal carousel kartu template (snap-scroll, center = focused).
- Tampilkan preview, nama, tags vibe.
- CTA "Pakai ini →".

#### 2c. Capture `/photobooth/capture`

**UI:**
- Full-bleed `<video>` element (kamera).
- Frame overlay transparan di atas viewfinder (bayangan frame template).
- Counter "1 / 3" (strip) di pojok atas.
- Countdown 3-2-1 di tengah (Framer Motion scale + fade).
- Capture button center-bottom.
- Flip camera (front/back) top-right — pakai `getUserMedia` `facingMode`.
- Thumbnail row di bawah untuk strip mode.

**Behavior:**
- Strip: 3x capture berurutan, jeda 1.5s, auto ke `/photobooth/print`.
- Polaroid: 1x, kasih opsi Retake atau Lanjut.
- Default: front camera.
- Flash: full-screen white `<div>` opacity 1→0 dalam 200ms.

#### 2d. Print `/photobooth/print`

**Ini screen paling krusial.**

**State 1 — Developing (<500ms):**
- Background gelap subtle, spinner kecil.
- Text: "developing your photos..."
- Di background: `html-to-image` render off-screen `<PhotoStrip />` atau `<Polaroid />` → PNG dataURL.

**State 2 — Print Animation:**
- Background tekstur tembok (subtle).
- Slot printer di bawah (sprite asset dari user).
- Kartu foto slide keluar dari slot.
- Detail di [Print Animation](#print-animation--web-implementation).

**State 3 — Done:**
- Kartu fully visible, drop shadow, sedikit draggable.
- Action bar dari bawah fade-in:
  - **Simpan ke perangkat** (download PNG)
  - **Bagikan** (Web Share API → IG/WA/dll, fallback download)
  - **Tambah ke jurnal** ← buka modal "pilih jurnal mana / buat baru"
  - **Foto lagi** (link kecil)

---

### 3. Journal Flow

#### 3a. JournalList `/journal`

**UI:**
- Grid card jurnal user (cover + title + last edited).
- Card "+ Jurnal baru" di paling kiri.
- Tap jurnal → `/journal/[id]`.

#### 3b. JournalNew `/journal/new`
- Pilih cover (preset 6-10 cover: kulit jeruk, denim, pastel, dark leather, dll).
- Input judul jurnal.
- Create → langsung buka `/journal/[id]` dengan jurnal baru (1 halaman kosong).

#### 3c. JournalView `/journal/[id]`

**Ini screen paling kompleks setelah Print.**

Dua mode:
- **Read mode (default):** halaman tampil sebagai buku 3D, swipe untuk flip.
- **Edit mode (toggle pencil icon):** halaman aktif jadi canvas, layer-layer item bisa di-drag/resize/rotate, palette tools muncul.

Detail di [Journal Book — Deep Dive](#journal-book--deep-dive).

---

### 4. SharedJournal `/shared/[token]`
- Public read-only view.
- User klik link → buka buku, bisa flip halaman, tapi gak bisa edit.
- Token disimpan di state + jurnal di-export ke JSON terkompresi yang di-encode di URL atau di-host di blob storage (Phase 3 detail).

---

## Print Animation — Web Implementation

Inti experience tetap sama dengan versi mobile, tapi dipindah ke Framer Motion + CSS transforms.

### Konsep Visual (sama dengan v1)

```
┌─────────────────────┐
│                     │
│                     │
│                     │   ← layar
│                     │
│  ┌───────────────┐  │   ← kartu foto muncul dari sini
│  │   FOTO CARD   │  │   ← slide ke atas, sedikit miring
└──┴───────────────┴──┘
   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ← slot printer (sprite asset dari user)
```

### Implementasi Framer Motion

```tsx
import { motion, useAnimationControls } from "framer-motion";

const CARD_HIDDEN_Y = 600;     // offset awal di bawah layar
const PRINT_DURATION = 1.2;    // detik

const controls = useAnimationControls();

const startPrintAnimation = async () => {
  // play sfx
  printSoundRef.current?.play();

  await controls.start({
    y: 0,
    rotate: 0,
    opacity: 1,
    transition: {
      y: { duration: PRINT_DURATION, ease: [0.16, 1, 0.3, 1] }, // easeOutExpo-ish
      rotate: { duration: 0.8, delay: 0.2, ease: "easeOut" },
      opacity: { duration: 0.15 },
    },
  });

  // micro-wobble settle
  await controls.start({
    y: [-8, 0],
    transition: { duration: 0.2, times: [0, 1] },
  });

  // haptic + show actions
  navigator.vibrate?.(20);
  onAnimationComplete();
};

<motion.div
  className="print-card"
  initial={{ y: CARD_HIDDEN_Y, rotate: 1.5, opacity: 0 }}
  animate={controls}
  style={{
    boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
    willChange: "transform",
  }}
>
  {/* PhotoStrip atau Polaroid composed PNG */}
  <img src={composedImageUri} />
</motion.div>
```

### Timeline (total ~1.4s)

```
0ms      → kartu di y=600px, opacity 0, rotate 1.5deg, slot terlihat
0ms      → SFX kertas printer play
0ms      → opacity 0 → 1 (150ms)
0ms      → translateY 600 → 0 (1200ms, easeOutExpo)
200ms    → rotate 1.5 → 0 (800ms, easeOut)
1200ms   → kartu settle position
1200ms   → micro-wobble y -8 → 0 (200ms)
1400ms   → vibrate(20), action buttons fade-in dari bawah
```

### Drag fisik setelah print

Bungkus kartu dengan `<motion.div drag dragConstraints={...} dragElastic={0.15}>` supaya bisa sedikit digeser dan spring-back. Mouse + touch otomatis didukung.

### Sound effect

`/public/sounds/print.mp3` — preload via `<audio preload="auto">`, play saat animasi start. Volume default 0.7. User bisa mute via toggle global di header (Phase 2).

---

## Journal Book — Deep Dive

### Layer Model

Tiap halaman jurnal adalah **canvas absolute-positioned** dengan layer-layer item di atas background paper.

```ts
interface JournalPage {
  id: string;
  background: {
    type: "paper" | "color" | "grid" | "dot" | "lined";
    value: string;            // path texture, hex color, atau preset id
  };
  items: PageItem[];          // ordered, paling bawah = paling belakang
}

type PageItem =
  | PhotoItem
  | TextItem
  | StickerItem
  | TapeItem
  | DoodleItem;

interface BaseItem {
  id: string;
  x: number;        // px
  y: number;
  rotation: number; // deg
  scale: number;
  zIndex: number;
}

interface PhotoItem extends BaseItem {
  type: "photo";
  src: string;          // dataURL atau IndexedDB key
  frame?: "polaroid" | "tape" | "none";
}

interface TextItem extends BaseItem {
  type: "text";
  text: string;
  font: "handwriting-1" | "handwriting-2" | "marker" | "serif";
  size: number;
  color: string;
}

interface StickerItem extends BaseItem {
  type: "sticker";
  assetId: string;      // dari sticker library
}

interface TapeItem extends BaseItem {
  type: "tape";
  assetId: string;      // washi tape variants
  width: number;        // length of strip
}

interface DoodleItem extends BaseItem {
  type: "doodle";
  paths: { points: [number, number][]; color: string; width: number }[];
}
```

### Page Flip

Pakai `react-pageflip` (StPageFlip wrapper):

```tsx
import HTMLFlipBook from "react-pageflip";

<HTMLFlipBook
  width={420}
  height={580}
  size="stretch"
  minWidth={320}
  maxWidth={600}
  minHeight={480}
  maxHeight={800}
  showCover={true}
  mobileScrollSupport={true}
  flippingTime={700}
  drawShadow={true}
  usePortrait={isMobile}
>
  <Cover />
  {pages.map((p) => <PageRenderer key={p.id} page={p} />)}
  <BackCover />
</HTMLFlipBook>
```

- Drag dari sudut halaman = curl preview.
- Drag-release di tengah = page flip animation 700ms.
- Tap kiri/kanan tepi halaman = flip cepat.
- Mobile: portrait mode, satu halaman per view; desktop: dua halaman terbuka (spread).

### Edit Mode

Toggle ikon pencil di header. Saat ON:
- Page flip di-disable (biar gak konflik dengan drag item).
- Setiap item bisa di-tap → muncul handle (corner = resize, top = rotate).
- Long-press item → opsi delete, duplicate, kirim ke depan/belakang.
- Bottom toolbar muncul dengan tab:
  - **Foto** — pilih dari hasil photobooth atau upload baru.
  - **Tulisan** — pilih font, warna, ketik teks.
  - **Sticker** — grid sticker dari library.
  - **Tape** — pilih washi pattern.
  - **Doodle** — brush sketsa (pakai `perfect-freehand` untuk smoothing).
  - **Halaman** — ganti background paper, tambah halaman baru, hapus halaman.

Tap tempat kosong di halaman = deselect.

### Drag-Resize-Rotate Implementation

Pakai Framer Motion `drag` + custom handle untuk rotate & scale:

```tsx
<motion.div
  drag
  dragMomentum={false}
  onDragEnd={(_, info) => updateItem(item.id, {
    x: item.x + info.offset.x,
    y: item.y + info.offset.y,
  })}
  style={{
    rotate: item.rotation,
    scale: item.scale,
    zIndex: item.zIndex,
  }}
>
  {renderItemContent(item)}
  {isSelected && <ResizeRotateHandle ... />}
</motion.div>
```

`ResizeRotateHandle` adalah corner gripper yang dengar `pointerMove` dan hitung delta angle & distance.

### Snap & Guides

- Saat drag, kalau dekat dengan edge atau pusat halaman, tampilkan garis bantu tipis (snap).
- Saat rotate, snap ke kelipatan 5deg kalau dekat 0/45/90.

### Auto-save

Tiap perubahan di-debounce 500ms lalu commit ke IndexedDB. Tampilkan indikator kecil "Tersimpan" di pojok header.

### Add from Photobooth

Setelah print, modal "Tambah ke jurnal":
- Pilih jurnal target dari list.
- Pilih halaman target: "halaman terakhir" / "halaman baru".
- Foto langsung jadi `PhotoItem` di posisi tengah halaman, user tinggal geser.

### Share Journal

Tiga opsi:
1. **Share link read-only** — generate token, export JSON terkompresi → upload ke blob storage / encode di URL → buka `/shared/[token]`.
2. **Export PDF** — render semua halaman sequentially pakai `jspdf` + `html-to-image`.
3. **Export PNG per halaman** — zip dan download.

Phase 3 detail (lihat Phase Plan).

---

## Template System

Sama dengan v1, tapi format Template object disesuaikan untuk web (background sebagai CSS gradient/color, overlay sebagai PNG di `/public/frames/`).

```ts
interface Template {
  id: string;
  name: string;
  tags: string[];
  format: "strip" | "polaroid" | "both";

  backgroundColor: string;          // CSS color / gradient
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;

  photoGap: number;
  photoBorderRadius?: number;

  showDate: boolean;
  showCaption: boolean;
  fontFamily?: string;
  textColor: string;

  overlayAsset?: string;            // /frames/y2k-stars.png
  overlayOpacity?: number;

  thumbnail: string;                // /frames/thumbs/y2k.png
}
```

MVP templates: Classic, Y2K, Film, Dark, Pastel (sama seperti v1, asset siapkan di `/public/frames/`).

---

## State & Storage

### Zustand Store (persisted)

```ts
// store/usePhotoboothStore.ts
interface PhotoboothState {
  format: "strip" | "polaroid" | null;
  template: Template | null;
  capturedPhotos: string[];         // dataURLs sementara
  composedImage: string | null;     // dataURL hasil
  isProcessing: boolean;
  // actions...
}

// store/useJournalStore.ts
interface JournalState {
  journals: Journal[];
  currentJournalId: string | null;
  isEditMode: boolean;
  selectedItemId: string | null;
  // actions: createJournal, updatePage, addItem, updateItem, deleteItem, ...
}
```

### IndexedDB Layout (via `idb-keyval` atau `dexie`)

```
db: photobooth-app
├── store: media          → blob foto besar (key: id, value: Blob)
├── store: journals       → Journal objects (key: id, value: Journal)
├── store: thumbnails     → small preview untuk grid (key: journalId, value: Blob)
└── store: settings       → user prefs (sound, theme, dll)
```

`Journal` di-simpan ringan: `items[].src` pakai key referensi ke `media` store, bukan dataURL langsung. Ini supaya jurnal yang punya 50+ foto gak nge-bloat localStorage.

### Compose & Capture

```
capturedPhotos (dataURL[] dari <video>.captureStream → canvas.toDataURL)
    ↓
html-to-image.toPng(<PhotoStrip ref />)
    ↓
composedImage (dataURL PNG)
    ↓
download / share / addToJournal
```

Off-screen render: container `position: fixed; left: -9999px; top: 0;` dengan ref → `html-to-image` capture. Setelah capture, container un-mount.

### Platform Adapter

```
lib/platform/
├── camera.ts        → web: getUserMedia. native: Capacitor Camera plugin.
├── storage.ts       → web: idb-keyval. native: same (Capacitor supports IDB).
├── share.ts         → web: navigator.share + fallback download. native: Capacitor Share plugin.
├── haptics.ts       → web: navigator.vibrate. native: Capacitor Haptics.
└── filesystem.ts    → web: download blob. native: Capacitor Filesystem.
```

Saat Phase 4 (porting ke app), hanya file-file ini yang berubah implementasi.

---

## File Structure

```
photobooth/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # root layout, providers
│   ├── page.tsx                      # MainMenu
│   │
│   ├── photobooth/
│   │   ├── layout.tsx
│   │   ├── format/page.tsx
│   │   ├── template/page.tsx
│   │   ├── capture/page.tsx
│   │   └── print/page.tsx
│   │
│   ├── journal/
│   │   ├── page.tsx                  # journal list
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx             # journal view + edit
│   │
│   └── shared/[token]/page.tsx       # public read-only
│
├── components/
│   ├── menu/
│   │   └── MainMenuCards.tsx
│   │
│   ├── photobooth/
│   │   ├── FormatPicker.tsx
│   │   ├── TemplateCarousel.tsx
│   │   ├── CameraView.tsx
│   │   ├── CountdownOverlay.tsx
│   │   ├── CameraFlash.tsx
│   │   ├── ThumbnailStrip.tsx
│   │   ├── CaptureButton.tsx
│   │   ├── PhotoStrip.tsx
│   │   ├── Polaroid.tsx
│   │   ├── OffscreenComposer.tsx
│   │   ├── PrintSlot.tsx             # animasi wrapper
│   │   ├── PrinterSlotVisual.tsx     # sprite slot
│   │   └── ActionBar.tsx
│   │
│   ├── journal/
│   │   ├── JournalGrid.tsx
│   │   ├── JournalCoverPicker.tsx
│   │   ├── JournalBook.tsx           # react-pageflip wrapper
│   │   ├── PageRenderer.tsx
│   │   ├── PageItem.tsx              # generic draggable item
│   │   ├── ResizeRotateHandle.tsx
│   │   ├── EditToolbar.tsx
│   │   ├── tools/
│   │   │   ├── PhotoTool.tsx
│   │   │   ├── TextTool.tsx
│   │   │   ├── StickerTool.tsx
│   │   │   ├── TapeTool.tsx
│   │   │   ├── DoodleTool.tsx
│   │   │   └── PageTool.tsx
│   │   └── AddToJournalModal.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── LoadingOverlay.tsx
│       └── Toast.tsx
│
├── hooks/
│   ├── useCamera.ts                  # getUserMedia logic
│   ├── useCountdownCapture.ts        # countdown + flash + capture sequence
│   ├── usePrintAnimation.ts          # framer motion controls
│   ├── useImageCompose.ts            # html-to-image logic
│   ├── useJournalEditor.ts           # item selection, edit mode state
│   └── useAutosave.ts                # debounced commit to IDB
│
├── lib/
│   ├── platform/                     # platform adapter (see above)
│   │   ├── camera.ts
│   │   ├── storage.ts
│   │   ├── share.ts
│   │   ├── haptics.ts
│   │   └── filesystem.ts
│   ├── compose/
│   │   ├── photoStrip.ts             # layout math
│   │   └── polaroid.ts
│   └── share/
│       ├── journalExportPdf.ts
│       └── journalShareLink.ts
│
├── store/
│   ├── usePhotoboothStore.ts
│   └── useJournalStore.ts
│
├── constants/
│   ├── templates.ts
│   ├── stickers.ts                   # sticker library manifest
│   ├── tapes.ts                      # washi tape library
│   ├── papers.ts                     # background paper library
│   ├── fonts.ts                      # handwriting font list
│   └── dimensions.ts
│
├── public/
│   ├── frames/                       # template overlays + thumbnails
│   ├── printer/                      # printer slot sprite, machine art
│   ├── stickers/                     # PNG sticker assets
│   ├── tapes/                        # washi tape PNGs
│   ├── papers/                       # paper texture PNGs (jpg)
│   ├── covers/                       # journal cover presets
│   ├── sounds/print.mp3
│   └── fonts/                        # handwriting fonts (woff2)
│
├── types/
│   └── index.ts
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Assets Required (dari user)

Yang nanti perlu disiapkan dan ditaruh di `/public/`:

### Photobooth
- `printer/slot.png` — sprite slot printer (PNG transparent, 800x100 ideal).
- `printer/machine-bg.png` (opsional) — ilustrasi mesin printer di background.
- `frames/*.png` — overlay per template (Y2K stars, film grain, dll) + thumbnail.
- `sounds/print.mp3` — sound printer ~1s.
- `sounds/shutter.mp3` (opsional) — shutter saat capture.

### Journal
- `covers/*.png` — 6–10 cover preset (kulit, denim, pastel, dark leather, dll).
- `papers/*.jpg` — 6–10 paper texture (cream, dotted, lined, grid, kraft, dll).
- `stickers/*.png` — sticker pack (50+ ideal), kategori: emoji, hati, bintang, kawaii, retro.
- `tapes/*.png` — washi tape (10–15 variant, repeatable horizontal pattern).
- `fonts/*.woff2` — 3–5 handwriting font.

Kalau mau, plan ini bisa di-update lagi dengan list spesifik tiap asset (filename + dimensi) begitu user upload referensi.

---

## Phase Plan

### Phase 1 — Web Core MVP
**Target: end-to-end photobooth + jurnal sederhana di web.**

- [ ] Setup Next.js 15 + TypeScript + Tailwind + Framer Motion.
- [ ] MainMenu (`/`) dengan 2 kartu.
- [ ] Photobooth flow lengkap: format → template (1 template) → capture → print animation → save (download PNG).
- [ ] `getUserMedia` kamera, countdown, flash, capture canvas.
- [ ] `<PhotoStrip />` + `<Polaroid />` + OffscreenComposer + html-to-image compose.
- [ ] **Print animation** dengan Framer Motion (translateY + rotate + opacity + micro-wobble).
- [ ] Jurnal sederhana: list jurnal, buat baru, halaman dengan foto + text basic, page flip pakai `react-pageflip`.
- [ ] IndexedDB storage untuk foto + jurnal.
- [ ] Platform adapter layer (`lib/platform/`).

**Deliverable:** Bisa foto, lihat print animation, save, dan buat jurnal yang halamannya bisa di-swipe.

---

### Phase 2 — Template & Journal Customization
- [ ] 5 template lengkap dengan overlay + font custom.
- [ ] Date + caption text di output photobooth.
- [ ] Edit mode jurnal: drag-resize-rotate semua item.
- [ ] Sticker library + tape library + paper background library.
- [ ] Tool: foto, text, sticker, tape, doodle (perfect-freehand), halaman.
- [ ] Auto-save jurnal (debounced).
- [ ] "Tambah ke jurnal" dari halaman Print.

---

### Phase 3 — Share & Polish
- [ ] Web Share API integration (share PNG ke IG/WA, fallback download).
- [ ] Export jurnal jadi PDF (`jspdf`).
- [ ] Share link read-only jurnal (`/shared/[token]`).
- [ ] Sound effect + Vibration API.
- [ ] Snap & guides di edit mode.
- [ ] Onboarding / empty state ilustrasi.
- [ ] PWA manifest + service worker (install-able dari browser).
- [ ] Responsive: desktop spread (2 halaman), mobile portrait (1 halaman).

---

### Phase 4 — Native App Wrap
- [ ] Setup Capacitor.
- [ ] Swap implementasi di `lib/platform/`: kamera, share, haptics, filesystem.
- [ ] Tambah native splash screen + icon.
- [ ] Build iOS (TestFlight) + Android (internal track).
- [ ] (Opsional) Tauri wrap untuk desktop.

---

### Phase 5 — Extended (Future)
- [ ] Akun + cloud sync (Supabase atau Cloudflare R2 + D1).
- [ ] Multi-user kolaborasi jurnal.
- [ ] Custom template editor.
- [ ] Filter foto (B&W, warm, cool).
- [ ] Timer mode + GIF output strip.
- [ ] AI-generated sticker / background.

---

## App Port Path (Future)

Cara migrasi web → native pakai Capacitor:

```bash
npm i -D @capacitor/core @capacitor/cli
npx cap init
# build static export
next build && next export
# tambah platform
npx cap add ios
npx cap add android
# install plugins yang menggantikan web API
npm i @capacitor/camera @capacitor/share @capacitor/haptics @capacitor/filesystem
# update lib/platform/*.ts untuk pakai plugin native
npx cap sync
npx cap open ios   # buka Xcode
```

Karena semua API web-only kita encapsulate di `lib/platform/`, porting ke native cuma ganti implementasi 5 file. UI components, animation, state, storage IDB semua reusable apa adanya.

---

## Open Questions

1. **Orientasi web:** Portrait-first dengan responsive desktop (book spread)? Atau full responsive di kedua mode? Recommend portrait-first.
2. **Jumlah foto strip:** 3 atau 4? Real photobooth biasa 4.
3. **Aspect ratio foto:** Square 1:1 atau 4:3?
4. **Caption polaroid:** Manual user, auto (tanggal), atau dua-duanya opsional?
5. **Output resolution:** PNG export di berapa DPI? Default 2x untuk retina + print-friendly.
6. **Cover jurnal:** Cuma preset, atau juga bisa upload custom foto sebagai cover?
7. **Jumlah halaman per jurnal:** Ada batas (mis. 50)? Atau infinite + lazy load?
8. **Share link:** Self-host (perlu blob storage) atau encode JSON di URL (max ~2KB jurnal, gak realistis kalau ada foto)?
9. **Account & sync:** Phase 5 (lokal-first dulu) — confirmed atau mau lebih awal?
10. **Naming app:** Belum ada. Kandidat: Strippo, Boothsnap, Devel, Petite, Kertas, Lipat.

---

*Last updated: 2026-06-13 — v2 (web-first + journal)*
