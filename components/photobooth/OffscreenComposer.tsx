"use client";

import { useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { PhotoStrip } from "./PhotoStrip";
import { Polaroid } from "./Polaroid";
import type { Format, Template } from "@/types";

interface Props {
  format: Format;
  template: Template;
  photos: string[];
  onComposed: (dataUrl: string) => void;
}

const PNG_OPTS = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "transparent",
  // Skip cross-origin CSS font embedding — avoids SecurityError on cssRules.
  // Fonts already applied to the DOM are rendered correctly by the canvas engine.
  fontEmbedCSS: " ",
} as const;

async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
  // Wait two frames so layout fully settles.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

export function OffscreenComposer({
  format,
  template,
  photos,
  onComposed,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let ran = false;

    const run = async () => {
      if (!ref.current || ran) return;
      ran = true;

      await waitForImages(ref.current);
      if (!ref.current || !mounted) return;

      // html-to-image has a known issue where the first call may produce a
      // blank/partial result due to font loading timing. The second call
      // reliably produces the correct image. We discard the first result.
      try { await toPng(ref.current, PNG_OPTS); } catch { /* warm-up */ }

      if (!ref.current || !mounted) return;

      try {
        const dataUrl = await toPng(ref.current, PNG_OPTS);
        if (mounted) onComposed(dataUrl);
      } catch (e) {
        console.error("compose failed", e);
      }
    };

    void run();
    return () => { mounted = false; };
    // Deliberately exclude `template` object identity — caller memoizes it.
  }, [format, photos, onComposed]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: "-9999px",
        pointerEvents: "none",
        // No opacity or visibility changes — element must be FULLY rendered
        // for html-to-image to capture non-blank content.
        // It's off-screen so the user never sees it.
      }}
    >
      <div ref={ref}>
        {format === "polaroid" ? (
          <Polaroid photo={photos[0] ?? ""} template={template} />
        ) : (
          <PhotoStrip photos={photos} template={template} />
        )}
      </div>
    </div>
  );
}
