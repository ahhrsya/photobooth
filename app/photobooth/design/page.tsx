"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATES, getTemplateById } from "@/constants/templates";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import type { Format, Template } from "@/types";

export default function DesignPage() {
  const router = useRouter();
  const { templateId, setFormat, setTemplate } = usePhotoboothStore();
  const [format, setLocalFormat] = useState<Format>("strip");
  const [designId, setDesignId] = useState<string>(templateId ?? TEMPLATES[0].id);

  const template = getTemplateById(designId);

  useEffect(() => {
    if (!templateId) {
      router.replace("/photobooth/booth");
    } else {
      setDesignId(templateId);
    }
  }, [templateId, router]);

  const onConfirm = () => {
    setTemplate(template);
    setFormat(format);
    router.push("/photobooth/capture");
  };

  return (
    <main
      className="relative min-h-dvh overflow-hidden transition-colors duration-500"
      style={{ background: template.backgroundColor }}
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-2">
        <button
          onClick={() => router.push("/photobooth/booth")}
          className="rounded-full px-3 py-1.5 text-sm"
          style={{
            background: `${template.borderColor}20`,
            color: template.textColor,
          }}
        >
          ←
        </button>
        <p
          className="mx-auto font-serif italic text-lg"
          style={{ color: template.textColor }}
        >
          atur hasil foto
        </p>
        <div className="w-9" />
      </div>

      <div className="px-5 pb-40 space-y-6 mt-2">
        {/* Section: Format */}
        <section>
          <Label template={template}>format</Label>
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: `2px solid ${template.borderColor}40` }}
          >
            {(["strip", "polaroid"] as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => setLocalFormat(f)}
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={
                  format === f
                    ? {
                        background: template.borderColor,
                        color: template.backgroundColor,
                      }
                    : { color: template.textColor, opacity: 0.5 }
                }
              >
                {f === "strip" ? "🎞 Photo Strip" : "🏷 Polaroid"}
              </button>
            ))}
          </div>
          <p
            className="mt-1.5 text-center text-xs"
            style={{ color: template.textColor, opacity: 0.4 }}
          >
            {format === "strip"
              ? "3 foto berurutan, cetak vertikal"
              : "1 foto, border putih bawah"}
          </p>
        </section>

        {/* Section: Design */}
        <section>
          <Label template={template}>desain</Label>
          <div className="flex gap-3 overflow-x-auto scroll-no-bar pb-1">
            {TEMPLATES.map((t) => (
              <DesignChip
                key={t.id}
                template={t}
                selected={designId === t.id}
                onSelect={() => setDesignId(t.id)}
              />
            ))}
          </div>
        </section>

        {/* Section: Preview */}
        <section>
          <Label template={template}>preview</Label>
          <div className="flex items-center justify-center py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${format}-${designId}`}
                initial={{ opacity: 0, scale: 0.86, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {format === "strip" ? (
                  <StripPreview template={template} />
                ) : (
                  <PolaroidPreview template={template} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* CTA */}
      <div
        className="fixed bottom-0 inset-x-0 px-6 pb-8 pt-6"
        style={{
          background: `linear-gradient(to top, ${template.backgroundColor} 60%, transparent)`,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className="w-full max-w-sm mx-auto block rounded-2xl py-4 font-serif text-lg shadow-xl"
          style={{
            background: template.borderColor,
            color: template.backgroundColor,
          }}
        >
          Mulai Foto →
        </motion.button>
      </div>
    </main>
  );
}

function Label({
  template,
  children,
}: {
  template: Template;
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-2"
      style={{ color: template.textColor, opacity: 0.45 }}
    >
      {children}
    </p>
  );
}

function DesignChip({
  template,
  selected,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onSelect}
      className="shrink-0 rounded-xl overflow-hidden transition-shadow"
      style={{
        width: 68,
        background: template.backgroundColor,
        border: selected
          ? `3px solid ${template.borderColor}`
          : `2px solid ${template.borderColor}40`,
        boxShadow: selected ? `0 0 14px ${template.borderColor}60` : undefined,
      }}
    >
      {/* Mini strip */}
      <div className="flex flex-col gap-1 p-1.5 h-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: `${template.borderColor}30` }}
          />
        ))}
      </div>
      <p
        className="pb-1.5 text-center text-[9px] font-medium"
        style={{ color: template.textColor }}
      >
        {template.name}
      </p>
    </motion.button>
  );
}

function StripPreview({ template }: { template: Template }) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  return (
    <motion.div
      animate={{ rotate: [-1, 1, -1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: 150,
        background: template.backgroundColor,
        border: `${template.borderWidth}px solid ${template.borderColor}`,
        borderRadius: template.borderRadius ?? 4,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: template.photoGap,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: template.photoBorderRadius ?? 2,
            background: `linear-gradient(135deg, ${template.borderColor}20, ${template.borderColor}08)`,
            border: `1px solid ${template.borderColor}20`,
          }}
        />
      ))}
      {template.showDate && (
        <p
          style={{
            textAlign: "center",
            fontSize: 9,
            color: template.textColor,
            letterSpacing: 1,
            marginTop: 4,
            fontFamily:
              template.fontFamily === "mono" ? "monospace" : undefined,
          }}
        >
          {date}
        </p>
      )}
    </motion.div>
  );
}

function PolaroidPreview({ template }: { template: Template }) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  return (
    <motion.div
      animate={{ rotate: [2, -2, 2] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: 170,
        background: template.backgroundColor,
        border: `${template.borderWidth}px solid ${template.borderColor}`,
        borderRadius: template.borderRadius ?? 2,
        padding: 10,
        paddingBottom: 32,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          height: 150,
          borderRadius: template.photoBorderRadius ?? 2,
          background: `linear-gradient(135deg, ${template.borderColor}20, ${template.borderColor}08)`,
          border: `1px solid ${template.borderColor}20`,
        }}
      />
      {template.showDate && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: template.textColor,
            letterSpacing: 1,
            fontFamily:
              template.fontFamily === "mono" ? "monospace" : undefined,
          }}
        >
          {date}
        </p>
      )}
    </motion.div>
  );
}
