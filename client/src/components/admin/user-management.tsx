import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Eye, 
  CreditCard,
  FileText,
  Shield,
  AlertTriangle,
  Ban,
  ShieldOff
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  kycStatus: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasVirtualCard: boolean;
  balance: string;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", { page, status, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status && status !== "all" && { status }),
        ...(search && { search }),
      });
      const response = await apiRequest("GET", `/api/admin/users?${params}`);
      return response.json();
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Banned",
        description: "User has been successfully banned",
      });
      setBanDialogOpen(false);
      setBanReason("");
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/unban`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Unbanned",
        description: "User has been successfully unbanned",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  const getUserStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (user.kycStatus === "verified") {
      return <Badge variant="default">Verified</Badge>;
    }
    if (user.kycStatus === "pending") {
      return <Badge variant="secondary">Pending KYC</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const confirmBan = () => {
    if (!selectedUser || !banReason.trim()) return;
    banUserMutation.mutate({ userId: selectedUser.id, reason: banReason });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load users data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage platform users, review KYC status, and control access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-search"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-user-status">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="pending">Pending KYC</SelectItem>
                <SelectItem value="verified">Verified Users</SelectItem>
                <SelectItem value="banned">Banned Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({usersData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium" data-testid={`text-user-name-${user.id}`}>
                            {user.fullName}
                          </p>
                          <p className="text-sm text-gray-500">{user.country}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUserStatusBadge(user)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.kycStatus === "verified" ? "default" : "secondary"}
                          data-testid={`badge-kyc-${user.id}`}
                        >
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">${user.balance || "0.00"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(user.createdAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-view-user-${user.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details: {user.fullName}</DialogTitle>
                                <DialogDescription>
                                  Complete user information and account status
                                </DialogDescription>
                              </DialogHeader>
                              <UserDetailsDialog user={user} />
                            </DialogContent>
                          </Dialog>

                          {user.isBanned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unbanUserMutation.mutate(user.id)}
                              disabled={unbanUserMutation.isPending}
                              data-testid={`button-unban-user-${user.id}`}
                            >
                              <ShieldOff className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBanUser(user)}
                              data-testid={`button-ban-user-${user.id}`}
                            >
                              <Ban className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData && usersData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {usersData.page} of {usersData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= usersData.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will ban the user from accessing their account. They will see the ban reason and have the option to delete their account.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">User Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedUser.fullName}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone}</p>
                </div>
              </div>

              <div>
                <label htmlFor="ban-reason" className="block text-sm font-medium mb-1">
                  Ban Reason (Required)
                </label>
                <textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  data-testid="ban-reason-input"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmBan}
              disabled={banUserMutation.isPending || !banReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-ban-button"
            >
              {banUserMutation.isPending ? 'Banning...' : 'Ban User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailsDialog({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Personal Information</h4>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">Full Name:</span>
              <p className="text-sm font-medium">{user.fullName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Phone:</span>
              <p className="text-sm font-medium">{user.phone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Country:</span>
              <p className="text-sm font-medium">{user.country}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Account Status</h4>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">Email Verified:</span>
              <Badge variant={user.isEmailVerified ? "default" : "secondary"} className="ml-2">
                {user.isEmailVerified ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">Phone Verified:</span>
              <Badge variant={user.isPhoneVerified ? "default" : "secondary"} className="ml-2">
                {user.isPhoneVerified ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">KYC Status:</span>
              <Badge variant={user.kycStatus === "verified" ? "default" : "secondary"} className="ml-2">
                {user.kycStatus}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">Virtual Card:</span>
              <Badge variant={user.hasVirtualCard ? "default" : "secondary"} className="ml-2">
                {user.hasVirtualCard ? "Active" : "None"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Balance</h4>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold">${user.balance || "0.00"}</p>
          <p className="text-sm text-gray-500">Available Balance</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            View KYC
          </Button>
          <Button variant="outline" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            View Transactions
          </Button>
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
}