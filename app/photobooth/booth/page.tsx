"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATES } from "@/constants/templates";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import type { Template } from "@/types";

export default function BoothPage() {
  const router = useRouter();
  const { setTemplate } = usePhotoboothStore();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected);

  const onSelect = (t: Template) => {
    setSelected(t.id);
    setTemplate(t);
  };

  return (
    <main className="relative min-h-dvh bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-2">
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
        >
          ←
        </button>
        <p className="mx-auto font-serif italic text-white/90 text-lg">
          pilih bilik foto
        </p>
        <div className="w-9" />
      </div>

      <p className="text-center text-xs text-white/30 mb-4">
        geser untuk lihat semua booth
      </p>

      {/* Horizontal booth scroll */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-6 scroll-no-bar">
        {TEMPLATES.map((t, i) => (
          <BoothCard
            key={t.id}
            template={t}
            index={i}
            selected={selected === t.id}
            onSelect={() => onSelect(t)}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 inset-x-0 px-6 pb-8 pt-4 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
        <AnimatePresence mode="wait">
          {selectedTemplate ? (
            <motion.button
              key="enter"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/photobooth/capture")}
              className="w-full max-w-sm mx-auto block rounded-2xl py-4 font-serif text-lg shadow-xl"
              style={{
                background: selectedTemplate.backgroundColor,
                color: selectedTemplate.textColor,
                border: `3px solid ${selectedTemplate.borderColor}`,
              }}
            >
              Masuk {selectedTemplate.name} Booth →
            </motion.button>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/35 text-sm py-4"
            >
              tap salah satu booth untuk mulai
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function BoothCard({
  template,
  selected,
  index,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 220, damping: 22 }}
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      className="relative shrink-0 snap-center rounded-2xl overflow-hidden flex flex-col"
      style={{
        width: 190,
        background: template.backgroundColor,
        border: selected
          ? `3px solid ${template.borderColor}`
          : `2px solid ${template.borderColor}45`,
        boxShadow: selected
          ? `0 0 28px ${template.borderColor}70, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 4px 20px rgba(0,0,0,0.35)",
      }}
    >
      {/* Strip preview */}
      <div
        className="flex flex-col gap-2 p-4 flex-1"
        style={{
          border: `${Math.max(template.borderWidth - 2, 2)}px solid ${template.borderColor}40`,
          margin: 6,
          borderRadius: template.borderRadius ?? 4,
          background: `${template.backgroundColor}`,
          minHeight: 200,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 rounded"
            style={{
              background: `linear-gradient(135deg, ${template.borderColor}22, ${template.borderColor}0a)`,
              border: `1px solid ${template.borderColor}25`,
              borderRadius: template.photoBorderRadius ?? 2,
            }}
          />
        ))}
        {template.showDate && (
          <p
            className="text-center text-[9px] tracking-widest mt-1"
            style={{
              color: template.textColor,
              fontFamily: template.fontFamily === "mono" ? "monospace" : undefined,
              opacity: 0.8,
            }}
          >
            2026.06.13
          </p>
        )}
      </div>

      {/* Label */}
      <div
        className="px-4 py-3"
        style={{ borderTop: `1px solid ${template.borderColor}30` }}
      >
        <p
          className="font-serif text-lg text-left"
          style={{ color: template.textColor }}
        >
          {template.name}
        </p>
        <p
          className="text-[10px] uppercase tracking-wider text-left"
          style={{ color: template.textColor, opacity: 0.5 }}
        >
          {template.tags.join(" · ")}
        </p>
      </div>

      {/* Selected check */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full grid place-items-center text-xs font-bold"
            style={{
              background: template.borderColor,
              color: template.backgroundColor,
            }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
