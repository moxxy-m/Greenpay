import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRecipients, useCreateRecipient } from "@/hooks/use-recipients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Send, DollarSign, Users, CheckCircle, Globe } from "lucide-react";

interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export default function SendMoneyPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: "",
    phone: "",
    email: "",
    accountNumber: "",
    bankName: "",
    country: "Kenya",
    currency: "KES",
    recipientType: "mobile_wallet" as "bank" | "mobile_wallet" | "cash_pickup"
  });
  
  // GreenPay user transfer state
  const [greenPaySearchTerm, setGreenPaySearchTerm] = useState("");
  const [selectedGreenPayUser, setSelectedGreenPayUser] = useState<UserSearchResult | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [greenPaySearchResults, setGreenPaySearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("greenpay");
  
  const { user } = useAuth();
  const { data: recipientData } = useRecipients();
  const createRecipient = useCreateRecipient();
  const recipients = recipientData?.recipients || [];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions for real-time balance calculation
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const transactions = (transactionData as any)?.transactions || [];
  
  // Real-time balance calculation
  const realTimeBalance = transactions.reduce((balance: number, txn: any) => {
    if (txn.status === 'completed') {
      if (txn.type === 'receive' || txn.type === 'deposit') {
        return balance + parseFloat(txn.amount);
      } else if (txn.type === 'send' || txn.type === 'card_purchase') {
        return balance - parseFloat(txn.amount) - parseFloat(txn.fee || '0');
      }
    }
    return balance;
  }, parseFloat(user?.balance || '0'));

  // Search GreenPay users
  const searchGreenPayUsersMutation = useMutation({
    mutationFn: async (search: string) => {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(search)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setGreenPaySearchResults(data.users || []);
      setIsSearchingUsers(false);
    },
    onError: () => {
      setGreenPaySearchResults([]);
      setIsSearchingUsers(false);
    }
  });

  // Transfer money to GreenPay user
  const greenPayTransferMutation = useMutation({
    mutationFn: async (transferData: {
      fromUserId: string;
      toUserId: string;
      amount: string;
      currency: string;
      description?: string;
    }) => {
      const response = await apiRequest("POST", "/api/transfer", transferData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Successful",
        description: `$${transferAmount} sent to ${selectedGreenPayUser?.fullName} successfully!`,
      });
      
      // Reset form
      resetGreenPayForm();
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Unable to complete transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGreenPayUserSearch = async (term: string) => {
    if (term.length < 2) {
      setGreenPaySearchResults([]);
      return;
    }
    
    setIsSearchingUsers(true);
    searchGreenPayUsersMutation.mutate(term);
  };

  const handleGreenPayUserSelect = (selectedUser: UserSearchResult) => {
    setSelectedGreenPayUser(selectedUser);
    setGreenPaySearchResults([]);
    setGreenPaySearchTerm("");
  };

  const resetGreenPayForm = () => {
    setSelectedGreenPayUser(null);
    setTransferAmount("");
    setTransferDescription("");
    setGreenPaySearchTerm("");
    setGreenPaySearchResults([]);
  };

  const handleGreenPayTransfer = () => {
    if (!selectedGreenPayUser || !transferAmount || !user) return;

    const amount = parseFloat(transferAmount);
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (amount > realTimeBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this transfer.",
        variant: "destructive",
      });
      return;
    }

    greenPayTransferMutation.mutate({
      fromUserId: user.id,
      toUserId: selectedGreenPayUser.id,
      amount: transferAmount,
      currency: "USD",
      description: transferDescription || `Transfer to ${selectedGreenPayUser.fullName}`
    });
  };

  // Check if user has virtual card requirement
  if (!user?.hasVirtualCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-destructive">block</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Virtual Card Required</h2>
          <p className="text-muted-foreground mb-4">You need to purchase a virtual card before you can send money.</p>
          <Button onClick={() => setLocation("/virtual-card-purchase")}>
            Get Virtual Card
          </Button>
        </div>
      </div>
    );
  }

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.phone?.includes(searchQuery) ||
    recipient.email?.includes(searchQuery)
  );

  const handleContinue = () => {
    if (selectedRecipient) {
      // Store selected recipient in sessionStorage for next step
      sessionStorage.setItem('selectedRecipient', JSON.stringify(selectedRecipient));
      setLocation("/send-amount");
    }
  };

  const handleAddRecipient = () => {
    createRecipient.mutate(newRecipient, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewRecipient({
          name: "",
          phone: "",
          email: "",
          accountNumber: "",
          bankName: "",
          country: "Kenya",
          currency: "KES",
          recipientType: "mobile_wallet"
        });
      }
    });
  };

  const countries = [
    { name: "Kenya", currency: "KES" },
    { name: "Nigeria", currency: "NGN" },
    { name: "Ghana", currency: "GHS" },
    { name: "South Africa", currency: "ZAR" },
    { name: "Uganda", currency: "UGX" },
    { name: "Tanzania", currency: "TZS" },
    { name: "Rwanda", currency: "RWF" },
  ];

  const renderGreenPayTransferContent = () => {
    return (
      <div className="space-y-4">
        {/* User Search Section */}
        {!selectedGreenPayUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Find GreenPay User
              </CardTitle>
              <CardDescription>
                Search for a GreenPay user by email or full name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter email or full name..."
                  value={greenPaySearchTerm}
                  onChange={(e) => {
                    setGreenPaySearchTerm(e.target.value);
                    handleGreenPayUserSearch(e.target.value);
                  }}
                  className="pl-10"
                  data-testid="input-search-greenpay-user"
                />
              </div>

              {/* Search Results */}
              {isSearchingUsers && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              )}

              {greenPaySearchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {greenPaySearchResults.map((resultUser) => (
                    <motion.div
                      key={resultUser.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGreenPayUserSelect(resultUser)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      data-testid={`greenpay-user-result-${resultUser.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {resultUser.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{resultUser.fullName}</p>
                          <p className="text-sm text-muted-foreground">{resultUser.email}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {greenPaySearchTerm.length >= 2 && !isSearchingUsers && greenPaySearchResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transfer Form */}
        {selectedGreenPayUser && (
          <div className="space-y-4">
            {/* Selected User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sending to
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {selectedGreenPayUser.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedGreenPayUser.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedGreenPayUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreenPayUser(null)}
                    data-testid="button-change-greenpay-user"
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Amount and Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="greenpay-amount">Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="greenpay-amount"
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                      data-testid="input-greenpay-amount"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: ${realTimeBalance.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greenpay-description">Description (Optional)</Label>
                  <Textarea
                    id="greenpay-description"
                    placeholder="What's this transfer for?"
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    rows={3}
                    data-testid="input-greenpay-description"
                  />
                </div>

                <Button
                  onClick={handleGreenPayTransfer}
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0 || greenPayTransferMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-send-greenpay-money"
                >
                  {greenPayTransferMutation.isPending ? (
                    "Processing Transfer..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send ${transferAmount || "0.00"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-icons text-blue-600 text-sm">info</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">About GreenPay Transfers</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Transfers between GreenPay users are instant and free</p>
                  <p>• Both sender and recipient will receive notifications</p>
                  <p>• Transfers are processed immediately with real-time balance updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInternationalTransferContent = () => {
    return (
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </div>

        {/* Recipient Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Who are you sending to?</h3>
            
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Search by name, email or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-search-recipient"
              />
              
              <div className="text-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors"
                    data-testid="button-add-recipient"
                  >
                    <span className="material-icons text-muted-foreground mb-2">person_add</span>
                    <p className="text-sm font-medium">Add New Recipient</p>
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Recipient</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                        placeholder="Recipient's full name"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label htmlFor="country">Country *</Label>
                        <Select 
                          value={newRecipient.country} 
                          onValueChange={(value) => {
                            const country = countries.find(c => c.name === value);
                            setNewRecipient({ 
                              ...newRecipient, 
                              country: value,
                              currency: country?.currency || 'KES'
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.name} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={newRecipient.currency}
                          disabled
                          className="text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="recipientType">Recipient Type</Label>
                      <Select 
                        value={newRecipient.recipientType} 
                        onValueChange={(value: any) => setNewRecipient({ ...newRecipient, recipientType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile_wallet">Mobile Wallet</SelectItem>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="cash_pickup">Cash Pickup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newRecipient.recipientType === 'mobile_wallet' && (
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={newRecipient.phone}
                          onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                          placeholder="Phone number for mobile wallet"
                        />
                      </div>
                    )}
                    {newRecipient.recipientType === 'bank' && (
                      <>
                        <div>
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Input
                            id="bankName"
                            value={newRecipient.bankName}
                            onChange={(e) => setNewRecipient({ ...newRecipient, bankName: e.target.value })}
                            placeholder="Bank name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountNumber">Account Number *</Label>
                          <Input
                            id="accountNumber"
                            value={newRecipient.accountNumber}
                            onChange={(e) => setNewRecipient({ ...newRecipient, accountNumber: e.target.value })}
                            placeholder="Bank account number"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddRecipient}
                        disabled={!newRecipient.name || createRecipient.isPending}
                        className="flex-1"
                      >
                        {createRecipient.isPending ? 'Adding...' : 'Add Recipient'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Filtered Recipients Display */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Recent Recipients</h3>
            </div>
            <div className="divide-y divide-border">
              {filteredRecipients.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <span className="material-icons text-4xl mb-2">person_outline</span>
                  <p>No recipients found</p>
                  <p className="text-sm">Add a new recipient to get started</p>
                </div>
              ) : (
                filteredRecipients.map((recipient) => (
                  <motion.button
                    key={recipient.id}
                    whileHover={{ backgroundColor: "var(--muted)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRecipient(recipient)}
                    className={`w-full p-4 flex items-center transition-colors text-left ${
                      selectedRecipient?.id === recipient.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
                    data-testid={`recipient-${recipient.id}`}
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">
                        {recipient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipient.recipientType === 'bank' ? recipient.bankName : 
                         recipient.recipientType === 'mobile_wallet' ? recipient.phone :
                         'Cash Pickup'} - {recipient.country}
                      </p>
                      <p className="text-xs text-muted-foreground">{recipient.currency}</p>
                    </div>
                    <div className="text-right">
                      <span className="material-icons text-muted-foreground">chevron_right</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleContinue}
          className="w-full ripple"
          disabled={!selectedRecipient}
          data-testid="button-continue"
        >
          Continue
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Send Money</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-200 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">${realTimeBalance.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-green-200 text-sm">GreenPay Wallet</p>
        </motion.div>

        {/* Transfer Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="greenpay" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                GreenPay Users
              </TabsTrigger>
              <TabsTrigger value="international" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                International
              </TabsTrigger>
            </TabsList>
            
            {/* GreenPay User Transfer Tab */}
            <TabsContent value="greenpay" className="space-y-4">
              {renderGreenPayTransferContent()}
            </TabsContent>
            
            {/* International Transfer Tab */}
            <TabsContent value="international" className="space-y-4">
              {renderInternationalTransferContent()}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}