export interface Dealership {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  status: string;
  organization_id: string | null;
  created_at: string;
}

export interface RooftopGroup {
  organization_id: string | null;
  organization_name: string;
  dealerships: Dealership[];
}

export interface AccessibleDealershipsResponse {
  groups: RooftopGroup[];
  active_organization_id: string | null;
  active_dealership_id: string;
}
