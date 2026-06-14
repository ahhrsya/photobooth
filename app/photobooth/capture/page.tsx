"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { openCamera, captureVideoFrame } from "@/lib/platform/camera";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { CameraFrame } from "@/components/photobooth/CameraFrame";
import { TEMPLATES, getTemplateById } from "@/constants/templates";
import type { Format, Template } from "@/types";

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const { templateId, setPhotos, setFormat, setTemplate, setComposed } =
    usePhotoboothStore();

  // Local pre-shoot selections — committed to store when START is pressed.
  // Always start with "strip" so stale sessionStorage never overrides the UI.
  const [localFormat, setLocalFormat] = useState<Format>("strip");
  const [localDesignId, setLocalDesignId] = useState<string>(templateId ?? TEMPLATES[0].id);

  // Clear any leftover composed image from a previous session on mount.
  useEffect(() => {
    setComposed(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "select" = format/design overlay active; "shoot" = camera ready for START
  const [mode, setMode] = useState<"select" | "shoot">("select");

  const target = localFormat === "polaroid" ? 1 : 3;

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [photos, setLocalPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera only opens once user confirms selection (shoot mode).
  useEffect(() => {
    if (mode !== "shoot") return;
    let cancelled = false;
    (async () => {
      try {
        const cam = await openCamera(facing);
        if (cancelled) { cam.stop(); return; }
        stopRef.current = cam.stop;
        if (videoRef.current) {
          videoRef.current.srcObject = cam.stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (e) {
        const err = e as Error;
        setError(err.message || "Tidak bisa akses kamera");
      }
    })();
    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [facing, mode]);

  const confirmSelection = () => {
    setFormat(localFormat);
    setTemplate(getTemplateById(localDesignId));
    setMode("shoot");
  };

  const runSession = async () => {
    if (busy || !!error) return;
    setBusy(true);
    const collected: string[] = [];
    for (let i = 0; i < target; i++) {
      await sleep(150);
      for (let n = 3; n > 0; n--) {
        setCountdown(n);
        await sleep(900);
      }
      setCountdown(null);
      setFlash(true);
      await sleep(40);
      if (videoRef.current) {
        const data = captureVideoFrame(videoRef.current, 1024);
        collected.push(data);
        setLocalPhotos([...collected]);
      }
      setFlash(false);
      if (i < target - 1) await sleep(1100);
    }
    setBusy(false);
    setPhotos(collected);
    router.push("/photobooth/print");
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      {error ? (
        <div className="absolute inset-0">
          <ErrorScreen msg={error} />
        </div>
      ) : (
        <CameraFrame
          videoRef={videoRef}
          facing={facing}
          hasError={!!error}
          selectMode={mode === "select"}
          onStartClick={mode === "shoot" ? runSession : undefined}
          hideStart={mode === "select"}
          preShootOverlay={
            mode === "select" ? (
              <SelectionOverlay
                localFormat={localFormat}
                localDesignId={localDesignId}
                onFormatChange={setLocalFormat}
                onDesignChange={setLocalDesignId}
                onConfirm={confirmSelection}
              />
            ) : undefined
          }
        >
          {/* Countdown */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
                style={{ zIndex: 10 }}
              >
                <span className="font-serif text-[10rem] italic text-white drop-shadow-lg">
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 bg-white"
                style={{ zIndex: 20 }}
              />
            )}
          </AnimatePresence>
        </CameraFrame>
      )}

      {/* Top HUD — sits above everything */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-black/50 px-3 py-1 text-sm backdrop-blur"
        >
          ←
        </button>
        <div className="rounded-full bg-black/50 px-3 py-1 text-sm backdrop-blur">
          {busy
            ? "ambil foto..."
            : target > 1
            ? `${photos.length} / ${target}`
            : "polaroid"}
        </div>
        <button
          onClick={() => setFacing((p) => (p === "user" ? "environment" : "user"))}
          className="rounded-full bg-black/50 px-3 py-1 text-sm backdrop-blur"
        >
          ↺
        </button>
      </div>

      {/* Thumbnail strip — visible while/after shooting */}
      {target > 1 && photos.length > 0 && (
        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {Array.from({ length: target }).map((_, i) => {
            const p = photos[i];
            return (
              <div
                key={i}
                className="h-12 w-12 overflow-hidden rounded-md border-2 border-white/70 bg-white/10"
              >
                {p && <img src={p} alt="" className="h-full w-full object-cover" />}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function SelectionOverlay({
  localFormat,
  localDesignId,
  onFormatChange,
  onDesignChange,
  onConfirm,
}: {
  localFormat: Format;
  localDesignId: string;
  onFormatChange: (f: Format) => void;
  onDesignChange: (id: string) => void;
  onConfirm: () => void;
}) {
  const activeTemplate = getTemplateById(localDesignId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, rgba(10,10,20,0.94) 0%, rgba(18,18,32,0.96) 100%)",
        backdropFilter: "blur(10px)",
        padding: "clamp(8px, 2%, 16px)",
        gap: "clamp(6px, 1.5%, 12px)",
      }}
    >
      {/* Title */}
      <p
        className="text-center font-serif italic shrink-0"
        style={{
          color: activeTemplate.borderColor,
          fontSize: "clamp(11px, 1.8vh, 16px)",
          letterSpacing: "0.02em",
          textShadow: `0 0 20px ${activeTemplate.borderColor}60`,
        }}
      >
        ✦ atur hasil foto ✦
      </p>

      {/* Format cards */}
      <div className="flex gap-2 flex-1 min-h-0">
        {(["strip", "polaroid"] as Format[]).map((f) => {
          const selected = localFormat === f;
          return (
            <motion.button
              key={f}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onFormatChange(f)}
              className="flex-1 flex flex-col items-center justify-between rounded-xl overflow-hidden relative"
              style={{
                background: selected
                  ? `${activeTemplate.borderColor}18`
                  : "rgba(255,255,255,0.04)",
                border: selected
                  ? `2px solid ${activeTemplate.borderColor}`
                  : "1.5px solid rgba(255,255,255,0.1)",
                boxShadow: selected
                  ? `0 0 20px ${activeTemplate.borderColor}40, inset 0 0 30px ${activeTemplate.borderColor}08`
                  : undefined,
                padding: "clamp(6px, 1.5%, 12px)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Visual preview */}
              <div className="flex-1 w-full flex items-center justify-center min-h-0 py-1">
                {f === "strip" ? (
                  <div
                    className="flex flex-col gap-1 rounded"
                    style={{
                      width: "clamp(28px, 5vw, 48px)",
                      padding: 4,
                      background: activeTemplate.backgroundColor,
                      border: `1.5px solid ${activeTemplate.borderColor}60`,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          height: "clamp(10px, 2vh, 18px)",
                          background: selected
                            ? `${activeTemplate.borderColor}40`
                            : "rgba(255,255,255,0.1)",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col rounded"
                    style={{
                      width: "clamp(32px, 5.5vw, 54px)",
                      padding: 4,
                      paddingBottom: 10,
                      background: activeTemplate.backgroundColor,
                      border: `1.5px solid ${activeTemplate.borderColor}60`,
                    }}
                  >
                    <div
                      className="rounded-sm"
                      style={{
                        height: "clamp(22px, 4vh, 40px)",
                        background: selected
                          ? `${activeTemplate.borderColor}40`
                          : "rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="shrink-0 text-center">
                <p
                  className="font-semibold"
                  style={{
                    fontSize: "clamp(9px, 1.4vh, 13px)",
                    color: selected ? activeTemplate.borderColor : "rgba(255,255,255,0.4)",
                  }}
                >
                  {f === "strip" ? "🎞 Strip" : "🏷 Polaroid"}
                </p>
                <p
                  style={{
                    fontSize: "clamp(7px, 1vh, 10px)",
                    color: selected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {f === "strip" ? "3 foto" : "1 foto"}
                </p>
              </div>

              {/* Selected indicator */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center"
                  style={{
                    width: 14,
                    height: 14,
                    background: activeTemplate.borderColor,
                    fontSize: 8,
                    color: activeTemplate.backgroundColor,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Design chips */}
      <div className="shrink-0">
        <p
          className="text-center uppercase tracking-widest mb-1"
          style={{ fontSize: "clamp(7px, 1vh, 9px)", color: "rgba(255,255,255,0.3)" }}
        >
          desain
        </p>
        <div className="flex justify-center gap-1.5 overflow-x-auto scroll-no-bar">
          {TEMPLATES.map((t) => {
            const sel = localDesignId === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => onDesignChange(t.id)}
                className="shrink-0 rounded-lg overflow-hidden"
                style={{
                  width: "clamp(38px, 6vw, 52px)",
                  background: t.backgroundColor,
                  border: sel
                    ? `2px solid ${t.borderColor}`
                    : "1.5px solid rgba(255,255,255,0.15)",
                  boxShadow: sel ? `0 0 8px ${t.borderColor}80` : undefined,
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  className="flex flex-col gap-0.5 p-1"
                  style={{ height: "clamp(26px, 3.5vh, 36px)" }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ background: `${t.borderColor}40` }}
                    />
                  ))}
                </div>
                <p
                  className="pb-0.5 text-center font-medium"
                  style={{
                    fontSize: "clamp(6px, 0.85vh, 8px)",
                    color: t.textColor,
                    opacity: sel ? 1 : 0.7,
                  }}
                >
                  {t.name}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onConfirm}
        className="shrink-0 w-full rounded-xl font-serif shadow-lg"
        style={{
          background: activeTemplate.borderColor,
          color: activeTemplate.backgroundColor,
          padding: "clamp(7px, 1.2vh, 12px) 0",
          fontSize: "clamp(11px, 1.6vh, 15px)",
          boxShadow: `0 4px 20px ${activeTemplate.borderColor}50`,
        }}
      >
        Mulai Foto →
      </motion.button>
    </motion.div>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-black p-8 text-center">
      <div>
        <p className="font-serif text-2xl">Kamera ga bisa dibuka</p>
        <p className="mt-3 text-sm text-white/70">{msg}</p>
        <p className="mt-4 text-xs text-white/50">
          Allow camera permission di browser kamu lalu refresh halaman.
        </p>
      </div>
    </div>
  );
}
