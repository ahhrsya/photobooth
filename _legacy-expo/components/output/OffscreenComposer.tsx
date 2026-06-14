import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Platform,
  Image as RNImage,
} from "react-native";
import { captureRef as viewShotCapture } from "react-native-view-shot";
import { Template, OverlayKey } from "../../types";
import { FONT_FAMILY } from "../../constants/fonts";
import { OVERLAY_SOURCES } from "../../constants/overlays";

export interface ComposerHandle {
  capture: () => Promise<string>;
}

interface OffscreenComposerProps {
  photos: string[];
  template: Template;
  format: "strip" | "polaroid";
  width: number;
  height: number;
  caption?: string;
  /**
   * Invoked once the underlying ViewShot has measured and the inner
   * content is ready to be captured. Use this if the parent wants
   * to gate its capture call on layout completion.
   */
  onReady?: () => void;
}

/**
 * Renders the final card layout and captures it as a PNG.
 *  - On native: uses react-native-view-shot's captureRef with retry.
 *  - On web: uses html2canvas directly on the resolved DOM element.
 *
 * The card is rendered into a positioned View (not display:none) so the
 * native view system measures it, and html2canvas can find it on web.
 */
export const OffscreenComposer = forwardRef<
  ComposerHandle,
  OffscreenComposerProps
>(({ photos, template, format, width, height, caption, onReady }, ref) => {
  const cardRef = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const expectedImageCount = format === "strip" ? photos.length : 1;

  const handleImageLoaded = useCallback(() => {
    setImagesLoaded((n) => n + 1);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      capture: async (): Promise<string> => {
        const refAny = cardRef.current as any;
        if (!refAny) throw new Error("composer not ready");

        // Wait for images to fully load (hard cap to avoid infinite wait)
        const start = Date.now();
        while (
          imagesLoaded < expectedImageCount &&
          Date.now() - start < 5000
        ) {
          await new Promise((r) => setTimeout(r, 80));
        }
        // Layout settle
        await new Promise((r) => setTimeout(r, 200));

        if (Platform.OS === "web") {
          return captureViaCanvasWeb(refAny, width, height);
        }
        return captureNativeWithRetry(refAny, 6);
      },
    }),
    [width, height, imagesLoaded, expectedImageCount]
  );

  useEffect(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  return (
    <View
      // Keep the wrapper visible-but-hidden. iOS does not honor zIndex: -1
      // and view-shot will not capture a view that is display:none or
      // has display contents "none". We keep it laid out with opacity 0
      // and pointerEvents: none so it cannot be interacted with. The card
      // itself sits off-screen below via absolute positioning so the user
      // does not see it flash in.
      style={styles.offscreenWrapper}
      pointerEvents="none"
      // @ts-ignore web-only style
      data-composer-root="true"
    >
      <View
        ref={cardRef}
        collapsable={false}
        style={[styles.cardHolder, { width, height }]}
        // @ts-ignore web-only
        data-card="true"
      >
        {format === "strip" ? (
          <StripLayout
            photos={photos}
            template={template}
            width={width}
            height={height}
            caption={caption}
            onImageLoaded={handleImageLoaded}
          />
        ) : (
          <PolaroidLayout
            photo={photos[0]}
            template={template}
            width={width}
            height={height}
            caption={caption}
            onImageLoaded={handleImageLoaded}
          />
        )}
      </View>
      {/* sentinel so callers can wait for ready state without polling */}
      {ready ? null : <View style={styles.sizer} />}
    </View>
  );
});

OffscreenComposer.displayName = "OffscreenComposer";

// ====== Layout components (shared between platforms) ======

interface StripLayoutProps {
  photos: string[];
  template: Template;
  width: number;
  height: number;
  caption?: string;
  onImageLoaded?: () => void;
}

const StripLayout: React.FC<StripLayoutProps> = ({
  photos,
  template,
  width,
  height,
  caption,
  onImageLoaded,
}) => {
  const innerWidth = width - template.borderWidth * 2;
  const innerHeight = height - template.borderWidth * 2;
  const photoAreaHeight =
    innerHeight -
    (template.showDate ? 36 : 0) -
    (template.showCaption ? 28 : 0) -
    template.photoGap * (photos.length - 1);
  const photoHeight = photoAreaHeight / photos.length;
  const dateFamily = FONT_FAMILY[template.dateFont];
  const captionFamily = FONT_FAMILY[template.captionFont];

  return (
    <View
      style={[
        styles.cardBase,
        {
          width,
          height,
          backgroundColor: template.backgroundColor,
          borderColor: template.borderColor,
          borderWidth: template.borderWidth,
          borderRadius: template.borderRadius ?? 0,
        },
      ]}
    >
      {photos.map((uri, i) => (
        <PreloadedImage
          key={i}
          uri={uri}
          width={innerWidth}
          height={photoHeight}
          borderRadius={template.photoBorderRadius ?? 0}
          marginBottom={i < photos.length - 1 ? template.photoGap : 0}
          onLoaded={onImageLoaded}
        />
      ))}
      {template.showDate && (
        <Text
          style={[
            styles.dateText,
            { color: template.textColor, fontFamily: dateFamily, marginTop: 8 },
          ]}
        >
          {formatDate()}
        </Text>
      )}
      {template.showCaption && (
        <Text
          style={[
            styles.captionText,
            { color: template.textColor, fontFamily: captionFamily },
          ]}
        >
          {caption || "made today"}
        </Text>
      )}
      <OverlayLayer template={template} />
    </View>
  );
};

