import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

type TransactionFilter = "all" | "sent" | "received" | "pending";

export default function TransactionsPage() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const mockTransactions = [
    {
      id: "1",
      type: "send",
      amount: "150.00",
      status: "completed",
      recipient: "Mary Okafor",
      date: "Today, 2:30 PM",
      method: "Bank Transfer",
      exchangeAmount: "₦123,000",
    },
    {
      id: "2",
      type: "deposit",
      amount: "300.00",
      status: "completed",
      recipient: "Wallet Top-up",
      date: "Today, 11:15 AM",
      method: "Card Payment",
    },
    {
      id: "3",
      type: "receive",
      amount: "85.50",
      status: "completed",
      recipient: "James Kone",
      date: "Yesterday, 4:15 PM",
      method: "Mobile Money",
    },
    {
      id: "4",
      type: "withdraw",
      amount: "200.00",
      status: "completed",
      recipient: "Withdrawal",
      date: "Yesterday, 1:20 PM",
      method: "Bank Transfer",
    },
    {
      id: "5",
      type: "send",
      amount: "75.00",
      status: "failed",
      recipient: "Failed Transfer",
      date: "Mar 15",
      method: "Bank Transfer",
    },
    {
      id: "6",
      type: "send",
      amount: "125.00",
      status: "pending",
      recipient: "Pending Transfer",
      date: "Mar 14",
      method: "Under Review",
    },
  ];

  const filteredTransactions = mockTransactions.filter(transaction => {
    switch (activeFilter) {
      case "sent":
        return transaction.type === "send";
      case "received":
        return transaction.type === "receive";
      case "pending":
        return transaction.status === "pending";
      default:
        return true;
    }
  });

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "failed") return { icon: "close", bg: "bg-red-100", color: "text-red-600" };
    if (status === "pending") return { icon: "schedule", bg: "bg-yellow-100", color: "text-yellow-600" };
    
    switch (type) {
      case "send":
        return { icon: "arrow_upward", bg: "bg-green-100", color: "text-green-600" };
      case "receive":
        return { icon: "arrow_downward", bg: "bg-blue-100", color: "text-blue-600" };
      case "deposit":
        return { icon: "add", bg: "bg-purple-100", color: "text-purple-600" };
      case "withdraw":
        return { icon: "remove", bg: "bg-orange-100", color: "text-orange-600" };
      default:
        return { icon: "account_balance", bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getAmountPrefix = (type: string, status: string) => {
    if (status === "failed") return "";
    return type === "send" || type === "withdraw" ? "-" : "+";
  };

  const getAmountColor = (type: string, status: string) => {
    if (status === "failed") return "text-muted-foreground";
    return type === "send" || type === "withdraw" ? "text-destructive" : "text-primary";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 elevation-1"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Transactions</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="material-icons text-muted-foreground p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-filter"
          >
            filter_list
          </motion.button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: "all", label: "All" },
            { id: "sent", label: "Sent" },
            { id: "received", label: "Received" },
            { id: "pending", label: "Pending" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as TransactionFilter)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeFilter === filter.id
                  ? "bg-card text-foreground elevation-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`filter-${filter.id}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="p-6">
        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl border border-border mb-6 elevation-1"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-monthly-total">$2,485.50</p>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="font-semibold text-destructive" data-testid="text-monthly-sent">$1,250.00</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="font-semibold text-primary" data-testid="text-monthly-received">$1,235.50</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction List */}
        <div className="space-y-4">
          {/* Today */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Today</h3>
            <div className="space-y-3">
              {filteredTransactions
                .filter(t => t.date.includes("Today"))
                .map((transaction, index) => {
                  const iconConfig = getTransactionIcon(transaction.type, transaction.status);
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-card p-4 rounded-xl border border-border transaction-item cursor-pointer elevation-1 hover:bg-muted transition-colors"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${iconConfig.bg} rounded-full flex items-center justify-center mr-3`}>
                            <span className={`material-icons ${iconConfig.color} text-sm`}>{iconConfig.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{transaction.recipient}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date} • {transaction.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getAmountColor(transaction.type, transaction.status)}`}>
                            {getAmountPrefix(transaction.type, transaction.status)}${transaction.amount}
                          </p>
                          {transaction.exchangeAmount ? (
                            <p className="text-xs text-muted-foreground">{transaction.exchangeAmount}</p>
                          ) : (
                            <p className={`text-xs ${getStatusColor(transaction.status)} capitalize`}>{transaction.status}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>

          {/* Yesterday */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Yesterday</h3>
            <div className="space-y-3">
              {filteredTransactions
                .filter(t => t.date.includes("Yesterday"))
                .map((transaction, index) => {
                  const iconConfig = getTransactionIcon(transaction.type, transaction.status);
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-card p-4 rounded-xl border border-border transaction-item cursor-pointer elevation-1 hover:bg-muted transition-colors"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${iconConfig.bg} rounded-full flex items-center justify-center mr-3`}>
                            <span className={`material-icons ${iconConfig.color} text-sm`}>{iconConfig.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{transaction.recipient}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date} • {transaction.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getAmountColor(transaction.type, transaction.status)}`}>
                            {getAmountPrefix(transaction.type, transaction.status)}${transaction.amount}
                          </p>
                          <p className={`text-xs ${getStatusColor(transaction.status)} capitalize`}>{transaction.status}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>

          {/* This Week */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">This Week</h3>
            <div className="space-y-3">
              {filteredTransactions
                .filter(t => t.date.includes("Mar"))
                .map((transaction, index) => {
                  const iconConfig = getTransactionIcon(transaction.type, transaction.status);
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="bg-card p-4 rounded-xl border border-border transaction-item cursor-pointer elevation-1 hover:bg-muted transition-colors"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${iconConfig.bg} rounded-full flex items-center justify-center mr-3`}>
                            <span className={`material-icons ${iconConfig.color} text-sm`}>{iconConfig.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium">{transaction.recipient}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date} • {transaction.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getAmountColor(transaction.type, transaction.status)}`}>
                            {getAmountPrefix(transaction.type, transaction.status)}${transaction.amount}
                          </p>
                          <p className={`text-xs ${getStatusColor(transaction.status)} capitalize`}>{transaction.status}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
