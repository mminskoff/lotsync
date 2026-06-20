export type ScanType = "barcode" | "qr" | "nfc" | "manual";
export type AssignmentSource = "mobile_app" | "web_pwa" | "api" | "automation";

export interface DealershipScope {
  organization_id: string | null;
  dealership_id: string;
}

export interface VehiclePairingSummary {
  id: string;
  dealership_id: string;
  vin: string;
  stock_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  displayed_price: string | null;
  status: string | null;
  sync_status: string | null;
  image_url?: string | null;
}

export interface ESLDevicePairingSummary {
  id: string;
  dealership_id: string;
  device_id: string;
  provider: string | null;
  model: string | null;
  battery_level: number | null;
  signal_status: string | null;
  status: string | null;
}

export interface AssignmentSummary {
  id: string;
  status: string;
  assignment_source: string;
  scan_type: string | null;
  nfc_uid: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  vehicle: VehiclePairingSummary;
  device: ESLDevicePairingSummary;
}

export interface SyncEventSummary {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
}

export interface VehicleLookupResponse extends DealershipScope {
  vehicle: VehiclePairingSummary;
  active_assignment: AssignmentSummary | null;
  warnings: string[];
}

export interface DeviceLookupResponse extends DealershipScope {
  device: ESLDevicePairingSummary;
  active_assignment: AssignmentSummary | null;
  warnings: string[];
}

export interface PairingCreateBody {
  vin: string;
  device_code: string;
  force_reassign?: boolean;
  scan_type?: ScanType | null;
  nfc_uid?: string | null;
  assignment_source?: AssignmentSource;
}

export interface PairingReassignBody {
  device_code: string;
  new_vin: string;
  force_reassign?: boolean;
  scan_type?: ScanType | null;
  nfc_uid?: string | null;
  assignment_source?: AssignmentSource;
}

export interface PairingResponse extends DealershipScope {
  assignment_id: string;
  status: "paired" | "reassigned";
  vehicle: VehiclePairingSummary;
  device: ESLDevicePairingSummary;
  sync_event: SyncEventSummary;
  assignment_source: string;
  scan_type: string | null;
  nfc_uid: string | null;
}

export interface UnpairResponse extends DealershipScope {
  assignment_id: string;
  status: "unpaired";
  unassigned_at: string;
  vehicle: VehiclePairingSummary;
  device: ESLDevicePairingSummary;
  sync_event: SyncEventSummary | null;
}

export interface ActivePairingsResponse extends DealershipScope {
  pairings: AssignmentSummary[];
}

export interface PushLabelResponse extends DealershipScope {
  vehicle_id: string;
  sync_event: SyncEventSummary;
}
