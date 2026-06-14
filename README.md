# Photobooth + Journal

Web app: photobooth strip/polaroid dengan animasi print, plus jurnal digital yang bisa di-flip & dikustomisasi.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** strict
- **Tailwind CSS** untuk styling
- **Framer Motion** untuk animasi (print, page flip, drag)
- **react-pageflip** untuk 3D book flip
- **Zustand** + **idb-keyval** untuk state + IndexedDB persist
- **html-to-image** untuk compose foto + frame → PNG

## Folder map

```
app/                       # Next.js routes
├── page.tsx               # MainMenu
├── photobooth/
│   ├── format/            # pilih strip/polaroid
│   ├── template/          # pilih template
│   ├── capture/           # kamera + countdown + flash
│   └── print/             # print animation + save/share/+jurnal
└── journal/
    ├── page.tsx           # daftar jurnal
    ├── new/               # buat jurnal baru
    └── [id]/              # baca/edit jurnal (page-flip + edit mode)

components/
├── photobooth/            # PhotoStrip, Polaroid, PrinterSlot, dll
└── journal/               # JournalBook, PageRenderer, EditToolbar

lib/platform/              # adapter layer (camera, storage, share, haptics)
                           # swap implementasi di sini saat porting ke Capacitor

store/                     # zustand stores
constants/                 # templates, covers, papers, stickers, tapes
types/                     # shared TS types
public/sounds/print.mp3    # (kasih asset dari user)
_legacy-expo/              # kode Expo lama, diarsipkan
```

## Roadmap

- **Phase 1** (DONE): MVP end-to-end — photobooth + jurnal sederhana.
- **Phase 2**: customisasi lanjutan (drag-resize-rotate halus, doodle freehand, snap guides, autosave indicator).
- **Phase 3**: share link, PDF export, PWA install.
- **Phase 4**: wrap ke iOS/Android via Capacitor (cuma ganti `lib/platform/*`).

Detail lengkap: lihat [`PLAN.md`](./PLAN.md).

## Assets yang masih dibutuhkan

- `public/sounds/print.mp3` — sound printer ~1s
- `public/printer/*.png` — sprite printer body (opsional, sekarang CSS)
- `public/stickers/*.png` — sticker pack (sekarang emoji)
- `public/tapes/*.png` — washi tape (sekarang CSS gradient)
- `public/papers/*.jpg` — paper texture (sekarang CSS gradient)
- `public/covers/*.png` — journal cover (sekarang CSS gradient)
