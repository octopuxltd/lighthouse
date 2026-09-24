"use client";

import { useEffect, useRef, useState } from "react";
// Type-only import (erased at build), so the heavy library never loads during
// server render — the runtime import happens inside the effect, client-only.
import type { GestureRecognizer } from "@mediapipe/tasks-vision";

// Self-hosted MediaPipe assets (see public/mediapipe). Nothing third-party is
// fetched at runtime; the webcam frames never leave the browser.
const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/gesture_recognizer.task";
const THUMB_UP = "Thumb_Up"; // MediaPipe's category name
const CONFIDENCE = 0.6; // a genuine thumbs-up, not just a hand in frame
// A tolerant accumulator instead of a strict consecutive-frame streak: a
// thumbs-up adds charge, anything else bleeds it away, so a sustained gesture
// unlocks while a hand drifting past (or a one-frame flicker) does not.
const UNLOCK_AT = 5;

function cameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError") return "Camera access was denied.";
  if (name === "NotFoundError") return "No camera was found.";
  return "The camera could not be started.";
}

export default function ThumbUnlock({
  onUnlock,
  onClose,
}: {
  onUnlock: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Starting the camera…");
  const [error, setError] = useState<string | null>(null);

  // Keep the latest onUnlock without restarting the camera on every re-render.
  const onUnlockRef = useRef(onUnlock);
  useEffect(() => {
    onUnlockRef.current = onUnlock;
  }, [onUnlock]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let recognizer: GestureRecognizer | null = null;
    let raf = 0;
    let cancelled = false;
    let lastVideoTime = -1;
    let charge = 0; // builds on thumbs-up frames, decays otherwise

    async function start() {
      try {
        const { GestureRecognizer, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (cancelled) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (cancelled) return;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("Give a thumbs up 👍");

        const tick = () => {
          if (cancelled || !recognizer) return;
          const video = videoRef.current;
          if (video && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = recognizer.recognizeForVideo(video, performance.now());
            const top = result.gestures?.[0]?.[0];
            const name = top?.categoryName ?? "none";
            const score = top?.score ?? 0;

            const isThumb = name === THUMB_UP && score >= CONFIDENCE;
            charge = isThumb
              ? Math.min(UNLOCK_AT, charge + 1)
              : Math.max(0, charge - 1);
            if (charge >= UNLOCK_AT) {
              onUnlockRef.current();
              return; // matched — parent will unmount this panel
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        if (!cancelled) setError(cameraError(e));
      }
    }

    start();

    // Tear everything down: stop the camera, free the model, cancel the loop.
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      recognizer?.close();
    };
  }, []);

  return (
    <div className="camera">
      {error ? (
        <p className="camera-status">{error}</p>
      ) : (
        <>
          {/* Mirrored so it reads like a mirror (styled in globals.css). */}
          <video ref={videoRef} className="camera-video" muted playsInline />
          <span className="camera-caption">{status}</span>
        </>
      )}
      <button
        type="button"
        className="camera-close"
        onClick={onClose}
        aria-label="Close the camera"
      >
        ×
      </button>
    </div>
  );
}
