import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Download, Trash2, RefreshCw, AlertCircle, Info, AlertTriangle, Bug, Server, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  source?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

interface LogStats {
  total: number;
  byLevel: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
  recent: {
    lastHour: number;
    last24Hours: number;
  };
}

export default function LogsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queryClient = useQueryClient();

  // Fetch system logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/admin/system-logs", { 
      level: levelFilter !== "all" ? levelFilter : undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      search: searchTerm || undefined,
      limit: 1000 
    }],
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds if enabled
  });

  // Fetch log statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/system-logs/stats"],
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh stats every 10 seconds
  });

  const logs: LogEntry[] = logsData?.logs || [];
  const stats: LogStats = statsData?.stats || {
    total: 0,
    byLevel: { info: 0, warn: 0, error: 0, debug: 0 },
    recent: { lastHour: 0, last24Hours: 0 }
  };

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/system-logs/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-logs/stats"] });
    },
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200';
      case 'debug': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200';
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Message,Source,Details',
      ...logs.map(log => 
        `"${log.timestamp}","${log.level}","${log.message.replace(/"/g, '""')}","${log.source || ''}","${formatDetails(log.details)?.replace(/"/g, '""') || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.byLevel.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.byLevel.warn}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Hour</p>
                <p className="text-2xl font-bold text-green-600">{stats.recent.lastHour}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>System Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-logs"
                />
              </div>
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40" data-testid="select-level-filter">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40" data-testid="select-source-filter">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-auto-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                data-testid="button-refresh-logs"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                disabled={logs.length === 0}
                data-testid="button-export-logs"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isPending}
                data-testid="button-clear-logs"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>

          {/* Logs Display */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No logs found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  {searchTerm || levelFilter !== "all" || sourceFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "System logs will appear here"}
                </p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`log-entry-${log.id}`}
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`${getLevelBadgeColor(log.level)} text-xs px-2 py-1`}>
                            {log.level.toUpperCase()}
                          </Badge>
                          {log.source && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {log.source}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded border mt-2 overflow-x-auto">
                            {formatDetails(log.details)}
                          </pre>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>ID: {log.id}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.userId && <span>User: {log.userId.substring(0, 8)}...</span>}
                          {log.ip && <span>IP: {log.ip}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}