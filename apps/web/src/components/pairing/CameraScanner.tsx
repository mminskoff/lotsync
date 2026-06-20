"use client";

import type { ScanTarget } from "@/lib/parse-scan-payload";
import { parseScanPayload } from "@/lib/parse-scan-payload";
import type { ScanMethod } from "@/hooks/usePairingFlow";
import type { VehiclePairingSummary } from "@/lib/types/pairing";
import { formatVehicleTitle } from "@/lib/format";
import { Keyboard, Zap } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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
      <div className="absolute right-2 left-2 h-0.5 animate-scan-sweep bg-green-400 shadow-[0_0_12px_2px_var(--green-400)]" />
    </div>
  );
}

function CamTool({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <div
        className={`flex size-12 items-center justify-center rounded-full ${
          active ? "bg-white/30" : "bg-white/14"
        }`}
      >
        {children}
      </div>
      <span className="text-[11px] text-white/85">{label}</span>
    </>
  );

  if (!onClick) {
    return <div className="flex flex-col items-center gap-1.5">{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
      aria-label={label}
      aria-pressed={active}
    >
      {inner}
    </button>
  );
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
  const containerId = useId().replace(/:/g, "");
  const scannerRef = useRef<{ stop: () => Promise<void>; getRunningTrackCapabilities: () => MediaTrackCapabilities; applyVideoConstraints: (c: MediaTrackConstraints) => Promise<void> } | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    handledRef.current = false;
    setFlashOn(false);
    setFlashSupported(false);

    async function start() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (cancelled) return;

        const formats =
          target === "vin"
            ? [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.DATA_MATRIX,
              ]
            : [Html5QrcodeSupportedFormats.QR_CODE];

        const scanner = new Html5Qrcode(containerId, { formatsToSupport: formats, verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 280 } },
          (decodedText) => {
            if (handledRef.current) return;
            const parsed = parseScanPayload(decodedText, target);
            if (!parsed) return;
            handledRef.current = true;
            void scanner.stop().finally(() => {
              onScanRef.current(parsed.value, parsed.method);
            });
          },
          () => undefined,
        );

        if (!cancelled) {
          setStarting(false);
          setError(null);
          try {
            const caps = scanner.getRunningTrackCapabilities();
            setFlashSupported("torch" in caps);
          } catch {
            setFlashSupported(false);
          }
        }
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
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) void scanner.stop().catch(() => undefined);
    };
  }, [containerId, target]);

  const toggleFlash = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !flashSupported) return;
    const next = !flashOn;
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setFlashOn(next);
    } catch {
      setFlashSupported(false);
    }
  }, [flashOn, flashSupported]);

  const vehicleTitle = vehicle ? formatVehicleTitle(vehicle) : null;
  const cameraReady = !starting && !error;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_50%_35%,#2b332e_0%,#161b18_60%,#0c100e_100%)] pt-[42px]">
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

        <p className="px-8 pt-1.5 text-center text-sm font-medium text-white/92">{error ?? hint}</p>
        {subhint && !error ? (
          <p className="px-8 pt-0.5 pb-1 text-center text-xs font-normal text-white/70">{subhint}</p>
        ) : null}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div
          id={containerId}
          className={`absolute inset-0 overflow-hidden [&_video]:size-full [&_video]:object-cover ${
            cameraReady ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {starting ? (
          <div className="relative z-10 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        ) : (
          <div className="relative z-10">
            <Brackets />
          </div>
        )}
      </div>

      <div className="relative z-10 shrink-0 px-5 pt-4 pb-[max(22px,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-[320px] grid-cols-[48px_1fr_48px] items-end gap-3">
          <div className="flex justify-center">
            {flashSupported ? (
              <CamTool label="Flash" onClick={() => void toggleFlash()} active={flashOn}>
                <Zap className="size-[22px] text-white" strokeWidth={1.8} />
              </CamTool>
            ) : null}
          </div>

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

          {/* Balance column so manual stays centered when flash is visible */}
          <div aria-hidden className="size-12" />
        </div>
      </div>
    </div>
  );
}
