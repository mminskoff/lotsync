import { createClient } from "@/lib/supabase/client";

export async function fetchUserDealershipId(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("dealership_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.dealership_id) {
    return null;
  }

  return data.dealership_id;
}
