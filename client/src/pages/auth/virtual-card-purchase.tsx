import { motion } from "framer-motion";
import { useLocation } from "wouter";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useInitializeCardPayment, useVerifyCardPayment } from "@/hooks/use-paystack";

export default function VirtualCardPurchasePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();

  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const initializePayment = useInitializeCardPayment();
  const verifyPayment = useVerifyCardPayment();

  // Listen for payment completion (in real app, use webhooks)
  useState(() => {
    const checkPaymentStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const status = urlParams.get('status');
      
      if (reference && status === 'success') {
        verifyPayment.mutate(reference, {
          onSuccess: () => {
            setLocation('/dashboard');
          }
        });
      }
    };
    
    checkPaymentStatus();
  });

  const handlePurchase = () => {
    initializePayment.mutate(undefined, {
      onSuccess: (data) => {
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      },
      onError: (error) => {
        toast({
          title: "Payment Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
        <h1 className="text-lg font-semibold">Get Your Virtual Card</h1>
      </motion.div>

      <div className="flex-1 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: -30 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl mb-6 elevation-3"
          >
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <span className="material-icons text-white text-4xl">credit_card</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">GreenPay Virtual Card</h3>
            <p className="text-green-100 text-sm">Required for all transactions</p>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-4"
          >
            Almost There!
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            To start sending and receiving money, you need to purchase a virtual card for just $60. 
            This one-time fee unlocks all features.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card p-4 rounded-xl border border-border mb-6 elevation-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Virtual Card (Annual)</span>
              <span className="text-xl font-bold text-primary">$60</span>
            </div>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Send money worldwide</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Receive money instantly</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Withdraw to bank accounts</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>24/7 customer support</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Button
              onClick={handlePurchase}
              className="w-full ripple"
              disabled={initializePayment.isPending}
              data-testid="button-purchase-card"
            >
              {initializePayment.isPending ? "Processing..." : "Purchase Virtual Card - $60"}
            </Button>

            <p className="text-xs text-muted-foreground">Secure payment powered by Paystack</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
