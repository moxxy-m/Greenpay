import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import { useToast } from "@/hooks/use-toast";

export default function ExchangePage() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KES");
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: exchangeRates } = useExchangeRates(fromCurrency);
  const exchangeMutation = useCurrencyExchange();

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭" },
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
    { code: "RWF", name: "Rwandan Franc", symbol: "RF", flag: "🇷🇼" },
  ];

  const exchangeRate = exchangeRates?.rates?.[toCurrency] || 1;
  const convertedAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : "0.00";
  const fee = amount ? (parseFloat(amount) * 0.015).toFixed(2) : "0.00"; // 1.5% fee
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : "0.00";

  const handleExchange = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to exchange",
        variant: "destructive",
      });
      return;
    }

    if (!user?.hasVirtualCard) {
      toast({
        title: "Virtual Card Required",
        description: "You need a virtual card to perform currency exchanges",
        variant: "destructive",
      });
      return;
    }

    exchangeMutation.mutate({
      amount,
      fromCurrency,
      toCurrency,
    }, {
      onSuccess: () => {
        setAmount("");
      }
    });
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
        <h1 className="text-lg font-semibold">Currency Exchange</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-primary">{user?.balance || "0.00"} USD</p>
          </div>
        </motion.div>

        {/* Exchange Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-4">Exchange Currency</h3>
          
          <div className="space-y-4">
            {/* From Currency */}
            <div>
              <label className="text-sm font-medium mb-2 block">You pay</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                  data-testid="input-amount"
                />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <span className="material-icons mr-1 text-sm">sync_alt</span>
                1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
              </div>
            </div>

            {/* To Currency */}
            <div>
              <label className="text-sm font-medium mb-2 block">You receive</label>
              <div className="flex space-x-2">
                <Input
                  value={convertedAmount}
                  disabled
                  className="flex-1 bg-muted/50"
                  data-testid="text-converted-amount"
                />
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fee Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <h4 className="font-medium mb-3">Exchange breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Exchange amount</span>
              <span>{amount || "0.00"} {fromCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span>Exchange fee (1.5%)</span>
              <span>{fee} {fromCurrency}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total deducted</span>
                <span>{total} {fromCurrency}</span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-green-700 dark:text-green-300">
              <div className="flex justify-between font-medium">
                <span>You will receive</span>
                <span>{convertedAmount} {toCurrency}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exchange Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleExchange}
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || exchangeMutation.isPending}
            data-testid="button-exchange"
          >
            {exchangeMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing Exchange...
              </div>
            ) : (
              "Exchange Currency"
            )}
          </Button>
        </motion.div>

        {/* Exchange History Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Recent Exchanges</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/transactions")}
              className="text-primary hover:text-primary"
            >
              View All
            </Button>
          </div>
          <div className="text-center py-6 text-muted-foreground">
            <span className="material-icons text-3xl mb-2">swap_horiz</span>
            <p className="text-sm">No recent exchanges</p>
            <p className="text-xs">Your currency exchanges will appear here</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}