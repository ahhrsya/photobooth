import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

export const useMediaPermissions = () => {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cam = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(cam.granted);
      } catch (e) {
        console.warn("camera permission failed", e);
        setCameraPermission(false);
      }

      if (Platform.OS !== "web") {
        try {
          const med = await MediaLibrary.requestPermissionsAsync();
          setMediaPermission(med.granted);
        } catch (e) {
          console.warn("media permission failed", e);
          setMediaPermission(false);
        }
      } else {
        setMediaPermission(true); // not used on web (download fallback)
      }
    })();
  }, []);

  return { cameraPermission, mediaPermission };
};
