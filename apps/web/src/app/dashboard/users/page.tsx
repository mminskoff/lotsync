"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireUserManager } from "@/components/auth/RequireUserManager";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleLabel, type LotRole } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";
import { useDealership } from "@/providers/DealershipProvider";

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function UsersAdminContent() {
  const { session } = useAuth();
  const { dealershipId } = useDealership();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<LotRole>("lot_staff");
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!dealershipId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/users?dealershipId=${encodeURIComponent(dealershipId)}`,
      );
      const payload = (await response.json()) as {
        users?: AdminUserRow[];
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to load users");
      }
      setUsers(payload.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!dealershipId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, dealershipId }),
      });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to send invite");
      }
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      setRole("lot_staff");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invite";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!dealershipId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, dealershipId }),
      });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to create user");
      }
      toast.success(`Created ${email} — share the password with them`);
      setEmail("");
      setPassword("");
      setRole("lot_staff");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions: LotRole[] =
    session?.role === "owner" ? ["lot_staff", "manager", "owner"] : ["lot_staff", "manager"];

  const roleField = (
    <div className="space-y-2">
      <Label htmlFor="user-role">Role</Label>
      <Select value={role} onValueChange={(v) => setRole(v as LotRole)}>
        <SelectTrigger id="user-role" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {roleLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Team"
        description="Invite your partner by email — they'll get a link to choose their own password."
      />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <Tabs defaultValue="invite">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="invite" className="flex-1">
                Email invite
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Set password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite">
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold">Send invite email</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    They&apos;ll receive an email with a link to set their password and sign in.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    autoComplete="off"
                    placeholder="partner@dealership.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {roleField}

                <Button type="submit" className="w-full" disabled={submitting || !dealershipId}>
                  {submitting ? "Sending…" : "Send invite email"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manual">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold">Create with password</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You choose the password and share it with them directly.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-email">Email</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    autoComplete="off"
                    placeholder="lot@dealership.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-password">Temporary password</Label>
                  <Input
                    id="manual-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {roleField}

                <Button type="submit" className="w-full" disabled={submitting || !dealershipId}>
                  {submitting ? "Creating…" : "Create & share login"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Team members</h2>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No users yet for this rooftop.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{roleLabel(user.role as LotRole)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {session?.email !== user.email ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={submitting}
                          onClick={async () => {
                            if (!dealershipId) return;
                            if (!confirm(`Remove ${user.email}? You can invite them again after.`)) {
                              return;
                            }
                            setSubmitting(true);
                            setError(null);
                            try {
                              const response = await fetch(
                                `/api/admin/users/${user.id}?dealershipId=${encodeURIComponent(dealershipId)}`,
                                { method: "DELETE" },
                              );
                              const payload = (await response.json()) as { detail?: string };
                              if (!response.ok) {
                                throw new Error(payload.detail ?? "Failed to delete user");
                              }
                              toast.success(`Removed ${user.email}`);
                              await loadUsers();
                            } catch (err) {
                              const message =
                                err instanceof Error ? err.message : "Failed to delete user";
                              setError(message);
                              toast.error(message);
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardUsersPage() {
  return (
    <RequireUserManager>
      <UsersAdminContent />
    </RequireUserManager>
  );
}
