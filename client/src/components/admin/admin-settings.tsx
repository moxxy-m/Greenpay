import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Save, 
  DollarSign,
  Shield,
  Mail,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface SystemSettingsResponse {
  settings: SystemSetting[];
}

export default function AdminSettings() {
  const [fees, setFees] = useState({
    transfer_fee: "2.50",
    exchange_rate_margin: "0.05",
    virtual_card_fee: "5.00",
    withdrawal_fee: "1.00"
  });

  const [security, setSecurity] = useState({
    two_factor_required: true,
    kyc_auto_approval: false,
    max_daily_limit: "10000",
    min_transaction_amount: "1.00"
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    admin_alerts: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery<SystemSettingsResponse>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/settings");
      return response.json();
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest("PUT", `/api/admin/settings/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveFees = () => {
    Object.entries(fees).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value });
    });
  };

  const handleSaveSecurity = () => {
    Object.entries(security).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value: value.toString() });
    });
  };

  const handleSaveNotifications = () => {
    Object.entries(notifications).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value: value.toString() });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure platform settings, fees, and system behavior
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fees">Fees & Pricing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Fees & Pricing Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fees & Pricing Configuration
              </CardTitle>
              <CardDescription>
                Set transaction fees and pricing for different services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer_fee">Transfer Fee ($)</Label>
                  <Input
                    id="transfer_fee"
                    type="number"
                    step="0.01"
                    value={fees.transfer_fee}
                    onChange={(e) => setFees({ ...fees, transfer_fee: e.target.value })}
                    data-testid="input-transfer-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate_margin">Exchange Rate Margin (%)</Label>
                  <Input
                    id="exchange_rate_margin"
                    type="number"
                    step="0.01"
                    value={fees.exchange_rate_margin}
                    onChange={(e) => setFees({ ...fees, exchange_rate_margin: e.target.value })}
                    data-testid="input-exchange-margin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="virtual_card_fee">Virtual Card Fee ($)</Label>
                  <Input
                    id="virtual_card_fee"
                    type="number"
                    step="0.01"
                    value={fees.virtual_card_fee}
                    onChange={(e) => setFees({ ...fees, virtual_card_fee: e.target.value })}
                    data-testid="input-card-fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_fee">Withdrawal Fee ($)</Label>
                  <Input
                    id="withdrawal_fee"
                    type="number"
                    step="0.01"
                    value={fees.withdrawal_fee}
                    onChange={(e) => setFees({ ...fees, withdrawal_fee: e.target.value })}
                    data-testid="input-withdrawal-fee"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveFees}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-fees"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Fee Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security settings and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication Required</Label>
                      <p className="text-sm text-gray-500">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={security.two_factor_required}
                      onCheckedChange={(checked) => setSecurity({ ...security, two_factor_required: checked })}
                      data-testid="switch-2fa-required"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>KYC Auto-Approval</Label>
                      <p className="text-sm text-gray-500">Automatically approve KYC documents</p>
                    </div>
                    <Switch
                      checked={security.kyc_auto_approval}
                      onCheckedChange={(checked) => setSecurity({ ...security, kyc_auto_approval: checked })}
                      data-testid="switch-kyc-auto"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_daily_limit">Max Daily Limit ($)</Label>
                    <Input
                      id="max_daily_limit"
                      type="number"
                      value={security.max_daily_limit}
                      onChange={(e) => setSecurity({ ...security, max_daily_limit: e.target.value })}
                      data-testid="input-daily-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_transaction_amount">Min Transaction Amount ($)</Label>
                    <Input
                      id="min_transaction_amount"
                      type="number"
                      step="0.01"
                      value={security.min_transaction_amount}
                      onChange={(e) => setSecurity({ ...security, min_transaction_amount: e.target.value })}
                      data-testid="input-min-amount"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSaveSecurity}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-security"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure notification preferences and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                    data-testid="switch-email-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS notifications for transactions</p>
                  </div>
                  <Switch
                    checked={notifications.sms_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, sms_notifications: checked })}
                    data-testid="switch-sms-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Send mobile push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                    data-testid="switch-push-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Admin Alerts</Label>
                    <p className="text-sm text-gray-500">Receive admin alerts for critical events</p>
                  </div>
                  <Switch
                    checked={notifications.admin_alerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, admin_alerts: checked })}
                    data-testid="switch-admin-alerts"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveNotifications}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-notifications"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Platform-wide settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value="GreenPay"
                    data-testid="input-platform-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value="support@greenpay.com"
                    data-testid="input-support-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Input
                    id="default_currency"
                    value="USD"
                    data-testid="input-default-currency"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value="30"
                    data-testid="input-session-timeout"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms_url">Terms of Service URL</Label>
                <Input
                  id="terms_url"
                  type="url"
                  value="https://greenpay.com/terms"
                  data-testid="input-terms-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Textarea
                  id="maintenance_message"
                  placeholder="Enter message to display during maintenance..."
                  data-testid="textarea-maintenance-message"
                />
              </div>
              <Button 
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-general"
              >
                <Save className="w-4 h-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}