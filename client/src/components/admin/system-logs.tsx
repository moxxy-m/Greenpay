import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Terminal, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Activity
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'api';
  message: string;
  source?: string;
  data?: any;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/logs`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to logs WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        if (!isPaused) {
          try {
            const logEntry: LogEntry = JSON.parse(event.data);
            setLogs(prev => {
              const newLogs = [...prev, logEntry];
              // Keep only last 1000 logs to prevent memory issues
              return newLogs.slice(-1000);
            });
          } catch (error) {
            console.error('Failed to parse log entry:', error);
          }
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'api': return <Activity className="w-4 h-4 text-green-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'api': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      (log.source && log.source.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
    
    return matchesFilter && matchesLevel;
  });

  const logLevels = ['all', 'api', 'info', 'warn', 'error', 'debug'];
  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
          <p className="text-gray-600 mt-1">Real-time system logs and API requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {logs.length} logs
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            data-testid="button-pause-logs"
          >
            {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            data-testid="button-clear-logs"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogs}
            disabled={filteredLogs.length === 0}
            data-testid="button-download-logs"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
            data-testid="input-log-filter"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-1 border rounded-md bg-background"
            data-testid="select-log-level"
          >
            {logLevels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)} 
                {level !== 'all' && levelCounts[level] ? ` (${levelCounts[level]})` : ''}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          Auto-scroll
        </label>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Live System Logs
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} log entries
            {isPaused && (
              <Badge variant="outline" className="ml-2">
                Paused
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 h-96">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No logs to display</p>
                    {!isConnected && (
                      <p className="text-xs mt-1">Waiting for connection...</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 hover:bg-gray-800 px-2 py-1 rounded">
                      <span className="text-gray-400 text-xs shrink-0 w-20">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {getLogIcon(log.level)}
                      </div>
                      <span className={`text-xs uppercase font-semibold w-12 shrink-0 ${getLogColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="flex-1 break-words">
                        {log.message}
                        {log.data && (
                          <pre className="mt-1 text-xs text-gray-400 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Connection Lost</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Attempting to reconnect to log stream...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}