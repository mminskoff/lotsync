export interface ESLDevice {
  id: string;
  dealership_id: string;
  device_id: string;
  provider: string | null;
  provider_device_id: string | null;
  model: string | null;
  screen_width: number | null;
  screen_height: number | null;
  battery_level: number | null;
  signal_status: string | null;
  gateway_id: string | null;
  status: string | null;
  last_seen_at: string | null;
  last_updated_at: string | null;
  created_at: string;
}
