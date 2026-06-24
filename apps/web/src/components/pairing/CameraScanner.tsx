"use client";

import type { ScanTarget } from "@/lib/parse-scan-payload";
import { parseScanPayload } from "@/lib/parse-scan-payload";
import type { ScanMethod } from "@/hooks/usePairingFlow";
import type { VehiclePairingSummary } from "@/lib/types/pairing";
import { formatVehicleTitle } from "@/lib/format";
import { Keyboard, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CameraScannerProps {
  target: ScanTarget;
  stepLabel: string;
  hint: string;
  subhint?: string;
  manualLabel?: string;
  vehicle?: VehiclePairingSummary | null;
  isLoading?: boolean;
  onScan: (value: string, method: ScanMethod) => void;
  onManual: () => void;
}

function Brackets() {
  const corner = "absolute size-[34px] border-[3px] border-white";
  return (
    <div className="relative h-[132px] w-[200px]">
      <span className={`${corner} top-0 left-0 rounded-tl-[10px] border-r-0 border-b-0`} />
      <span className={`${corner} top-0 right-0 rounded-tr-[10px] border-b-0 border-l-0`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-[10px] border-t-0 border-r-0`} />
      <span className={`${corner} bottom-0 right-0 rounded-br-[10px] border-t-0 border-l-0`} />
    </div>
  );
}

function barcodeFormats(target: ScanTarget) {
  return import("@zxing/library").then(({ BarcodeFormat, DecodeHintType }) => {
    const formats =
      target === "vin"
        ? [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.DATA_MATRIX,
          ]
        : [BarcodeFormat.QR_CODE];
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    return hints;
  });
}

export function CameraScanner({
  target,
  stepLabel,
  hint,
  subhint,
  manualLabel = "Enter manually",
  vehicle,
  isLoading,
  onScan,
  onManual,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const readerRef = useRef<InstanceType<
    Awaited<typeof import("@zxing/browser")>["BrowserMultiFormatReader"]
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    handledRef.current = false;
    setFlashOn(false);
    setFlashSupported(false);
    setStarting(true);
    setError(null);

    async function start() {
      const video = videoRef.current;
      if (!video) return;

      try {
        const [{ BrowserMultiFormatReader }, { NotFoundException }, hints] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
          barcodeFormats(target),
        ]);
        if (cancelled) return;

        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
        readerRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result, scanError) => {
            if (handledRef.current) return;
            if (scanError && !(scanError instanceof NotFoundException)) {
              return;
            }
            if (!result) {
              setScanning(true);
              return;
            }

            const parsed = parseScanPayload(result.getText(), target);
            if (!parsed) {
              setScanning(true);
              return;
            }

            setScanning(false);
            handledRef.current = true;
            controls.stop();
            onScanRef.current(parsed.value, parsed.method);
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;

        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        await video.play().catch(() => undefined);

        const stream = video.srcObject;
        if (stream instanceof MediaStream) {
          const track = stream.getVideoTracks()[0];
          const caps = track?.getCapabilities?.();
          if (caps && "torch" in caps) {
            setFlashSupported(true);
          }
        }

        setStarting(false);
        setScanning(true);
        setError(null);
      } catch {
        if (!cancelled) {
          setStarting(false);
          setError("Camera unavailable — use manual entry below.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
      const video = videoRef.current;
      if (video?.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, [target]);

  const toggleFlash = useCallback(async () => {
    const video = videoRef.current;
    if (!(video?.srcObject instanceof MediaStream) || !flashSupported) return;

    const track = video.srcObject.getVideoTracks()[0];
    if (!track) return;

    const next = !flashOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setFlashOn(next);
    } catch {
      setFlashSupported(false);
    }
  }, [flashOn, flashSupported]);

  const captureFrame = useCallback(async () => {
    if (handledRef.current || capturing || isLoading) {
      return;
    }

    const video = videoRef.current;
    const reader = readerRef.current;
    if (!video || !reader || video.videoWidth === 0) {
      return;
    }

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.drawImage(video, 0, 0);

      const image = new Image();
      image.src = canvas.toDataURL("image/jpeg", 0.92);
      await image.decode();

      const result = await reader.decodeFromImageElement(image);
      const parsed = parseScanPayload(result.getText(), target);
      if (!parsed) {
        setError("No barcode found — hold steady and try again, or enter manually.");
        return;
      }

      handledRef.current = true;
      controlsRef.current?.stop();
      onScanRef.current(parsed.value, parsed.method);
    } catch {
      setError("No barcode found — hold steady and try again, or enter manually.");
    } finally {
      setCapturing(false);
    }
  }, [capturing, isLoading, target]);

  const vehicleTitle = vehicle ? formatVehicleTitle(vehicle) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black pt-[42px]">
      <div className="absolute top-1.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
        {stepLabel}
      </div>

      <div className="relative z-10 shrink-0">
        {vehicle ? (
          <div className="mx-5 mb-2 flex items-center gap-2.5 rounded-[14px] bg-white/12 px-3.5 py-2.5 text-white backdrop-blur-sm">
            <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-white/18">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4H5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{vehicleTitle}</p>
              <p className="truncate font-mono text-[11px] opacity-80">
                {vehicle.vin} · pairing now
              </p>
            </div>
          </div>
        ) : null}

        <p className="px-8 pt-1.5 text-center text-sm font-medium text-white/92">
          {error ?? hint}
        </p>
        {subhint && !error ? (
          <p className="px-8 pt-0.5 pb-1 text-center text-xs font-normal text-white/70">
            {subhint}
          </p>
        ) : null}
        {!error && !starting ? (
          <p className="px-8 pb-1 text-center text-[11px] font-medium text-white/55">
            Auto-detects barcodes and QR codes — no button needed
          </p>
        ) : null}
      </div>

      <div className="relative flex min-h-[min(52dvh,420px)] min-w-full flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {starting ? (
          <div className="relative z-10 flex items-center justify-center bg-black/40">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        ) : error ? null : (
          <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3">
            <Brackets />
            {scanning ? (
              <div className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                <span className="size-2 animate-pulse rounded-full bg-green-400" />
                Scanning…
              </div>
            ) : null}
          </div>
        )}

        {flashSupported ? (
          <button
            type="button"
            onClick={() => void toggleFlash()}
            aria-label="Toggle flash"
            aria-pressed={flashOn}
            className={`absolute bottom-4 left-4 z-20 flex size-12 items-center justify-center rounded-full ${
              flashOn ? "bg-white/30" : "bg-black/40"
            } backdrop-blur-sm`}
          >
            <Zap className="size-[22px] text-white" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>

      <div className="relative z-10 shrink-0 bg-black/80 px-5 pt-4 pb-[max(22px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2.5">
          {!error ? (
            <button
              type="button"
              disabled={isLoading || capturing || starting}
              onClick={() => void captureFrame()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-[13px] font-semibold text-green-900 disabled:opacity-50"
            >
              {capturing ? "Reading…" : "Tap to scan"}
            </button>
          ) : null}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={isLoading}
              onClick={onManual}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/95 px-[18px] text-[13px] font-semibold text-green-900 disabled:opacity-50"
            >
              <Keyboard className="size-[18px]" strokeWidth={2} />
              {manualLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
