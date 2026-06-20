import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types/audit";

const PAIRING_ACTIONS = new Set([
  "pairing.create",
  "pairing.reassign",
  "pairing.unpair",
  "sync_event.create",
]);

function actionLabel(action: string): string {
  return action.replaceAll(".", " ");
}

export function AuditLogCard({ entry }: { entry: AuditLogEntry }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{actionLabel(entry.action)}</CardTitle>
          <Badge variant="outline">{entry.entity_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{formatDateTime(entry.created_at)}</p>
        {entry.entity_id ? (
          <p className="font-mono text-xs">{entry.entity_id}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function filterPairingAuditLogs(entries: AuditLogEntry[]): AuditLogEntry[] {
  return entries
    .filter((entry) => PAIRING_ACTIONS.has(entry.action))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}