interface PolaroidLayoutProps {
  photo: string;
  template: Template;
  width: number;
  height: number;
  caption?: string;
  onImageLoaded?: () => void;
}

const PolaroidLayout: React.FC<PolaroidLayoutProps> = ({
  photo,
  template,
  width,
  height,
  caption,
  onImageLoaded,
}) => {
  const sidePadding = width * 0.06;
  const innerWidth = width - sidePadding * 2;
  const bottomArea = height * 0.22;
  const photoHeight = height - bottomArea - sidePadding;
  const dateFamily = FONT_FAMILY[template.dateFont];
  const captionFamily = FONT_FAMILY[template.captionFont];

  return (
    <View
      style={[
        styles.cardBase,
        {
          width,
          height,
          backgroundColor: template.backgroundColor,
          borderColor: template.borderColor,
          borderWidth: template.borderWidth,
          borderRadius: template.borderRadius ?? 0,
          padding: sidePadding,
        },
      ]}
    >
      <PreloadedImage
        uri={photo}
        width={innerWidth}
        height={photoHeight}
        borderRadius={template.photoBorderRadius ?? 0}
        onLoaded={onImageLoaded}
      />
      <View style={styles.polaroidBottom}>
        {template.showDate && (
          <Text
            style={[
              styles.dateText,
              { color: template.textColor, fontFamily: dateFamily },
            ]}
          >
            {formatDate()}
          </Text>
        )}
        {template.showCaption && (
          <Text
            style={[
              styles.polaroidCaption,
              { color: template.textColor, fontFamily: captionFamily },
            ]}
            numberOfLines={1}
          >
            {caption || "say cheese!"}
          </Text>
        )}
      </View>
      <OverlayLayer template={template} />
    </View>
  );
};

/**
 * Image that waits for its source to be fully loaded before reporting
 * "loaded". On iOS this prevents view-shot from capturing a partially-written
 * file URI from expo-camera, which can cause native crashes.
 *
 * Uses Image.prefetch as a fast path plus onLoad as the authoritative
 * signal that the underlying image is fully decoded and rendered.
 */
const PreloadedImage: React.FC<{
  uri: string;
  width: number;
  height: number;
  borderRadius: number;
  marginBottom?: number;
  onLoaded?: () => void;
}> = ({ uri, width, height, borderRadius, marginBottom, onLoaded }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    setLoaded(false);
    setErrored(false);
    (async () => {
      try {
        await RNImage.prefetch(uri);
        if (cancelled) return;
        // After prefetch resolves, the next render will mount <Image> with
        // onLoad, which is the real "ready" signal.
      } catch (e) {
        if (!cancelled) setErrored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        marginBottom,
        backgroundColor: errored ? "#888" : "#222",
        overflow: "hidden",
      }}
    >
      {errored ? null : (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onLoad={() => {
            setLoaded(true);
            onLoaded?.();
          }}
          onError={() => setErrored(true)}
        />
      )}
    </View>
  );
};

const OverlayLayer: React.FC<{ template: Template }> = ({ template }) => {
  if (!template.overlayKey) return null;
  return (
    <Image
      source={OVERLAY_SOURCES[template.overlayKey as OverlayKey]}
      style={[styles.overlay, { opacity: template.overlayOpacity ?? 1 }]}
      resizeMode="cover"
    />
  );
};

const formatDate = () => {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
};

// ====== Capture helpers ======

async function captureNativeWithRetry(
  ref: any,
  retriesLeft: number
): Promise<string> {
  try {
    const uri = await viewShotCapture(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
    return uri;
  } catch (e) {
    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 200));
      return captureNativeWithRetry(ref, retriesLeft - 1);
    }
    throw e;
  }
}

async function captureViaCanvasWeb(
  ref: any,
  width: number,
  height: number
): Promise<string> {
  const el: HTMLElement | null = resolveWebElement(ref);
  if (!el) {
    throw new Error("composer DOM element not found");
  }
  await new Promise((r) => setTimeout(r, 100));

  const html2canvasMod = await import("html2canvas");
  const html2canvas = html2canvasMod.default;

  const canvas = await html2canvas(el, {
    backgroundColor: null,
    logging: false,
    useCORS: true,
    allowTaint: false,
    width,
    height,
    windowWidth: Math.max(width, 800),
    windowHeight: Math.max(height, 800),
    scale: 1,
  });

  return canvas.toDataURL("image/png");
}

function resolveWebElement(ref: any): HTMLElement | null {
  if (!ref || typeof ref !== "object") return null;
  if (ref instanceof HTMLElement) return ref;
  if (ref.stateNode instanceof HTMLElement) return ref.stateNode;
  if (ref._reactInternals?.stateNode instanceof HTMLElement) {
    return ref._reactInternals.stateNode;
  }
  if (ref._root?.current instanceof HTMLElement) return ref._root.current;
  let node: any = ref;
  for (let i = 0; i < 8 && node; i++) {
    if (node instanceof HTMLElement) return node;
    node = node.parentNode;
  }
  return null;
}

const styles = StyleSheet.create({
  offscreenWrapper: {
    position: "absolute",
    left: 0,
    bottom: -10000, // far off-screen but rendered (iOS-safe for view-shot)
    opacity: 1, // must be visible-ish for view-shot to capture
    pointerEvents: "none",
  },
  cardHolder: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  cardBase: {
    alignItems: "center",
    overflow: "hidden",
  },
  dateText: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  captionText: {
    fontSize: 14,
    marginTop: 2,
  },
  polaroidBottom: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  polaroidCaption: {
    fontSize: 20,
    marginTop: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  sizer: { width: 1, height: 1 },
});
