"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useJournalStore } from "@/store/useJournalStore";
import { getCoverById } from "@/constants/covers";

export default function JournalList() {
  const { journals, loadAll, isLoaded } = useJournalStore();

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <main className="relative min-h-dvh paper-noise">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur"
        >
          ←
        </Link>
        <h1 className="font-serif text-lg italic text-ink-900">Jurnalku</h1>
        <div className="w-9" />
      </header>

      <div className="mx-auto max-w-md px-6 pb-10">
        {!isLoaded ? (
          <p className="text-center text-sm text-ink-500">memuat...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Link href="/journal/new">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-500/30 bg-cream-50 text-ink-500"
              >
                <span className="text-3xl">＋</span>
                <span className="font-hand text-lg">jurnal baru</span>
              </motion.div>
            </Link>
            {journals.map((j) => {
              const cover = getCoverById(j.cover);
              return (
                <Link key={j.id} href={`/journal/${j.id}`}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative flex h-48 flex-col justify-end rounded-md p-3 shadow-card"
                    style={{
                      background: cover.background,
                      color: cover.textColor,
                    }}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-black/15" />
                    <p className="line-clamp-3 font-serif text-base italic leading-tight">
                      {j.title}
                    </p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {j.pages.length} halaman
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
