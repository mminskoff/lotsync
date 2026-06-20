import { DataPageLayout } from "@/components/layout/DataPageLayout";
import { VehicleList } from "@/components/vehicles/VehicleList";

export default function VehiclesPage() {
  return (
    <DataPageLayout description="Inventory on the lot with ESL assignment status.">
      <VehicleList />
    </DataPageLayout>
  );
}
