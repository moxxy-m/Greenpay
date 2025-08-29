import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileCheck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Image,
  User,
  Calendar,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  selfieUrl: string | null;
  dateOfBirth: string | null;
  address: string | null;
  status: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface KycResponse {
  kycDocuments: KycDocument[];
}

export default function KycManagement() {
  const [selectedKyc, setSelectedKyc] = useState<KycDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kycData, isLoading, error } = useQuery<KycResponse>({
    queryKey: ["/api/admin/kyc"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc");
      return response.json();
    },
  });

  const updateKycMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await apiRequest("PUT", `/api/admin/kyc/${id}`, {
        status,
        verificationNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "KYC Updated",
        description: "KYC document status has been updated successfully",
      });
      setSelectedKyc(null);
      setReviewStatus("");
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update KYC document",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "national_id":
        return "National ID";
      case "passport":
        return "Passport";
      case "drivers_license":
        return "Driver's License";
      default:
        return type;
    }
  };

  const handleSubmitReview = () => {
    if (!selectedKyc || !reviewStatus) return;
    
    updateKycMutation.mutate({
      id: selectedKyc.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load KYC documents
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingKyc = kycData?.kycDocuments.filter(doc => doc.status === "pending") || [];
  const reviewedKyc = kycData?.kycDocuments.filter(doc => doc.status !== "pending") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            KYC Document Review
          </CardTitle>
          <CardDescription>
            Review and approve user identity verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{pendingKyc.length}</p>
              <p className="text-sm text-yellow-600">Pending Review</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {reviewedKyc.filter(doc => doc.status === "verified").length}
              </p>
              <p className="text-sm text-green-600">Verified</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {reviewedKyc.filter(doc => doc.status === "rejected").length}
              </p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      {pendingKyc.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Pending Reviews ({pendingKyc.length})
            </CardTitle>
            <CardDescription>
              Documents awaiting verification
            </CardDescription>
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
                    <TableHead>User ID</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingKyc.map((kyc) => (
                    <TableRow key={kyc.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{kyc.userId.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{getDocumentTypeName(kyc.documentType)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(kyc.createdAt), "MMM dd, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {kyc.frontImageUrl && (
                            <Badge variant="outline" className="text-xs">Front</Badge>
                          )}
                          {kyc.backImageUrl && (
                            <Badge variant="outline" className="text-xs">Back</Badge>
                          )}
                          {kyc.selfieUrl && (
                            <Badge variant="outline" className="text-xs">Selfie</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(kyc.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedKyc(kyc)}
                              data-testid={`button-review-kyc-${kyc.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>KYC Document Review</DialogTitle>
                              <DialogDescription>
                                Review identity verification documents for user {kyc.userId.slice(0, 8)}...
                              </DialogDescription>
                            </DialogHeader>
                            {selectedKyc && (
                              <KycReviewDialog 
                                kyc={selectedKyc} 
                                onSubmit={handleSubmitReview}
                                reviewStatus={reviewStatus}
                                setReviewStatus={setReviewStatus}
                                reviewNotes={reviewNotes}
                                setReviewNotes={setReviewNotes}
                                isLoading={updateKycMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All KYC Documents</CardTitle>
          <CardDescription>
            Complete history of KYC document submissions
          </CardDescription>
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
                  <TableHead>User ID</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycData?.kycDocuments.map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{kyc.userId.slice(0, 8)}...</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{getDocumentTypeName(kyc.documentType)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(kyc.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(kyc.createdAt), "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {kyc.verifiedAt ? format(new Date(kyc.verifiedAt), "MMM dd, yyyy") : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedKyc(kyc)}
                        data-testid={`button-view-kyc-${kyc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
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

function KycReviewDialog({ 
  kyc, 
  onSubmit, 
  reviewStatus, 
  setReviewStatus, 
  reviewNotes, 
  setReviewNotes, 
  isLoading 
}: {
  kyc: KycDocument;
  onSubmit: () => void;
  reviewStatus: string;
  setReviewStatus: (status: string) => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Document Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Document Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span className="text-sm">Type: {kyc.documentType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">DOB: {kyc.dateOfBirth || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Address: {kyc.address || "Not provided"}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">User: {kyc.userId ? kyc.userId.slice(0, 8) + '...' : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Submitted: {format(new Date(kyc.createdAt), "MMM dd, yyyy HH:mm")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Images */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Document Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kyc.frontImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Front Image</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.frontImageUrl} 
                  alt="Front of document" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.frontImageUrl, '_blank')}
                  data-testid="img-kyc-front"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
          {kyc.backImageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Back Image</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.backImageUrl} 
                  alt="Back of document" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.backImageUrl, '_blank')}
                  data-testid="img-kyc-back"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
          {kyc.selfieUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selfie</p>
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img 
                  src={kyc.selfieUrl} 
                  alt="Verification selfie" 
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(kyc.selfieUrl, '_blank')}
                  data-testid="img-kyc-selfie"
                />
                <p className="text-xs text-center p-2 text-gray-500">Click to view full size</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Review Decision</h4>
        
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={reviewStatus} onValueChange={setReviewStatus}>
            <SelectTrigger data-testid="select-kyc-status">
              <SelectValue placeholder="Select review decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Approve & Verify
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Reject
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Review Notes</label>
          <Textarea
            placeholder="Add notes about your review decision..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="mt-1"
            data-testid="textarea-kyc-notes"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={!reviewStatus || isLoading}
            className="flex items-center gap-2"
            data-testid="button-submit-kyc-review"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Submit Review
          </Button>
        </div>
      </div>

      {/* Existing Notes */}
      {kyc.verificationNotes && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="font-medium mb-2">Previous Review Notes</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">{kyc.verificationNotes}</p>
        </div>
      )}
    </div>
  );
}