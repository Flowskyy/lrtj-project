"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatWIBDate } from "@/lib/formatWIBDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Bell, Send, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";

interface NotificationItem {
  id: number;
  user_id: number | null;
  title: string;
  description: string;
  payload: any;
  created_at: string | null;
}

interface NotificationsContentProps {
  username: string;
}

export default function NotificationsContent({ username }: NotificationsContentProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<NotificationItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payload, setPayload] = useState("");
  const [sendPush, setSendPush] = useState(false);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const response = await res.json();
        setItems(response.data || []);
        setTotalCount(response.meta?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Send notification
  const handleSendNotification = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setSending(true);
    try {
      let payloadData = null;
      if (payload.trim()) {
        try {
          payloadData = JSON.parse(payload);
        } catch (e) {
          toast.error("Invalid JSON in payload field");
          setSending(false);
          return;
        }
      }
      
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          payload: payloadData,
          sendPush,
        }),
      });

      if (res.ok) {
        await fetchItems();
        setIsSendDialogOpen(false);
        setTitle("");
        setDescription("");
        setPayload("");
        setSendPush(false);
        toast.success("Notification sent successfully");
      } else {
        toast.error("Failed to send notification");
      }
    } catch (err) {
      console.error("Failed to send notification", err);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  // Edit notification
  const handleEditNotification = async () => {
    if (!editingItem) return;
    
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setSending(true);
    try {
      let payloadData = null;
      if (payload.trim()) {
        try {
          payloadData = JSON.parse(payload);
        } catch (e) {
          toast.error("Invalid JSON in payload field");
          setSending(false);
          return;
        }
      }
      
      const res = await fetch(`/api/notifications/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          payload: payloadData,
        }),
      });

      if (res.ok) {
        await fetchItems();
        setIsEditDialogOpen(false);
        setEditingItem(null);
        setTitle("");
        setDescription("");
        setPayload("");
        setSendPush(false);
        toast.success("Notification updated successfully");
      } else {
        toast.error("Failed to update notification");
      }
    } catch (err) {
      console.error("Failed to update notification", err);
      toast.error("Failed to update notification");
    } finally {
      setSending(false);
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (item: NotificationItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPayload(item.payload ? JSON.stringify(item.payload, null, 2) : "");
    setSendPush(false); // Push switch is disabled in edit mode
    setIsEditDialogOpen(true);
  };

  // Delete notification
  const handleDeleteNotification = async () => {
    if (!deleteItem) return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/notifications/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchItems();
        setIsDeleteDialogOpen(false);
        setDeleteItem(null);
        toast.success("Notification deleted successfully");
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Failed to delete notification");
    } finally {
      setSending(false);
    }
  };

  // Get target badge
  const getTargetBadge = (userId: number | null) => {
    if (userId === null) {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
          Global Broadcast
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        User #{userId}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and send broadcast notifications to all users
          </p>
        </div>
        <Button 
          onClick={() => setIsSendDialogOpen(true)}
          className="bg-[#E5262C] hover:bg-[#c41e24] text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Total Notifications
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? "..." : totalCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#E5262C]/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#E5262C]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border-b">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications sent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">Target</TableHead>
                    <TableHead className="w-[180px]">Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {item.description}
                      </TableCell>
                      <TableCell>
                        {getTargetBadge(item.user_id)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatWIBDate(item.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(item)} className="text-xs h-8">
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setDeleteItem(item);
                              setIsDeleteDialogOpen(true);
                            }} variant="destructive" className="text-xs h-8">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Broadcast Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter notification description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={sending}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payload">Payload (Optional JSON)</Label>
              <Textarea
                id="payload"
                placeholder='{"action": "open_url", "url": "https://..."}'
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                disabled={sending}
                rows={2}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Optional JSON data for deep links or custom actions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sendPush"
                checked={sendPush}
                onCheckedChange={setSendPush}
                disabled={sending}
              />
              <Label htmlFor="sendPush" className="cursor-pointer">
                Send Push Notification
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSendDialogOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={sending || !title.trim() || !description.trim()}
              className="bg-[#E5262C] hover:bg-[#c41e24] text-white"
            >
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notification Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Enter notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter notification description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={sending}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payload">Payload (Optional JSON)</Label>
              <Textarea
                id="edit-payload"
                placeholder='{"action": "open_url", "url": "https://..."}'
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                disabled={sending}
                rows={2}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Optional JSON data for deep links or custom actions
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
                setTitle("");
                setDescription("");
                setPayload("");
              }}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditNotification}
              disabled={sending || !title.trim() || !description.trim()}
              className="bg-[#E5262C] hover:bg-[#c41e24] text-white"
            >
              {sending ? "Updating..." : "Update Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            {deleteItem && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="font-medium text-sm">{deleteItem.title}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{deleteItem.description}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteItem(null);
              }}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteNotification}
              disabled={sending}
              variant="destructive"
            >
              {sending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
