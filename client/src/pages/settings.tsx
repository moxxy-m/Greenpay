import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: user?.country || "",
  });

  // Settings states
  const [settings, setSettings] = useState({
    defaultCurrency: user?.defaultCurrency || "KES",
    pushNotificationsEnabled: user?.pushNotificationsEnabled !== false,
    twoFactorEnabled: user?.twoFactorEnabled || false,
    biometricEnabled: user?.biometricEnabled || false,
  });

  // Profile editing states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [fingerprintSetup, setFingerprintSetup] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Unable to update profile",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/settings`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Unable to update settings",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    if (!profileData.fullName || !profileData.email || !profileData.phone || !profileData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleSettingUpdate = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-2fa`, { userId: user?.id });
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setIs2FASetup(true);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup 2FA",
        variant: "destructive",
      });
    },
  });

  const setupFingerprintMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-biometric`, { userId: user?.id });
      return response.json();
    },
    onSuccess: () => {
      setFingerprintSetup(true);
      handleSettingUpdate('biometricEnabled', true);
      toast({
        title: "Fingerprint Setup Complete",
        description: "You can now use fingerprint to authenticate",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup fingerprint",
        variant: "destructive",
      });
    },
  });

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        handleSettingUpdate('pushNotificationsEnabled', true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for transactions",
        });
        
        // Register for push notifications
        await apiRequest("POST", `/api/notifications/register`, { 
          userId: user?.id,
          endpoint: 'browser-notification'
        });
      }
    }
  };

  const handleLogout = () => {
    // Clear all local storage and session data
    localStorage.clear();
    sessionStorage.clear();
    logout();
    setLocation("/");
  };

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
              <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                user?.kycStatus === 'verified' 
                  ? 'text-green-600 bg-green-100' 
                  : 'text-yellow-600 bg-yellow-100'
              }`}>
                {user?.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
              </p>
            </div>
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="material-icons text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
                  data-testid="button-edit-profile"
                >
                  edit
                </motion.button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      data-testid="input-full-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={profileData.country}
                      onValueChange={(value) => setProfileData({ ...profileData, country: value })}
                    >
                      <SelectTrigger data-testid="select-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                        <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                        <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleProfileUpdate}
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
          
          {/* Default Currency */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">account_balance</span>
              <div>
                <p className="font-medium">Default Currency</p>
                <p className="text-sm text-muted-foreground">Choose your preferred currency</p>
              </div>
            </div>
            <Select 
              value={settings.defaultCurrency}
              onValueChange={(value) => handleSettingUpdate('defaultCurrency', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-default-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="KES">KSh KES</SelectItem>
                <SelectItem value="NGN">₦ NGN</SelectItem>
                <SelectItem value="GHS">₵ GHS</SelectItem>
                <SelectItem value="ZAR">R ZAR</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
                <SelectItem value="GBP">£ GBP</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* KYC Management */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/kyc")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-kyc"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">verified_user</span>
              <div className="text-left">
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">Manage your KYC documents</p>
              </div>
            </div>
            <span className="material-icons">chevron_right</span>
          </motion.button>

          {/* Virtual Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/virtual-card")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-virtual-card-settings"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">credit_card</span>
              <div className="text-left">
                <p className="font-medium">Virtual Card</p>
                <p className="text-sm text-muted-foreground">
                  {user?.hasVirtualCard ? 'Manage your card' : 'Purchase virtual card'}
                </p>
              </div>
            </div>
            <span className="material-icons">chevron_right</span>
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
          
          {/* 2FA */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">security</span>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.twoFactorEnabled) {
                    setup2FAMutation.mutate();
                  } else {
                    handleSettingUpdate('twoFactorEnabled', checked);
                  }
                }}
                data-testid="switch-2fa"
              />
              {setup2FAMutation.isPending && <span className="text-xs">Setting up...</span>}
            </div>
          </motion.div>

          {/* Biometric */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">fingerprint</span>
              <div>
                <p className="font-medium">Biometric Login</p>
                <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.biometricEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.biometricEnabled) {
                    setupFingerprintMutation.mutate();
                  } else {
                    handleSettingUpdate('biometricEnabled', checked);
                  }
                }}
                data-testid="switch-biometric"
              />
              {setupFingerprintMutation.isPending && <span className="text-xs">Setting up...</span>}
            </div>
          </motion.div>
        </motion.div>

        {/* 2FA QR Code Dialog */}
        {qrCodeUrl && (
          <Dialog open={is2FASetup} onOpenChange={setIs2FASetup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Setup Authenticator</DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Scan with your authenticator app</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Google Authenticator, Authy, or any TOTP app to scan this QR code.
                  </p>
                  <Button 
                    onClick={() => {
                      setIs2FASetup(false);
                      handleSettingUpdate('twoFactorEnabled', true);
                    }}
                    className="w-full"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">NOTIFICATIONS</h3>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">notifications</span>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Transaction alerts and updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.pushNotificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.pushNotificationsEnabled) {
                    requestNotificationPermission();
                  } else {
                    handleSettingUpdate('pushNotificationsEnabled', checked);
                  }
                }}
                data-testid="switch-notifications"
              />
            </div>
          </motion.div>
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
            data-testid="button-support"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">support_agent</span>
              <div className="text-left">
                <p className="font-medium">Help & Support</p>
                <p className="text-sm text-muted-foreground">Get help and contact support</p>
              </div>
            </div>
            <span className="material-icons">chevron_right</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="w-full bg-destructive/10 p-4 rounded-xl border border-destructive/20 flex items-center justify-between hover:bg-destructive/20 transition-colors elevation-1"
            data-testid="button-logout"
          >
            <div className="flex items-center">
              <span className="material-icons text-destructive mr-3">logout</span>
              <span className="font-medium text-destructive">Sign Out</span>
            </div>
          </motion.button>
        </motion.div>

        <div className="text-center pt-6 pb-4">
          <p className="text-sm text-muted-foreground">GreenPay v2.1.0</p>
        </div>
      </div>
    </div>
  );
}