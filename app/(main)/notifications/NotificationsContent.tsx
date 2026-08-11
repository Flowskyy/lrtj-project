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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatWIBDate } from "@/lib/formatWIBDate";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Send, MoreVertical, Pencil, Trash2, Search } from "lucide-react";

interface NotificationItem {
  id: number;
  user_id: number | null;
  title: string;
  description: string;
  payload: any;
  created_at: string | null;
}

interface NotificationsContentProps {
  // No props needed anymore
}

export default function NotificationsContent({ }: NotificationsContentProps) {
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
  const [sendPush, setSendPush] = useState(true);

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Notifications
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? "..." : totalCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Notification Management</h2>
            <Button
              onClick={() => {
                // Reset form to default state when opening dialog
                setTitle("");
                setDescription("");
                setPayload("");
                setSendPush(true); // Default to ON
                setIsSendDialogOpen(true);
              }}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </div>

          {/* Table */}
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
            <div className="overflow-x-auto">
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
                          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(item)} className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setDeleteItem(item);
                                setIsDeleteDialogOpen(true);
                              }} 
                              variant="destructive" 
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={(open) => {
        setIsSendDialogOpen(open);
        // Reset form to default state when dialog closes
        if (!open) {
          setTitle("");
          setDescription("");
          setPayload("");
          setSendPush(true); // Reset to default (true)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Send Broadcast Notification</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Create and send a notification to all users</p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Notification Details Section */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Notification Details</h3>
                <p className="text-xs text-gray-500">Enter the content for your notification</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={sending}
                    className="mt-2 h-10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter notification description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={sending}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </section>

            {/* Advanced Settings Section */}
            <section className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Advanced Settings</h3>
                <p className="text-xs text-gray-500">Configure additional notification options</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payload" className="text-sm font-medium text-gray-700">
                    Payload (Optional JSON)
                  </Label>
                  <Textarea
                    id="payload"
                    placeholder='{"action": "open_url", "url": "https://..."}'
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    disabled={sending}
                    rows={3}
                    className="mt-2 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional JSON data for deep links or custom actions
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Switch
                    id="sendPush"
                    checked={sendPush}
                    onCheckedChange={setSendPush}
                    disabled={sending}
                  />
                  <div className="flex-1">
                    <Label htmlFor="sendPush" className="cursor-pointer text-sm font-medium text-gray-700">
                      Send Push Notification
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Deliver this notification via push to user devices
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsSendDialogOpen(false)}
              disabled={sending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={sending || !title.trim() || !description.trim()}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c41e24] text-white"
            >
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notification Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Notification</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Update the notification content</p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Notification Details Section */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Notification Details</h3>
                <p className="text-xs text-gray-500">Update the content for this notification</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={sending}
                    className="mt-2 h-10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter notification description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={sending}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </section>

            {/* Advanced Settings Section */}
            <section className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Advanced Settings</h3>
                <p className="text-xs text-gray-500">Configure additional notification options</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-payload" className="text-sm font-medium text-gray-700">
                    Payload (Optional JSON)
                  </Label>
                  <Textarea
                    id="edit-payload"
                    placeholder='{"action": "open_url", "url": "https://..."}'
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    disabled={sending}
                    rows={3}
                    className="mt-2 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional JSON data for deep links or custom actions
                  </p>
                </div>
              </div>
            </section>
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray-200">
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
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditNotification}
              disabled={sending || !title.trim() || !description.trim()}
              className="min-h-[44px] bg-[#E5262C] hover:bg-[#c41e24] text-white"
            >
              {sending ? "Updating..." : "Update Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteItem(null);
        }}
        title="Delete Notification"
        itemName={deleteItem?.title}
        description="Are you sure you want to delete this notification?"
        onConfirm={handleDeleteNotification}
        isDeleting={sending}
      />
    </div>
  );
}
