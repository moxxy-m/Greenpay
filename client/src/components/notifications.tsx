import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, AlertCircle, CheckCircle, Info, AlertTriangle, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [animateNewNotification, setAnimateNewNotification] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
  });

  const notifications = (notificationsData as any)?.notifications || [];

  // Animate new notifications
  useEffect(() => {
    if (notifications.length > 0 && !notifications.every((n: Notification) => n.isRead)) {
      setAnimateNewNotification(true);
      setTimeout(() => setAnimateNewNotification(false), 2000);
    }
  }, [notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('POST', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    
    switch (type) {
      case 'success': return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700';
      case 'warning': return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700';
      case 'error': return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-700';
      default: return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Button variant="ghost" size="sm" disabled>
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${animateNewNotification ? 'animate-pulse' : ''}`}
        data-testid="button-notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${animateNewNotification ? 'animate-bounce' : ''}`} />
        ) : (
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white dark:border-gray-900 shadow-lg animate-pulse"
            data-testid="badge-notification-count"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50 max-h-96 overflow-hidden transform transition-all duration-300 ease-out">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-close-notifications"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {notifications.length === 0 ? (
              <div className="p-8 text-center" data-testid="text-no-notifications">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.map((notification: Notification, index: number) => (
                  <div 
                    key={notification.id}
                    className={`group rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer ${getNotificationBgColor(notification.type, notification.isRead)}`}
                    data-testid={`notification-${notification.id}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2 rounded-full ${!notification.isRead ? 'animate-pulse' : ''}`}>
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`font-semibold text-sm leading-tight ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                              {notification.title}
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></span>
                              )}
                            </h4>
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm"
                                data-testid={`button-mark-read-${notification.id}`}
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                          <p className={`text-sm mt-1 leading-relaxed ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${notification.isRead ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500 animate-pulse'}`}></div>
                              <span className={`text-xs font-medium ${notification.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                {notification.isRead ? 'Read' : 'New'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}