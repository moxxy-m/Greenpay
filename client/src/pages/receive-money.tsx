import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "@/components/qr-code";
import { mockCurrencies } from "@/lib/mock-data";

const paymentRequestSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  currency: z.string().min(1, "Please select a currency"),
  toEmail: z.string().optional(),
  toPhone: z.string().optional(),
  message: z.string().optional(),
}).refine((data) => data.toEmail || data.toPhone, {
  message: "Please enter either email or phone number",
  path: ["toEmail"],
});

type PaymentRequestForm = z.infer<typeof paymentRequestSchema>;

export default function ReceiveMoneyPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"qr" | "request">("qr");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<PaymentRequestForm>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      toEmail: "",
      toPhone: "",
      message: "",
    },
  });

  const paymentRequestMutation = useMutation({
    mutationFn: async (data: PaymentRequestForm) => {
      const response = await apiRequest("POST", "/api/payment-requests", {
        fromUserId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment request sent!",
        description: "The recipient will be notified about your payment request.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Unable to send payment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentRequestForm) => {
    paymentRequestMutation.mutate(data);
  };

  const handleCopyAccountDetail = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GreenPay QR Code',
        text: 'Scan this QR code to send me money via GreenPay',
      });
    } else {
      toast({
        title: "QR Code ready",
        description: "Save or screenshot the QR code to share.",
      });
    }
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
        <h1 className="text-lg font-semibold">Receive Money</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 bg-muted p-1 rounded-lg"
        >
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === "qr" ? "bg-card text-foreground elevation-1" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-qr"
          >
            QR Code
          </button>
          <button
            onClick={() => setActiveTab("request")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
              activeTab === "request" ? "bg-card text-foreground elevation-1" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-request"
          >
            Request Payment
          </button>
        </motion.div>

        {activeTab === "qr" && (
          <>
            {/* QR Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-6 rounded-xl border border-border text-center elevation-1"
            >
              <h3 className="font-semibold mb-4">Scan to Pay</h3>
              <div className="flex justify-center mb-4">
                <QRCode
                  value={`greenpay://pay/${user?.id}`}
                  size={192}
                  className="mx-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">Share this QR code for instant payments</p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleShare}
                  className="flex-1"
                  data-testid="button-share-qr"
                >
                  <span className="material-icons text-sm mr-1">share</span>
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1"
                  data-testid="button-save-qr"
                >
                  <span className="material-icons text-sm mr-1">file_download</span>
                  Save
                </Button>
              </div>
            </motion.div>

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Share Account Details</h3>
                <button
                  onClick={() => {
                    const details = `Account: GP-${user?.id?.slice(-9)}\nEmail: ${user?.email}\nPhone: ${user?.phone}`;
                    navigator.clipboard.writeText(details);
                    toast({ title: "All details copied!" });
                  }}
                  className="text-primary text-sm hover:underline"
                  data-testid="button-copy-all"
                >
                  Copy All
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">GP-{user?.id?.slice(-9) || "123456789"}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail(`GP-${user?.id?.slice(-9) || "123456789"}`, "Account number")}
                    className="material-icons text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-copy-account"
                  >
                    content_copy
                  </motion.button>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail(user?.email || "", "Email")}
                    className="material-icons text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-copy-email"
                  >
                    content_copy
                  </motion.button>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user?.phone}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyAccountDetail(user?.phone || "", "Phone number")}
                    className="material-icons text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-copy-phone"
                  >
                    content_copy
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "request" && (
          <>
            {/* Payment Request Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-4">Request Payment</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
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
                                  {currency.code}
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
                                data-testid="input-request-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="toEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter email address"
                            data-testid="input-recipient-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone (Alternative)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter phone number"
                            data-testid="input-recipient-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add a note for your payment request"
                            className="h-20"
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full ripple"
                    disabled={paymentRequestMutation.isPending}
                    data-testid="button-send-request"
                  >
                    {paymentRequestMutation.isPending ? "Sending..." : "Send Payment Request"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          </>
        )}

        {/* Recent Requests */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Recent Requests</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4 flex items-center justify-between" data-testid="request-item-1">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-yellow-600 text-sm">schedule</span>
                </div>
                <div>
                  <p className="font-medium">Payment Request</p>
                  <p className="text-sm text-muted-foreground">To: mary.okafor@email.com</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">$125.00</p>
                <p className="text-xs text-yellow-500">Pending</p>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between" data-testid="request-item-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-green-600 text-sm">check</span>
                </div>
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-sm text-muted-foreground">From: james.kone@email.com</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">$85.50</p>
                <p className="text-xs text-green-500">Completed</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
