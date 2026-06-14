import * as ImageManipulator from "expo-image-manipulator";

export interface ComposeResult {
  uri: string;
  width: number;
  height: number;
}

export const resizeForStrip = async (uri: string, targetW: number, targetH: number): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: targetW, height: targetH } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

export const resizeForPolaroid = async (uri: string, targetW: number, targetH: number): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: targetW, height: targetH } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
