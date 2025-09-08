import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle, DollarSign, User, Calendar, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  fee: string;
  recipientDetails: any;
  reference: string;
  createdAt: string;
  adminNotes?: string;
  processedAt?: string;
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export default function WithdrawalManagement() {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawalData, isLoading } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
  });

  const withdrawals = withdrawalData?.withdrawals || [];

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes: string }) => {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const response = await apiRequest('POST', `/api/admin/withdrawals/${id}/${endpoint}`, {
        adminNotes: notes
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({
        title: `Withdrawal ${actionType === 'approve' ? 'approved' : 'rejected'}`,
        description: `The withdrawal request has been ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });
      setDialogOpen(false);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || `Failed to ${actionType} withdrawal`,
        variant: "destructive",
      });
    },
  });

  const handleAction = (withdrawal: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedWithdrawal) return;
    
    processWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      action: actionType,
      notes: adminNotes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  const pendingWithdrawals = withdrawals.filter((w: WithdrawalRequest) => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter((w: WithdrawalRequest) => w.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Withdrawal Management</h2>
          <p className="text-gray-600">Review and manage user withdrawal requests</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {pendingWithdrawals.length} pending reviews
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="processed">Processed ({processedWithdrawals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {pendingWithdrawals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Withdrawals</h3>
                    <p className="text-gray-600">All withdrawal requests have been processed.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingWithdrawals.map((withdrawal: WithdrawalRequest) => (
                  <Card key={withdrawal.id} className="border-l-4 border-l-yellow-400">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-500" />
                          <div>
                            <h3 className="font-semibold">{withdrawal.userInfo.fullName}</h3>
                            <p className="text-sm text-gray-600">{withdrawal.userInfo.email}</p>
                          </div>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Amount</Label>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{formatAmount(withdrawal.amount, withdrawal.currency)}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Fee</Label>
                          <p className="font-medium">{formatAmount(withdrawal.fee, withdrawal.currency)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Total</Label>
                          <p className="font-medium text-red-600">
                            -{formatAmount((parseFloat(withdrawal.amount) + parseFloat(withdrawal.fee)).toString(), withdrawal.currency)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Requested</Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatDate(withdrawal.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">Description</Label>
                        <p className="text-sm">{withdrawal.description}</p>
                      </div>

                      {withdrawal.recipientDetails && (
                        <div>
                          <Label className="text-xs text-gray-500">Recipient Details</Label>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                            {Object.entries(withdrawal.recipientDetails).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="font-medium">{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleAction(withdrawal, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          data-testid={`approve-${withdrawal.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleAction(withdrawal, 'reject')}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          data-testid={`reject-${withdrawal.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="processed">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {processedWithdrawals.map((withdrawal: WithdrawalRequest) => (
                <Card key={withdrawal.id} className={`border-l-4 ${
                  withdrawal.status === 'completed' ? 'border-l-green-400' : 'border-l-red-400'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <h3 className="font-semibold">{withdrawal.userInfo.fullName}</h3>
                          <p className="text-sm text-gray-600">{withdrawal.userInfo.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Amount</Label>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{formatAmount(withdrawal.amount, withdrawal.currency)}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Requested</Label>
                        <span className="text-sm">{formatDate(withdrawal.createdAt)}</span>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Processed</Label>
                        <span className="text-sm">{withdrawal.processedAt ? formatDate(withdrawal.processedAt) : 'N/A'}</span>
                      </div>
                    </div>

                    {withdrawal.adminNotes && (
                      <div>
                        <Label className="text-xs text-gray-500">Admin Notes</Label>
                        <p className="text-sm bg-gray-50 p-3 rounded-lg">{withdrawal.adminNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will approve the withdrawal and notify the user that their funds are being processed.'
                : 'This will reject the withdrawal request. Please provide a reason for rejection.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Withdrawal Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>User:</strong> {selectedWithdrawal.userInfo.fullName}</p>
                  <p><strong>Amount:</strong> {formatAmount(selectedWithdrawal.amount, selectedWithdrawal.currency)}</p>
                  <p><strong>Fee:</strong> {formatAmount(selectedWithdrawal.fee, selectedWithdrawal.currency)}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="admin-notes">
                  {actionType === 'approve' ? 'Processing Notes (Optional)' : 'Rejection Reason (Required)'}
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Enter any processing notes...' 
                    : 'Please explain why this withdrawal is being rejected...'
                  }
                  className="mt-1"
                  data-testid="admin-notes-input"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processWithdrawalMutation.isPending || (actionType === 'reject' && !adminNotes.trim())}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              data-testid="confirm-action-button"
            >
              {processWithdrawalMutation.isPending ? 'Processing...' : 
               actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}