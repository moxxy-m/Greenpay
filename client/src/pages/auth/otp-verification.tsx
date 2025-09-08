import { motion } from "framer-motion";
import { useLocation } from "wouter";
import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function OtpVerificationPage() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        code,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Phone verified!",
        description: "Your phone number has been successfully verified.",
      });
      setLocation("/kyc-verification");
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Invalid OTP code. Please try again.",
        variant: "destructive",
      });
      // Clear OTP inputs
      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    },
  });

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next element
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      verifyOtpMutation.mutate(otpCode);
    }
  };

  const handleResend = () => {
    toast({
      title: "OTP Resent",
      description: "A new verification code has been sent to your phone.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/signup")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Verify Phone</h1>
      </motion.div>

      <div className="flex-1 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="material-icons text-white text-2xl">sms</span>
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">Verify Your Phone</h2>
          <p className="text-muted-foreground mb-8">
            We've sent a 6-digit code to
            <br />
            <strong>+1 (555) 123-4567</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center space-x-3 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-12 h-12 text-center text-xl font-bold border border-border rounded-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  data-testid={`input-otp-${index}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full ripple mb-4"
              disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
              data-testid="button-verify"
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <p className="text-muted-foreground text-sm">
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              className="text-primary hover:underline font-medium"
              data-testid="button-resend"
            >
              Resend SMS
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
