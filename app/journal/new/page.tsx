"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { COVERS } from "@/constants/covers";
import { useJournalStore } from "@/store/useJournalStore";

export default function NewJournal() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState(COVERS[0].id);
  const createJournal = useJournalStore((s) => s.createJournal);

  const create = () => {
    const j = createJournal(title || "Untitled", cover);
    router.push(`/journal/${j.id}`);
  };

  return (
    <main className="relative min-h-dvh paper-noise">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
        <Link
          href="/journal"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur"
        >
          ←
        </Link>
        <h1 className="font-serif text-lg italic text-ink-900">Jurnal baru</h1>
        <div className="w-9" />
      </header>

      <div className="mx-auto max-w-md px-6 pb-10">
        <label className="mb-2 mt-2 block text-sm text-ink-500">
          Judul jurnal
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Liburan, kenangan, doodle…"
          className="w-full rounded-xl border border-ink-500/20 bg-white px-4 py-3 font-serif text-lg italic outline-none focus:border-pop-pink"
        />

        <label className="mb-2 mt-6 block text-sm text-ink-500">
          Pilih cover
        </label>
        <div className="grid grid-cols-4 gap-3">
          {COVERS.map((c) => {
            const active = cover === c.id;
            return (
              <button key={c.id} onClick={() => setCover(c.id)}>
                <div
                  className="relative h-24 w-full rounded-md shadow-page"
                  style={{
                    background: c.background,
                    outline: active ? "3px solid #FF6FA5" : "none",
                    outlineOffset: 2,
                  }}
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-black/15" />
                </div>
                <p className="mt-1 text-center text-[10px] text-ink-500">
                  {c.name}
                </p>
              </button>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={create}
          className="mt-8 w-full rounded-2xl bg-ink-900 py-4 font-serif text-lg text-cream-50 shadow-card"
        >
          Buat jurnal →
        </motion.button>
      </div>
    </main>
  );
}
