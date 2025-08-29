import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowUpDown, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Flag
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Transaction {
  id: string;
  senderId: string;
  recipientId: string;
  amount: string;
  fee: string;
  currency: string;
  targetCurrency: string;
  exchangeRate: string;
  status: string;
  type: string;
  description: string | null;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string | null;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TransactionManagement() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactionsData, isLoading, error } = useQuery<TransactionsResponse>({
    queryKey: ["/api/admin/transactions", { page, status, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status && status !== "all" && { status }),
        ...(search && { search }),
      });
      const response = await apiRequest("GET", `/api/admin/transactions?${params}`);
      return response.json();
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const response = await apiRequest("PUT", `/api/admin/transactions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Transaction Updated",
        description: "Transaction status has been updated successfully",
      });
      setSelectedTransaction(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "send":
        return <Badge variant="outline" className="text-red-600">Send</Badge>;
      case "receive":
        return <Badge variant="outline" className="text-green-600">Receive</Badge>;
      case "deposit":
        return <Badge variant="outline" className="text-blue-600">Deposit</Badge>;
      case "withdrawal":
        return <Badge variant="outline" className="text-orange-600">Withdrawal</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(num);
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!selectedTransaction) return;
    
    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      updates: { status: newStatus }
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load transactions data
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
            <ArrowUpDown className="w-5 h-5" />
            Transaction Management
          </CardTitle>
          <CardDescription>
            Monitor and manage all platform transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by transaction ID, user ID, or amount..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-transaction-search"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-transaction-status">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Volume</p>
                <p className="text-lg font-bold">
                  ${transactionsData?.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-lg font-bold">
                  {transactionsData?.transactions.filter(t => t.status === "completed").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-lg font-bold">
                  {transactionsData?.transactions.filter(t => t.status === "pending").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-lg font-bold">
                  {transactionsData?.transactions.filter(t => t.status === "failed").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactionsData?.total || 0})</CardTitle>
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
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <span className="font-mono text-sm" data-testid={`text-transaction-id-${transaction.id}`}>
                          {transaction.id.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          {transaction.targetCurrency !== transaction.currency && (
                            <p className="text-sm text-gray-500">
                              → {formatCurrency((parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate)).toString(), transaction.targetCurrency)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">From: {transaction.senderId.slice(0, 8)}...</p>
                          <p className="text-sm">To: {transaction.recipientId.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                              data-testid={`button-view-transaction-${transaction.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Complete transaction information and controls
                              </DialogDescription>
                            </DialogHeader>
                            {selectedTransaction && (
                              <TransactionDetailsDialog 
                                transaction={selectedTransaction} 
                                onStatusUpdate={handleStatusUpdate}
                                isLoading={updateTransactionMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {transactionsData && transactionsData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {transactionsData.page} of {transactionsData.totalPages}
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
                      disabled={page >= transactionsData.totalPages}
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
    </div>
  );
}

function TransactionDetailsDialog({ 
  transaction, 
  onStatusUpdate, 
  isLoading 
}: {
  transaction: Transaction;
  onStatusUpdate: (status: string) => void;
  isLoading: boolean;
}) {
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Transaction Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Transaction Details</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">ID:</span>
              <p className="text-sm font-mono">{transaction.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Type:</span>
              <p className="text-sm font-medium">{transaction.type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Payment Method:</span>
              <p className="text-sm font-medium">{transaction.paymentMethod}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Description:</span>
              <p className="text-sm">{transaction.description || "No description"}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Amount & Currency</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Amount:</span>
              <p className="text-sm font-medium">{formatCurrency(transaction.amount, transaction.currency)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Fee:</span>
              <p className="text-sm font-medium">{formatCurrency(transaction.fee, transaction.currency)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Exchange Rate:</span>
              <p className="text-sm font-medium">{transaction.exchangeRate}</p>
            </div>
            {transaction.targetCurrency !== transaction.currency && (
              <div>
                <span className="text-sm text-gray-500">Target Amount:</span>
                <p className="text-sm font-medium">
                  {formatCurrency((parseFloat(transaction.amount) * parseFloat(transaction.exchangeRate)).toString(), transaction.targetCurrency)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sender</h4>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-mono">{transaction.senderId}</span>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recipient</h4>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-mono">{transaction.recipientId}</span>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Created: {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm:ss")}</span>
          </div>
          {transaction.updatedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Updated: {format(new Date(transaction.updatedAt), "MMM dd, yyyy HH:mm:ss")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Management */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status Management</h4>
        <div className="flex gap-2">
          {transaction.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => onStatusUpdate("completed")}
                disabled={isLoading}
                data-testid="button-approve-transaction"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onStatusUpdate("failed")}
                disabled={isLoading}
                data-testid="button-reject-transaction"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {transaction.status === "failed" && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate("pending")}
              disabled={isLoading}
              data-testid="button-retry-transaction"
            >
              <Clock className="w-4 h-4 mr-2" />
              Mark as Pending
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusUpdate("cancelled")}
            disabled={isLoading || transaction.status === "completed"}
            data-testid="button-cancel-transaction"
          >
            <Flag className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}