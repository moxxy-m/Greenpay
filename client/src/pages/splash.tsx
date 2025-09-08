import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import React, { useEffect } from "react";

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Auto-redirect authenticated users to dashboard
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-white px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 elevation-3"
        >
          <span className="material-icons text-primary text-4xl">attach_money</span>
        </motion.div>
        
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-bold mb-4 text-center"
          data-testid="app-title"
        >
          Welcome to GreenPay
        </motion.h1>
        
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl text-center text-green-100 mb-8 max-w-sm"
        >
          Send money to Africa safely, quickly, and affordably
        </motion.p>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-sm space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/login")}
            className="w-full bg-white text-primary font-semibold py-4 px-6 rounded-xl ripple elevation-2 transition-all duration-200 hover:bg-gray-50"
            data-testid="button-signin"
          >
            Sign In
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/signup")}
            className="w-full border-2 border-white text-white font-semibold py-4 px-6 rounded-xl ripple transition-all duration-200 hover:bg-white hover:text-primary"
            data-testid="button-signup"
          >
            Create Account
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="p-6 text-center"
      >
        <p className="text-green-200 text-sm">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
