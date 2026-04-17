"use client";

import * as faceapi from "@vladmandic/face-api";

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 256,
  scoreThreshold: 0.5,
});

export async function detectSingleFaceFast(video: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(video, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();
}
