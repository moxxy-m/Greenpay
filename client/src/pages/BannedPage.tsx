import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield, Trash2, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function BannedPage() {
  const [location, setLocation] = useLocation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/delete-account', {
        userId: user?.id,
        termsAccepted: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.alreadyDeleted) {
        // Account was already deleted
        toast({
          title: "Account Already Deleted",
          description: data.message || "Your account has already been deleted.",
        });
        setLocation("/");
      } else {
        // Account just deleted
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "You must accept the terms to delete your account.",
        variant: "destructive",
      });
      return;
    }
    deleteAccountMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!user?.isBanned) {
    // If user is not banned, redirect them to dashboard immediately
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600">Your account has been temporarily suspended</p>
        </div>

        {/* Ban Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Suspension Details
            </CardTitle>
            <CardDescription>
              Information about your account suspension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reason for Suspension</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{user.banReason}</p>
              </div>
            </div>

            {user.bannedAt && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Suspension Date</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(user.bannedAt.toString())}</span>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">What this means:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• You cannot access your wallet or make transactions</li>
                <li>• Your virtual card has been deactivated</li>
                <li>• You cannot send or receive money</li>
                <li>• Your account data is temporarily suspended</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              If you wish to permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Before you delete your account:</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• All your transaction history will be permanently deleted</li>
                <li>• Your virtual card will be cancelled and cannot be recovered</li>
                <li>• Any remaining funds will be returned to the original senders</li>
                <li>• This action cannot be undone</li>
                <li>• You will not be able to create a new account with the same email or phone</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                data-testid="checkbox-terms-agreement"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I understand that deleting my account is permanent and cannot be undone. I accept the terms and conditions for account deletion.
              </label>
            </div>

            <Button
              onClick={handleDeleteAccount}
              disabled={!termsAccepted || deleteAccountMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-delete-account"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>If you believe this suspension was made in error, please contact our support team.</p>
          <p className="mt-1">Email: support@greenpay.com</p>
        </div>
      </div>
    </div>
  );
}