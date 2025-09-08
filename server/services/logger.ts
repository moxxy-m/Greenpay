interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  source?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  log(level: LogEntry['level'], message: string, details?: any, meta?: Partial<LogEntry>) {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      level,
      message,
      details,
      source: meta?.source || 'system',
      userId: meta?.userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    };

    // Add to memory store
    this.logs.unshift(logEntry);
    
    // Keep only maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console with proper formatting
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, details || '');
        break;
      case 'warn':
        console.warn(prefix, message, details || '');
        break;
      case 'debug':
        console.debug(prefix, message, details || '');
        break;
      default:
        console.log(prefix, message, details || '');
    }
  }

  info(message: string, details?: any, meta?: Partial<LogEntry>) {
    this.log('info', message, details, meta);
  }

  warn(message: string, details?: any, meta?: Partial<LogEntry>) {
    this.log('warn', message, details, meta);
  }

  error(message: string, details?: any, meta?: Partial<LogEntry>) {
    this.log('error', message, details, meta);
  }

  debug(message: string, details?: any, meta?: Partial<LogEntry>) {
    this.log('debug', message, details, meta);
  }

  getLogs(filters?: {
    level?: LogEntry['level'];
    source?: string;
    userId?: string;
    limit?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      
      if (filters.source) {
        filteredLogs = filteredLogs.filter(log => log.source === filters.source);
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
      
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }
    }

    return filteredLogs;
  }

  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
      },
      recent: {
        lastHour: 0,
        last24Hours: 0,
      }
    };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      
      if (log.timestamp >= oneHourAgo) {
        stats.recent.lastHour++;
      }
      
      if (log.timestamp >= oneDayAgo) {
        stats.recent.last24Hours++;
      }
    });

    return stats;
  }

  clearLogs() {
    this.logs = [];
    this.info('System logs cleared by admin');
  }
}

export const logger = new LoggerService();
export type { LogEntry };