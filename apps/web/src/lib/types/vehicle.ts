export interface Vehicle {
  id: string;
  dealership_id: string;
  vin: string;
  stock_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  mileage: number | null;
  status: string | null;
  source_price: string | null;
  displayed_price: string | null;
  website_verified_price: string | null;
  price_type: string | null;
  source_type: string | null;
  source_url: string | null;
  vehicle_url: string | null;
  image_url: string | null;
  price_verified: boolean;
  sync_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithAssignment extends Vehicle {
  assigned_esl: string | null;
  assignment_id: string | null;
}
