import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const ToggleSwitch = ({ checked, onChange, testId }: { checked: boolean; onChange: () => void; testId: string }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        data-testid={testId}
      />
      <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <h1 className="text-lg font-semibold">Settings</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xl">
                {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user?.fullName || 'John Doe'}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full inline-block mt-1">Verified</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="material-icons text-muted-foreground"
              data-testid="button-edit-profile"
            >
              edit
            </motion.button>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">ACCOUNT</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-personal-info"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">person</span>
              <div className="text-left">
                <p className="font-medium">Personal Information</p>
                <p className="text-sm text-muted-foreground">Update your personal details</p>
              </div>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-identity-verification"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">verified_user</span>
              <div className="text-left">
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">Manage KYC documents</p>
              </div>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-payment-methods"
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">payment</span>
              <div className="text-left">
                <p className="font-medium">Payment Methods</p>
                <p className="text-sm text-muted-foreground">Manage cards and bank accounts</p>
              </div>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SECURITY</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-change-password"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">lock</span>
              <div className="text-left">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1">
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">fingerprint</span>
              <div className="text-left">
                <p className="font-medium">Biometric Login</p>
                <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <ToggleSwitch 
              checked={biometricLogin} 
              onChange={() => setBiometricLogin(!biometricLogin)}
              testId="toggle-biometric"
            />
          </div>

          <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1">
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">security</span>
              <div className="text-left">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Extra security for your account</p>
              </div>
            </div>
            <ToggleSwitch 
              checked={twoFactorAuth} 
              onChange={() => setTwoFactorAuth(!twoFactorAuth)}
              testId="toggle-2fa"
            />
          </div>
        </motion.div>

        {/* App Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">APP PREFERENCES</h3>
          
          <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1">
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">dark_mode</span>
              <div className="text-left">
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </div>
            </div>
            <ToggleSwitch 
              checked={darkMode} 
              onChange={toggleDarkMode}
              testId="toggle-dark-mode"
            />
          </div>

          <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1">
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">notifications</span>
              <div className="text-left">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive transaction alerts</p>
              </div>
            </div>
            <ToggleSwitch 
              checked={pushNotifications} 
              onChange={() => setPushNotifications(!pushNotifications)}
              testId="toggle-notifications"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-language"
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">language</span>
              <div className="text-left">
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">English (US)</p>
              </div>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>
        </motion.div>

        {/* Support & Legal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SUPPORT & LEGAL</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/support")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-help-center"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">help</span>
              <span className="font-medium">Help Center</span>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/support")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-contact-support"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">chat</span>
              <span className="font-medium">Contact Support</span>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-terms"
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">description</span>
              <span className="font-medium">Terms of Service</span>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-privacy"
          >
            <div className="flex items-center">
              <span className="material-icons text-muted-foreground mr-3">privacy_tip</span>
              <span className="font-medium">Privacy Policy</span>
            </div>
            <span className="material-icons text-muted-foreground">chevron_right</span>
          </motion.button>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 pt-6"
        >
          <h3 className="font-semibold text-sm text-destructive">DANGER ZONE</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="w-full bg-card p-4 rounded-xl border border-destructive text-destructive flex items-center justify-between hover:bg-destructive/5 transition-colors"
            data-testid="button-logout"
          >
            <div className="flex items-center">
              <span className="material-icons mr-3">logout</span>
              <span className="font-medium">Sign Out</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-card p-4 rounded-xl border border-destructive text-destructive flex items-center justify-between hover:bg-destructive/5 transition-colors"
            data-testid="button-delete-account"
          >
            <div className="flex items-center">
              <span className="material-icons mr-3">delete_forever</span>
              <span className="font-medium">Delete Account</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </motion.button>
        </motion.div>

        <div className="text-center pt-6 pb-4">
          <p className="text-sm text-muted-foreground">GreenPay v2.1.0</p>
        </div>
      </div>
    </div>
  );
}
