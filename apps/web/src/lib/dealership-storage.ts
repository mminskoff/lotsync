const STORAGE_KEY = "lotsync_dealership_id";

export function getDealershipId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored;
    }
  }
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}

export function setDealershipId(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, id.trim());
  }
}

export function getDefaultDealershipId(): string {
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}
