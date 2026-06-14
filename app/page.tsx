"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useJournalStore } from "@/store/useJournalStore";
import { getCoverById } from "@/constants/covers";

export default function MainMenu() {
  const { journals, loadAll, isLoaded } = useJournalStore();

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const recent = journals.slice(0, 3);

  return (
    <main className="relative min-h-dvh overflow-hidden paper-noise">
      {/* Floating doodles in background */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute left-6 top-8 text-3xl opacity-60">✿</span>
        <span className="absolute right-10 top-20 text-2xl opacity-50">✦</span>
        <span className="absolute left-12 bottom-24 text-2xl opacity-40">♡</span>
        <span className="absolute right-8 bottom-10 text-3xl opacity-50">✧</span>
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-10">
        <header className="mb-8 text-center">
          <p className="font-hand text-3xl text-ink-700">welcome back</p>
          <h1 className="mt-1 font-serif text-5xl italic tracking-tight text-ink-900">
            photobooth
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            ambil foto, simpan kenangan
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <MenuCard
            href="/photobooth/booth"
            title="Mulai Foto"
            sub="strip / polaroid + cetak animasi"
            emoji="📸"
            gradient="linear-gradient(135deg, #FFD972 0%, #FF8A65 100%)"
          />
          <MenuCard
            href="/journal"
            title="Buka Jurnal"
            sub="tempel foto, tulis, dekor halamanmu"
            emoji="📖"
            gradient="linear-gradient(135deg, #FFB3DE 0%, #FF6FA5 100%)"
          />
        </div>

        {isLoaded && recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-hand text-2xl text-ink-700">
              jurnal terakhir
            </h2>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 scroll-no-bar">
              {recent.map((j) => {
                const cover = getCoverById(j.cover);
                return (
                  <Link
                    key={j.id}
                    href={`/journal/view?id=${j.id}`}
                    className="shrink-0"
                  >
                    <div
                      className="flex h-32 w-24 flex-col justify-end rounded-md p-2 shadow-card"
                      style={{
                        background: cover.background,
                        color: cover.textColor,
                      }}
                    >
                      <p className="line-clamp-2 font-hand text-sm leading-tight">
                        {j.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-auto pt-10 text-center text-xs text-ink-500">
          dibuat dengan ♡ — v0.2
        </footer>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  title,
  sub,
  emoji,
  gradient,
}: {
  href: string;
  title: string;
  sub: string;
  emoji: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative flex h-32 items-center gap-4 rounded-2xl p-5 shadow-card"
        style={{ background: gradient }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/35 text-3xl backdrop-blur">
          {emoji}
        </div>
        <div className="text-left">
          <p className="font-serif text-2xl text-white drop-shadow-sm">
            {title}
          </p>
          <p className="text-sm text-white/85">{sub}</p>
        </div>
        <span className="absolute right-5 text-white/80">→</span>
      </motion.div>
    </Link>
  );
}
