import { DataPageLayout } from "@/components/layout/DataPageLayout";
import { AuditLogList } from "@/components/audit/AuditLogList";

export default function AuditLogPage() {
  return (
    <DataPageLayout description="Pairing, reassignment, unpair, and sync activity.">
      <AuditLogList />
    </DataPageLayout>
  );
}
