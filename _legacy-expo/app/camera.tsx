import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { CameraView } from "expo-camera";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { CountdownOverlay } from "../components/camera/CountdownOverlay";
import { CameraFlash } from "../components/camera/CameraFlash";
import { CaptureButton } from "../components/camera/CaptureButton";
import { ThumbnailStrip } from "../components/camera/ThumbnailStrip";
import { WebCameraMock } from "../components/camera/WebCameraMock";
import { colors, spacing } from "../constants/theme";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import { useCameraCapture } from "../hooks/useCameraCapture";
import { usePhotoboothStore } from "../store/usePhotoboothStore";

const STRIP_DELAY_BETWEEN_MS = 1500;
const NAV_DELAY_MS = 1500;

export default function CameraScreen() {
  const router = useRouter();
  const { cameraPermission } = useMediaPermissions();
  const format = usePhotoboothStore((s) => s.format);
  const template = usePhotoboothStore((s) => s.template);
  const capturedPhotos = usePhotoboothStore((s) => s.capturedPhotos);
  const addPhoto = usePhotoboothStore((s) => s.addPhoto);
  const resetPhotos = usePhotoboothStore((s) => s.resetPhotos);
  const expectedCount = usePhotoboothStore((s) => s.expectedCount);

  const total = expectedCount || (format === "strip" ? 3 : 1);

  const [singleCaptured, setSingleCaptured] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  // Stable refs for cleanup / iOS teardown
  const mountedRef = useRef(true);
  const cameraRefContainer = useRef<CameraView | null>(null);

  const onAllCaptured = useCallback(() => {
    if (format === "strip") {
      // Explicitly stop the camera so iOS tears down AVCaptureSession
      // before we navigate away. Without this, the camera view can be
      // unmounted mid-capture and crash the native bridge.
      const cam = cameraRefContainer.current as any;
      try {
        cam?.pausePreview?.();
      } catch {}
      setTimeout(() => {
        if (mountedRef.current) router.replace("/print");
      }, NAV_DELAY_MS);
    } else {
      setSingleCaptured(true);
    }
  }, [format, router]);

  const session = useCameraCapture({
    total,
    onCapture: (uri) => {
      setFlashTrigger((n) => n + 1);
      setShowFlash(true);
      addPhoto(uri);
    },
    onAllCaptured,
  });

  // Forward the live ref into our container
  useEffect(() => {
    cameraRefContainer.current = session.cameraRef.current;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Stop the camera when the screen unmounts to let iOS tear down
      // AVCaptureSession cleanly. This avoids native crashes when the
      // screen is dismissed during/right after a photo capture.
      const cam = cameraRefContainer.current as any;
      try {
        cam?.pausePreview?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!format || !template) {
      router.replace("/");
    } else if (capturedPhotos.length === 0) {
      resetPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, template]);

  useEffect(() => {
    session.setStartIndex(capturedPhotos.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedPhotos.length]);

  if (!format || !template) return null;

  // Web fallback: no real camera. Use the image-picker mock.
  if (Platform.OS === "web") {
    return (
      <WebCameraMock
        format={format}
        expectedCount={total}
        onAllCaptured={(uris) => {
          resetPhotos();
          uris.forEach((u) => addPhoto(u));
          onAllCaptured();
        }}
      />
    );
  }

  if (cameraPermission === null) {
    return (
      <Screen bg={colors.black}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.white} />
        </View>
      </Screen>
    );
  }

  if (!cameraPermission) {
    return (
      <Screen bg={colors.black}>
        <View style={styles.center}>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permSub}>
            We need your camera to take photobooth pics.
          </Text>
          <Button label="Go back" onPress={() => router.back()} variant="secondary" />
        </View>
      </Screen>
    );
  }

  const onCountdownComplete = async () => {
    setIsCounting(false);
    if (!mountedRef.current) return;

    const done = await session.captureOne();
    if (done || !mountedRef.current) return;

    if (format === "strip") {
      await new Promise((r) => setTimeout(r, STRIP_DELAY_BETWEEN_MS));
      if (!mountedRef.current) return;
      setIsCounting(true);
      setCountdownKey((n) => n + 1);
    }
  };

  const handleTapCapture = () => {
    if (isCounting || session.isCapturing) return;
    if (format === "strip") {
      setIsCounting(true);
      setCountdownKey((n) => n + 1);
    } else {
      if (singleCaptured) return;
      setIsCounting(true);
      setCountdownKey((n) => n + 1);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={session.cameraRef}
        style={StyleSheet.absoluteFill}
        facing={session.facing}
      />

      <View style={styles.overlay} pointerEvents="none">
        {format === "strip" && (
          <View style={styles.frameStrip}>
            <View style={styles.frameCell} />
            <View style={styles.frameCell} />
            <View style={styles.frameCell} />
          </View>
        )}
        {format === "polaroid" && <View style={styles.framePolaroid} />}
      </View>

      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            if (mountedRef.current) router.back();
          }}
          style={styles.iconBtn}
        >
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {format === "strip" ? `${capturedPhotos.length} / ${total}` : ""}
          </Text>
        </View>
        <Pressable onPress={session.toggleFacing} style={styles.iconBtn}>
          <Text style={styles.iconText}>⟲</Text>
        </Pressable>
      </View>

      <CountdownOverlay
        key={countdownKey}
        trigger={countdownKey}
        onComplete={onCountdownComplete}
      />

      {showFlash && (
        <CameraFlash
          trigger={flashTrigger}
          onComplete={() => setShowFlash(false)}
        />
      )}

      <View style={styles.bottom}>
        {format === "strip" && (
          <ThumbnailStrip photos={capturedPhotos} total={total} />
        )}

        <View style={styles.bottomRow}>
          {format === "polaroid" && singleCaptured ? (
            <View style={styles.polaroidActions}>
              <Button
                label="Retake"
                variant="secondary"
                onPress={() => {
                  setSingleCaptured(false);
                  resetPhotos();
                }}
                style={{ flex: 1 }}
              />
              <Button
                label="Use this →"
                onPress={() => {
                  if (mountedRef.current) router.replace("/print");
                }}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <CaptureButton
              onPress={handleTapCapture}
              disabled={isCounting || session.isCapturing}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  permTitle: { color: colors.white, fontSize: 20, fontWeight: "700" },
  permSub: { color: "#bbb", textAlign: "center" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frameStrip: {
    width: "70%",
    aspectRatio: 0.72,
    justifyContent: "space-between",
    padding: 16,
  },
  frameCell: {
    flex: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
    borderStyle: "dashed",
    marginVertical: 4,
  },
  framePolaroid: {
    width: "75%",
    aspectRatio: 0.85,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderStyle: "dashed",
    borderRadius: 6,
  },

  topBar: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: colors.white, fontSize: 22, fontWeight: "700" },
  counter: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
  },
  counterText: { color: colors.white, fontWeight: "700", letterSpacing: 1 },

  bottom: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing.lg,
  },
  bottomRow: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  polaroidActions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
});
