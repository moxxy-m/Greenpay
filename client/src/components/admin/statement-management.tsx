import React, { useState } from "react";
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

export default function StatementManagement() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      params.append('adminName', 'Admin'); // Could get from auth context

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
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Statement Management</h2>
      </div>

      {/* Date Range Filter */}
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Leave dates empty to include all transactions
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>System Reports</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>User Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* System Reports Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Administrative Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comprehensive Admin Report */}
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
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                      <li>• All user transactions</li>
                      <li>• Transaction volume analysis</li>
                      <li>• Fee collection summary</li>
                      <li>• Status breakdown</li>
                      <li>• Transaction type analytics</li>
                    </ul>
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

                {/* Report Info */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">Report Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Real-time Data</p>
                          <p className="text-xs text-gray-500">Generated with latest transaction data</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Comprehensive Analytics</p>
                          <p className="text-xs text-gray-500">Includes volume, fees, and status metrics</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Professional Format</p>
                          <p className="text-xs text-gray-500">Clean PDF layout with charts and tables</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Date Filtering</p>
                          <p className="text-xs text-gray-500">Filter by custom date ranges</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Reports Tab */}
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
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{user.fullName}</span>
                            <span className="text-sm text-gray-500">({user.email})</span>
                          </div>
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

              {/* User List with Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No users found</div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
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
                          data-testid={`button-download-${user.id}`}
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