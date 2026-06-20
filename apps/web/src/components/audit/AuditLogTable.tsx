import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types/audit";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDateTime(entry.created_at)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.action}</Badge>
              </TableCell>
              <TableCell>{entry.entity_type}</TableCell>
              <TableCell className="max-w-md truncate font-mono text-xs">
                {JSON.stringify(entry.metadata)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
