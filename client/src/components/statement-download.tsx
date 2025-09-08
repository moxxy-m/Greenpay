import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, FileText, Calendar, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface StatementDownloadProps {
  className?: string;
}

export default function StatementDownload({ className = "" }: StatementDownloadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includePersonalInfo, setIncludePersonalInfo] = useState(true);

  const generateStatement = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to generate statements",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('includePersonalInfo', includePersonalInfo.toString());

      const response = await fetch(`/api/statements/user/${user.id}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement-${user.fullName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Statement downloaded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Statement generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate statement",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Set default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Download Statement</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="input-end-date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Include Personal Information</span>
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Include your name, email, and phone number
            </p>
          </div>
          <Switch
            checked={includePersonalInfo}
            onCheckedChange={setIncludePersonalInfo}
            data-testid="switch-include-personal-info"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={generateStatement}
            disabled={isGenerating}
            className="flex-1"
            data-testid="button-generate-statement"
          >
            <Download className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Download PDF Statement'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Statements include all transactions for the selected period</p>
          <p>• If no dates are selected, all transactions will be included</p>
          <p>• PDFs are generated in real-time and contain latest transaction data</p>
        </div>
      </CardContent>
    </Card>
  );
}