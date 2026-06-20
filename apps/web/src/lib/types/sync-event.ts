export interface SyncEvent {
  id: string;
  dealership_id: string;
  vehicle_id: string | null;
  esl_device_id: string | null;
  event_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}
