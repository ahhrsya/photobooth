"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import type { PageItem } from "@/types";
import { STICKERS } from "@/constants/stickers";
import { TAPES } from "@/constants/tapes";
import { PAPERS } from "@/constants/papers";

type Tab = "photo" | "text" | "sticker" | "tape" | "paper" | null;

interface Props {
  onAdd: (item: PageItem) => void;
  onChangePaper: (bgId: string) => void;
  onAddPage: () => void;
  centerPos: { x: number; y: number };
}

export function EditToolbar({ onAdd, onChangePaper, onAddPage, centerPos }: Props) {
  const [tab, setTab] = useState<Tab>(null);

  const close = () => setTab(null);

  return (
    <>
      <AnimatePresence>
        {tab !== null && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed inset-x-0 bottom-16 z-40 mx-auto max-h-[40vh] max-w-md overflow-y-auto rounded-t-3xl bg-cream-50 p-4 shadow-2xl"
          >
            {tab === "photo" && (
              <PhotoUploadPanel
                onAdd={(src, w, h) => {
                  onAdd({
                    type: "photo",
                    id: nanoid(8),
                    src,
                    width: w,
                    height: h,
                    x: centerPos.x - w / 2,
                    y: centerPos.y - h / 2,
                    rotation: -3,
                    scale: 1,
                    zIndex: Date.now(),
                  });
                  close();
                }}
              />
            )}
            {tab === "text" && (
              <TextPanel
                onAdd={(text, color, size) => {
                  onAdd({
                    type: "text",
                    id: nanoid(8),
                    text,
                    color,
                    size,
                    font: "marker",
                    width: 200,
                    x: centerPos.x - 100,
                    y: centerPos.y - size / 2,
                    rotation: 0,
                    scale: 1,
                    zIndex: Date.now(),
                  });
                  close();
                }}
              />
            )}
            {tab === "sticker" && (
              <StickerPanel
                onAdd={(id) => {
                  onAdd({
                    type: "sticker",
                    id: nanoid(8),
                    assetId: id,
                    width: 48,
                    height: 48,
                    x: centerPos.x - 24,
                    y: centerPos.y - 24,
                    rotation: 0,
                    scale: 1,
                    zIndex: Date.now(),
                  });
                  close();
                }}
              />
            )}
            {tab === "tape" && (
              <TapePanel
                onAdd={(id) => {
                  onAdd({
                    type: "tape",
                    id: nanoid(8),
                    assetId: id,
                    width: 140,
                    height: 28,
                    x: centerPos.x - 70,
                    y: centerPos.y - 14,
                    rotation: -10,
                    scale: 1,
                    zIndex: Date.now(),
                  });
                  close();
                }}
              />
            )}
            {tab === "paper" && (
              <PaperPanel
                onChoose={(id) => {
                  onChangePaper(id);
                  close();
                }}
                onAddPage={() => {
                  onAddPage();
                  close();
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-500/15 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          <TabButton emoji="📷" label="Foto" onClick={() => setTab(tab === "photo" ? null : "photo")} active={tab === "photo"} />
          <TabButton emoji="✍️" label="Tulis" onClick={() => setTab(tab === "text" ? null : "text")} active={tab === "text"} />
          <TabButton emoji="✨" label="Stiker" onClick={() => setTab(tab === "sticker" ? null : "sticker")} active={tab === "sticker"} />
          <TabButton emoji="🩹" label="Tape" onClick={() => setTab(tab === "tape" ? null : "tape")} active={tab === "tape"} />
          <TabButton emoji="📄" label="Kertas" onClick={() => setTab(tab === "paper" ? null : "paper")} active={tab === "paper"} />
        </div>
      </nav>
    </>
  );
}

function TabButton({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${
        active ? "text-pop-pink" : "text-ink-700"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function PhotoUploadPanel({
  onAdd,
}: {
  onAdd: (src: string, w: number, h: number) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg italic">Tambah foto</h3>
      <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-500/30 bg-white text-sm text-ink-500">
        <span>tap untuk upload</span>
        <span className="mt-1 text-xs">atau ambil dari hasil photobooth</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const img = new Image();
              img.onload = () => {
                const max = 240;
                const ratio = img.width / img.height;
                const w = ratio >= 1 ? max : max * ratio;
                const h = ratio >= 1 ? max / ratio : max;
                onAdd(dataUrl, w, h);
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          }}
        />
      </label>
    </div>
  );
}

function TextPanel({
  onAdd,
}: {
  onAdd: (text: string, color: string, size: number) => void;
}) {
  const [t, setT] = useState("");
  const [c, setC] = useState("#1A1410");
  const [s, setS] = useState(28);
  const palette = ["#1A1410", "#FF6FA5", "#4A6FA5", "#6B8E5A", "#C9A84C", "#8B3A3A"];
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg italic">Tulis sesuatu</h3>
      <textarea
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="ketik di sini..."
        rows={3}
        className="w-full rounded-xl border border-ink-500/20 bg-white p-3 font-hand text-xl outline-none focus:border-pop-pink"
        style={{ color: c }}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          {palette.map((col) => (
            <button
              key={col}
              onClick={() => setC(col)}
              className="h-7 w-7 rounded-full border-2"
              style={{
                background: col,
                borderColor: c === col ? "#FF6FA5" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-700">
          ukuran
          <input
            type="range"
            min={14}
            max={56}
            value={s}
            onChange={(e) => setS(Number(e.target.value))}
          />
        </div>
      </div>
      <button
        onClick={() => onAdd(t || "...", c, s)}
        className="mt-3 w-full rounded-xl bg-pop-pink py-3 text-sm text-white"
      >
        Tempel di halaman
      </button>
    </div>
  );
}

function StickerPanel({ onAdd }: { onAdd: (id: string) => void }) {
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg italic">Pilih stiker</h3>
      <div className="grid grid-cols-6 gap-2">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            onClick={() => onAdd(s.id)}
            className="aspect-square rounded-lg bg-white text-2xl shadow-page"
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function TapePanel({ onAdd }: { onAdd: (id: string) => void }) {
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg italic">Pilih washi tape</h3>
      <div className="grid grid-cols-2 gap-3">
        {TAPES.map((t) => (
          <button
            key={t.id}
            onClick={() => onAdd(t.id)}
            className="h-10 rounded-md shadow-page"
            style={{ background: t.css }}
          />
        ))}
      </div>
    </div>
  );
}

function PaperPanel({
  onChoose,
  onAddPage,
}: {
  onChoose: (id: string) => void;
  onAddPage: () => void;
}) {
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg italic">Ganti kertas</h3>
      <div className="grid grid-cols-4 gap-2">
        {PAPERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChoose(p.id)}
            className="aspect-square rounded-md shadow-page"
            style={{ background: p.css }}
            title={p.name}
          />
        ))}
      </div>
      <button
        onClick={onAddPage}
        className="mt-4 w-full rounded-xl bg-ink-900 py-3 text-sm text-cream-50"
      >
        + Halaman baru
      </button>
    </div>
  );
}
