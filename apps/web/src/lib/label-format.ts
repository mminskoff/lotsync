import { formatPrice } from "@/lib/format";

export interface LabelVehicle {
  vin: string;
  stock_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  mileage: number | null;
  status: string | null;
  displayed_price: string | null;
  source_price: string | null;
  vehicle_url: string | null;
}

export function splitModelTrim(vehicle: LabelVehicle): { model: string | null; trim: string | null } {
  if (vehicle.trim) {
    return { model: vehicle.model, trim: vehicle.trim };
  }
  if (!vehicle.model) {
    return { model: null, trim: null };
  }
  const parts = vehicle.model.split(" ");
  if (parts.length <= 1) {
    return { model: vehicle.model, trim: null };
  }
  return { model: parts[0], trim: parts.slice(1).join(" ") };
}

export function labelVehicleName(vehicle: LabelVehicle): string {
  const { model } = splitModelTrim(vehicle);
  return [vehicle.year, vehicle.make, model].filter(Boolean).join(" ");
}

export function labelTrim(vehicle: LabelVehicle): string | null {
  return splitModelTrim(vehicle).trim;
}

export function labelPriceParts(vehicle: LabelVehicle): { whole: string; formatted: string } {
  const raw = vehicle.displayed_price ?? vehicle.source_price;
  const formatted = formatPrice(raw);
  if (formatted === "—") {
    return { whole: "Call for price", formatted: "—" };
  }
  const numeric = formatted.replace(/^\$/, "");
  return { whole: numeric, formatted };
}

export function labelPreviousPrice(vehicle: LabelVehicle): string | null {
  const current = vehicle.displayed_price ?? vehicle.source_price;
  if (!vehicle.source_price || !current) return null;
  if (Number(vehicle.source_price) > Number(current)) {
    return formatPrice(vehicle.source_price);
  }
  return null;
}

export function labelSpecs(vehicle: LabelVehicle): string[] {
  const parts: string[] = [];
  if (vehicle.mileage != null) {
    parts.push(`${vehicle.mileage.toLocaleString()} mi`);
  }
  return parts;
}

export type LabelStatusKind = "available" | "prep" | "price_reduced" | "sold" | "other";

export function labelStatus(vehicle: LabelVehicle): { kind: LabelStatusKind; label: string } {
  const status = (vehicle.status ?? "available").toLowerCase();
  if (status === "sold") {
    return { kind: "sold", label: "Available" };
  }
  if (labelPreviousPrice(vehicle)) {
    return { kind: "price_reduced", label: "Price Reduced" };
  }
  if (status === "available" || status === "active") {
    return { kind: "available", label: "Available" };
  }
  if (status === "prep") {
    return { kind: "prep", label: "Prep" };
  }
  return {
    kind: "other",
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export function labelQrValue(vehicle: LabelVehicle): string {
  return vehicle.vehicle_url ?? `https://lotsync.app/v/${vehicle.vin}`;
}
