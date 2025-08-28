import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { mockCurrencies, mockExchangeRates } from "@/lib/mock-data";

const amountSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  currency: z.string().min(1, "Please select a currency"),
});

type AmountForm = z.infer<typeof amountSchema>;

export default function SendAmountPage() {
  const [, setLocation] = useLocation();
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(820);
  const [recipientAmount, setRecipientAmount] = useState<string>("0");
  const { user } = useAuth();

  const form = useForm<AmountForm>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
    },
  });

  const watchedAmount = form.watch("amount");
  const watchedCurrency = form.watch("currency");

  useEffect(() => {
    // Get selected recipient from previous step
    const recipient = sessionStorage.getItem('selectedRecipient');
    if (recipient) {
      setSelectedRecipient(JSON.parse(recipient));
    } else {
      setLocation("/send-money");
    }
  }, [setLocation]);

  useEffect(() => {
    // Calculate recipient amount based on exchange rate
    if (watchedAmount && parseFloat(watchedAmount) > 0) {
      const amount = parseFloat(watchedAmount) * exchangeRate;
      setRecipientAmount(amount.toLocaleString());
    } else {
      setRecipientAmount("0");
    }
  }, [watchedAmount, exchangeRate]);

  const handleContinue = (data: AmountForm) => {
    const transferData = {
      recipient: selectedRecipient,
      amount: data.amount,
      currency: data.currency,
      recipientAmount,
      exchangeRate,
      fee: "2.99",
      total: (parseFloat(data.amount) + 2.99).toFixed(2),
    };
    sessionStorage.setItem('transferData', JSON.stringify(transferData));
    setLocation("/send-confirm");
  };

  if (!selectedRecipient) {
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
          onClick={() => setLocation("/send-money")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Send to {selectedRecipient.name}</h1>
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
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleContinue)} className="space-y-6">
            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-6 rounded-xl border border-border text-center elevation-1"
            >
              <p className="text-muted-foreground mb-4">You send</p>
              <div className="flex items-center justify-center mb-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="text-lg font-medium border-none bg-transparent focus:outline-none mr-2 w-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCurrencies.slice(0, 3).map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="text-4xl font-bold bg-transparent border-none focus:outline-none text-center p-0 h-auto"
                      placeholder="0"
                      data-testid="input-amount"
                    />
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground">Available balance: $2,847.65</p>
              <FormMessage />
            </motion.div>

            {/* Exchange Rate */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <div className="flex items-center justify-center mb-4">
                <span className="material-icons text-primary">swap_vert</span>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-2">They receive</p>
                <p className="text-2xl font-bold" data-testid="text-recipient-amount">₦{recipientAmount}</p>
                <p className="text-sm text-muted-foreground">1 USD = {exchangeRate.toLocaleString()} NGN</p>
              </div>
            </motion.div>

            {/* Fee Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Transaction Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium" data-testid="text-amount">${watchedAmount || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer fee</span>
                  <span className="font-medium">$2.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange rate</span>
                  <span className="font-medium">1 USD = {exchangeRate.toLocaleString()} NGN</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-bold">
                  <span>Total to pay</span>
                  <span data-testid="text-total">
                    ${watchedAmount ? (parseFloat(watchedAmount) + 2.99).toFixed(2) : "2.99"}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Arrival time</span>
                  <span>Within 5 minutes</span>
                </div>
              </div>
            </motion.div>

            {/* Delivery Method */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Delivery Method</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between p-3 border border-primary rounded-xl bg-primary/5">
                  <div className="flex items-center">
                    <span className="material-icons text-primary mr-3">account_balance</span>
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">GTBank ****4567</p>
                    </div>
                  </div>
                  <span className="material-icons text-primary">check_circle</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                className="w-full ripple"
                data-testid="button-review-transfer"
              >
                Review Transfer
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
