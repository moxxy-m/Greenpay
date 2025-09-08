import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Save, TestTube, CheckCircle, XCircle } from "lucide-react";

interface PayHeroSettings {
  channelId: string;
  provider: string;
  cardPrice: string;
  username?: string;
  password?: string;
}

export default function PayHeroSettings() {
  const [settings, setSettings] = useState<PayHeroSettings>({
    channelId: "3407",
    provider: "m-pesa",
    cardPrice: "60.00"
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/payhero-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading PayHero settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('PUT', '/api/admin/payhero-settings', settings);
      
      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "PayHero configuration has been saved successfully.",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update PayHero settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await apiRequest('POST', '/api/admin/test-payhero', {
        amount: 1,
        phone: '0700000000',
        reference: 'TEST-' + Date.now()
      });
      
      const result = await response.json();
      
      setTestResult({
        success: result.success,
        message: result.success ? 
          'PayHero connection successful!' : 
          result.message || 'Connection test failed'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PayHero Settings</h2>
          <p className="text-gray-600 mt-1">Configure M-Pesa payment processing settings</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Payment Gateway
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Update PayHero API settings for M-Pesa integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                type="number"
                value={settings.channelId}
                onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                placeholder="e.g., 608"
                data-testid="input-channel-id"
              />
              <p className="text-sm text-gray-500">
                Your PayHero payment channel ID from dashboard
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={settings.provider} 
                onValueChange={(value) => setSettings({ ...settings, provider: value })}
              >
                <SelectTrigger data-testid="select-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m-pesa">M-Pesa</SelectItem>
                  <SelectItem value="sasapay">SasaPay</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Payment provider for processing transactions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardPrice">Virtual Card Price (USD)</Label>
              <Input
                id="cardPrice"
                type="number"
                step="0.01"
                value={settings.cardPrice}
                onChange={(e) => setSettings({ ...settings, cardPrice: e.target.value })}
                placeholder="60.00"
                data-testid="input-card-price"
              />
              <p className="text-sm text-gray-500">
                Price for purchasing virtual cards (automatically synced to user side)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1"
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <Button 
                onClick={handleTest} 
                variant="outline"
                disabled={testing}
                className="flex-1"
                data-testid="button-test-connection"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status & Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Test PayHero API connectivity and monitor status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                <p className={`text-sm ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Channel ID:</span>
                <Badge variant="outline">{settings.channelId}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Provider:</span>
                <Badge variant="outline" className="capitalize">{settings.provider}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Card Price:</span>
                <Badge variant="outline">${settings.cardPrice}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Endpoint:</span>
                <Badge variant="secondary">backend.payhero.co.ke</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Test Instructions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click "Test Connection" to verify API connectivity</li>
                <li>• Test uses a minimal 1 KES transaction</li>
                <li>• Successful test confirms channel is active</li>
                <li>• Failed tests indicate configuration issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Channel ID Requirements:</h4>
              <ul className="space-y-1">
                <li>• Must be a valid PayHero channel ID</li>
                <li>• Found in PayHero dashboard under "Payment Channels"</li>
                <li>• Each channel has specific settings and limits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Provider Options:</h4>
              <ul className="space-y-1">
                <li>• <strong>M-Pesa:</strong> Standard mobile money (most common)</li>
                <li>• <strong>SasaPay:</strong> Alternative mobile payment platform</li>
                <li>• Provider must match your PayHero channel setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}