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

  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const transactions = transactionData?.transactions || [];

  const filteredTransactions = transactions.filter((transaction: any) => {
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
      case "exchange":
        return { icon: "swap_horiz", bg: "bg-indigo-100", color: "text-indigo-600" };
      case "card_purchase":
        return { icon: "credit_card", bg: "bg-pink-100", color: "text-pink-600" };
      default:
        return { icon: "account_balance", bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
      case "processing":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getAmountPrefix = (type: string, status: string) => {
    if (status === "failed") return "";
    return type === "send" || type === "withdraw" || type === "card_purchase" || type === "exchange" ? "-" : "+";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <motion.div className="bg-card shadow-sm p-4 elevation-1">
          <h1 className="text-lg font-semibold">Transactions</h1>
        </motion.div>
        <div className="p-6 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
            <p className="text-2xl font-bold text-primary" data-testid="text-monthly-total">
              ${transactions.reduce((total: number, txn: any) => 
                txn.status === 'completed' ? total + parseFloat(txn.amount) : total, 0
              ).toFixed(2)}
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="font-semibold text-destructive" data-testid="text-monthly-sent">
                  ${transactions.filter((txn: any) => (txn.type === 'send' || txn.type === 'withdraw' || txn.type === 'card_purchase') && txn.status === 'completed')
                    .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="font-semibold text-primary" data-testid="text-monthly-received">
                  ${transactions.filter((txn: any) => (txn.type === 'receive' || txn.type === 'deposit') && txn.status === 'completed')
                    .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-muted-foreground mb-4">receipt_long</span>
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">Start sending or receiving money to see your transaction history here.</p>
              <button
                onClick={() => setLocation('/send-money')}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Money
              </button>
            </div>
          ) : (
            filteredTransactions.map((transaction: any) => {
              const iconData = getTransactionIcon(transaction.type, transaction.status);
              const prefix = getAmountPrefix(transaction.type, transaction.status);
              const recipientName = transaction.recipientDetails?.name || 
                (transaction.type === 'deposit' ? 'Wallet Top-up' : 
                 transaction.type === 'withdraw' ? 'Bank Withdrawal' : 
                 transaction.type === 'card_purchase' ? 'Virtual Card Purchase' :
                 transaction.type === 'exchange' ? 'Currency Exchange' : 'Transaction');
              
              const transactionDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors elevation-1 cursor-pointer"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${iconData.bg} rounded-full flex items-center justify-center mr-3`}>
                        <span className={`material-icons text-sm ${iconData.color}`}>{iconData.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-recipient-${transaction.id}`}>
                          {recipientName}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span data-testid={`text-date-${transaction.id}`}>
                            {transactionDate}
                          </span>
                          {transaction.description && (
                            <>
                              <span>•</span>
                              <span>{transaction.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.status === "failed" 
                          ? "text-muted-foreground" 
                          : transaction.type === "send" || transaction.type === "withdraw" || transaction.type === "card_purchase" || transaction.type === "exchange"
                          ? "text-destructive" 
                          : "text-primary"
                      }`} data-testid={`text-amount-${transaction.id}`}>
                        {prefix}${transaction.amount}
                      </p>
                      <div className="flex items-center justify-end space-x-2">
                        {transaction.metadata?.convertedAmount && transaction.metadata?.targetCurrency && (
                          <span className="text-xs text-muted-foreground">
                            ≈ {transaction.metadata.targetCurrency} {transaction.metadata.convertedAmount}
                          </span>
                        )}
                        <span className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}