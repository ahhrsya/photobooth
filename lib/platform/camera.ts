// Web implementation. Native (Capacitor) swap goes here later.

export interface CameraStream {
  stream: MediaStream;
  stop: () => void;
}

export async function openCamera(
  facingMode: "user" | "environment" = "user"
): Promise<CameraStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
    throw new Error("Camera API not available in this environment");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 1280 },
    },
    audio: false,
  });
  return {
    stream,
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  size = 1024
): string {
  const canvas = document.createElement("canvas");
  const w = video.videoWidth || size;
  const h = video.videoHeight || size;
  // square crop centered
  const side = Math.min(w, h);
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D ctx");
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
  return canvas.toDataURL("image/jpeg", 0.9);
}
