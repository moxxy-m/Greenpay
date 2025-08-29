import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  UserX,
  UserCheck,
  DollarSign,
  Plus,
  Minus,
  CreditCard,
  Shield,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  country: string;
  isBlocked: boolean;
  balance: string;
  currency: string;
  hasVirtualCard: boolean;
  cardStatus: string;
  kycStatus: string;
  totalTransactions: number;
  lastActiveAt: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function EnhancedUserManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceUpdate, setBalanceUpdate] = useState("");
  const [updateType, setUpdateType] = useState<"add" | "subtract" | "set">("add");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", { search, status, page }],
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
    mutationFn: async ({ userId, action }: { userId: string; action: "block" | "unblock" }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type }: { userId: string; amount: string; type: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/balance`, {
        amount,
        type
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Balance Updated",
        description: "User balance has been updated successfully",
      });
      setSelectedUser(null);
      setBalanceUpdate("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive",
      });
    },
  });

  const updateCardStatusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "activate" | "deactivate" | "issue" }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/card/${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Card Updated",
        description: "Virtual card status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update card status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    switch (user.kycStatus) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending KYC</Badge>;
      case "rejected":
        return <Badge variant="destructive">KYC Rejected</Badge>;
      default:
        return <Badge variant="outline">Incomplete</Badge>;
    }
  };

  const getCardBadge = (user: User) => {
    if (!user.hasVirtualCard) {
      return <Badge variant="outline">No Card</Badge>;
    }
    switch (user.cardStatus) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const handleBalanceUpdate = (user: User) => {
    if (!balanceUpdate || parseFloat(balanceUpdate) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    updateBalanceMutation.mutate({
      userId: user.id,
      amount: balanceUpdate,
      type: updateType
    });
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
            <Users className="w-5 h-5" />
            Enhanced User Management
          </CardTitle>
          <CardDescription>
            Manage users with real balance updates and card controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-user-search"
              />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Virtual Card</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        <p className="font-medium">${parseFloat(user.balance).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{user.currency}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCardBadge(user)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{user.totalTransactions} transactions</p>
                        <p className="text-gray-500">
                          Last active: {format(new Date(user.lastActiveAt), "MMM dd")}
                        </p>
                      </div>
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
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Management</DialogTitle>
                              <DialogDescription>
                                Manage user account and financial settings
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <UserManagementDialog 
                                user={selectedUser}
                                onUpdateBalance={handleBalanceUpdate}
                                onUpdateCard={(action) => updateCardStatusMutation.mutate({
                                  userId: selectedUser.id,
                                  action
                                })}
                                balanceUpdate={balanceUpdate}
                                setBalanceUpdate={setBalanceUpdate}
                                updateType={updateType}
                                setUpdateType={setUpdateType}
                                isLoading={updateBalanceMutation.isPending || updateCardStatusMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => blockUserMutation.mutate({
                            userId: user.id,
                            action: user.isBlocked ? "unblock" : "block"
                          })}
                          disabled={blockUserMutation.isPending}
                          data-testid={`button-toggle-user-${user.id}`}
                        >
                          {user.isBlocked ? (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementDialog({ 
  user, 
  onUpdateBalance,
  onUpdateCard,
  balanceUpdate,
  setBalanceUpdate,
  updateType,
  setUpdateType,
  isLoading 
}: {
  user: User;
  onUpdateBalance: (user: User) => void;
  onUpdateCard: (action: "activate" | "deactivate" | "issue") => void;
  balanceUpdate: string;
  setBalanceUpdate: (value: string) => void;
  updateType: "add" | "subtract" | "set";
  setUpdateType: (type: "add" | "subtract" | "set") => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* User Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Personal Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{user.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Joined {format(new Date(user.createdAt), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Status</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">KYC Status:</span>
              <Badge variant="outline" className="ml-2">{user.kycStatus}</Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">Account Status:</span>
              <Badge variant={user.isBlocked ? "destructive" : "default"} className="ml-2">
                {user.isBlocked ? "Blocked" : "Active"}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Transactions:</span>
              <span className="ml-2 font-medium">{user.totalTransactions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Management */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Balance Management</h4>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-lg font-semibold">
              Current Balance: ${parseFloat(user.balance).toFixed(2)} {user.currency}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="update-type">Action</Label>
              <Select value={updateType} onValueChange={(value: "add" | "subtract" | "set") => setUpdateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      Add
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-red-600" />
                      Subtract
                    </div>
                  </SelectItem>
                  <SelectItem value="set">Set Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={balanceUpdate}
                onChange={(e) => setBalanceUpdate(e.target.value)}
                placeholder="0.00"
                data-testid="input-balance-amount"
              />
            </div>
            
            <div className="flex items-end">
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