import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
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
import { mockCurrencies } from "@/lib/mock-data";

const withdrawSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) >= 10, "Minimum withdrawal is $10"),
  currency: z.string().min(1, "Please select a currency"),
  withdrawMethod: z.string().min(1, "Please select a withdrawal method"),
  accountDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    phoneNumber: z.string().optional(),
    country: z.string().optional(),
  }),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      withdrawMethod: "",
      accountDetails: {
        bankName: "",
        accountNumber: "",
        accountName: "",
        phoneNumber: "",
        country: "",
      },
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      const response = await apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        type: "withdraw",
        amount: data.amount,
        currency: data.currency,
        description: `Withdrawal via ${data.withdrawMethod}`,
        fee: "2.99",
        recipientDetails: data.accountDetails,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal successful!",
        description: `$${form.getValues("amount")} has been withdrawn from your account.`,
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Withdrawal failed",
        description: "Unable to process withdrawal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawForm) => {
    withdrawMutation.mutate(data);
  };

  const withdrawMethods = [
    {
      id: "bank-transfer",
      name: "Bank Transfer",
      icon: "account_balance",
      description: "Direct transfer to your bank account",
      fee: "$2.99",
      processingTime: "1-3 business days",
      countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Uganda"],
    },
    {
      id: "mobile-money",
      name: "Mobile Money",
      icon: "phone_android",
      description: "M-Pesa, Airtel Money, MTN Mobile Money",
      fee: "$1.99",
      processingTime: "Within 30 minutes",
      countries: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Cameroon"],
    },
    {
      id: "local-bank",
      name: "Local Bank Account",
      icon: "account_balance_wallet",
      description: "Direct deposit to local African banks",
      fee: "$3.99",
      processingTime: "2-4 hours",
      countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt"],
    },
  ];

  const africanCountries = [
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "UG", name: "Uganda", flag: "🇺🇬" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
    { code: "RW", name: "Rwanda", flag: "🇷🇼" },
    { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
    { code: "CM", name: "Cameroon", flag: "🇨🇲" },
    { code: "SN", name: "Senegal", flag: "🇸🇳" },
  ];

  const getWithdrawFee = () => {
    const method = withdrawMethods.find(m => m.id === selectedMethod);
    return method?.fee || "$2.99";
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
        <h1 className="text-lg font-semibold">Withdraw Money</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Available for Withdrawal</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-available-balance">$2,847.65</p>
            <p className="text-xs text-muted-foreground mt-1">Virtual Card Balance</p>
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
              <h3 className="font-semibold mb-4">How much would you like to withdraw?</h3>
              
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
                          {mockCurrencies.slice(0, 3).map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code}
                            </SelectItem>
                          ))}
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

            {/* Withdrawal Methods */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Choose Withdrawal Method</h3>
                <p className="text-sm text-muted-foreground">Available in African countries</p>
              </div>
              
              <FormField
                control={form.control}
                name="withdrawMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="divide-y divide-border">
                      {withdrawMethods.map((method) => (
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
                          data-testid={`withdraw-method-${method.id}`}
                        >
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mr-4">
                            <span className="material-icons text-muted-foreground">{method.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{method.name}</p>
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                {method.fee}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="text-xs text-accent font-medium mt-1">{method.processingTime}</p>
                          </div>
                          {field.value === method.id && (
                            <span className="material-icons text-primary ml-2">check_circle</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Account Details Form */}
            {selectedMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border elevation-1"
              >
                <h3 className="font-semibold mb-4">
                  {selectedMethod === "mobile-money" ? "Mobile Money Details" :
                   selectedMethod === "bank-transfer" ? "Bank Account Details" :
                   selectedMethod === "western-union" ? "Recipient Details" :
                   "Account Details"}
                </h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountDetails.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select destination country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {africanCountries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountDetails.accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedMethod === "mobile-money" ? "Account Holder Name" :
                           selectedMethod === "western-union" ? "Recipient Name" :
                           "Account Holder Name"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter full name as it appears on account"
                            data-testid="input-account-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedMethod === "mobile-money" && (
                    <FormField
                      control={form.control}
                      name="accountDetails.phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Money Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="e.g., +254712345678"
                              data-testid="input-mobile-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(selectedMethod === "bank-transfer" || selectedMethod === "local-bank") && (
                    <>
                      <FormField
                        control={form.control}
                        name="accountDetails.bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., GTBank, Equity Bank, Standard Bank"
                                data-testid="input-bank-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter bank account number"
                                data-testid="input-account-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {selectedMethod === "western-union" && (
                    <FormField
                      control={form.control}
                      name="accountDetails.phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="Phone number for pickup notification"
                              data-testid="input-recipient-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </motion.div>
            )}

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
                  <h4 className="font-medium text-accent mb-1">Important Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure all account details are correct to avoid delays</li>
                    <li>• Withdrawals cannot be cancelled once processed</li>
                    <li>• You may be contacted for verification purposes</li>
                    <li>• Exchange rates are locked at the time of withdrawal</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Transaction Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Amount</span>
                  <span className="font-medium">${form.watch("amount") || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">{getWithdrawFee()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium">1 USD = 820 NGN</span>
                </div>
                {selectedMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span className="font-medium text-accent">
                      {withdrawMethods.find(m => m.id === selectedMethod)?.processingTime}
                    </span>
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between font-bold">
                  <span>You Receive</span>
                  <span className="text-primary">
                    ${form.watch("amount") ? 
                      (parseFloat(form.watch("amount")) - parseFloat(getWithdrawFee().replace('$', ''))).toFixed(2) : 
                      "0.00"}
                  </span>
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
                disabled={withdrawMutation.isPending || !selectedMethod}
                data-testid="button-confirm-withdrawal"
              >
                {withdrawMutation.isPending ? "Processing..." : `Withdraw $${form.watch("amount") || "0.00"}`}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
