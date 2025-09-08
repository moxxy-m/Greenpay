import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, Calendar, MessageSquare, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  message: z.string().min(1, "Message is required").max(500, "Message must be less than 500 characters"),
  type: z.enum(["general", "promotion", "security", "maintenance", "alert"]),
  actionUrl: z.string().optional(),
  expiresIn: z.number().min(1, "Expiry must be at least 1 hour").max(168, "Expiry cannot exceed 1 week").optional(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  userId?: string;
  isGlobal: boolean;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function NotificationManagement() {
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["/api/admin/notifications"],
  });

  const notifications = notificationsData?.notifications || [];

  const form = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "general",
      actionUrl: "",
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: BroadcastForm) => {
      const response = await apiRequest('POST', '/api/admin/broadcast-notification', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Notification Sent",
        description: "Your notification has been broadcast to all users successfully.",
      });
      setBroadcastDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BroadcastForm) => {
    broadcastMutation.mutate(data);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion':
        return 'bg-blue-100 text-blue-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'alert':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const globalNotifications = notifications.filter((n: Notification) => n.isGlobal);
  const activeNotifications = globalNotifications.filter((n: Notification) => !isExpired(n.expiresAt));
  const expiredNotifications = globalNotifications.filter((n: Notification) => isExpired(n.expiresAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
          <p className="text-gray-600">Manage and broadcast notifications to users</p>
        </div>
        <Button onClick={() => setBroadcastDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Send className="w-4 h-4 mr-2" />
          Broadcast Notification
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{globalNotifications.length}</p>
              <p className="text-sm text-gray-600">Total Notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{activeNotifications.length}</p>
              <p className="text-sm text-gray-600">Active Notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{expiredNotifications.length}</p>
              <p className="text-sm text-gray-600">Expired Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeNotifications.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {activeNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Notifications</h3>
                    <p className="text-gray-600 mb-4">Create your first broadcast notification to engage with users.</p>
                    <Button onClick={() => setBroadcastDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                activeNotifications.map((notification: Notification) => (
                  <Card key={notification.id} className="border-l-4 border-l-green-400">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-gray-500" />
                          <div>
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm text-gray-600">Global broadcast</p>
                          </div>
                        </div>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{notification.body}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">Created</Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                        {notification.expiresAt && (
                          <div>
                            <Label className="text-xs text-gray-500">Expires</Label>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatDate(notification.expiresAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {notification.actionUrl && (
                        <div>
                          <Label className="text-xs text-gray-500">Action URL</Label>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded">{notification.actionUrl}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="expired">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {expiredNotifications.map((notification: Notification) => (
                <Card key={notification.id} className="border-l-4 border-l-gray-400 opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <div>
                          <h3 className="font-semibold text-gray-700">{notification.title}</h3>
                          <p className="text-sm text-gray-600">Expired notification</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-gray-600">
                        Expired
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{notification.body}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Expired on {formatDate(notification.expiresAt!)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send a notification to all users. This will appear in their notifications panel.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter notification title" {...field} data-testid="notification-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your message..." 
                        className="min-h-[100px]" 
                        {...field} 
                        data-testid="notification-message" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="notification-type">
                            <SelectValue placeholder="Select notification type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires In (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="24" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="notification-expires"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="actionUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/action" 
                        {...field} 
                        data-testid="notification-action-url" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setBroadcastDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={broadcastMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="send-notification-button"
                >
                  {broadcastMutation.isPending ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}