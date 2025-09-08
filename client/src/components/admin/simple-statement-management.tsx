import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar, Users, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export function SimpleStatementManagement() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Fetch all users for individual reports
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const users: User[] = usersData?.users || [];

  const generateAdminStatement = async () => {
    setIsGenerating('admin');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('adminName', 'Admin');

      const response = await fetch(`/api/admin/statements/all?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate admin statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Admin report downloaded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Admin statement generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate admin report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const generateUserStatement = async (userId: string, userName: string) => {
    setIsGenerating(userId);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('adminName', 'Admin');

      const response = await fetch(`/api/admin/statements/user/${userId}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate user statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-${userName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Statement for ${userName} downloaded successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('User statement generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate statement for ${userName}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Statement Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Date Range Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-start-date">Start Date</Label>
              <Input
                id="admin-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-admin-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-end-date">End Date</Label>
              <Input
                id="admin-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-admin-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">System Reports</TabsTrigger>
          <TabsTrigger value="users">User Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Administrative Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="border-2 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Comprehensive Report</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete system transaction analysis
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={generateAdminStatement}
                    disabled={isGenerating === 'admin'}
                    className="w-full"
                    data-testid="button-generate-admin-report"
                  >
                    <Download className={`w-4 h-4 mr-2 ${isGenerating === 'admin' ? 'animate-spin' : ''}`} />
                    {isGenerating === 'admin' ? 'Generating...' : 'Generate Admin Report'}
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Individual User Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      const user = users.find(u => u.id === selectedUserId);
                      if (user) {
                        generateUserStatement(user.id, user.fullName);
                      } else {
                        toast({
                          title: "Error",
                          description: "Please select a user",
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={!selectedUserId || isGenerating !== null}
                    className="w-full"
                    data-testid="button-generate-user-report"
                  >
                    <Download className={`w-4 h-4 mr-2 ${isGenerating === selectedUserId ? 'animate-spin' : ''}`} />
                    {isGenerating === selectedUserId ? 'Generating...' : 'Generate User Report'}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No users found</div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-sm">{user.fullName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateUserStatement(user.id, user.fullName)}
                          disabled={isGenerating !== null}
                        >
                          {isGenerating === user.id ? (
                            <Download className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}