"use client";

import {
  createPairing,
  lookupDeviceByCode,
  lookupVehicleByVin,
  pushLabel,
  reassignPairing,
  unpairAssignment,
} from "@/lib/pairingApi";
import type {
  DeviceLookupResponse,
  PairingResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";
import { ApiError } from "@/lib/api";
import {
  getDealershipId,
  getDefaultDealershipId,
} from "@/lib/dealership-storage";
import { useCallback, useEffect, useRef, useState } from "react";

function resolveDealershipIdForRequest(override?: string): string {
  return override || getDealershipId() || getDefaultDealershipId();
}

function missingDealershipMessage(): string {
  return "Dev Dealership ID is missing. Open Settings and save your dealership UUID.";
}

export type PairingStep = "home" | "vin" | "esl" | "confirm" | "reassign" | "submitting" | "success";
export type PairingPhase = "scan" | "detail" | "manual" | "not-found";
export type ScanMethod = "manual" | "barcode" | "qr" | "nfc";

export interface PairingFlowCallbacks {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface PairingFlowOptions {
  initialVin?: string | null;
  initialEsl?: string | null;
  dealershipId?: string;
}

function hasAssignmentConflict(
  vehicleLookup: VehicleLookupResponse | null,
  deviceLookup: DeviceLookupResponse | null,
): boolean {
  if (!vehicleLookup || !deviceLookup) {
    return false;
  }

  const vehicleAssignment = vehicleLookup.active_assignment;
  const deviceAssignment = deviceLookup.active_assignment;

  if (!vehicleAssignment && !deviceAssignment) {
    return false;
  }

  if (
    vehicleAssignment &&
    deviceAssignment &&
    vehicleAssignment.id === deviceAssignment.id
  ) {
    return false;
  }

  return true;
}

export function usePairingFlow(
  callbacks: PairingFlowCallbacks = {},
  options: PairingFlowOptions = {},
) {
  const [step, setStep] = useState<PairingStep>(
    options.initialVin || options.initialEsl ? "vin" : "home",
  );
  const [vinPhase, setVinPhase] = useState<PairingPhase>("scan");
  const [eslPhase, setEslPhase] = useState<PairingPhase>("scan");
  const [vinInput, setVinInput] = useState(options.initialVin ?? "");
  const [deviceCodeInput, setDeviceCodeInput] = useState(options.initialEsl ?? "");
  const [vinScanMethod, setVinScanMethod] = useState<ScanMethod>("manual");
  const [eslScanMethod, setEslScanMethod] = useState<ScanMethod>("manual");
  const [vehicleLookup, setVehicleLookup] = useState<VehicleLookupResponse | null>(
    null,
  );
  const [deviceLookup, setDeviceLookup] = useState<DeviceLookupResponse | null>(
    null,
  );
  const [pairingResult, setPairingResult] = useState<PairingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [pairingDurationSec, setPairingDurationSec] = useState<number | null>(null);
  const pairingStartedAtRef = useRef<number | null>(null);

  const apiContext = { dealershipId: options.dealershipId };

  const submitVin = useCallback(
    async (value: string, method: ScanMethod) => {
      if (!pairingStartedAtRef.current) {
        pairingStartedAtRef.current = Date.now();
      }
      const trimmed = value.trim();
      if (!trimmed) {
        const message = "Enter a VIN to continue.";
        setError(message);
        setStatusMessage(message);
        callbacks.onError?.(message);
        return;
      }

      const dealershipId = resolveDealershipIdForRequest(options.dealershipId);
      if (!dealershipId) {
        const message = missingDealershipMessage();
        setError(message);
        setStatusMessage(message);
        callbacks.onError?.(message);
        return;
      }

      setIsLoading(true);
      setError(null);
      setStatusMessage("Looking up vehicle…");
      setVinInput(trimmed);
      setVinScanMethod(method);
      try {
        const result = await lookupVehicleByVin(trimmed, apiContext);
        setVehicleLookup(result);
        setStatusMessage(null);
        setVinPhase("detail");
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to look up vehicle";
        if (err instanceof ApiError && err.status === 404) {
          setVinPhase("not-found");
          setError(null);
          setStatusMessage(null);
        } else {
          setError(message);
          setStatusMessage(message);
          callbacks.onError?.(message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [callbacks, options.dealershipId],
  );

  const submitDeviceCode = useCallback(
    async (value: string, method: ScanMethod) => {
      const trimmed = value.trim();
      if (!trimmed) {
        const message = "Enter an ESL device code to continue.";
        setError(message);
        setStatusMessage(message);
        callbacks.onError?.(message);
        return;
      }

      const dealershipId = resolveDealershipIdForRequest(options.dealershipId);
      if (!dealershipId) {
        const message = missingDealershipMessage();
        setError(message);
        setStatusMessage(message);
        callbacks.onError?.(message);
        return;
      }

      setIsLoading(true);
      setError(null);
      setStatusMessage("Looking up ESL device…");
      setDeviceCodeInput(trimmed);
      setEslScanMethod(method);
      try {
        const result = await lookupDeviceByCode(trimmed, apiContext);
        setDeviceLookup(result);
        setStatusMessage(null);
        setEslPhase("detail");
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to look up ESL device";
        if (err instanceof ApiError && err.status === 404) {
          setEslPhase("not-found");
          setError(null);
          setStatusMessage(null);
        } else {
          setError(message);
          setStatusMessage(message);
          callbacks.onError?.(message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [callbacks, options.dealershipId],
  );

  const startPairing = useCallback(() => {
    setError(null);
    pairingStartedAtRef.current = Date.now();
    setPairingDurationSec(null);
    setStep("vin");
    setVinPhase("scan");
  }, []);

  const goHome = useCallback(() => {
    setStep("home");
    setVinPhase("scan");
    setEslPhase("scan");
    setError(null);
    setStatusMessage(null);
  }, []);

  const confirmVin = useCallback(() => {
    if (!vehicleLookup) {
      return;
    }
    setError(null);
    setStep("esl");
    setEslPhase("scan");
  }, [vehicleLookup]);

  const confirmDevice = useCallback(() => {
    if (!deviceLookup) {
      return;
    }
    setError(null);
    setStep("confirm");
  }, [deviceLookup]);

  const rescanVin = useCallback(() => {
    setError(null);
    setStatusMessage(null);
    setVehicleLookup(null);
    setVinInput("");
    setVinPhase("scan");
  }, []);

  const rescanDevice = useCallback(() => {
    setError(null);
    setStatusMessage(null);
    setDeviceLookup(null);
    setDeviceCodeInput("");
    setEslPhase("scan");
  }, []);

  const showManualVin = useCallback(() => {
    setError(null);
    setVinPhase("manual");
  }, []);

  const showManualDevice = useCallback(() => {
    setError(null);
    setEslPhase("manual");
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    if (step === "reassign") {
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      setStep("esl");
      setEslPhase(deviceLookup ? "detail" : "scan");
      return;
    }
    if (step === "esl") {
      if (eslPhase === "detail") {
        setEslPhase("scan");
        setDeviceLookup(null);
        return;
      }
      if (eslPhase === "manual") {
        setEslPhase("scan");
        return;
      }
      setStep("vin");
      setVinPhase(vehicleLookup ? "detail" : "scan");
    }
  }, [step, eslPhase, deviceLookup, vehicleLookup]);

  const backToVinScan = useCallback(() => {
    setError(null);
    setStep("vin");
    setVinPhase(vehicleLookup ? "detail" : "scan");
  }, [vehicleLookup]);

  const backFromManualVin = useCallback(() => {
    setError(null);
    setVinPhase("scan");
  }, []);

  const backFromManualDevice = useCallback(() => {
    setError(null);
    setEslPhase("scan");
  }, []);

  const backFromVinDetail = useCallback(() => {
    rescanVin();
  }, [rescanVin]);

  const executePair = useCallback(
    async (forceReassign: boolean) => {
      if (!vehicleLookup || !deviceLookup) {
        return;
      }

      setStep("submitting");
      setIsLoading(true);
      setError(null);
      setShowReassignDialog(false);

      const vin = vehicleLookup.vehicle.vin;
      const deviceCode = deviceLookup.device.device_id;
      const scanType = eslScanMethod === "manual" ? "manual" : eslScanMethod;

      try {
        let result: PairingResponse;

        if (forceReassign) {
          result = await reassignPairing(
            {
              device_code: deviceCode,
              new_vin: vin,
              scan_type: scanType,
            },
            apiContext,
          );
        } else {
          result = await createPairing(
            {
              vin,
              device_code: deviceCode,
              force_reassign: false,
              scan_type: scanType,
            },
            apiContext,
          );
        }

        setPairingResult(result);
        if (pairingStartedAtRef.current) {
          setPairingDurationSec(
            Math.max(1, Math.round((Date.now() - pairingStartedAtRef.current) / 1000)),
          );
        }
        setStep("success");
        callbacks.onSuccess?.("Tag paired successfully");
      } catch (err) {
        if (err instanceof ApiError && err.status === 409 && !forceReassign) {
          setStep("reassign");
          return;
        }
        const message =
          err instanceof ApiError ? err.message : "Failed to create pairing";
        setError(message);
        setStep("confirm");
        callbacks.onError?.(message);
      } finally {
        setIsLoading(false);
      }
    },
    [vehicleLookup, deviceLookup, eslScanMethod, callbacks, options.dealershipId],
  );

  const requestPair = useCallback(() => {
    if (hasAssignmentConflict(vehicleLookup, deviceLookup)) {
      setStep("reassign");
      return;
    }
    void executePair(false);
  }, [vehicleLookup, deviceLookup, executePair]);

  const confirmReassign = useCallback(() => {
    void executePair(true);
  }, [executePair]);

  const dismissReassignDialog = useCallback(() => {
    setShowReassignDialog(false);
  }, []);

  const unpair = useCallback(async () => {
    if (!pairingResult) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await unpairAssignment(pairingResult.assignment_id, apiContext);
      callbacks.onSuccess?.("Tag unpaired");
      setPairingResult(null);
      setStep("home");
      setVinPhase("scan");
      setEslPhase("scan");
      setVehicleLookup(null);
      setDeviceLookup(null);
      setVinInput("");
      setDeviceCodeInput("");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to unpair tag";
      setError(message);
      callbacks.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [pairingResult, callbacks, options.dealershipId]);

  const resyncTag = useCallback(async () => {
    if (!pairingResult) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await pushLabel(pairingResult.vehicle.id, apiContext);
      setPairingResult({
        ...pairingResult,
        sync_event: result.sync_event,
      });
      callbacks.onSuccess?.("Label sync queued");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to queue label sync";
      setError(message);
      callbacks.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [pairingResult, callbacks, options.dealershipId]);

  const reset = useCallback(() => {
    setStep("home");
    setVinPhase("scan");
    setEslPhase("scan");
    setVinInput("");
    setDeviceCodeInput("");
    setVehicleLookup(null);
    setDeviceLookup(null);
    setPairingResult(null);
    setPairingDurationSec(null);
    pairingStartedAtRef.current = null;
    setError(null);
    setStatusMessage(null);
    setShowReassignDialog(false);
  }, []);

  const updateVinInput = useCallback((value: string) => {
    setVinInput(value);
    setError(null);
  }, []);

  const updateDeviceCodeInput = useCallback((value: string) => {
    setDeviceCodeInput(value);
    setError(null);
  }, []);

  const initialVinHandled = useRef(false);
  useEffect(() => {
    if (initialVinHandled.current || !options.initialVin) {
      return;
    }
    if (!resolveDealershipIdForRequest(options.dealershipId)) {
      return;
    }
    initialVinHandled.current = true;
    void submitVin(options.initialVin, "qr");
  }, [options.initialVin, options.dealershipId, submitVin]);

  const initialEslHandled = useRef(false);
  useEffect(() => {
    if (
      initialEslHandled.current ||
      !options.initialEsl ||
      step !== "esl" ||
      eslPhase !== "scan" ||
      !vehicleLookup
    ) {
      return;
    }
    if (!resolveDealershipIdForRequest(options.dealershipId)) {
      return;
    }
    initialEslHandled.current = true;
    void submitDeviceCode(options.initialEsl, "qr");
  }, [
    options.initialEsl,
    options.dealershipId,
    step,
    eslPhase,
    vehicleLookup,
    submitDeviceCode,
  ]);

  const warnings = [
    ...(vehicleLookup?.warnings ?? []),
    ...(deviceLookup?.warnings ?? []),
  ];

  return {
    step,
    vinPhase,
    eslPhase,
    vinInput,
    deviceCodeInput,
    updateVinInput,
    updateDeviceCodeInput,
    vinScanMethod,
    eslScanMethod,
    vehicleLookup,
    deviceLookup,
    pairingResult,
    pairingDurationSec,
    error,
    statusMessage,
    isLoading,
    showReassignDialog,
    warnings,
    submitVin,
    submitDeviceCode,
    confirmVin,
    confirmDevice,
    rescanVin,
    rescanDevice,
    showManualVin,
    showManualDevice,
    goBack,
    backToVinScan,
    backFromManualVin,
    backFromManualDevice,
    backFromVinDetail,
    requestPair,
    confirmReassign,
    dismissReassignDialog,
    unpair,
    resyncTag,
    reset,
    startPairing,
    goHome,
  };
}
