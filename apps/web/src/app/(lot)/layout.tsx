import { LotShell } from "@/components/layout/LotShell";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function LotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <LotShell>{children}</LotShell>
    </RequireAuth>
  );
}
