import { motion } from "framer-motion";
import { useLocation } from "wouter";
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function SendConfirmPage() {
  const [, setLocation] = useLocation();
  const [transferData, setTransferData] = useState<any>(null);
  const [pin, setPin] = useState<string[]>(new Array(4).fill(""));
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Get transfer data from previous step
    const data = sessionStorage.getItem('transferData');
    if (data) {
      setTransferData(JSON.parse(data));
    } else {
      setLocation("/send-money");
    }
  }, [setLocation]);

  const sendMoneyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        type: "send",
        amount: transferData.amount,
        currency: transferData.currency,
        recipientDetails: transferData.recipient,
        fee: transferData.fee,
        exchangeRate: transferData.exchangeRate.toString(),
        description: `Sent to ${transferData.recipient.name}`,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer successful!",
        description: `$${transferData.amount} has been sent to ${transferData.recipient.name}.`,
      });
      // Clear stored data
      sessionStorage.removeItem('selectedRecipient');
      sessionStorage.removeItem('transferData');
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Transfer failed",
        description: "Unable to complete the transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePinChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setPin([...pin.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next element
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleConfirmTransfer = () => {
    const pinCode = pin.join("");
    if (pinCode.length === 4) {
      sendMoneyMutation.mutate();
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-digit transaction PIN.",
        variant: "destructive",
      });
    }
  };

  if (!transferData) {
    return <div>Loading...</div>;
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
          onClick={() => setLocation("/send-amount")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Confirm Transfer</h1>
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
            <div className="w-16 h-1 bg-primary mx-2"></div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-16 h-1 bg-primary mx-2"></div>
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </motion.div>

        {/* Transfer Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-xl border border-border elevation-1"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">{transferData.recipient.initials}</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{transferData.recipient.name}</h3>
            <p className="text-muted-foreground">{transferData.recipient.country}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">You send</span>
              <span className="font-semibold text-lg">${transferData.amount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">They receive</span>
              <span className="font-semibold text-lg">₦{transferData.recipientAmount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Transfer fee</span>
              <span className="font-medium">${transferData.fee}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Exchange rate</span>
              <span className="font-medium">1 USD = {transferData.exchangeRate.toLocaleString()} NGN</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-bold">Total to pay</span>
              <span className="font-bold text-xl text-primary">${transferData.total}</span>
            </div>
          </div>
        </motion.div>

        {/* Security PIN */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card p-6 rounded-xl border border-border elevation-1"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-accent-foreground">lock</span>
            </div>
            <h3 className="font-semibold mb-2">Enter Transaction PIN</h3>
            <p className="text-sm text-muted-foreground">Please enter your 4-digit PIN to confirm this transfer</p>
          </div>

          <div className="flex justify-center space-x-3 mb-6">
            {pin.map((data, index) => (
              <input
                key={index}
                type="password"
                maxLength={1}
                value={data}
                onChange={(e) => handlePinChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-12 text-center text-xl font-bold border border-border rounded-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                data-testid={`input-pin-${index}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-accent/10 p-4 rounded-xl border border-accent/20"
        >
          <div className="flex items-start">
            <span className="material-icons text-accent mr-3 mt-0.5">info</span>
            <div>
              <h4 className="font-medium text-accent mb-1">Important</h4>
              <p className="text-sm text-muted-foreground">
                This transfer cannot be cancelled once confirmed. Please verify all details are correct.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={handleConfirmTransfer}
            className="w-full ripple bg-primary hover:bg-primary/90"
            disabled={sendMoneyMutation.isPending || pin.join("").length !== 4}
            data-testid="button-confirm-transfer"
          >
            {sendMoneyMutation.isPending ? "Processing..." : `Confirm Transfer - $${transferData.total}`}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setLocation("/send-amount")}
            className="w-full"
            data-testid="button-edit-transfer"
          >
            Edit Transfer
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
