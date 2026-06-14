"use client";

// generateStaticParams is required for dynamic routes with output: 'export'.
// Journal IDs are runtime-generated (stored in the browser), so we pre-render
// a single placeholder shell "__". Cloudflare Pages _redirects then rewrites
// /journal/[any-id] → /journal/__/ so useParams() gets the correct ID at runtime.
export function generateStaticParams() {
  return [{ id: "__" }];
}

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useJournalStore } from "@/store/useJournalStore";
import { PageRenderer, PAGE_W, PAGE_H } from "@/components/journal/PageRenderer";
import { EditToolbar } from "@/components/journal/EditToolbar";
import { getPaperById } from "@/constants/papers";
import type { PageItem } from "@/types";

// react-pageflip uses window — load client-only
const JournalBook = dynamic(
  () => import("@/components/journal/JournalBook").then((m) => m.JournalBook),
  { ssr: false }
);

export default function JournalView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    journals,
    loadAll,
    isLoaded,
    isEditMode,
    setEditMode,
    selectedItemId,
    setSelected,
    addItem,
    updateItem,
    removeItem,
    addPage,
    updatePageBackground,
  } = useJournalStore();

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const journal = useMemo(
    () => journals.find((j) => j.id === params.id),
    [journals, params.id]
  );

  const [editPageIndex, setEditPageIndex] = useState(0);

  if (!isLoaded) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="text-sm text-ink-500">memuat...</p>
      </main>
    );
  }
  if (!journal) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <p className="text-sm text-ink-500">Jurnal ga ketemu.</p>
          <Link
            href="/journal"
            className="mt-3 inline-block text-sm underline"
          >
            kembali
          </Link>
        </div>
      </main>
    );
  }

  const editingPage = journal.pages[editPageIndex] ?? journal.pages[0];

  return (
    <main className="relative min-h-dvh paper-noise">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link
          href="/journal"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="font-serif italic text-ink-900">{journal.title}</p>
          <p className="text-[10px] text-ink-500">
            {isEditMode
              ? `edit halaman ${editPageIndex + 1}/${journal.pages.length}`
              : `${journal.pages.length} halaman · swipe →`}
          </p>
        </div>
        <button
          onClick={() => setEditMode(!isEditMode)}
          className="rounded-full bg-white/70 px-3 py-1 text-sm backdrop-blur"
        >
          {isEditMode ? "selesai" : "✎"}
        </button>
      </header>

      {!isEditMode ? (
        <div className="grid place-items-center pt-4 pb-10">
          <JournalBook
            pages={journal.pages}
            coverId={journal.cover}
            title={journal.title}
          />
        </div>
      ) : (
        <EditView
          page={editingPage}
          pageIndex={editPageIndex}
          pageCount={journal.pages.length}
          journalId={journal.id}
          selectedItemId={selectedItemId}
          onSelect={setSelected}
          onUpdateItem={(id, patch) =>
            updateItem(journal.id, editingPage.id, id, patch)
          }
          onRemoveItem={(id) => removeItem(journal.id, editingPage.id, id)}
          onAddItem={(item: PageItem) =>
            addItem(journal.id, editingPage.id, item)
          }
          onPagePrev={() => setEditPageIndex((i) => Math.max(0, i - 1))}
          onPageNext={() =>
            setEditPageIndex((i) => Math.min(journal.pages.length - 1, i + 1))
          }
          onAddPage={() => {
            addPage(journal.id);
            setEditPageIndex(journal.pages.length); // new page index
          }}
          onChangePaper={(paperId) => {
            const p = getPaperById(paperId);
            updatePageBackground(journal.id, editingPage.id, p.bg);
          }}
        />
      )}

      {!isEditMode && (
        <p className="mx-auto max-w-md px-6 pb-10 text-center text-xs text-ink-500">
          Tap pojok kanan/kiri buku untuk flip halaman.
        </p>
      )}
    </main>
  );
}

function EditView({
  page,
  pageIndex,
  pageCount,
  journalId,
  selectedItemId,
  onSelect,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onPagePrev,
  onPageNext,
  onAddPage,
  onChangePaper,
}: {
  page: import("@/types").JournalPage;
  pageIndex: number;
  pageCount: number;
  journalId: string;
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateItem: (id: string, patch: Partial<PageItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: PageItem) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onAddPage: () => void;
  onChangePaper: (id: string) => void;
}) {
  return (
    <div className="pb-28">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 pb-2">
        <button
          onClick={onPagePrev}
          disabled={pageIndex === 0}
          className="rounded-full bg-white px-3 py-1 text-sm shadow-page disabled:opacity-40"
        >
          ← prev
        </button>
        <p className="text-xs text-ink-500">
          halaman {pageIndex + 1} / {pageCount}
        </p>
        <button
          onClick={onPageNext}
          disabled={pageIndex === pageCount - 1}
          className="rounded-full bg-white px-3 py-1 text-sm shadow-page disabled:opacity-40"
        >
          next →
        </button>
      </div>

      <div className="grid place-items-center pt-2">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <PageRenderer
            page={page}
            editable
            selectedId={selectedItemId}
            onSelect={onSelect}
            onUpdate={(id, patch) => onUpdateItem(id, patch)}
          />
        </motion.div>
      </div>

      {selectedItemId && (
        <div className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2">
          <button
            onClick={() => {
              const it = page.items.find((x) => x.id === selectedItemId);
              if (!it) return;
              onUpdateItem(selectedItemId, { rotation: it.rotation - 10 });
            }}
            className="rounded-full bg-white px-3 py-1 text-xs shadow-page"
          >
            ↺ putar
          </button>
          <button
            onClick={() => {
              const it = page.items.find((x) => x.id === selectedItemId);
              if (!it) return;
              onUpdateItem(selectedItemId, {
                scale: Math.min(2, it.scale + 0.1),
              });
            }}
            className="rounded-full bg-white px-3 py-1 text-xs shadow-page"
          >
            ＋ besar
          </button>
          <button
            onClick={() => {
              const it = page.items.find((x) => x.id === selectedItemId);
              if (!it) return;
              onUpdateItem(selectedItemId, {
                scale: Math.max(0.4, it.scale - 0.1),
              });
            }}
            className="rounded-full bg-white px-3 py-1 text-xs shadow-page"
          >
            － kecil
          </button>
          <button
            onClick={() => {
              onRemoveItem(selectedItemId);
              onSelect(null);
            }}
            className="rounded-full bg-pop-coral px-3 py-1 text-xs text-white shadow-page"
          >
            hapus
          </button>
        </div>
      )}

      <EditToolbar
        onAdd={onAddItem}
        onChangePaper={onChangePaper}
        onAddPage={onAddPage}
        centerPos={{ x: PAGE_W / 2, y: PAGE_H / 2 }}
      />
    </div>
  );
}
