"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { TopBar } from "@/components/photobooth/TopBar";
import type { Format } from "@/types";

export default function FormatPicker() {
  const router = useRouter();
  const setFormat = usePhotoboothStore((s) => s.setFormat);

  const pick = (f: Format) => {
    setFormat(f);
    router.push("/photobooth/template");
  };

  return (
    <main className="relative min-h-dvh paper-noise">
      <TopBar back="/" title="Pilih Format" />
      <div className="mx-auto max-w-md px-6 pt-2">
        <p className="mb-6 text-center text-sm text-ink-500">
          mau strip foto atau polaroid?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FormatCard
            label="Photo Strip"
            sub="3 foto"
            onClick={() => pick("strip")}
            preview={<StripPreview />}
          />
          <FormatCard
            label="Polaroid"
            sub="1 foto"
            onClick={() => pick("polaroid")}
            preview={<PolaroidPreview />}
          />
        </div>
      </div>
    </main>
  );
}

function FormatCard({
  label,
  sub,
  onClick,
  preview,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  preview: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center rounded-2xl bg-white p-5 shadow-card"
    >
      <div className="flex h-40 w-full items-center justify-center">
        {preview}
      </div>
      <p className="mt-4 font-serif text-xl text-ink-900">{label}</p>
      <p className="text-xs text-ink-500">{sub}</p>
    </motion.button>
  );
}

function StripPreview() {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-36 w-16 flex-col justify-between rounded-md border-4 border-ink-900 bg-white p-1"
    >
      <div className="h-1/3 rounded-sm bg-pop-pink/40" />
      <div className="h-1/3 rounded-sm bg-pop-mint/40" />
      <div className="h-1/3 rounded-sm bg-pop-butter/40" />
    </motion.div>
  );
}

function PolaroidPreview() {
  return (
    <motion.div
      animate={{ rotate: [3, -3, 3] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="flex h-36 w-28 flex-col rounded-sm bg-white p-2 shadow-printout"
    >
      <div className="h-3/4 rounded-sm bg-gradient-to-br from-pop-sky/40 to-pop-pink/40" />
      <div className="mt-2 h-3 rounded-sm" />
    </motion.div>
  );
}

