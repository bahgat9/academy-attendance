"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Upload,
  RefreshCcw,
} from "lucide-react";
import { loadFaceModels } from "@/lib/face/models";
import {
  detectAllFacesFromVideo,
  detectSingleFaceFromVideo,
} from "@/lib/face/detect";
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

const captureGuides = [
  "Look straight",
  "Turn slightly left",
  "Turn slightly right",
  "Lift chin slightly",
  "Lower chin slightly",
  "Look straight again",
  "Move a little closer and look straight",
];

type CameraFacingMode = "user" | "environment";

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
  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState("Camera is not started");
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<CapturedSample[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const completed = samples.length >= sampleTarget;

  const currentGuide = useMemo(() => {
    return captureGuides[Math.min(samples.length, captureGuides.length - 1)];
  }, [samples.length]);

  async function startCamera(mode: CameraFacingMode = cameraMode) {
    try {
      stopCamera();
      setIsReady(false);
      setIsStarting(true);
      setError(null);
      setStatus("Loading face models...");

      await loadFaceModels();

      setStatus("Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsReady(true);
      setStatus(
        `${mode === "user" ? "Front" : "Back"} camera ready. Position one face in the frame.`
      );
    } catch (err) {
      console.error(err);
      setError("Could not access the camera.");
      setStatus("Camera failed to start.");
    } finally {
      setIsStarting(false);
    }
  }

  async function switchCamera() {
    const nextMode: CameraFacingMode =
      cameraMode === "user" ? "environment" : "user";

    setCameraMode(nextMode);
    await startCamera(nextMode);
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function captureSample() {
    if (!videoRef.current || !canvasRef.current || detecting) return;

    try {
      setDetecting(true);
      setError(null);
      setStatus("Checking face...");

      const allFaces = await detectAllFacesFromVideo(videoRef.current);

      if (allFaces.length === 0) {
        setStatus("No face detected");
        return;
      }

      if (allFaces.length > 1) {
        setStatus("Only one face must be visible");
        return;
      }

      const detection = await detectSingleFaceFromVideo(videoRef.current);

      if (!detection) {
        setStatus("Face could not be processed");
        return;
      }

      const quality = validateFaceBox(detection.detection.box);

      if (!quality.ok) {
        setStatus(quality.message);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setStatus("Canvas error");
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const descriptor = Array.from(detection.descriptor);

      const newSample: CapturedSample = {
        id: crypto.randomUUID(),
        imageDataUrl,
        descriptor,
      };

      setSamples((prev) => [...prev, newSample]);
      setStatus("Sample captured successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to capture face sample.");
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

      setStatus(`Enrollment saved successfully (${result.saved} samples)`);
      router.push("/players");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save enrollment");
      setStatus("Enrollment save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4">
        <p className="text-xs uppercase tracking-wide text-blue-200/70">
          Current capture instruction
        </p>
        <p className="mt-2 text-lg font-semibold text-blue-100">{currentGuide}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-white/50">Camera Mode</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setCameraMode("user");
              startCamera("user");
            }}
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              cameraMode === "user"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white"
            }`}
          >
            Front Camera
          </button>

          <button
            type="button"
            onClick={() => {
              setCameraMode("environment");
              startCamera("environment");
            }}
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              cameraMode === "environment"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white"
            }`}
          >
            Back Camera
          </button>
        </div>
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
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/50">Enrollment progress</p>
            <p className="mt-1 text-lg font-medium">
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

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => startCamera(cameraMode)}
          disabled={isStarting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          {isStarting ? "Starting..." : "Start"}
        </button>

        <button
          type="button"
          onClick={switchCamera}
          disabled={isStarting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Switch
        </button>

        <button
          type="button"
          onClick={captureSample}
          disabled={!isReady || detecting}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {detecting ? "Checking..." : "Capture"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={resetSamples}
          disabled={samples.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Samples
        </button>

        <button
          type="button"
          onClick={saveEnrollment}
          disabled={!completed || saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-black disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {saving ? "Saving..." : "Save Enrollment"}
        </button>
      </div>

      {samples.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Captured Samples</h3>

          <div className="grid grid-cols-2 gap-3">
            {samples.map((sample, index) => (
              <div
                key={sample.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-black">
                  <img
                    src={sample.imageDataUrl}
                    alt={`Sample ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between px-3 py-3">
                  <span className="text-sm text-white/70">Sample {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSample(sample.id)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
