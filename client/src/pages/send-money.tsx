import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useRecipients, useCreateRecipient } from "@/hooks/use-recipients";

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
  const { user } = useAuth();
  const { data: recipientData } = useRecipients();
  const createRecipient = useCreateRecipient();
  const recipients = recipientData?.recipients || [];

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
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </motion.div>

        {/* Recipient Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
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
        </motion.div>

        {/* Recent Recipients */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full ripple"
            disabled={!selectedRecipient}
            data-testid="button-continue"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </div>
  );
}