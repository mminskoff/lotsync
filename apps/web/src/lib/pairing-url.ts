export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export function pairingEslQrUrl(deviceCode: string): string {
  return `${getAppBaseUrl()}/pairing?esl=${encodeURIComponent(deviceCode)}`;
}

export function pairingVinQrUrl(vin: string): string {
  return `${getAppBaseUrl()}/pairing?vin=${encodeURIComponent(vin)}`;
}
