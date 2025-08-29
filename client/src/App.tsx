import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import SplashPage from "@/pages/splash";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import OtpVerificationPage from "@/pages/auth/otp-verification";
import KycVerificationPage from "@/pages/auth/kyc-verification";
import VirtualCardPurchasePage from "@/pages/auth/virtual-card-purchase";
import DashboardPage from "@/pages/dashboard";
import SendMoneyPage from "@/pages/send-money";
import SendAmountPage from "@/pages/send-amount";
import SendConfirmPage from "@/pages/send-confirm";
import ReceiveMoneyPage from "@/pages/receive-money";
import TransactionsPage from "@/pages/transactions";
import VirtualCardPage from "@/pages/virtual-card";
import SettingsPage from "@/pages/settings";
import SupportPage from "@/pages/support";
import DepositPage from "@/pages/deposit";
import WithdrawPage from "@/pages/withdraw";
import ExchangePage from "@/pages/exchange";
import KycPage from "@/pages/kyc";
import LoadingScreen from "@/components/loading-screen";
import BottomNavigation from "@/components/bottom-navigation";
import { PWAInstallPrompt } from "@/components/pwa-install";
import PaymentCallbackPage from "@/pages/payment-callback";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard-new";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/send-money" component={SendMoneyPage} />
      <Route path="/send-amount" component={SendAmountPage} />
      <Route path="/send-confirm" component={SendConfirmPage} />
      <Route path="/receive-money" component={ReceiveMoneyPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/virtual-card" component={VirtualCardPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/deposit" component={DepositPage} />
      <Route path="/withdraw" component={WithdrawPage} />
      <Route path="/exchange" component={ExchangePage} />
      <Route path="/kyc" component={KycPage} />
      <Route path="/payment-callback" component={PaymentCallbackPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <LoadingScreen />
          <Toaster />
          <Router />
          <BottomNavigation />
          <PWAInstallPrompt />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
