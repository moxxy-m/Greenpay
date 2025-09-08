import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Save, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

export default function CardPriceManagement() {
  const [newPrice, setNewPrice] = useState("60.00");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current card price
  const { data: currentPriceData, isLoading } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const currentPrice = (currentPriceData as any)?.price || "60.00";

  // Update price when data loads
  useEffect(() => {
    if (currentPrice) {
      setNewPrice(currentPrice);
    }
  }, [currentPrice]);

  const updatePriceMutation = useMutation({
    mutationFn: async (price: string) => {
      const response = await apiRequest('PUT', '/api/system-settings/card-price', { 
        price: parseFloat(price).toFixed(2) 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Price Updated",
        description: "Virtual card price has been updated successfully.",
      });
      // Invalidate both system settings and any card-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings/card-price'] });
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-card'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update card price. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }
    updatePriceMutation.mutate(newPrice);
  };

  const priceChanged = parseFloat(newPrice) !== parseFloat(currentPrice);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Card Price Management
          </CardTitle>
          <CardDescription>Loading current price...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Card Price Management</h2>
          <p className="text-gray-600 mt-1">Configure virtual card pricing for users</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Pricing Settings
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Price Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Current Price
            </CardTitle>
            <CardDescription>
              The current price users see for virtual cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${currentPrice}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Active price displayed to users
            </div>
          </CardContent>
        </Card>

        {/* Price Update Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Update Price
            </CardTitle>
            <CardDescription>
              Set a new price for virtual card purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-price">New Card Price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="card-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-10"
                  placeholder="60.00"
                  data-testid="input-card-price"
                />
              </div>
            </div>

            {priceChanged && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Price change: ${currentPrice} → ${parseFloat(newPrice).toFixed(2)}
                </span>
              </div>
            )}

            <Button 
              onClick={handleSave}
              disabled={!priceChanged || updatePriceMutation.isPending}
              className="w-full"
              data-testid="button-save-price"
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Price Change Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Immediate Effect</p>
              <p className="text-sm text-gray-600">
                Price changes take effect immediately for all new card purchases
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">User Display</p>
              <p className="text-sm text-gray-600">
                Updated price will be shown on the virtual card page for all users
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Payment Processing</p>
              <p className="text-sm text-gray-600">
                M-Pesa payments will be processed for the new amount
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}