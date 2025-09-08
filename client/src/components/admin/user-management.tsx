import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
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
  Trash2,
  Users,
  DollarSign,
  Plus,
  Minus,
  Mail,
  Phone,
  Calendar
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/block`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Blocked",
        description: "User has been successfully blocked",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/unblock`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Unblocked",
        description: "User has been successfully unblocked",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User and all related data have been permanently deleted",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const getUserStatusBadge = (user: User) => {
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (user.kycStatus === "verified") {
      return <Badge variant="default">Verified</Badge>;
    }
    if (user.kycStatus === "pending") {
      return <Badge variant="secondary">Pending KYC</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  const isUserBlocked = (user: User) => {
    return !user.isEmailVerified && !user.isPhoneVerified;
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
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
                <SelectItem value="blocked">Blocked Users</SelectItem>
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

                          {isUserBlocked(user) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unblockUserMutation.mutate(user.id)}
                              disabled={unblockUserMutation.isPending}
                              data-testid={`button-unblock-user-${user.id}`}
                            >
                              <UserCheck className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => blockUserMutation.mutate(user.id)}
                              disabled={blockUserMutation.isPending}
                              data-testid={`button-block-user-${user.id}`}
                            >
                              <UserX className="w-4 h-4 text-red-600" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data including:
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">User to be deleted:</h4>
                <div className="space-y-1 text-sm text-red-800">
                  <p><strong>Name:</strong> {userToDelete.fullName}</p>
                  <p><strong>Email:</strong> {userToDelete.email}</p>
                  <p><strong>Phone:</strong> {userToDelete.phone}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">The following data will be permanently deleted:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• User profile and personal information</li>
                  <li>• All transaction history</li>
                  <li>• Virtual card information</li>
                  <li>• KYC documents and verification status</li>
                  <li>• Payment requests and recipients</li>
                  <li>• Notifications and preferences</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              data-testid="confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailsDialog({ user }: { user: User }) {
  const [balanceUpdate, setBalanceUpdate] = useState("");
  const [updateType, setUpdateType] = useState<"add" | "subtract" | "set">("add");
  const [transactionDetails, setTransactionDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onUpdateBalance = async (user: User) => {
    if (!balanceUpdate || !transactionDetails) {
      toast({
        title: "Error",
        description: "Please enter both amount and transaction details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}/balance`, {
        amount: balanceUpdate,
        type: updateType,
        details: transactionDetails,
      });

      if (response.ok) {
        toast({
          title: "Balance Updated",
          description: `Successfully updated balance for ${user.fullName}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setBalanceUpdate("");
        setTransactionDetails("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdateCard = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${user.id}/virtual-card`, {
        action,
      });

      if (response.ok) {
        toast({
          title: "Card Updated",
          description: `Successfully ${action}d virtual card for ${user.fullName}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update virtual card",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Personal Information
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Full Name:</span>
                <span className="text-sm font-medium">{user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-sm font-medium break-all">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="text-sm font-medium">{user.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Country:</span>
                <span className="text-sm font-medium">{user.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since:</span>
                <span className="text-sm font-medium">
                  {format(new Date(user.createdAt), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Account Status
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email Status:</span>
                <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Phone Status:</span>
                <Badge variant={user.isPhoneVerified ? "default" : "secondary"}>
                  {user.isPhoneVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">KYC Status:</span>
                <Badge variant={user.kycStatus === "verified" ? "default" : user.kycStatus === "pending" ? "secondary" : "destructive"}>
                  {user.kycStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Virtual Card:</span>
                <Badge variant={user.hasVirtualCard ? "default" : "outline"}>
                  {user.hasVirtualCard ? "Active" : "None"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Management */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Balance Management
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4">
            <Label>Current Balance</Label>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${user.balance || "0.00"}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="update-type">Action</Label>
              <Select value={updateType} onValueChange={(value: "add" | "subtract" | "set") => setUpdateType(value)}>
                <SelectTrigger data-testid="select-balance-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Balance</SelectItem>
                  <SelectItem value="subtract">Subtract Balance</SelectItem>
                  <SelectItem value="set">Set Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="balance-amount">Amount ($)</Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                value={balanceUpdate}
                onChange={(e) => setBalanceUpdate(e.target.value)}
                placeholder="0.00"
                data-testid="input-balance-amount"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="transaction-details">Transaction Details</Label>
            <Input
              id="transaction-details"
              type="text"
              value={transactionDetails}
              onChange={(e) => setTransactionDetails(e.target.value)}
              placeholder="Enter description for transaction history (e.g., Admin adjustment, Bonus payment, Refund)"
              data-testid="input-transaction-details"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => onUpdateBalance(user)}
              disabled={isLoading || !balanceUpdate}
              className="w-full"
              data-testid="button-update-balance"
            >
              {isLoading ? "Updating..." : "Update Balance"}
            </Button>
          </div>
        </div>
      </div>

      {/* Virtual Card Management */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Virtual Card Management</h4>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Card Status: </span>
              {user.hasVirtualCard ? (
                <Badge variant={user.cardStatus === "active" ? "default" : "destructive"}>
                  {user.cardStatus}
                </Badge>
              ) : (
                <Badge variant="outline">No Card</Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!user.hasVirtualCard ? (
              <Button
                onClick={() => onUpdateCard("issue")}
                disabled={isLoading}
                variant="default"
                data-testid="button-issue-card"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Issue Virtual Card
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => onUpdateCard(user.cardStatus === "active" ? "deactivate" : "activate")}
                  disabled={isLoading}
                  variant={user.cardStatus === "active" ? "destructive" : "default"}
                  data-testid="button-toggle-card"
                >
                  {user.cardStatus === "active" ? "Deactivate Card" : "Activate Card"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Security Actions</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            Reset 2FA
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Verification Email
          </Button>
        </div>
      </div>
    </div>
  );
}