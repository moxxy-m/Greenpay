import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const type = urlParams.get('type');
    
    if (reference && type) {
      if (type === 'virtual-card') {
        toast({
          title: "Card Purchase Successful!",
          description: "Your virtual card has been activated and is ready to use",
        });
      } else if (type === 'deposit') {
        toast({
          title: "Deposit Successful!",
          description: "Your account has been credited successfully",
        });
      }
    }
  }, [toast]);

  const handleContinue = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'virtual-card') {
      setLocation("/virtual-card");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment has been processed successfully
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleContinue}
            className="w-full"
            data-testid="button-continue"
          >
            Continue
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="w-full"
            data-testid="button-dashboard"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}