"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanFace, UserPlus } from "lucide-react";
import { loadFaceModels } from "@/lib/face/models";
import {
    detectAllFacesFromVideo,
    detectSingleFaceFromVideo,
} from "@/lib/face/detect";
import { validateFaceBox } from "@/lib/face/quality";
import { ManualAttendanceSheet } from "@/components/attendance/manual-attendance-sheet";
import { ScanResultOverlay } from "@/components/attendance/scan-result-overlay";

type PlayerItem = {
    id: string;
    full_name: string;
    age_group: string | null;
    is_active: boolean;
};

type ScanResult =
    | {
        status: "recognized_auto" | "recognized_confirm" | "duplicate_blocked" | "manual";
        matched: true;
        player: {
            id: string;
            fullName: string;
            ageGroup?: string | null;
        };
        distance?: number;
        message: string;
    }
    | {
        status: "unknown";
        matched: false;
        distance?: number;
        message: string;
    };

type LiveAttendanceScannerProps = {
    players: PlayerItem[];
    scanCooldownMs: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
};

export function LiveAttendanceScanner({
    players,
    scanCooldownMs,
    soundEnabled,
    vibrationEnabled,
}: LiveAttendanceScannerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const busyRef = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [status, setStatus] = useState("Camera not started");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [showManualSheet, setShowManualSheet] = useState(false);


    function triggerFeedback(type: "success" | "warning" | "manual" | "error") {
        if (soundEnabled) {
            const audio = new Audio(
                type === "success"
                    ? "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA"
                    : "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA"
            );
            audio.play().catch(() => { });
        }

        if (vibrationEnabled && "vibrate" in navigator) {
            if (type === "success") navigator.vibrate([120]);
            else if (type === "manual") navigator.vibrate([90, 40, 90]);
            else if (type === "warning") navigator.vibrate([80, 40, 80]);
            else navigator.vibrate([180]);
        }
    }

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    function stopCamera() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }

    function showTemporaryResult(nextResult: ScanResult) {
        if (nextResult.status === "recognized_auto") triggerFeedback("success");
        else if (nextResult.status === "manual") triggerFeedback("manual");
        else if (
            nextResult.status === "recognized_confirm" ||
            nextResult.status === "duplicate_blocked"
        )
            triggerFeedback("warning");
        else triggerFeedback("error");
        setResult(nextResult);
        setStatus(nextResult.message);
        setError(null);

        window.setTimeout(() => {
            setResult((current) => {
                if (!current) return null;
                if (current.message !== nextResult.message) return current;
                return null;
            });
        }, scanCooldownMs);
    }

    async function startCamera() {
        try {
            setIsStarting(true);
            setError(null);
            setStatus("Loading face models...");

            await loadFaceModels();

            setStatus("Requesting camera access...");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
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
            setStatus("Camera ready. Show one player at a time.");
            startRecognitionLoop();
        } catch (err) {
            console.error(err);
            setError("Could not access the camera.");
            setStatus("Camera failed to start.");
        } finally {
            setIsStarting(false);
        }
    }

    function startRecognitionLoop() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(async () => {
            if (!videoRef.current || busyRef.current || showManualSheet) return;

            try {
                busyRef.current = true;

                const allFaces = await detectAllFacesFromVideo(videoRef.current);

                if (allFaces.length === 0) {
                    setStatus("No face detected");
                    return;
                }

                if (allFaces.length > 1) {
                    setStatus("Only one face should be visible");
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

                const response = await fetch("/api/attendance/scan", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        descriptor: Array.from(detection.descriptor),
                    }),
                });

                const data = (await response.json()) as ScanResult | { error: string };

                if (!response.ok) {
                    throw new Error("error" in data ? data.error : "Scan failed");
                }

                const parsed = data as ScanResult;
                showTemporaryResult(parsed);

                await new Promise((resolve) =>
                    setTimeout(resolve, Math.max(scanCooldownMs, 1800))
                );
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Recognition failed");
            } finally {
                busyRef.current = false;
            }
        }, scanCooldownMs);
    }

    return (
        <>
            <ScanResultOverlay result={result} />

            <div className="space-y-4">
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

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-white/50">Scanner status</p>
                    <p className="mt-2 text-lg font-semibold">{status}</p>
                    {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isStarting || isReady}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
                    >
                        <Camera className="h-4 w-4" />
                        {isReady ? "Ready" : isStarting ? "Starting..." : "Start"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setResult(null);
                            setStatus("Scanner reset");
                            setError(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
                    >
                        <ScanFace className="h-4 w-4" />
                        Reset
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowManualSheet(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 font-medium text-blue-200"
                    >
                        <UserPlus className="h-4 w-4" />
                        Manual
                    </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                    <p>Show one player at a time.</p>
                    <p className="mt-2">Use Manual for twins or difficult matches.</p>
                    <p className="mt-2">Duplicate attendance is blocked for 60 minutes.</p>
                </div>
            </div>

            {showManualSheet ? (
                <ManualAttendanceSheet
                    players={players}
                    onClose={() => setShowManualSheet(false)}
                    onMarked={({ status, player, message }) => {
                        showTemporaryResult({
                            status,
                            matched: true,
                            player: {
                                id: player.id,
                                fullName: player.fullName,
                                ageGroup: null,
                            },
                            message,
                        });
                    }}
                />
            ) : null}
        </>
    );
}