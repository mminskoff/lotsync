"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { ConfirmPairingStep } from "@/components/pairing/ConfirmPairingStep";
import { EslDetailStep } from "@/components/pairing/EslDetailStep";
import { EslNotFoundStep } from "@/components/pairing/EslNotFoundStep";
import { EslScanStep } from "@/components/pairing/EslScanStep";
import { PairHomeStep } from "@/components/pairing/PairHomeStep";
import { PairingSuccessStep } from "@/components/pairing/PairingSuccessStep";
import { ReassignWarningStep } from "@/components/pairing/ReassignWarningStep";
import { VinDetailStep } from "@/components/pairing/VinDetailStep";
import { VinNotFoundStep } from "@/components/pairing/VinNotFoundStep";
import { VinScanStep } from "@/components/pairing/VinScanStep";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePairingFlow } from "@/hooks/usePairingFlow";
import { useDealership } from "@/providers/DealershipProvider";

function PairingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialVin = searchParams.get("vin");
  const initialEsl = searchParams.get("esl");
  const { dealershipId } = useDealership();

  const callbacks = useMemo(
    () => ({
      onSuccess: (message: string) => toast.success(message),
      onError: (message: string) => toast.error(message),
    }),
    [],
  );

  const flow = usePairingFlow(callbacks, {
    initialVin,
    initialEsl,
    dealershipId,
  });

  let stepContent: React.ReactNode;

  if (flow.step === "submitting") {
    stepContent = (
      <div className="space-y-4 px-5 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-[52px] w-full rounded-xl" />
        <p className="text-center text-sm text-muted-foreground">Creating pairing…</p>
      </div>
    );
  } else if (flow.step === "home") {
    stepContent = (
      <PairHomeStep
        onStartPairing={flow.startPairing}
        onLookup={() => router.push("/vehicles")}
        onRecent={() => router.push("/audit-log")}
      />
    );
  } else if (flow.step === "success" && flow.pairingResult) {
    stepContent = (
      <PairingSuccessStep
        result={flow.pairingResult}
        pairingDurationSec={flow.pairingDurationSec}
        isLoading={flow.isLoading}
        error={flow.error}
        onResync={() => void flow.resyncTag()}
        onUnpair={() => void flow.unpair()}
        onReset={flow.reset}
        onDone={flow.goHome}
      />
    );
  } else if (
    flow.step === "reassign" &&
    flow.vehicleLookup &&
    flow.deviceLookup
  ) {
    stepContent = (
      <ReassignWarningStep
        vehicleLookup={flow.vehicleLookup}
        deviceLookup={flow.deviceLookup}
        isLoading={flow.isLoading}
        onConfirm={flow.confirmReassign}
        onScanDifferent={flow.rescanDevice}
      />
    );
  } else if (flow.step === "confirm" && flow.vehicleLookup && flow.deviceLookup) {
    stepContent = (
      <ConfirmPairingStep
        vehicleLookup={flow.vehicleLookup}
        deviceLookup={flow.deviceLookup}
        warnings={flow.warnings}
        error={flow.error}
        isLoading={flow.isLoading}
        onBack={flow.goBack}
        onConfirm={flow.requestPair}
      />
    );
  } else if (flow.step === "esl" && flow.vehicleLookup) {
    if (flow.eslPhase === "not-found") {
      stepContent = (
        <EslNotFoundStep
          deviceCode={flow.deviceCodeInput}
          onScanAgain={flow.rescanDevice}
          onManual={flow.showManualDevice}
          onBack={flow.backToVinScan}
        />
      );
    } else if (flow.eslPhase === "detail" && flow.deviceLookup) {
      stepContent = (
        <EslDetailStep
          vehicleLookup={flow.vehicleLookup}
          deviceLookup={flow.deviceLookup}
          isLoading={flow.isLoading}
          onContinue={flow.confirmDevice}
          onRescan={flow.rescanDevice}
          onBack={flow.backToVinScan}
        />
      );
    } else {
      stepContent = (
        <EslScanStep
          phase={flow.eslPhase}
          vehicleLookup={flow.vehicleLookup}
          value={flow.deviceCodeInput}
          onValueChange={flow.updateDeviceCodeInput}
          isLoading={flow.isLoading}
          statusMessage={flow.statusMessage}
          error={flow.error}
          onSubmit={(value, method) => void flow.submitDeviceCode(value, method)}
          onManual={flow.showManualDevice}
          onBackFromManual={flow.backFromManualDevice}
          onBack={flow.backToVinScan}
        />
      );
    }
  } else if (flow.step === "vin") {
    if (flow.vinPhase === "not-found") {
      stepContent = (
        <VinNotFoundStep
          vin={flow.vinInput}
          onScanAgain={flow.rescanVin}
          onManual={flow.showManualVin}
          onBack={flow.goHome}
        />
      );
    } else if (flow.vinPhase === "detail" && flow.vehicleLookup) {
      stepContent = (
        <VinDetailStep
          vehicleLookup={flow.vehicleLookup}
          isLoading={flow.isLoading}
          onContinue={flow.confirmVin}
          onRescan={flow.rescanVin}
        />
      );
    } else {
      stepContent = (
        <VinScanStep
          phase={flow.vinPhase}
          value={flow.vinInput}
          onValueChange={flow.updateVinInput}
          pendingEsl={initialEsl}
          isLoading={flow.isLoading}
          statusMessage={flow.statusMessage}
          error={flow.error}
          onSubmit={(value, method) => void flow.submitVin(value, method)}
          onManual={flow.showManualVin}
          onBackFromManual={flow.backFromManualVin}
          onBack={flow.goHome}
        />
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!dealershipId ? (
        <Alert variant="destructive" className="mx-4 mb-4 mt-2">
          <AlertTitle>Dealership ID required</AlertTitle>
          <AlertDescription>
            Open{" "}
            <Link href="/settings" className="font-medium underline">
              Settings
            </Link>{" "}
            and save your Dev Dealership ID before continuing.
          </AlertDescription>
        </Alert>
      ) : null}

      {stepContent}
    </div>
  );
}

export default function PairingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 px-5 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      }
    >
      <PairingPageContent />
    </Suspense>
  );
}
