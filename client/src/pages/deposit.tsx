import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) >= 10, "Minimum deposit is $10"),
  currency: z.string().min(1, "Please select a currency"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function DepositPage() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  // Refresh user data when deposit page loads to get latest balance
  useEffect(() => {
    refreshUser();
  }, []);

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      paymentMethod: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      // Initialize payment with Paystack
      const response = await apiRequest("POST", "/api/deposit/initialize-payment", {
        userId: user?.id,
        amount: data.amount,
        currency: data.currency,
      });
      const result = await response.json();
      
      if (result.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.href = result.authorizationUrl;
      }
      
      return result;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: "credit_card",
      description: "Instant deposit with your card",
      fee: "2.9% + $0.30",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: "account_balance",
      description: "Direct bank transfer (3-5 business days)",
      fee: "Free",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "account_balance_wallet",
      description: "Pay with your PayPal account",
      fee: "3.4% + $0.30",
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      icon: "currency_bitcoin",
      description: "Deposit with Bitcoin, Ethereum, or USDC",
      fee: "1% network fee",
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
        <h1 className="text-lg font-semibold">Add Money</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-current-balance">
              ${user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
            </p>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-4">How much would you like to add?</h3>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">$ USD</SelectItem>
                          <SelectItem value="EUR">€ EUR</SelectItem>
                          <SelectItem value="GBP">£ GBP</SelectItem>
                          <SelectItem value="NGN">₦ NGN</SelectItem>
                          <SelectItem value="KES">KSh KES</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="text-lg"
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["50", "100", "250", "500"].map((amount) => (
                  <motion.button
                    key={amount}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => form.setValue("amount", amount)}
                    className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    data-testid={`quick-amount-${amount}`}
                  >
                    ${amount}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Choose Payment Method</h3>
              </div>
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="divide-y divide-border">
                      {paymentMethods.map((method) => (
                        <motion.button
                          key={method.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            field.onChange(method.id);
                            setSelectedMethod(method.id);
                          }}
                          className={`w-full p-4 flex items-center text-left transition-colors ${
                            field.value === method.id ? 'bg-primary/5 border-r-2 border-primary' : 'hover:bg-muted'
                          }`}
                          data-testid={`payment-method-${method.id}`}
                        >
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mr-4">
                            <span className="material-icons text-muted-foreground">{method.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="text-xs text-primary font-medium mt-1">Fee: {method.fee}</p>
                          </div>
                          {field.value === method.id && (
                            <span className="material-icons text-primary">check_circle</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Payment Details */}
            {selectedMethod === "card" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border elevation-1"
              >
                <h3 className="font-semibold mb-4">Card Details</h3>
                <div className="space-y-3">
                  <Input placeholder="Card Number" data-testid="input-card-number" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="MM/YY" data-testid="input-expiry" />
                    <Input placeholder="CVV" data-testid="input-cvv" />
                  </div>
                  <Input placeholder="Cardholder Name" data-testid="input-cardholder" />
                </div>
              </motion.div>
            )}

            {selectedMethod === "bank" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border elevation-1"
              >
                <h3 className="font-semibold mb-4">Bank Transfer Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Bank: GreenPay Bank</p>
                    <p>Account: 1234567890</p>
                    <p>Routing: 021000021</p>
                    <p>Reference: GP-{user?.id?.slice(-8)}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Transfer funds to the account above and include the reference number.
                    Processing time: 3-5 business days.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">${form.watch("amount") || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium">
                    {selectedMethod === "bank" ? "Free" : 
                     selectedMethod === "card" ? "$2.99" : 
                     selectedMethod === "paypal" ? "$3.49" : 
                     selectedMethod === "crypto" ? "$1.50" : "TBD"}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    ${selectedMethod === "bank" ? form.watch("amount") || "0.00" : 
                      selectedMethod && form.watch("amount") ? (parseFloat(form.watch("amount")) + 2.99).toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full ripple"
                disabled={depositMutation.isPending}
                data-testid="button-confirm-deposit"
              >
                {depositMutation.isPending ? "Processing..." : `Add $${form.watch("amount") || "0.00"}`}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
