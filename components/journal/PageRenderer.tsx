"use client";

import { forwardRef } from "react";
import type { JournalPage, PageItem } from "@/types";
import { getPaperById, PAPERS } from "@/constants/papers";
import { STICKERS } from "@/constants/stickers";
import { TAPES } from "@/constants/tapes";

const PAGE_W = 380;
const PAGE_H = 540;

interface Props {
  page: JournalPage;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onUpdate?: (id: string, patch: Partial<PageItem>) => void;
}

export const PageRenderer = forwardRef<HTMLDivElement, Props>(
  function PageRenderer({ page, editable, selectedId, onSelect, onUpdate }, ref) {
    // Resolve background CSS
    const bgPreset =
      PAPERS.find(
        (p) =>
          p.bg.type === page.background.type &&
          p.bg.value === page.background.value
      ) ?? getPaperById("cream");
    return (
      <div
        ref={ref}
        onMouseDown={(e) => {
          if (editable && e.target === e.currentTarget) onSelect?.(null);
        }}
        className="relative select-none"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          background: bgPreset.css,
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.06), 0 4px 14px -8px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {page.items.map((item) => (
          <PageItemView
            key={item.id}
            item={item}
            editable={!!editable}
            selected={selectedId === item.id}
            onSelect={() => onSelect?.(item.id)}
            onUpdate={(patch) => onUpdate?.(item.id, patch)}
          />
        ))}

        {page.items.length === 0 && editable && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-ink-500/60">
            <p className="font-hand text-2xl">tap tools di bawah ↓</p>
          </div>
        )}
      </div>
    );
  }
);

function PageItemView({
  item,
  editable,
  selected,
  onSelect,
  onUpdate,
}: {
  item: PageItem;
  editable: boolean;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<PageItem>) => void;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
    transformOrigin: "center",
    zIndex: item.zIndex,
    cursor: editable ? "grab" : "default",
    outline: selected ? "2px dashed #FF6FA5" : "none",
    outlineOffset: 6,
  };

  const onDragStart = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = item.x;
    const oy = item.y;
    const move = (ev: PointerEvent) => {
      onUpdate({ x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  switch (item.type) {
    case "photo":
      return (
        <div style={style} onPointerDown={onDragStart}>
          <div
            style={{
              width: item.width,
              height: item.height,
              padding: 8,
              background: "white",
              boxShadow: "0 6px 14px -6px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src={item.src}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      );
    case "text":
      return (
        <div
          style={{
            ...style,
            width: item.width,
            color: item.color,
            fontSize: item.size,
            fontFamily:
              item.font === "marker"
                ? "var(--font-hand)"
                : item.font === "serif"
                ? "var(--font-serif)"
                : "var(--font-hand)",
            lineHeight: 1.2,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          onPointerDown={onDragStart}
        >
          {item.text || "..."}
        </div>
      );
    case "sticker": {
      const s = STICKERS.find((x) => x.id === item.assetId);
      return (
        <div
          style={{ ...style, fontSize: item.width }}
          onPointerDown={onDragStart}
        >
          <span style={{ pointerEvents: "none" }}>{s?.emoji ?? "✨"}</span>
        </div>
      );
    }
    case "tape": {
      const t = TAPES.find((x) => x.id === item.assetId);
      return (
        <div
          style={{
            ...style,
            width: item.width,
            height: item.height,
            background: t?.css ?? "#FFB3DE",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            borderLeft: "1px dashed rgba(255,255,255,0.4)",
            borderRight: "1px dashed rgba(255,255,255,0.4)",
          }}
          onPointerDown={onDragStart}
        />
      );
    }
    case "doodle":
      return (
        <svg
          style={{ ...style, width: item.width, height: item.height }}
          viewBox={`0 0 ${item.width} ${item.height}`}
          onPointerDown={onDragStart}
        >
          {item.paths.map((p, i) => (
            <polyline
              key={i}
              points={p.points.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={p.color}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      );
  }
}

export { PAGE_W, PAGE_H };
