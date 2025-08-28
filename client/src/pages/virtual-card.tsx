import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VirtualCardPage() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  const card = cardData?.card;
  const hasCard = !!card;

  const purchaseCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/virtual-card/initialize-payment", {
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        // Open Paystack in a new window for payment
        const paymentWindow = window.open(data.authorizationUrl, '_blank', 'width=600,height=700');
        
        // Monitor for payment completion
        const checkPayment = setInterval(async () => {
          if (paymentWindow?.closed) {
            clearInterval(checkPayment);
            
            // Verify payment
            try {
              const verifyResponse = await apiRequest("POST", "/api/virtual-card/verify-payment", {
                reference: data.reference,
                userId: user?.id
              });
              const verifyData = await verifyResponse.json();
              
              if (verifyData.card) {
                queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
                queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
                toast({
                  title: "Card Purchase Successful!",
                  description: "Your virtual card is now active and ready to use.",
                });
              }
            } catch (error) {
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support if your payment was successful.",
                variant: "destructive",
              });
            }
          }
        }, 1000);
      } else {
        throw new Error(data.message || "Unable to initialize payment");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to initiate card purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const maskCardNumber = (number: string) => {
    return showCardDetails ? number : "•••• •••• •••• " + number.slice(-4);
  };

  // If user doesn't have a card, show purchase screen
  if (!hasCard) {
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
          <h1 className="text-lg font-semibold">Virtual Card</h1>
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-green-200 text-sm">GreenPay Card</p>
                <p className="text-xs text-green-200">Virtual</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-white/30 rounded"></div>
                <div className="w-5 h-5 bg-white/50 rounded-full"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-2xl font-mono tracking-wider text-green-200">
                •••• •••• •••• ••••
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-green-200 text-xs">CARDHOLDER</p>
                <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "YOUR NAME"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">EXPIRES</p>
                <p className="text-sm font-semibold">••/••</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">CVV</p>
                <p className="text-sm font-semibold">•••</p>
              </div>
            </div>

            {/* Inactive overlay */}
            <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
              <div className="bg-white/90 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-black">INACTIVE</span>
              </div>
            </div>
          </motion.div>

          {/* Purchase Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border border-border elevation-1"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-icons text-primary text-2xl">credit_card</span>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Get Your Virtual Card</h2>
                <p className="text-muted-foreground">
                  Purchase a virtual card to unlock international transactions and online payments.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Virtual Card</span>
                  <span className="text-xl font-bold">$60.00</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  One-time purchase • No monthly fees • Valid for 3 years
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground text-left">
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  International online payments
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Secure transactions worldwide
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Real-time spending controls
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Instant card generation
                </div>
              </div>

              <Button
                onClick={() => purchaseCardMutation.mutate()}
                className="w-full text-lg py-3"
                disabled={purchaseCardMutation.isPending}
                data-testid="button-purchase-card"
              >
                {purchaseCardMutation.isPending ? "Processing..." : "Purchase Card - $60.00"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Payment processed securely by Paystack
              </p>
            </div>
          </motion.div>
        </div>
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
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Virtual Card</h1>
        <div className="ml-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="material-icons text-muted-foreground p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-more"
          >
            more_vert
          </motion.button>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Virtual Card Display */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-green-200 text-sm">GreenPay Card</p>
                <p className="text-xs text-green-200">Virtual</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-white/30 rounded"></div>
                <div className="w-5 h-5 bg-white/50 rounded-full"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-2xl font-mono tracking-wider" data-testid="text-card-number">
                {maskCardNumber(card.cardNumber || "4567123456784567")}
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-green-200 text-xs">CARDHOLDER</p>
                <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "JOHN DOE"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">EXPIRES</p>
                <p className="text-sm font-semibold">{card.expiryDate || "12/27"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">CVV</p>
                <p className="text-sm font-semibold">{showCardDetails ? (card.cvv || "123") : "•••"}</p>
              </div>
            </div>
          </div>
          
          {/* Card Actions */}
          <div className="absolute top-4 right-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full"
              data-testid="button-toggle-card-details"
            >
              <span className="material-icons text-white text-sm">
                {showCardDetails ? "visibility_off" : "visibility"}
              </span>
            </motion.button>
          </div>

          {/* Active badge */}
          <div className="absolute top-4 left-4">
            <div className="bg-green-500 px-2 py-1 rounded-full">
              <span className="text-xs font-semibold text-white">ACTIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Card Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-primary" data-testid="text-card-balance">
              ${user?.balance || "0.00"}
            </p>
            <p className="text-sm text-muted-foreground">Last updated: Just now</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/deposit")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-top-up"
          >
            <span className="material-icons text-primary text-2xl mb-2">add</span>
            <p className="font-semibold">Top Up</p>
            <p className="text-xs text-muted-foreground">Add money to card</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/withdraw")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-withdraw"
          >
            <span className="material-icons text-secondary text-2xl mb-2">remove</span>
            <p className="font-semibold">Withdraw</p>
            <p className="text-xs text-muted-foreground">Transfer to bank</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-freeze-card"
          >
            <span className="material-icons text-orange-500 text-2xl mb-2">lock</span>
            <p className="font-semibold">Freeze Card</p>
            <p className="text-xs text-muted-foreground">Temporarily disable</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-card-settings"
          >
            <span className="material-icons text-muted-foreground text-2xl mb-2">settings</span>
            <p className="font-semibold">Settings</p>
            <p className="text-xs text-muted-foreground">Manage card</p>
          </motion.button>
        </motion.div>

        {/* Card Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Card Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Card Status</span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Daily Limit</span>
              <span className="font-medium">$5,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Limit</span>
              <span className="font-medium">$50,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Issue Date</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}