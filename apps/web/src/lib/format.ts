export function formatVehicleLabel(
  year: number | null,
  make: string | null,
  model: string | null,
): string {
  return [year, make, model].filter(Boolean).join(" ") || "Unknown vehicle";
}

export function formatVehicleTitle(vehicle: {
  vin: string;
  stock_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
}): string {
  const label = formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model);
  if (label !== "Unknown vehicle") {
    return label;
  }
  if (vehicle.stock_number) {
    return `Stock ${vehicle.stock_number}`;
  }
  return vehicle.vin;
}

export function formatPrice(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
