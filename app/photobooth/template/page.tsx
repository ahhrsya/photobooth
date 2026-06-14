"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TEMPLATES, getTemplateById } from "@/constants/templates";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { TopBar } from "@/components/photobooth/TopBar";

export default function TemplatePicker() {
  const router = useRouter();
  const { setTemplate, format } = usePhotoboothStore();
  const [selected, setSelected] = useState<string>(TEMPLATES[0].id);

  const onConfirm = () => {
    setTemplate(getTemplateById(selected));
    router.push("/photobooth/capture");
  };

  return (
    <main className="relative min-h-dvh paper-noise">
      <TopBar back="/photobooth/format" title="Pilih Template" />
      <div className="mx-auto max-w-md px-2 pt-2">
        <p className="mb-4 text-center text-sm text-ink-500">
          {format === "strip" ? "format: strip" : "format: polaroid"}
        </p>

        <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-8 scroll-no-bar">
          {TEMPLATES.map((t) => {
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className="shrink-0 snap-center"
              >
                <motion.div
                  animate={{
                    scale: active ? 1.06 : 0.92,
                    opacity: active ? 1 : 0.7,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 22,
                  }}
                  className="flex h-72 w-44 flex-col items-center rounded-2xl bg-white p-3 shadow-card"
                  style={{
                    outline: active ? "3px solid #FF6FA5" : "none",
                    outlineOffset: 4,
                  }}
                >
                  <div
                    className="flex flex-1 w-full flex-col justify-around p-2"
                    style={{
                      background: t.backgroundColor,
                      border: `${t.borderWidth}px solid ${t.borderColor}`,
                      borderRadius: t.borderRadius ?? 4,
                    }}
                  >
                    <div
                      className="h-10 rounded"
                      style={{
                        background:
                          "linear-gradient(135deg, #f4cccc, #cfe2f3)",
                      }}
                    />
                    <div
                      className="h-10 rounded"
                      style={{
                        background:
                          "linear-gradient(135deg, #d9ead3, #fff2cc)",
                      }}
                    />
                    <div
                      className="h-10 rounded"
                      style={{
                        background:
                          "linear-gradient(135deg, #ead1dc, #c9daf8)",
                      }}
                    />
                    {t.showDate && (
                      <p
                        className="mt-1 text-center text-[10px]"
                        style={{
                          color: t.textColor,
                          fontFamily:
                            t.fontFamily === "mono" ? "monospace" : undefined,
                        }}
                      >
                        2026.06.13
                      </p>
                    )}
                  </div>
                  <p className="mt-3 font-serif text-base text-ink-900">
                    {t.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500">
                    {t.tags.join(" · ")}
                  </p>
                </motion.div>
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-10">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="w-full rounded-2xl bg-ink-900 py-4 font-serif text-lg text-cream-50 shadow-card"
          >
            Pakai ini →
          </motion.button>
        </div>
      </div>
    </main>
  );
}
