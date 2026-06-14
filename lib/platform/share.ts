// Web Share API + download fallback. Native swap to Capacitor Share plugin later.

export async function shareImage(dataUrl: string, filename = "photo.png") {
  if (typeof navigator === "undefined") return downloadImage(dataUrl, filename);

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: blob.type });
    if (
      "canShare" in navigator &&
      navigator.canShare?.({ files: [file] }) &&
      "share" in navigator
    ) {
      await navigator.share({ files: [file], title: "Photobooth" });
      return;
    }
  } catch {
    /* fall through to download */
  }
  downloadImage(dataUrl, filename);
}

export function downloadImage(dataUrl: string, filename = "photo.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
