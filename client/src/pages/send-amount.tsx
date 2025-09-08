import { motion } from "framer-motion";
import { useLocation } from "wouter";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useToast } from "@/hooks/use-toast";

export default function SendAmountPage() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [sourceCurrency, setSourceCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("KES");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: exchangeRates } = useExchangeRates(sourceCurrency);

  useEffect(() => {
    // Get selected recipient from sessionStorage
    const recipientData = sessionStorage.getItem('selectedRecipient');
    if (recipientData) {
      const recipient = JSON.parse(recipientData);
      setSelectedRecipient(recipient);
      setTargetCurrency(recipient.currency || 'KES');
    } else {
      // Redirect back if no recipient selected
      setLocation('/send-money');
    }
  }, [setLocation]);

  const exchangeRate = exchangeRates?.rates?.[targetCurrency] || 1;
  const convertedAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : "0.00";
  const fee = amount ? (parseFloat(amount) * 0.025).toFixed(2) : "0.00"; // 2.5% fee
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : "0.00";

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > (parseFloat(user?.balance || "0"))) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this transfer",
        variant: "destructive",
      });
      return;
    }

    // Store transaction details for confirmation
    sessionStorage.setItem('transferDetails', JSON.stringify({
      recipient: selectedRecipient,
      amount,
      sourceCurrency,
      targetCurrency,
      convertedAmount,
      fee,
      total,
      description,
      exchangeRate
    }));
    
    setLocation("/send-confirm");
  };

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  ];

  if (!selectedRecipient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
          onClick={() => setLocation("/send-money")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Send Amount</h1>
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
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div className="w-16 h-1 bg-primary mx-2"></div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </motion.div>

        {/* Recipient Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-3">Sending to</h3>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">
                {selectedRecipient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{selectedRecipient.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedRecipient.country} • {selectedRecipient.currency}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card p-6 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-4">How much are you sending?</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Label htmlFor="amount">You send</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-2xl h-14"
                    data-testid="input-amount"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
                      <SelectTrigger className="w-20 h-8 text-sm border-0 bg-transparent">
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
              </div>
            </div>

            <div className="text-center py-2">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <span className="material-icons mr-1 text-sm">sync_alt</span>
                1 {sourceCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
              </div>
            </div>

            <div>
              <Label htmlFor="converted">Recipient gets</Label>
              <div className="relative">
                <Input
                  id="converted"
                  value={convertedAmount}
                  disabled
                  className="pr-16 text-2xl h-14 bg-muted/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                  {targetCurrency}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="What's this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>
          </div>
        </motion.div>

        {/* Fee Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-3">Transaction breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Transfer amount</span>
              <span>{amount || "0.00"} {sourceCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer fee</span>
              <span>{fee} {sourceCurrency}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total to pay</span>
                <span>{total} {sourceCurrency}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            Available balance: <span className="font-semibold">{user?.balance || "0.00"} USD</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full ripple"
            disabled={!amount || parseFloat(amount) <= 0}
            data-testid="button-continue"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </div>
  );
}