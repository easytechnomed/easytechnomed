"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Check, X, Clock, ShieldCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/clientAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

export default function UserApproveTable({ initialUsers = [], roles = [] }) {
  const router = useRouter();
  const { hasPermission } = useAdminPermissions();
  const canApprove = hasPermission("APPROVAL_WRITE");
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingActionId, setPendingActionId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" }).then((r) => r.json());
    if (res.success) {
      toast.success("Logged out successfully");
      router.push(res.redirect);
      router.refresh();
    }
  };

  const handleApprove = async (userId) => {
    setPendingActionId({ id: userId, type: "approve" });
    startTransition(async () => {
      try {
        const res = await fetch("/api/approvals/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }).then((r) => r.json());
        if (res.success) {
          toast.success(res.message);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isApproved: true, rejected: false } : u
            )
          );
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Failed to approve user.");
      } finally {
        setPendingActionId(null);
      }
    });
  };

  const handleReject = async (userId) => {
    setPendingActionId({ id: userId, type: "reject" });
    startTransition(async () => {
      try {
        const res = await fetch("/api/approvals/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }).then((r) => r.json());
        if (res.success) {
          toast.success(res.message);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isApproved: false, rejected: true } : u
            )
          );
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Failed to reject user.");
      } finally {
        setPendingActionId(null);
      }
    });
  };

  const handleRoleChange = async (userId, roleId) => {
    setPendingActionId({ id: userId, type: "role" });
    startTransition(async () => {
      try {
        const res = await fetch("/api/approvals/change-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, roleId }),
        }).then((r) => r.json());
        if (res.success) {
          toast.success(res.message);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, roleId: res.user.roleId, role: res.user.role } : u
            )
          );
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Failed to change user role.");
      } finally {
        setPendingActionId(null);
      }
    });
  };

  // Filtering logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    let status = "pending";
    if (user.isApproved) status = "approved";
    if (user.rejected) status = "rejected";

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (user) => {
    if (user.rejected) {
      return (
        <Badge variant="danger" className="flex items-center gap-1 w-fit">
          <X className="h-3 w-3" /> Rejected
        </Badge>
      );
    }
    if (user.isApproved) {
      return (
        <Badge variant="success" className="flex items-center gap-1 w-fit">
          <Check className="h-3 w-3" /> Approved
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            User Approvals & Roles
          </h1>
          <p className="text-sm text-slate-500">
            Manage incoming registration requests and assign dynamic user roles
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <Button variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex-1 sm:flex-initial" onClick={() => router.push("/dashboard")}>
            Admin Dashboard
          </Button>
          <Button variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex-1 sm:flex-initial" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout Admin
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-white border-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <Card className="glass overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div>
                        <div className="font-semibold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      value={user.roleId}
                      disabled={(pendingActionId?.id === user.id && pendingActionId?.type === "role") || !canApprove}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      title={!canApprove ? "You do not have permission to change roles" : ""}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.isEmailVerified ? (
                      <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="bg-red-50 text-red-750 border-red-200">
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!user.isApproved && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApprove(user.id)}
                          disabled={!canApprove}
                          title={!canApprove ? "You do not have permission to approve users" : ""}
                          isLoading={
                            pendingActionId?.id === user.id &&
                            pendingActionId?.type === "approve"
                          }
                        >
                          Approve
                        </Button>
                      )}
                      {!user.rejected && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                          disabled={!canApprove}
                          title={!canApprove ? "You do not have permission to reject users" : ""}
                          isLoading={
                            pendingActionId?.id === user.id &&
                            pendingActionId?.type === "reject"
                          }
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No users found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
