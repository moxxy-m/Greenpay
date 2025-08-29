import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Search, 
  Eye, 
  Lock,
  Unlock,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
  isActive: boolean;
  balance: string;
  currency: string;
  purchaseDate: string;
  lastUsed: string | null;
}

interface VirtualCardsResponse {
  virtualCards: VirtualCard[];
}

export default function VirtualCardManagement() {
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardsData, isLoading, error } = useQuery<VirtualCardsResponse>({
    queryKey: ["/api/admin/virtual-cards", { search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(search && { search }),
      });
      const response = await apiRequest("GET", `/api/admin/virtual-cards?${params}`);
      return response.json();
    },
  });

  // Handle the case where cardsData might be undefined or have different structure
  const cards = cardsData?.cards || cardsData?.virtualCards || [];

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VirtualCard> }) => {
      const response = await apiRequest("PUT", `/api/admin/virtual-cards/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/virtual-cards"] });
      toast({
        title: "Card Updated",
        description: "Virtual card has been updated successfully",
      });
      setSelectedCard(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update virtual card",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="destructive">Blocked</Badge>
    );
  };

  const handleToggleStatus = (card: VirtualCard) => {
    updateCardMutation.mutate({
      id: card.id,
      updates: { isActive: !card.isActive }
    });
  };

  const maskCardNumber = (cardNumber: string) => {
    return `****-****-****-${cardNumber.slice(-4)}`;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load virtual cards data
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCards = cards.filter(c => c.isActive).length || 0;
  const blockedCards = cards.filter(c => !c.isActive).length || 0;
  const totalBalance = cardsData?.virtualCards?.reduce((sum, c) => sum + parseFloat(c.balance), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Virtual Card Management
          </CardTitle>
          <CardDescription>
            Monitor and manage virtual cards across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by card number, user ID, or cardholder name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-card-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Cards</p>
                <p className="text-lg font-bold">{cards.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Active Cards</p>
                <p className="text-lg font-bold">{activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Blocked Cards</p>
                <p className="text-lg font-bold">{blockedCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-lg font-bold">${totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Virtual Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Cards ({cards.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card Details</TableHead>
                  <TableHead>Cardholder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium" data-testid={`text-card-number-${card.id}`}>
                          {maskCardNumber(card.cardNumber)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires: {format(new Date(card.expiryDate), "MM/yy")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{card.cardHolderName}</p>
                        <p className="text-sm text-gray-500">{card.userId.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(card.isActive)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        ${parseFloat(card.balance).toFixed(2)} {card.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(card.purchaseDate), "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {card.lastUsed ? format(new Date(card.lastUsed), "MMM dd, yyyy") : "Never"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCard(card)}
                              data-testid={`button-view-card-${card.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Virtual Card Details</DialogTitle>
                              <DialogDescription>
                                Complete card information and controls
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCard && (
                              <CardDetailsDialog 
                                card={selectedCard} 
                                onToggleStatus={() => handleToggleStatus(selectedCard)}
                                isLoading={updateCardMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(card)}
                          disabled={updateCardMutation.isPending}
                          data-testid={`button-toggle-card-${card.id}`}
                        >
                          {card.isActive ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CardDetailsDialog({ 
  card, 
  onToggleStatus, 
  isLoading 
}: {
  card: VirtualCard;
  onToggleStatus: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Card Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Card Information</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Card Number:</span>
              <p className="text-sm font-mono">{card.cardNumber}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">CVV:</span>
              <p className="text-sm font-mono">{card.cvv}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Expiry Date:</span>
              <p className="text-sm font-medium">{format(new Date(card.expiryDate), "MMM yyyy")}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Cardholder Name:</span>
              <p className="text-sm font-medium">{card.cardHolderName}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Details</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">User ID:</span>
              <p className="text-sm font-mono">{card.userId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Balance:</span>
              <p className="text-sm font-medium">${parseFloat(card.balance).toFixed(2)} {card.currency}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <Badge variant={card.isActive ? "default" : "destructive"} className="ml-2">
                {card.isActive ? "Active" : "Blocked"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Information */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Usage Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <div>
              <span className="text-sm text-gray-500">Purchase Date:</span>
              <p className="text-sm">{format(new Date(card.purchaseDate), "MMM dd, yyyy HH:mm")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <div>
              <span className="text-sm text-gray-500">Last Used:</span>
              <p className="text-sm">
                {card.lastUsed ? format(new Date(card.lastUsed), "MMM dd, yyyy HH:mm") : "Never used"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Card Actions</h4>
        <div className="flex gap-2">
          <Button
            onClick={onToggleStatus}
            disabled={isLoading}
            variant={card.isActive ? "destructive" : "default"}
            data-testid="button-toggle-card-status"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : card.isActive ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <Unlock className="w-4 h-4 mr-2" />
            )}
            {card.isActive ? "Block Card" : "Activate Card"}
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <User className="w-4 h-4 mr-2" />
            View User Profile
          </Button>
        </div>
      </div>
    </div>
  );
}