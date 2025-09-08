import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentProcessingPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'timeout'>('processing');
  const [pollCount, setPollCount] = useState(0);
  const [reference, setReference] = useState<string>('');
  const [type, setType] = useState<string>('');

  // Extract reference and type from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('reference');
    const typeParam = urlParams.get('type');
    
    if (refParam) setReference(refParam);
    if (typeParam) setType(typeParam);
  }, []);

  // Poll transaction status
  useEffect(() => {
    if (!reference) return;

    const pollInterval = setInterval(async () => {
      try {
        setPollCount(prev => prev + 1);
        
        const response = await fetch(`/api/transaction-status/${reference}`);
        const data = await response.json();
        
        console.log('Transaction status poll result:', data);
        
        if (data.success && data.status) {
          if (data.status.toLowerCase() === 'success' || data.status.toLowerCase() === 'completed') {
            setStatus('success');
            clearInterval(pollInterval);
            
            // Redirect to dashboard after showing success animation
            setTimeout(() => {
              setLocation('/dashboard');
            }, 3000);
          } else if (data.status.toLowerCase() === 'failed' || data.status.toLowerCase() === 'cancelled') {
            setStatus('failed');
            clearInterval(pollInterval);
          }
        }
        
        // Timeout after 60 polls (5 minutes at 5-second intervals)
        if (pollCount >= 60) {
          setStatus('timeout');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Initial delay before first poll
    const initialDelay = setTimeout(() => {
      // First poll after 3 seconds
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(initialDelay);
    };
  }, [reference, pollCount]);

  const handleTryAgain = () => {
    if (type === 'virtual-card') {
      setLocation('/virtual-card');
    } else {
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-16 h-16 flex items-center justify-center"
              >
                <Loader2 className="w-16 h-16 text-primary" />
              </motion.div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Processing Payment</h1>
                <p className="text-muted-foreground">
                  Please wait while we confirm your M-Pesa payment...
                </p>
              </div>

              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Reference: <span className="font-mono text-foreground">{reference}</span>
                </p>
              </div>

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-sm text-muted-foreground"
              >
                This may take up to 2 minutes...
              </motion.div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
                <p className="text-muted-foreground">
                  {type === 'virtual-card' 
                    ? 'Your virtual card has been activated successfully.'
                    : 'Your payment has been processed successfully.'
                  }
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="text-sm text-green-700 dark:text-green-300">
                  Redirecting to dashboard in 3 seconds...
                </p>
              </motion.div>
            </motion.div>
          )}

          {(status === 'failed' || status === 'timeout') && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <XCircle className="w-20 h-20 text-red-500 mx-auto" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h1 className="text-2xl font-bold text-red-600">
                  {status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
                </h1>
                <p className="text-muted-foreground">
                  {status === 'timeout' 
                    ? 'We couldn\'t confirm your payment status. Please contact support if you completed the payment.'
                    : 'Your payment was not completed successfully. Please try again.'
                  }
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button 
                  onClick={handleTryAgain}
                  className="w-full"
                  data-testid="button-try-again"
                >
                  {type === 'virtual-card' ? 'Try Purchase Again' : 'Back to Dashboard'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}