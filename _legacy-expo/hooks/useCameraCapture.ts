import { useRef, useState, useCallback, useEffect } from "react";
import { CameraView } from "expo-camera";

export interface CaptureSessionOptions {
  total: number;
  onCapture: (uri: string, index: number) => void;
  onAllCaptured?: () => void;
  delayBetweenMs?: number;
}

/**
 * Manages the multi-shot capture sequence.
 * Caller drives the countdown UI (e.g. via CountdownOverlay), then calls
 * `captureOne()` per shot. This avoids stale-closure recursion and gives
 * the UI full control over the countdown animation.
 */
export const useCameraCapture = (opts: CaptureSessionOptions) => {
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [index, setIndex] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("front");

  // Refs to read latest values without making callbacks re-create
  const indexRef = useRef(0);
  const totalRef = useRef(opts.total);
  const isCapturingRef = useRef(false);
  const optsRef = useRef(opts);

  // Keep refs in sync (no re-render cost)
  useEffect(() => {
    totalRef.current = opts.total;
  }, [opts.total]);

  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const captureOne = useCallback(async (): Promise<boolean> => {
    if (isCapturingRef.current) return false;
    if (indexRef.current >= totalRef.current) return false;

    isCapturingRef.current = true;
    setIsCapturing(true);

    let photo: { uri: string } | null = null;
    try {
      const cam = cameraRef.current;
      if (!cam) {
        console.warn("captureOne: camera ref is null");
        return false;
      }
      photo = await cam.takePictureAsync({
        quality: 0.85,
        // skipProcessing: true avoids a separate HEIC->JPEG conversion step
        // on iOS. The returned file is a HEIC but Expo's <Image> handles
        // HEIC natively on iOS. The simpler pipeline is more reliable.
        skipProcessing: true,
        // Give the buffer a moment to flush before returning (iOS safety)
        shutterSound: false,
      });
    } catch (e) {
      console.warn("capture failed", e);
      return false;
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }

    if (photo?.uri) {
      const current = indexRef.current;
      optsRef.current.onCapture(photo.uri, current);
      const next = current + 1;
      setIndex(next);
      indexRef.current = next;
      if (next >= totalRef.current) {
        optsRef.current.onAllCaptured?.();
        return true; // done
      }
    }
    return false;
  }, []); // stable — uses refs

  const setStartIndex = useCallback((n: number) => {
    setIndex(n);
    indexRef.current = n;
  }, []);

  const reset = useCallback(() => {
    setIndex(0);
    indexRef.current = 0;
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === "front" ? "back" : "front"));
  }, []);

  return {
    cameraRef,
    isCapturing,
    index,
    facing,
    captureOne,
    setStartIndex,
    reset,
    toggleFacing,
  };
};
