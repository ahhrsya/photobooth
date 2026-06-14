"use client";

import { useEffect, useState } from "react";
import { CAMERA_FRAME } from "@/constants/cameraFrame";

// main-camera.png natural dimensions (612×408 → AR 1.5)
const IMG_AR = 612 / 408;

// START button bounds as % of the image (detected from pixel analysis)
const START = { top: 45.6, left: 81.5, width: 12.4, height: 14.2 };

export function CameraFrame({
  videoRef,
  facing,
  hasError,
  onStartClick,
  hideStart,
  selectMode,
  preShootOverlay,
  children,
}: {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  facing: "user" | "environment";
  hasError: boolean;
  onStartClick?: () => void;
  /** When true the START button is hidden */
  hideStart?: boolean;
  /** When true the live camera feed is replaced with a dark placeholder */
  selectMode?: boolean;
  /** Rendered inside the viewfinder area with pointer-events enabled */
  preShootOverlay?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [assetLoaded, setAssetLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAssetLoaded(true);
    img.onerror = () => setAssetLoaded(false);
    img.src = CAMERA_FRAME.src;
  }, []);

  // Full-bleed fallback when no asset
  if (assetLoaded === false || hasError) {
    return (
      <div className="absolute inset-0">
        <video
          ref={(el) => { videoRef.current = el; }}
          autoPlay playsInline muted
          className="h-full w-full object-cover"
          style={{
            transform: facing === "user" ? "scaleX(-1)" : "none",
            display: hasError ? "none" : undefined,
          }}
        />
        {children}
      </div>
    );
  }

  if (assetLoaded === null) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-black text-white/60">
        <p className="text-xs">memuat…</p>
      </div>
    );
  }

  const vf = CAMERA_FRAME.viewfinder;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {/*
        Container is sized to exactly match the image's aspect ratio.
        This ensures percentage-based video/button positioning is always correct.
        - Landscape viewport: fills full height, some width margin
        - Portrait viewport: fills full width, some height margin
      */}
      <div
        className="relative overflow-hidden"
        style={{
          width: `min(100vw, calc(100vh * ${IMG_AR}))`,
          height: `min(100vh, calc(100vw / ${IMG_AR}))`,
        }}
      >
        {/* Viewfinder: live feed in shoot mode, dark placeholder in select mode */}
        {selectMode ? (
          <div
            className="absolute"
            style={{
              top: vf.top,
              left: vf.left,
              width: vf.width,
              height: vf.height,
              background:
                "radial-gradient(ellipse at 50% 30%, #1c1c2e 0%, #0a0a0f 100%)",
              zIndex: 1,
            }}
          />
        ) : (
          <video
            ref={(el) => { videoRef.current = el; }}
            autoPlay playsInline muted
            className="absolute object-cover"
            style={{
              top: vf.top,
              left: vf.left,
              width: vf.width,
              height: vf.height,
              transform: facing === "user" ? "scaleX(-1)" : "none",
              zIndex: 1,
            }}
          />
        )}

        {/* Machine frame PNG — fills the container exactly (no distortion since AR matches) */}
        <img
          src={CAMERA_FRAME.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0"
          style={{ width: "100%", height: "100%", zIndex: 2 }}
        />

        {/* Interactive overlay inside the viewfinder (format/design picker) */}
        {preShootOverlay && (
          <div
            className="absolute overflow-hidden"
            style={{
              top: vf.top,
              left: vf.left,
              width: vf.width,
              height: vf.height,
              zIndex: 3,
            }}
          >
            {preShootOverlay}
          </div>
        )}

        {/* Invisible clickable overlay on the START button */}
        {onStartClick && !hideStart && (
          <button
            onClick={onStartClick}
            aria-label="Start capture"
            className="absolute cursor-pointer"
            style={{
              top: `${START.top}%`,
              left: `${START.left}%`,
              width: `${START.width}%`,
              height: `${START.height}%`,
              zIndex: 3,
              background: "transparent",
              border: "none",
              opacity: 0,
            }}
          />
        )}

        {/* HUD: countdown, flash, children — pointer-events-none so clicks reach the START button */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
