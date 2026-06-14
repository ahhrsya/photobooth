// Journal cover presets — colors/gradients now, swap to PNG textures when user provides assets.

export interface CoverPreset {
  id: string;
  name: string;
  background: string; // CSS background
  textColor: string;
}

export const COVERS: CoverPreset[] = [
  {
    id: "cream",
    name: "Cream",
    background:
      "linear-gradient(135deg, #F5EBD9 0%, #EAD9BA 100%)",
    textColor: "#3D2F25",
  },
  {
    id: "denim",
    name: "Denim",
    background:
      "linear-gradient(135deg, #4A6FA5 0%, #2C4670 100%)",
    textColor: "#F5EBD9",
  },
  {
    id: "rosewood",
    name: "Rosewood",
    background:
      "linear-gradient(135deg, #8B3A3A 0%, #5C1E1E 100%)",
    textColor: "#F5EBD9",
  },
  {
    id: "sage",
    name: "Sage",
    background:
      "linear-gradient(135deg, #A8C09A 0%, #6B8E5A 100%)",
    textColor: "#1A1410",
  },
  {
    id: "midnight",
    name: "Midnight",
    background:
      "linear-gradient(135deg, #1A1A2E 0%, #0A0A14 100%)",
    textColor: "#C9A84C",
  },
  {
    id: "pink",
    name: "Bubblegum",
    background:
      "linear-gradient(135deg, #FFB3DE 0%, #FF6FA5 100%)",
    textColor: "#FFFFFF",
  },
  {
    id: "butter",
    name: "Butter",
    background:
      "linear-gradient(135deg, #FFE599 0%, #FFD972 100%)",
    textColor: "#3D2F25",
  },
  {
    id: "moss",
    name: "Moss Kraft",
    background:
      "linear-gradient(135deg, #6B5645 0%, #3D2F25 100%)",
    textColor: "#EAD9BA",
  },
];

export const getCoverById = (id: string) =>
  COVERS.find((c) => c.id === id) ?? COVERS[0];
