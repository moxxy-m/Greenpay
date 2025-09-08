import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  FileCheck, 
  Activity, 
  Shield,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  Menu,
  X,
  Smartphone,
  Banknote,
  Bell,
  FileText,
  Receipt
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import UserManagement from "@/components/admin/user-management";
import EnhancedUserManagement from "@/components/admin/enhanced-user-management";
import KycManagement from "@/components/admin/kyc-management";
import TransactionManagement from "@/components/admin/transaction-management";
import VirtualCardManagement from "@/components/admin/virtual-card-management";
import AdminSettings from "@/components/admin/admin-settings";
import PayHeroSettings from "@/components/admin/payhero-settings";
import WithdrawalManagement from "@/components/admin/withdrawal-management";
import NotificationManagement from "@/components/admin/notification-management";
import LogsManagement from "@/components/admin/logs-management";

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  totalVolume: number;
  totalRevenue: number;
  pendingKyc: number;
}

interface TransactionTrend {
  date: string;
  count: number;
  volume: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  transactionTrends: TransactionTrend[];
  recentTransactions: any[];
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem("adminAuth");
    if (!admin) {
      setLocation("/admin/login");
      return;
    }
    setAdminData(JSON.parse(admin));
  }, [setLocation]);

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!adminData,
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setLocation("/admin/login");
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "kyc", label: "KYC Review", icon: FileCheck },
    { id: "transactions", label: "Transactions", icon: DollarSign },
    { id: "withdrawals", label: "Withdrawals", icon: Banknote },
    { id: "cards", label: "Virtual Cards", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "logs", label: "System Logs", icon: FileText },
    { id: "statements", label: "Statements", icon: Receipt },
    { id: "payhero", label: "PayHero Settings", icon: Smartphone },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardTab dashboardData={dashboardData} />;
      case "users":
        return <AdminUsersTab />;
      case "kyc":
        return <AdminKycTab />;
      case "transactions":
        return <AdminTransactionsTab />;
      case "withdrawals":
        return <WithdrawalManagement />;
      case "cards":
        return <AdminCardsTab />;
      case "notifications":
        return <NotificationManagement />;
      case "logs":
        return <LogsManagement />;
      case "statements":
        return <div className="p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Statement Management</h2>
          </div>
          
          <div className="grid gap-4">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">System-wide Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate comprehensive PDF report with all transactions, analytics, and system metrics.
              </p>
              <button
                onClick={() => {
                  window.location.href = '/api/admin/statements/all?adminName=Admin';
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Download Admin Report
              </button>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">User Reports</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate individual user statements. PDF reports will be available soon with enhanced filtering options.
              </p>
              <p className="text-xs text-amber-600">
                Enhanced user selection and date filtering features coming soon.
              </p>
            </div>
          </div>
        </div>;
      case "payhero":
        return <PayHeroSettings />;
      case "analytics":
        return <AdminAnalyticsTab dashboardData={dashboardData} />;
      case "settings":
        return <AdminSettingsTab />;
      default:
        return <AdminDashboardTab dashboardData={dashboardData} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading dashboard</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-lg font-bold text-gray-900">GreenPay Admin</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6">
            <nav className="space-y-2 px-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${activeTab === item.id 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator />

          {/* Admin Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminData?.email || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {renderActiveContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Component Functions
function AdminDashboardTab({ dashboardData }: { dashboardData?: DashboardData }) {
  const metrics = dashboardData?.metrics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {metrics?.activeUsers || 0} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Volume</p>
                <p className="text-2xl font-bold">${(metrics?.totalVolume || 0).toLocaleString()}</p>
                <p className="text-green-100 text-xs mt-1">
                  {metrics?.completedTransactions || 0} transactions
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold">${(metrics?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-purple-100 text-xs mt-1">
                  This month
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Pending KYC</p>
                <p className="text-2xl font-bold">{metrics?.pendingKyc || 0}</p>
                <p className="text-orange-100 text-xs mt-1">
                  Requires review
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Trends</CardTitle>
            <CardDescription>Daily transaction volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.transactionTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Count</CardTitle>
            <CardDescription>Number of transactions per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.transactionTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <UserCheck className="w-6 h-6" />
              <span className="text-sm">Approve KYC</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <UserX className="w-6 h-6" />
              <span className="text-sm">Block User</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm">Issue Card</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="w-6 h-6" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminUsersTab() {
  return <EnhancedUserManagement />;
}

function AdminKycTab() {
  return <KycManagement />;
}

function AdminTransactionsTab() {
  return <TransactionManagement />;
}

function AdminCardsTab() {
  return <VirtualCardManagement />;
}

function AdminAnalyticsTab({ dashboardData }: { dashboardData?: DashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics & Reports
        </CardTitle>
        <CardDescription>
          Detailed analytics and reporting tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Advanced analytics interface coming soon...</p>
      </CardContent>
    </Card>
  );
}

function AdminSettingsTab() {
  return <AdminSettings />;
}