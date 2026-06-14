"use client";

import { forwardRef } from "react";
// react-pageflip has no proper types — import default
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import type { JournalPage } from "@/types";
import { PageRenderer, PAGE_W, PAGE_H } from "./PageRenderer";
import { getPaperById, PAPERS } from "@/constants/papers";
import { getCoverById } from "@/constants/covers";

interface Props {
  pages: JournalPage[];
  coverId: string;
  title: string;
  forwardedRef?: React.Ref<unknown>;
}

export const JournalBook = forwardRef<unknown, Props>(function JournalBook(
  { pages, coverId, title },
  ref
) {
  const cover = getCoverById(coverId);
  return (
    <div className="grid place-items-center">
      {/* @ts-expect-error react-pageflip types are partial */}
      <HTMLFlipBook
        ref={ref}
        width={PAGE_W}
        height={PAGE_H}
        size="fixed"
        showCover
        usePortrait
        drawShadow
        flippingTime={700}
        mobileScrollSupport
        maxShadowOpacity={0.4}
        className="shadow-2xl"
      >
        <div
          className="grid h-full w-full place-items-end p-6"
          style={{
            background: cover.background,
            color: cover.textColor,
            width: PAGE_W,
            height: PAGE_H,
          }}
        >
          <div className="text-left">
            <p className="font-hand text-xl opacity-80">jurnal</p>
            <p className="mt-1 font-serif text-3xl italic leading-tight">
              {title}
            </p>
          </div>
        </div>
        {pages.map((p) => {
          const bg = PAPERS.find(
            (x) =>
              x.bg.type === p.background.type &&
              x.bg.value === p.background.value
          ) ?? getPaperById("cream");
          return (
            <div key={p.id} style={{ background: bg.css, width: PAGE_W, height: PAGE_H }}>
              <PageRenderer page={p} />
            </div>
          );
        })}
        <div
          className="grid h-full w-full place-items-center p-6"
          style={{
            background: cover.background,
            color: cover.textColor,
            width: PAGE_W,
            height: PAGE_H,
          }}
        >
          <p className="font-hand text-xl opacity-80">— end —</p>
        </div>
      </HTMLFlipBook>
    </div>
  );
});
