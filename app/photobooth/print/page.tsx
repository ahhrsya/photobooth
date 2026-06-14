"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { useJournalStore } from "@/store/useJournalStore";
import { getTemplateById } from "@/constants/templates";
import { OffscreenComposer } from "@/components/photobooth/OffscreenComposer";
import { PrinterSlot } from "@/components/photobooth/PrinterSlot";
import { downloadImage, shareImage } from "@/lib/platform/share";
import { vibrate } from "@/lib/platform/haptics";
import { nanoid } from "nanoid";
import Link from "next/link";

export default function PrintPage() {
  const router = useRouter();
  const { format, templateId, capturedPhotos, composedImage, setComposed, reset } =
    usePhotoboothStore();
  // Stable reference — otherwise OffscreenComposer re-runs forever and races.
  const template = useMemo(
    () => getTemplateById(templateId ?? "classic"),
    [templateId]
  );

  const [stage, setStage] = useState<"developing" | "printing" | "done">(
    "developing"
  );
  const [showJournalPicker, setShowJournalPicker] = useState(false);
  const controls = useAnimationControls();

  // Guard: no photos → bounce
  useEffect(() => {
    if (!capturedPhotos.length || !format) {
      router.replace("/photobooth/booth");
    }
  }, [capturedPhotos.length, format, router]);

  // Run print animation once composed.
  // setTimeout(0) defers past React's commit phase AND Framer Motion's
  // subscription setup — so controls.start() is guaranteed to have a
  // mounted motion component by the time it's called.
  useEffect(() => {
    if (!composedImage) return;
    if (stage !== "developing") return;
    const id = window.setTimeout(() => void runPrint(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composedImage]);

  const runPrint = async () => {
    setStage("printing");
    // Play sound (silently ignore if blocked)
    try {
      const audio = new Audio("/sounds/print.mp3");
      audio.volume = 0.7;
      void audio.play().catch(() => undefined);
    } catch {
      /* noop */
    }

    await controls.start({
      // Strip slides DOWN — clip is at 32% (below the panel separator),
      // so the strip emerges into the tray area from there.
      y: 100,
      rotate: 0,
      opacity: 1,
      transition: {
        y: { duration: 3.5, ease: [0.22, 1, 0.36, 1] },
        rotate: { duration: 1.8, delay: 0.3, ease: "easeOut" },
        opacity: { duration: 0.12 },
      },
    });

    // settle wobble
    await controls.start({
      y: [108, 96, 103, 100],
      transition: { duration: 0.5, times: [0, 0.4, 0.7, 1] },
    });

    vibrate(20);
    setStage("done");
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black">
      {/* Offscreen composer */}
      {!composedImage && capturedPhotos.length > 0 && (
        <OffscreenComposer
          format={format!}
          template={template}
          photos={capturedPhotos}
          onComposed={setComposed}
        />
      )}

      {/* Developing overlay */}
      {stage === "developing" && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/60">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="mt-4 font-hand text-2xl text-white">
              developing your photos...
            </p>
          </div>
        </div>
      )}

      <PrinterSlot />

      {/*
        Photo strip — z=10 puts it between the two machine layers:
        behind the top-portion overlay (z=20), in front of the background (z=1).
        Strip starts just below the slot and slides upward so it appears
        to be ejected from the "photo delivered here" opening.
      */}
      {composedImage && (
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center"
          style={{ zIndex: 10 }}
        >
          <motion.div
            drag={stage === "done"}
            dragElastic={0.15}
            dragConstraints={{ left: -30, right: 30, top: -20, bottom: 20 }}
            initial={{ y: -260, rotate: -1, opacity: 0 }}
            animate={controls}
            className="pointer-events-auto"
            style={{ willChange: "transform" }}
          >
            <img
              src={composedImage}
              alt="photo"
              className="block max-h-[60vh] w-auto rounded-sm"
              style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }}
            />
          </motion.div>
        </div>
      )}

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-30 mx-auto flex max-w-md items-center justify-between p-4">
        <Link
          href="/"
          className="rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur"
        >
          ←
        </Link>
        <p className="font-serif italic text-white drop-shadow">cetak foto</p>
        <div className="w-9" />
      </header>

      {/* Action bar */}
      {stage === "done" && composedImage && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="absolute inset-x-0 bottom-0 z-30 px-4 pb-6 pt-3"
        >
          <div className="mx-auto flex max-w-md flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <ActionButton
                onClick={() => downloadImage(composedImage, "photobooth.png")}
              >
                Simpan
              </ActionButton>
              <ActionButton
                onClick={() => shareImage(composedImage, "photobooth.png")}
              >
                Bagikan
              </ActionButton>
              <ActionButton
                primary
                onClick={() => setShowJournalPicker(true)}
              >
                + Jurnal
              </ActionButton>
            </div>
            <button
              onClick={() => {
                reset();
                router.push("/photobooth/booth");
              }}
              className="mt-1 py-2 text-center text-xs text-white/60 underline"
            >
              Foto lagi
            </button>
          </div>
        </motion.div>
      )}

      {showJournalPicker && composedImage && (
        <AddToJournalSheet
          dataUrl={composedImage}
          onClose={() => setShowJournalPicker(false)}
        />
      )}
    </main>
  );
}

function ActionButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-2xl py-3 text-sm shadow-card ${
        primary
          ? "bg-pop-pink text-white"
          : "bg-white text-ink-900"
      }`}
    >
      {children}
    </motion.button>
  );
}

function AddToJournalSheet({
  dataUrl,
  onClose,
}: {
  dataUrl: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { journals, loadAll, isLoaded, createJournal, addItem, addPage } =
    useJournalStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const sendToJournal = (journalId: string, mode: "last" | "new") => {
    const journal = useJournalStore.getState().journals.find(
      (j) => j.id === journalId
    );
    if (!journal) return;
    let pageId =
      mode === "last"
        ? journal.pages[journal.pages.length - 1].id
        : addPage(journalId);
    if (mode === "new") {
      // addPage already added; pick the newly created (last) page
      const fresh = useJournalStore
        .getState()
        .journals.find((j) => j.id === journalId);
      if (fresh) pageId = fresh.pages[fresh.pages.length - 1].id;
    }
    addItem(journalId, pageId, {
      type: "photo",
      id: nanoid(8),
      src: dataUrl,
      x: 80,
      y: 120,
      width: 220,
      height: 220,
      rotation: -4,
      scale: 1,
      zIndex: Date.now(),
    });
    router.push(`/journal/${journalId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-t-3xl bg-cream-50 p-5"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-ink-500/30" />
        <h3 className="mb-4 font-serif text-xl italic text-ink-900">
          Tambah ke jurnal
        </h3>

        {!isLoaded ? (
          <p className="text-sm text-ink-500">memuat...</p>
        ) : journals.length === 0 || creating ? (
          <CreateNewJournalForm
            onCreate={(title, cover) => {
              const j = createJournal(title, cover);
              sendToJournal(j.id, "last");
            }}
            onCancel={() => setCreating(false)}
            hasJournals={journals.length > 0}
          />
        ) : (
          <>
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {journals.map((j) => (
                <li key={j.id}>
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-page">
                    <p className="font-serif text-base text-ink-900">
                      {j.title}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => sendToJournal(j.id, "last")}
                        className="rounded-md bg-ink-900 px-3 py-1.5 text-xs text-cream-50"
                      >
                        halaman terakhir
                      </button>
                      <button
                        onClick={() => sendToJournal(j.id, "new")}
                        className="rounded-md bg-pop-pink px-3 py-1.5 text-xs text-white"
                      >
                        halaman baru
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setCreating(true)}
              className="mt-3 w-full rounded-xl border-2 border-dashed border-ink-500/40 py-3 text-sm text-ink-700"
            >
              + Jurnal baru
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-center text-xs text-ink-500 underline"
        >
          batal
        </button>
      </motion.div>
    </div>
  );
}

function CreateNewJournalForm({
  onCreate,
  onCancel,
  hasJournals,
}: {
  onCreate: (title: string, cover: string) => void;
  onCancel: () => void;
  hasJournals: boolean;
}) {
  const [title, setTitle] = useState("");
  return (
    <div>
      <input
        autoFocus
        placeholder="judul jurnal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3 w-full rounded-xl border border-ink-500/20 bg-white px-3 py-3 font-serif text-lg outline-none focus:border-pop-pink"
      />
      <button
        onClick={() => onCreate(title || "Untitled", "cream")}
        className="w-full rounded-xl bg-pop-pink py-3 text-sm text-white"
      >
        Buat & tambah foto
      </button>
      {hasJournals && (
        <button
          onClick={onCancel}
          className="mt-2 w-full py-1 text-center text-xs text-ink-500 underline"
        >
          batal
        </button>
      )}
    </div>
  );
}
