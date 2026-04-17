"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Trash2,
  Upload,
  RefreshCcw,
  Camera,
} from "lucide-react";
import { loadFaceModels } from "@/lib/face/models";
import { detectSingleFaceFast } from "@/lib/face/detect";
import { validateFaceBox } from "@/lib/face/quality";
import { useRouter } from "next/navigation";

type CapturedSample = {
  id: string;
  imageDataUrl: string;
  descriptor: number[];
};

type FaceEnrollmentCameraProps = {
  playerId: string;
  sampleTarget?: number;
};

type CameraFacingMode = "user" | "environment";

const captureGuides = [
  "Look straight",
  "Turn slightly left",
  "Turn slightly right",
  "Lift chin slightly",
  "Lower chin slightly",
  "Look straight again",
  "Move a little closer",
];

export function FaceEnrollmentCamera({
  playerId,
  sampleTarget = 7,
}: FaceEnrollmentCameraProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraFacingMode>("user");
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [status, setStatus] = useState("Preparing camera...");
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<CapturedSample[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const completed = samples.length >= sampleTarget;

  const currentGuide = useMemo(() => {
    return captureGuides[Math.min(samples.length, captureGuides.length - 1)];
  }, [samples.length]);

  useEffect(() => {
    startCamera("user");

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera(mode: CameraFacingMode = cameraMode) {
    try {
      stopCamera();
      setIsReady(false);
      setIsStarting(true);
      setError(null);
      setStatus("Loading models...");

      await loadFaceModels();

      setStatus("Opening camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraMode(mode);
      setIsReady(true);
      setStatus(`${mode === "user" ? "Front" : "Back"} camera ready`);
    } catch (err) {
      console.error(err);
      setError("Could not access the camera.");
      setStatus("Camera failed to start.");
    } finally {
      setIsStarting(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function switchCamera() {
    const nextMode: CameraFacingMode =
      cameraMode === "user" ? "environment" : "user";

    await startCamera(nextMode);
  }

  async function captureSample() {
    if (!videoRef.current || !canvasRef.current || detecting || !isReady) return;

    try {
      setDetecting(true);
      setError(null);
      setStatus("Detecting face...");

      const detection = await detectSingleFaceFast(videoRef.current);

      if (!detection) {
        setStatus("No clear face detected");
        return;
      }

      const quality = validateFaceBox(detection.detection.box);

      if (!quality.ok) {
        setStatus(quality.message);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setStatus("Canvas error");
        return;
      }

      const targetWidth = 640;
      const ratio = video.videoHeight / video.videoWidth;
      const targetHeight = Math.round(targetWidth * ratio);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const descriptor = Array.from(detection.descriptor);

      setSamples((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          imageDataUrl,
          descriptor,
        },
      ]);

      setStatus("Sample captured");
    } catch (err) {
      console.error(err);
      setError("Failed to capture sample.");
      setStatus("Capture failed");
    } finally {
      setDetecting(false);
    }
  }

  function removeSample(id: string) {
    setSamples((prev) => prev.filter((sample) => sample.id !== id));
  }

  function resetSamples() {
    setSamples([]);
    setStatus("Samples reset");
  }

  async function saveEnrollment() {
    try {
      setSaving(true);
      setError(null);
      setStatus("Saving enrollment...");

      const response = await fetch(`/api/enrollment/${playerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          samples: samples.map((sample) => ({
            imageDataUrl: sample.imageDataUrl,
            descriptor: sample.descriptor,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save enrollment");
      }

      setStatus(`Enrollment saved (${result.saved} samples)`);
      router.push("/players");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save enrollment");
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/50">Current instruction</p>
            <h2 className="mt-1 text-xl font-semibold">{currentGuide}</h2>
            <p className="mt-2 text-sm text-white/60">
              {samples.length} / {sampleTarget} samples
            </p>
          </div>

          {completed ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Ready
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-white/60">{status}</p>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
        <div className="relative aspect-[3/4] w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[58%] w-[72%] rounded-[2.5rem] border-2 border-dashed border-white/30" />
          </div>

          {isStarting ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white">
                Opening camera...
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {samples.length > 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex gap-3 overflow-x-auto">
            {samples.map((sample, index) => (
              <div
                key={sample.id}
                className="min-w-[96px] overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                <div className="aspect-[3/4] w-24 overflow-hidden bg-black">
                  <img
                    src={sample.imageDataUrl}
                    alt={`Sample ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-xs text-white/70">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSample(sample.id)}
                    className="rounded-lg border border-white/10 bg-white/5 p-1 text-white/70"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-20 z-20 rounded-[2rem] border border-white/10 bg-neutral-950/95 p-3 backdrop-blur">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={switchCamera}
            disabled={isStarting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            {cameraMode === "user" ? "Use Back" : "Use Front"}
          </button>

          <button
            type="button"
            onClick={captureSample}
            disabled={!isReady || detecting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {detecting ? "Detecting..." : "Capture"}
          </button>

          <button
            type="button"
            onClick={resetSamples}
            disabled={samples.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={saveEnrollment}
            disabled={!completed || saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-black disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
