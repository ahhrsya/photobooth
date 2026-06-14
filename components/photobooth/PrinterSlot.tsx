"use client";

import { useEffect, useState } from "react";

// print.png natural dimensions & slot position
const PRINT_AR = 1672 / 941; // ≈ 1.777
// Pixel analysis of print.png:
//   y=19–21% → slot slit (thin dark opening in the panel)
//   y=29–31% → pitch-black separator band = the BLACK SLOT visible on screen
//   y=32%+   → lighter machine body below
//   y=42%+   → tray interior
// Clip at the TOP of the black slot (29%) so the strip appears to emerge FROM it.
const SLOT_Y = 0.29;

/**
 * Computes the slot's Y position as a % of the viewport height,
 * accounting for how print.png renders with object-contain.
 */
function useSlotClipPct() {
  const [pct, setPct] = useState(SLOT_Y * 100);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const containerAR = vw / vh;

      // object-contain: image fills whichever axis constrains first
      let renderedH: number, offsetY: number;
      if (PRINT_AR > containerAR) {
        // image wider → constrained by width, bars top & bottom
        renderedH = vw / PRINT_AR;
        offsetY = (vh - renderedH) / 2;
      } else {
        // image taller or equal → constrained by height, no vertical bars
        renderedH = vh;
        offsetY = 0;
      }

      const slotPx = offsetY + renderedH * SLOT_Y;
      setPct((slotPx / vh) * 100);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return pct;
}

/**
 * Three-layer machine frame for the print page:
 *
 *  Layer 1 (z=1):  Full print.png as background — visible below the slot
 *  Layer 2 (z=10): Photo strip lives here (defined in print/page.tsx)
 *  Layer 3 (z=20): print.png clipped to the TOP portion (above the slot)
 *                  This masks the strip below the slot, creating the
 *                  "photo coming out of the slot" illusion.
 */
export function PrinterSlot() {
  const slotPct = useSlotClipPct();

  return (
    <>
      {/* Background layer — full machine */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
        <img
          src="/print.png"
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Foreground layer — machine top portion only (clips below the slot) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 20,
          clipPath: `polygon(0 0, 100% 0, 100% ${slotPct}%, 0 ${slotPct}%)`,
        }}
      >
        <img
          src="/print.png"
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
        />
      </div>
    </>
  );
}
