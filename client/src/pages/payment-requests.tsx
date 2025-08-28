import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentRequests } from "@/hooks/use-payment-requests";
import { useToast } from "@/hooks/use-toast";

export default function PaymentRequestsPage() {
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({
    toEmail: "",
    toPhone: "",
    amount: "",
    currency: "KES",
    message: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: requestsData, isLoading } = usePaymentRequests();
  const requests = requestsData?.requests || [];

  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id,
          ...newRequest,
          amount: parseFloat(newRequest.amount),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Payment Request Created",
          description: "Your payment request has been sent successfully",
        });
        setShowCreateDialog(false);
        setNewRequest({
          toEmail: "",
          toPhone: "",
          amount: "",
          currency: "KES",
          message: "",
        });
        // Refresh the list
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment request",
        variant: "destructive",
      });
    }
  };

  const copyPaymentLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Payment link copied to clipboard",
    });
  };

  const currencies = [
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center justify-between elevation-1"
      >
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/dashboard")}
            className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-back"
          >
            arrow_back
          </motion.button>
          <h1 className="text-lg font-semibold">Payment Requests</h1>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-request">
              <span className="material-icons mr-1 text-sm">add</span>
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Payment Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newRequest.amount}
                    onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={newRequest.currency}
                    onValueChange={(value) => setNewRequest({ ...newRequest, currency: value })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="toEmail">Email Address</Label>
                <Input
                  id="toEmail"
                  type="email"
                  placeholder="recipient@email.com"
                  value={newRequest.toEmail}
                  onChange={(e) => setNewRequest({ ...newRequest, toEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="toPhone">Phone Number</Label>
                <Input
                  id="toPhone"
                  placeholder="Phone number"
                  value={newRequest.toPhone}
                  onChange={(e) => setNewRequest({ ...newRequest, toPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="What's this payment for?"
                  value={newRequest.message}
                  onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRequest}
                  disabled={!newRequest.amount || (!newRequest.toEmail && !newRequest.toPhone)}
                  className="flex-1"
                >
                  Create Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-card p-4 rounded-xl border border-border text-center">
            <div className="text-2xl font-bold text-primary">
              {requests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border text-center">
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'paid').length}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </div>
        </motion.div>

        {/* Payment Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold">Your Payment Requests</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-card p-8 rounded-xl border border-border text-center">
              <span className="material-icons text-4xl text-muted-foreground mb-4">request_quote</span>
              <h3 className="font-semibold mb-2">No payment requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first payment request to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create Request
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card p-4 rounded-xl border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        request.status === 'paid' ? 'bg-green-500' :
                        request.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="font-medium capitalize">{request.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {request.currency} {parseFloat(request.amount.toString()).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {request.toEmail && (
                      <div className="flex items-center text-sm">
                        <span className="material-icons text-sm mr-2">email</span>
                        <span>{request.toEmail}</span>
                      </div>
                    )}
                    {request.toPhone && (
                      <div className="flex items-center text-sm">
                        <span className="material-icons text-sm mr-2">phone</span>
                        <span>{request.toPhone}</span>
                      </div>
                    )}
                    {request.message && (
                      <div className="flex items-center text-sm">
                        <span className="material-icons text-sm mr-2">message</span>
                        <span className="text-muted-foreground">{request.message}</span>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && request.paymentLink && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Payment Link</div>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={request.paymentLink}
                          disabled
                          className="flex-1 text-xs bg-muted/50"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPaymentLink(request.paymentLink)}
                          className="shrink-0"
                        >
                          <span className="material-icons text-sm">content_copy</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(request.paymentLink, '_blank')}
                          className="shrink-0"
                        >
                          <span className="material-icons text-sm">open_in_new</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}