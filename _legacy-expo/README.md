# Photobooth — devel.

React Native + Expo mobile app for taking photobooth pictures with satisfying print-out animation. See `PLAN.md` for the full design spec.

## Run

```bash
npm install
npx expo start              # QR scan with Expo Go
npx expo start --ios        # native iOS simulator
npx expo start --android    # native Android emulator
```

## Stack

- Expo SDK 52 + expo-router (file-based navigation)
- expo-camera, expo-media-library, expo-sharing, expo-haptics
- react-native-reanimated v3 (print animation on UI thread)
- react-native-view-shot (composed photo capture)
- zustand (state)

## Flow

1. **Home** (`/`) — pick Photo Strip or Polaroid
2. **Template Picker** (`/template-picker`) — choose design
3. **Camera** (`/camera`) — countdown + flash, captures 3 (strip) or 1 (polaroid)
4. **Print** (`/print`) — offscreen compose → print animation → save/share

## Print Animation

`components/print/PrintSlot.tsx` — Reanimated v3 worklet on the UI thread. Card slides up from a printer slot at the bottom, with subtle 1.5° rotation that straightens as it emerges, and a haptic at completion. After print, the card is draggable (gesture-handler PanGesture) with a spring-back.

## Structure

```
app/                  # expo-router pages
components/           # feature-grouped components (camera, output, print, template, ui)
hooks/                # camera capture, image compose, permissions
store/                # zustand store
constants/            # theme, dimensions, templates
types/                # shared types
```
