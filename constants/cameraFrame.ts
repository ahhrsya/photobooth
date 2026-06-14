/**
 * Camera frame overlay configuration.
 *
 * Drop your PNG into /public/main-camera.png. The image should have a
 * TRANSPARENT cutout where the camera viewfinder should appear (the
 * "green screen" area). The live <video> is rendered behind it and shows
 * through the transparent area.
 *
 * Tweak `viewfinder` percentages to match where the cutout sits in your PNG.
 * Values are percentages of the PNG bounding box.
 */
export const CAMERA_FRAME = {
  // Asset path (relative to /public). If file doesn't exist, code falls back
  // to full-bleed video without overlay.
  src: "/main-camera.png",

  // Where the viewfinder cutout sits inside the PNG (percentages of PNG box).
  // Adjust these to match the position of your transparent area.
  viewfinder: {
    top: "16.9%",
    left: "21.6%",
    width: "56.7%",
    height: "58.6%",
  },

  // If your PNG uses a SOLID GREEN screen (not transparent), set this to true.
  // We'll apply a chroma-key approximation via CSS filter + blend.
  // For best results, export with transparency instead.
  chromaKey: false,
};
