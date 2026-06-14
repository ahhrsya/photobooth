"use client";

import { forwardRef } from "react";
import type { Template } from "@/types";

interface Props {
  photos: string[];
  template: Template;
  width?: number;
}

export const PhotoStrip = forwardRef<HTMLDivElement, Props>(function PhotoStrip(
  { photos, template, width = 280 },
  ref
) {
  const slotSize = (width - template.borderWidth * 2) - 8;
  return (
    <div
      ref={ref}
      style={{
        width,
        background: template.backgroundColor,
        border: `${template.borderWidth}px solid ${template.borderColor}`,
        borderRadius: template.borderRadius ?? 4,
        padding: 8,
        gap: template.photoGap,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily:
          template.fontFamily === "mono"
            ? "monospace"
            : template.fontFamily === "serif"
            ? "var(--font-serif)"
            : undefined,
        color: template.textColor,
      }}
    >
      {photos.slice(0, 3).map((p, i) => (
        <img
          key={i}
          src={p}
          alt=""
          style={{
            width: slotSize,
            height: slotSize,
            objectFit: "cover",
            borderRadius: template.photoBorderRadius ?? 2,
            display: "block",
          }}
        />
      ))}
      {template.showDate && (
        <p style={{ fontSize: 11, letterSpacing: 1, marginTop: 4 }}>
          {new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, ".")}
        </p>
      )}
    </div>
  );
});
