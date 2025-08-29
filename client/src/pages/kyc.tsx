import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function KYCPage() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    documentType: "national_id",
    dateOfBirth: "",
    address: "",
    frontImage: null as File | null,
    backImage: null as File | null,
    selfie: null as File | null,
  });

  // Get existing KYC data
  const { data: kycData } = useQuery({
    queryKey: ["/api/kyc", user?.id],
    enabled: !!user?.id,
  });

  const submitKYCMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      login({ ...user, kycStatus: "pending" });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc", user?.id] });
      toast({
        title: "KYC Submitted Successfully!",
        description: "Your documents have been submitted for review. You will be notified once verified.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "KYC Submission Failed",
        description: error.message || "Unable to submit KYC documents",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = () => {
    if (!formData.dateOfBirth || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("userId", user?.id || "");
    submitData.append("documentType", formData.documentType);
    submitData.append("dateOfBirth", formData.dateOfBirth);
    submitData.append("address", formData.address);
    
    if (formData.frontImage) submitData.append("frontImage", formData.frontImage);
    if (formData.backImage) submitData.append("backImage", formData.backImage);
    if (formData.selfie) submitData.append("selfie", formData.selfie);

    submitKYCMutation.mutate(submitData);
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (user?.kycStatus === "verified") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <motion.div className="bg-card shadow-sm p-4 flex items-center elevation-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/settings")}
            className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          >
            arrow_back
          </motion.button>
          <h1 className="text-lg font-semibold">Identity Verification</h1>
        </motion.div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
          >
            <span className="material-icons text-4xl text-green-600">verified_user</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-4">Identity Verified!</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-sm">
            Your identity has been successfully verified. You now have full access to all GreenPay features.
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="px-8">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/settings")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Identity Verification</h1>
      </motion.div>

      <div className="p-6">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </motion.div>

        {/* Step 1: Document Type & Personal Info */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  >
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    data-testid="input-date-of-birth"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Home Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="textarea-address"
                  />
                </div>
              </div>
            </div>

            <Button onClick={nextStep} className="w-full" data-testid="button-next-step1">
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
              
              <div className="space-y-6">
                {/* Front Image */}
                <div>
                  <Label>Front of Document</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.frontImage ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.frontImage.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("frontImage", null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">cloud_upload</span>
                        <p className="text-sm text-muted-foreground">Upload front of your document</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("frontImage", e.target.files?.[0] || null)}
                          className="hidden"
                          id="front-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="front-upload" data-testid="button-upload-front">
                            Choose File
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div>
                  <Label>Back of Document</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.backImage ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.backImage.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("backImage", null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">cloud_upload</span>
                        <p className="text-sm text-muted-foreground">Upload back of your document</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("backImage", e.target.files?.[0] || null)}
                          className="hidden"
                          id="back-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="back-upload" data-testid="button-upload-back">
                            Choose File
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button onClick={nextStep} className="flex-1" data-testid="button-next-step2">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Selfie & Review */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Selfie Verification</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Take a Selfie</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.selfie ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.selfie.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("selfie", null)}
                        >
                          Retake
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">face</span>
                        <p className="text-sm text-muted-foreground">Take a clear photo of yourself</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("selfie", e.target.files?.[0] || null)}
                          className="hidden"
                          id="selfie-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="selfie-upload" data-testid="button-upload-selfie">
                            Take Selfie
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start">
                <span className="material-icons text-blue-600 mr-2 mt-1">security</span>
                <div>
                  <h3 className="font-medium text-blue-800">Verification Process</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your documents will be securely reviewed by our verification team. You'll receive a notification once the review is complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={submitKYCMutation.isPending}
                data-testid="button-submit-kyc"
              >
                {submitKYCMutation.isPending ? "Verifying..." : "Submit for Verification"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}