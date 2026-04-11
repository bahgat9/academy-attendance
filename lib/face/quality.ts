"use client";

export type FaceQualityResult = {
  ok: boolean;
  message: string;
};

export function validateFaceBox(box: {
  width: number;
  height: number;
  x: number;
  y: number;
}) : FaceQualityResult {
  const minSize = 120;

  if (box.width < minSize || box.height < minSize) {
    return {
      ok: false,
      message: "Move closer to the camera",
    };
  }

  return {
    ok: true,
    message: "Face looks good",
  };
}