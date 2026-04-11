"use client";

import * as faceapi from "@vladmandic/face-api";

export async function detectSingleFaceFromVideo(video: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
}

export async function detectAllFacesFromVideo(video: HTMLVideoElement) {
  return faceapi
    .detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptors();
}