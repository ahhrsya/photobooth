// Web Vibration API. Native swap to Capacitor Haptics plugin later.

export function vibrate(pattern: number | number[] = 20) {
  if (typeof navigator === "undefined") return;
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}
