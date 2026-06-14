"use client";

import { forwardRef } from "react";
import type { Template } from "@/types";

interface Props {
  photo: string;
  template: Template;
  width?: number;
  caption?: string;
}

export const Polaroid = forwardRef<HTMLDivElement, Props>(function Polaroid(
  { photo, template, width = 260, caption },
  ref
) {
  const innerWidth = width - 24;
  return (
    <div
      ref={ref}
      style={{
        width,
        background: template.backgroundColor,
        border: `${template.borderWidth}px solid ${template.borderColor}`,
        borderRadius: template.borderRadius ?? 2,
        padding: 12,
        paddingBottom: 36,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily:
          template.fontFamily === "mono"
            ? "monospace"
            : template.fontFamily === "serif"
            ? "var(--font-serif)"
            : "var(--font-hand)",
        color: template.textColor,
      }}
    >
      <img
        src={photo}
        alt=""
        style={{
          width: innerWidth,
          height: innerWidth,
          objectFit: "cover",
          borderRadius: template.photoBorderRadius ?? 2,
          display: "block",
        }}
      />
      <p style={{ marginTop: 12, fontSize: 18 }}>
        {caption ??
          (template.showDate
            ? new Date().toISOString().slice(0, 10).replace(/-/g, ".")
            : "")}
      </p>
    </div>
  );
});
