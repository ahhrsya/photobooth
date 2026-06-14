import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";
import { PrintSlot } from "../components/print/PrintSlot";
import { PrinterSlotVisual } from "../components/print/PrinterSlotVisual";
import { ActionButtons } from "../components/print/ActionButtons";
import { OffscreenComposer, ComposerHandle } from "../components/output/OffscreenComposer";
import { PhotoStrip } from "../components/output/PhotoStrip";
import { Polaroid } from "../components/output/Polaroid";
import { usePhotoboothStore } from "../store/usePhotoboothStore";
import { sizes } from "../constants/dimensions";
import { colors, spacing } from "../constants/theme";
import { Template } from "../types";

// On web, MediaLibrary is unavailable. We use a no-op hook so the call site
// stays the same and gate the actual save to native only.
const useMediaPermsWebSafe = () => {
  const native = MediaLibrary.usePermissions();
  if (Platform.OS === "web") {
    return [{ granted: true, canAskAgain: false } as any, async () => ({ granted: true } as any)];
  }
  return native;
};

export default function PrintScreen() {
  const router = useRouter();
  const format = usePhotoboothStore((s) => s.format);
  const template = usePhotoboothStore((s) => s.template);
  const photos = usePhotoboothStore((s) => s.capturedPhotos);
  const setComposed = usePhotoboothStore((s) => s.setComposedImage);
  const composed = usePhotoboothStore((s) => s.composedImageUri);
  const resetAll = usePhotoboothStore((s) => s.resetAll);
  const caption = usePhotoboothStore((s) => s.caption);
  const setCaption = usePhotoboothStore((s) => s.setCaption);
  const removeLastPhoto = usePhotoboothStore((s) => s.removeLastPhoto);
  const setExpectedCount = usePhotoboothStore((s) => s.setExpectedCount);

  const composerRef = useRef<ComposerHandle>(null);
  const composerReadyRef = useRef(false);
  const capturingRef = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [mediaPerm, requestMediaPerm] = useMediaPermsWebSafe();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!format || !template || photos.length === 0) {
      router.replace("/");
    }
  }, [format, template, photos.length]);

  useEffect(() => {
    if (composed) return;
    if (!template || !format) return;
    if (photos.length === 0) return;
    if (format === "strip" && photos.length < 3) return;
    if (capturingRef.current) return;

    // Hard ceiling: bail after 8s so the UI never spins forever
    const deadline = Date.now() + 8000;

    const tryRun = async () => {
      capturingRef.current = true;
      try {
        // Wait for the offscreen composer to signal ready, with a hard cap
        while (!composerReadyRef.current && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 80));
        }
        if (!composerReadyRef.current) {
          // Force a final capture attempt anyway
        }
        // Wrap the capture itself with the remaining deadline
        const remaining = Math.max(2000, deadline - Date.now());
        const capturePromise = composerRef.current?.capture();
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("Capture timed out — try again")),
            remaining
          )
        );
        const uri = await Promise.race([capturePromise, timeoutPromise]);
        if (uri && mountedRef.current) {
          setComposed(uri);
          setComposeError(null);
        }
      } catch (e: any) {
        console.warn("compose failed", e);
        if (mountedRef.current) setComposeError(e?.message ?? "Capture failed");
      } finally {
        capturingRef.current = false;
      }
    };
    tryRun();
    // photos array reference changes after addPhoto; we still want to re-capture
    // if the user re-edits a caption etc. Caption changes also trigger.
  }, [template?.id, format, photos.length, composed, caption]);

  if (!format || !template || photos.length === 0) return null;

  const cardWidth = format === "strip" ? sizes.cardStripWidth : sizes.cardPolaroidWidth;
  const cardHeight = format === "strip" ? sizes.cardStripHeight : sizes.cardPolaroidHeight;

  const onSave = async () => {
    if (!composed) return;
    if (composed === "skipped") {
      Alert.alert("No preview", "Capture failed. Please retake the photos.");
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      if (Platform.OS === "web") {
        // Trigger a browser download for the captured PNG
        const a = document.createElement("a");
        a.href = composed;
        a.download = `devel-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert("Downloaded!", "Your photobooth pic was downloaded.");
        return;
      }
      let granted = mediaPerm?.granted;
      if (!granted) {
        const req = await requestMediaPerm();
        granted = req.granted;
      }
      if (!granted) {
        Alert.alert(
          "Permission needed",
          "Allow access to Photos to save your pictures."
        );
        return;
      }
      await MediaLibrary.saveToLibraryAsync(composed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Saved!", "Your photobooth pic is in your gallery.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save image.");
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    if (!composed) return;
    if (composed === "skipped") {
      Alert.alert("No preview", "Capture failed. Please retake the photos.");
      return;
    }
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing unavailable", "This device does not support sharing.");
        return;
      }
      // Prefer Instagram Stories when installed (it accepts image shares via the
      // generic share sheet). The system share sheet will surface IG as a top
      // target thanks to UTI tagging; we just open the standard flow.
      await Sharing.shareAsync(composed, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Share your pic",
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not share image.");
    } finally {
      setSharing(false);
    }
  };

  const onTakeAnother = () => {
    Haptics.selectionAsync().catch(() => {});
    resetAll();
    router.replace("/");
  };

  const onRetakeLast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    removeLastPhoto();
    setComposed(null);
    composerReadyRef.current = false;
    // Re-enter camera with remaining count
    const remaining = photos.length - 1;
    setExpectedCount(remaining);
    router.replace("/camera");
  };

  const canRetake = photos.length > 0;

  const showCaptionEditor = format === "polaroid" && template.showCaption;

  return (
    <View style={styles.root}>
      <LoadingOverlay
        visible={!composed && !composeError}
        label="developing your photos..."
        error={composeError}
        onRetry={() => {
          setComposeError(null);
          // Force a re-mount of the composer and retry by clearing composed
          setComposed(null);
          // The useEffect above will re-run because composed flipped to null
        }}
        onSkip={() => {
          setComposeError(null);
          setComposed("skipped");
        }}
      />

      <OffscreenComposer
        ref={composerRef}
        photos={photos}
        template={template}
        format={format}
        width={cardWidth}
        height={cardHeight}
        caption={caption}
        onReady={() => {
          composerReadyRef.current = true;
        }}
      />

      <View style={styles.bgPattern} pointerEvents="none" />

      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={styles.brand}>devel.</Text>
        <View style={styles.topRight}>
          {canRetake && (
            <Pressable onPress={onRetakeLast} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>↶ retake last</Text>
            </Pressable>
          )}
          <Pressable onPress={onTakeAnother} style={styles.retake}>
            <Text style={styles.retakeText}>take another ↺</Text>
          </Pressable>
        </View>
      </View>

      {showCaptionEditor && (
        <View style={styles.captionRow} pointerEvents="box-none">
          {editingCaption ? (
            <TextInput
              value={caption}
              onChangeText={setCaption}
              onBlur={() => setEditingCaption(false)}
              onSubmitEditing={() => setEditingCaption(false)}
              autoFocus
              maxLength={24}
              style={styles.captionInput}
              placeholder="say something..."
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Pressable
              onPress={() => setEditingCaption(true)}
              style={styles.captionPill}
            >
              <Text style={styles.captionPillText}>✎ {caption || "add caption"}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.stage}>
        <View style={styles.printArea}>
          <PrintSlot
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onAnimationComplete={() => setShowActions(true)}
            autoPlay={!!composed}
          >
            {format === "strip" ? (
              <PrintPreviewStrip photos={photos} template={template} caption={caption} />
            ) : (
              <PrintPreviewPolaroid photo={photos[0]} template={template} caption={caption} />
            )}
          </PrintSlot>
        </View>

        <View style={styles.slotWrap}>
          <PrinterSlotVisual width={cardWidth} />
        </View>
      </View>

      <View style={styles.actions}>
        <ActionButtons
          onSave={onSave}
          onShare={onShare}
          saving={saving}
          sharing={sharing}
          visible={showActions && !!composed}
        />
      </View>
    </View>
  );
}

const PrintPreviewStrip: React.FC<{
  photos: string[];
  template: Template;
  caption?: string;
}> = ({ photos, template, caption }) => (
  <PhotoStrip
    photos={photos}
    template={template}
    width={sizes.cardStripWidth}
    height={sizes.cardStripHeight}
    caption={caption}
  />
);

const PrintPreviewPolaroid: React.FC<{
  photo: string;
  template: Template;
  caption?: string;
}> = ({ photo, template, caption }) => (
  <Polaroid
    photo={photo}
    template={template}
    width={sizes.cardPolaroidWidth}
    height={sizes.cardPolaroidHeight}
    caption={caption}
  />
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FAEDE3",
    opacity: 0.6,
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  brand: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  topRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  retake: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  captionRow: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  captionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.text,
  },
  captionPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    minWidth: 180,
    textAlign: "center",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: sizes.slotHeight + 20,
  },
  printArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  slotWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actions: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
