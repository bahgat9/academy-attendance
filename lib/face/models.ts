"use client";

import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;

  const modelPath = "/face-models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
  ]);

  modelsLoaded = true;
}