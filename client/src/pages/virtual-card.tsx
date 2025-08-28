import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function VirtualCardPage() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const { user } = useAuth();

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  const mockCard = {
    cardNumber: "4567123456784567",
    expiryDate: "12/27",
    cvv: "123",
    balance: "2847.65",
    status: "active",
    dailyLimit: "5,000",
    monthlyLimit: "50,000",
    issueDate: "Mar 10, 2024",
  };

  const maskCardNumber = (number: string) => {
    return showCardDetails ? number : "•••• •••• •••• " + number.slice(-4);
  };

  const mockCardTransactions = [
    {
      id: "1",
      type: "purchase",
      merchant: "Amazon.com",
      amount: "45.99",
      date: "Today 3:45 PM",
      status: "completed",
    },
    {
      id: "2",
      type: "deposit",
      merchant: "Bank Transfer",
      amount: "500.00",
      date: "Yesterday 2:30 PM",
      status: "completed",
    },
    {
      id: "3",
      type: "purchase",
      merchant: "Shell Gas Station",
      amount: "52.30",
      date: "Mar 15 • 8:30 AM",
      status: "completed",
    },
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
                {maskCardNumber(mockCard.cardNumber)}
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-green-200 text-xs">CARDHOLDER</p>
                <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "JOHN DOE"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">EXPIRES</p>
                <p className="text-sm font-semibold">{mockCard.expiryDate}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">CVV</p>
                <p className="text-sm font-semibold">{showCardDetails ? mockCard.cvv : "•••"}</p>
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
            <p className="text-3xl font-bold text-primary" data-testid="text-card-balance">${mockCard.balance}</p>
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
              <span className="text-green-500 bg-green-100 px-2 py-1 rounded-full text-xs font-medium capitalize">
                {mockCard.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Card Type</span>
              <span className="font-medium">Virtual Debit</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Issue Date</span>
              <span className="font-medium">{mockCard.issueDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expiry Date</span>
              <span className="font-medium">Dec 31, 2027</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Daily Limit</span>
              <span className="font-medium">${mockCard.dailyLimit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Limit</span>
              <span className="font-medium">${mockCard.monthlyLimit}</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Card Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent Card Activity</h3>
            <button
              onClick={() => setLocation("/transactions")}
              className="text-primary text-sm hover:underline"
              data-testid="link-view-all-card-transactions"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {mockCardTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                whileHover={{ backgroundColor: "var(--muted)" }}
                className="p-4 flex items-center justify-between cursor-pointer transition-colors"
                data-testid={`card-transaction-${transaction.id}`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    transaction.type === "purchase" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    <span className={`material-icons text-sm ${
                      transaction.type === "purchase" ? "text-blue-600" : "text-green-600"
                    }`}>
                      {transaction.type === "purchase" ? "shopping_cart" : "add"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.type === "purchase" ? "Online Purchase" : "Card Top-up"}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.merchant} • {transaction.date}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  transaction.type === "purchase" ? "text-destructive" : "text-primary"
                }`}>
                  {transaction.type === "purchase" ? "-" : "+"}${transaction.amount}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
