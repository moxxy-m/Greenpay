import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const { user, logout } = useAuth();

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const { data: virtualCard } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm elevation-1"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                </span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">Welcome back, {user?.fullName?.split(' ')[0] || 'John'}</h1>
                <p className="text-sm text-muted-foreground">Good morning!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
                data-testid="button-notifications"
              >
                <span className="material-icons text-muted-foreground">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                data-testid="button-dark-mode"
              >
                <span className="material-icons text-muted-foreground">brightness_6</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-200 text-sm">Total Balance</p>
              <p className="text-3xl font-bold" data-testid="text-balance">
                {showBalance ? "$2,847.65" : "••••••"}
              </p>
              <p className="text-green-200 text-sm">≈ £2,315.42 • €2,640.18</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBalance(!showBalance)}
              className="bg-white/20 p-2 rounded-full"
              data-testid="button-toggle-balance"
            >
              <span className="material-icons text-white">
                {showBalance ? "visibility" : "visibility_off"}
              </span>
            </motion.button>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/send-money")}
              className="flex-1 bg-white/20 backdrop-blur-sm py-3 px-4 rounded-xl font-medium transition-all hover:bg-white/30 ripple"
              data-testid="button-send"
            >
              <span className="material-icons text-sm mr-1">send</span>
              Send
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/receive-money")}
              className="flex-1 bg-white/20 backdrop-blur-sm py-3 px-4 rounded-xl font-medium transition-all hover:bg-white/30 ripple"
              data-testid="button-receive"
            >
              <span className="material-icons text-sm mr-1">call_received</span>
              Receive
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/deposit")}
              className="flex-1 bg-white/20 backdrop-blur-sm py-3 px-4 rounded-xl font-medium transition-all hover:bg-white/30 ripple"
              data-testid="button-add"
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/virtual-card")}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="button-virtual-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-icons text-primary">credit_card</span>
              <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="font-semibold mb-1">Virtual Card</h3>
            <p className="text-sm text-muted-foreground">Manage your card</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/withdraw")}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="button-withdraw"
          >
            <span className="material-icons text-secondary mb-2">account_balance</span>
            <h3 className="font-semibold mb-1">Withdraw</h3>
            <p className="text-sm text-muted-foreground">To bank account</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="button-exchange"
          >
            <span className="material-icons text-accent mb-2">swap_horiz</span>
            <h3 className="font-semibold mb-1">Exchange</h3>
            <p className="text-sm text-muted-foreground">Convert currency</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/support")}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="button-support"
          >
            <span className="material-icons text-muted-foreground mb-2">support_agent</span>
            <h3 className="font-semibold mb-1">Support</h3>
            <p className="text-sm text-muted-foreground">Get help</p>
          </motion.button>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent Transactions</h3>
            <button
              onClick={() => setLocation("/transactions")}
              className="text-primary text-sm hover:underline"
              data-testid="link-view-all-transactions"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            <motion.div
              whileHover={{ backgroundColor: "var(--muted)" }}
              className="p-4 flex items-center justify-between transaction-item cursor-pointer"
              data-testid="transaction-item-1"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-green-600 text-sm">arrow_upward</span>
                </div>
                <div>
                  <p className="font-medium">Sent to Mary Okafor</p>
                  <p className="text-sm text-muted-foreground">Today, 2:30 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-destructive">-$150.00</p>
                <p className="text-xs text-muted-foreground">≈ ₦123,000</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ backgroundColor: "var(--muted)" }}
              className="p-4 flex items-center justify-between transaction-item cursor-pointer"
              data-testid="transaction-item-2"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-blue-600 text-sm">arrow_downward</span>
                </div>
                <div>
                  <p className="font-medium">Received from James Kone</p>
                  <p className="text-sm text-muted-foreground">Yesterday, 4:15 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">+$85.50</p>
                <p className="text-xs text-muted-foreground">≈ €79.20</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ backgroundColor: "var(--muted)" }}
              className="p-4 flex items-center justify-between transaction-item cursor-pointer"
              data-testid="transaction-item-3"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-purple-600 text-sm">add</span>
                </div>
                <div>
                  <p className="font-medium">Card Top-up</p>
                  <p className="text-sm text-muted-foreground">Mar 15, 10:22 AM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">+$500.00</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Promotions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-accent to-primary p-4 rounded-xl text-white elevation-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1">Refer Friends & Earn</h3>
              <p className="text-sm text-green-100">Get $10 for each successful referral</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              data-testid="button-share-referral"
            >
              Share
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
