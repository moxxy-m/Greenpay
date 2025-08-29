import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const status = urlParams.get('status');
    
    let description = "Your payment could not be processed. Please try again.";
    if (error) {
      description = decodeURIComponent(error);
    } else if (status) {
      description = `Payment status: ${status}. Please try again.`;
    }
    
    toast({
      title: "Payment Failed",
      description,
      variant: "destructive",
    });
  }, [toast]);

  const handleRetry = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'virtual-card') {
      setLocation("/virtual-card");
    } else {
      setLocation("/deposit");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
          <p className="text-muted-foreground">
            We couldn't process your payment. This could be due to insufficient funds, network issues, or other payment problems.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleRetry}
            className="w-full"
            data-testid="button-retry"
          >
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="w-full"
            data-testid="button-dashboard"
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => setLocation("/support")}
            className="w-full text-sm"
            data-testid="button-support"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}