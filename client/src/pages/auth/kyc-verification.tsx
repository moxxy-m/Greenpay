import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const kycSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Please enter your full address"),
  documentType: z.string().min(1, "Please select a document type"),
});

type KycForm = z.infer<typeof kycSchema>;

export default function KycVerificationPage() {
  const [, setLocation] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState({
    frontImage: null as File | null,
    backImage: null as File | null,
    selfie: null as File | null,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<KycForm>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      dateOfBirth: "",
      address: "",
      documentType: "",
    },
  });

  const kycMutation = useMutation({
    mutationFn: async (data: KycForm) => {
      const response = await apiRequest("POST", "/api/kyc/submit", {
        ...data,
        userId: user?.id,
        frontImageUrl: "mock-front-image.jpg",
        backImageUrl: "mock-back-image.jpg",
        selfieUrl: "mock-selfie.jpg",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documents submitted!",
        description: "Your documents have been submitted for verification.",
      });
      setLocation("/virtual-card-purchase");
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Unable to submit documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: KycForm) => {
    kycMutation.mutate(data);
  };

  const handleFileUpload = (type: keyof typeof uploadedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/otp-verification")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Identity Verification</h1>
      </motion.div>

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="material-icons text-accent-foreground text-2xl">verified_user</span>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Verify Your Identity</h2>
            <p className="text-muted-foreground">Complete your profile to ensure secure transactions</p>
          </div>

          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Personal Details</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <Form {...form}>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            placeholder="Date of Birth"
                            data-testid="input-dob"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Full Address"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </div>

            {/* Document Upload */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Identity Document</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <div className="space-y-3">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('frontImage')}
                    className="hidden"
                    id="front-upload"
                  />
                  <label htmlFor="front-upload" className="cursor-pointer" data-testid="upload-front">
                    <span className="material-icons text-3xl text-muted-foreground mb-2">cloud_upload</span>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFiles.frontImage ? uploadedFiles.frontImage.name : "Tap to upload front side"}
                    </p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('backImage')}
                    className="hidden"
                    id="back-upload"
                  />
                  <label htmlFor="back-upload" className="cursor-pointer" data-testid="upload-back">
                    <span className="material-icons text-3xl text-muted-foreground mb-2">cloud_upload</span>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFiles.backImage ? uploadedFiles.backImage.name : "Tap to upload back side"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Selfie Verification */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Selfie Verification</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('selfie')}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer" data-testid="upload-selfie">
                  <span className="material-icons text-3xl text-muted-foreground mb-2">camera_alt</span>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.selfie ? uploadedFiles.selfie.name : "Take a selfie"}
                  </p>
                </label>
              </div>
            </div>

            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="w-full ripple"
              disabled={kycMutation.isPending}
              data-testid="button-continue-verification"
            >
              {kycMutation.isPending ? "Submitting..." : "Continue Verification"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
