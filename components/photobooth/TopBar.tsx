"use client";

import Link from "next/link";

export function TopBar({
  back,
  title,
  right,
}: {
  back: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
      <Link
        href={back}
        className="grid h-9 w-9 place-items-center rounded-full bg-white/70 backdrop-blur"
      >
        ←
      </Link>
      <h1 className="font-serif text-lg italic text-ink-900">{title}</h1>
      <div className="h-9 w-9">{right}</div>
    </header>
  );
}
