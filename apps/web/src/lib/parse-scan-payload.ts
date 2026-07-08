import type { ScanMethod } from "@/hooks/usePairingFlow";

export type ScanTarget = "vin" | "esl";

export interface ParsedScan {
  value: string;
  method: ScanMethod;
}

export function parseScanPayload(
  raw: string,
  target: ScanTarget,
): ParsedScan | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (target === "vin") {
      const vin = url.searchParams.get("vin");
      if (vin?.trim()) {
        return { value: vin.trim().toUpperCase(), method: "qr" };
      }
    }
    if (target === "esl") {
      const esl = url.searchParams.get("esl");
      if (esl?.trim()) {
        return { value: esl.trim().toUpperCase(), method: "qr" };
      }
    }
  } catch {
    // not a URL
  }

  if (target === "esl") {
    const normalized = trimmed.toUpperCase();
    // Minew hardware IDs (e.g. E100000A1525)
    if (/^E[0-9A-F]{10,}$/i.test(normalized)) {
      return { value: normalized, method: "barcode" };
    }
    // Full rooftop codes (e.g. DOVERDO-ESL-009) — must not truncate to ESL-009
    if (/^[A-Z0-9]+-ESL-[A-Z0-9-]+$/.test(normalized)) {
      return { value: normalized, method: "barcode" };
    }
    const eslMatch = trimmed.match(/ESL-[\w-]+/i);
    if (eslMatch) {
      return { value: eslMatch[0].toUpperCase(), method: "barcode" };
    }
  }

  if (target === "vin") {
    const vinMatch = trimmed.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) {
      return { value: vinMatch[0].toUpperCase(), method: "barcode" };
    }
    if (/^[A-HJ-NPR-Z0-9]{11,17}$/i.test(trimmed)) {
      return { value: trimmed.toUpperCase(), method: "barcode" };
    }
  }

  if (trimmed.length >= 3) {
    return {
      value: trimmed.toUpperCase(),
      method: target === "esl" ? "barcode" : "barcode",
    };
  }

  return null;
}
