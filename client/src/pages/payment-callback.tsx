import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentCallbackPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    
    const actualReference = reference || trxref;
    
    if (actualReference && user?.id) {
      // Verify the payment
      if (actualReference.includes('card')) {
        // Virtual card payment
        verifyCardPayment(actualReference);
      } else {
        // Deposit payment
        verifyDepositPayment(actualReference);
      }
    } else {
      toast({
        title: "Payment Error",
        description: "Invalid payment reference",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user?.id, setLocation, toast]);

  const verifyCardPayment = async (reference: string) => {
    try {
      const response = await apiRequest("POST", "/api/virtual-card/verify-payment", {
        reference,
        userId: user?.id
      });
      
      if (response.ok) {
        toast({
          title: "Card Purchase Successful!",
          description: "Your virtual card has been activated",
        });
        setLocation("/virtual-card");
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Unable to verify card payment",
        variant: "destructive",
      });
      setLocation("/virtual-card");
    }
  };

  const verifyDepositPayment = async (reference: string) => {
    try {
      // Get amount from URL or localStorage if needed
      const urlParams = new URLSearchParams(window.location.search);
      const amount = urlParams.get('amount') || '0';
      const currency = urlParams.get('currency') || 'USD';
      
      const response = await apiRequest("POST", "/api/deposit/verify-payment", {
        reference,
        userId: user?.id,
        amount,
        currency
      });
      
      if (response.ok) {
        toast({
          title: "Deposit Successful!",
          description: `Your account has been credited`,
        });
        setLocation("/dashboard");
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Unable to verify deposit payment",
        variant: "destructive",
      });
      setLocation("/deposit");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    </div>
  );
}