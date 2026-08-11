"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { formatWIBDate } from "@/lib/formatWIBDate";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Popup {
  id: number;
  description: string | null;
  image_url: string;
  sequence: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface PopupsContentProps {
  // No props needed anymore
}



function SortablePopupCard({ popup, onDelete }: { popup: Popup; onDelete: (popup: Popup) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: popup.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1"
            >
              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>

            {/* Image Thumbnail */}
            <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
              <img
                src={getImageUrl(popup.image_url)}
                alt={popup.description || "Popup"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {popup.description || "No description"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sequence: {popup.sequence}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Created:</span> {formatWIBDate(popup.created_at)} by {popup.created_by || "-"}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Updated:</span> {formatWIBDate(popup.updated_at)} by {popup.updated_by || "-"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/master/popups/edit/${popup.id}`}>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(popup)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PopupsContent({ }: PopupsContentProps) {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<Popup | null>(null);

  // Reorder state
  const [originalPopups, setOriginalPopups] = useState<Popup[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/popups");
      if (res.ok) {
        const data = await res.json();
        setPopups(data);
        setOriginalPopups(data);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Failed to fetch popups", err);
      toast.error("Failed to fetch popups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = popups.findIndex((p) => p.id === active.id);
      const newIndex = popups.findIndex((p) => p.id === over.id);

      const newPopups = arrayMove(popups, oldIndex, newIndex);
      
      // Update sequence values locally
      const reorderedPopups = newPopups.map((popup, index) => ({
        ...popup,
        sequence: index + 1,
      }));
      
      setPopups(reorderedPopups);
      setHasUnsavedChanges(true);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!selectedPopup) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/popups/${selectedPopup.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Popup deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedPopup(null);
        setHasUnsavedChanges(false);
        fetchPopups();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete popup");
      }
    } catch (err) {
      console.error("Failed to delete popup", err);
      toast.error("Failed to delete popup");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (popup: Popup) => {
    setSelectedPopup(popup);
    setDeleteDialogOpen(true);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/popups/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: popups.map((p) => ({ id: p.id, sequence: p.sequence })),
        }),
      });

      if (res.ok) {
        toast.success("Popup order updated");
        setOriginalPopups(popups);
        setHasUnsavedChanges(false);
      } else {
        toast.error("Failed to update order");
        setPopups(originalPopups);
      }
    } catch (err) {
      console.error("Failed to reorder popups", err);
      toast.error("Failed to update order");
      setPopups(originalPopups);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = () => {
    setPopups(originalPopups);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Popups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage popup images and their display order</p>
        </div>
        <Link href="/master/popups/add">
          <Button className="bg-[#E5262C] hover:bg-[#c41e22] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Popup
          </Button>
        </Link>
      </div>

      {/* Popups List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : popups.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No popups found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first popup to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={popups.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {popups.map((popup) => (
                <SortablePopupCard
                  key={popup.id}
                  popup={popup}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Popup"
        description="Are you sure you want to delete this popup? This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Save/Cancel Footer Bar */}
      {hasUnsavedChanges && (
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-4 mt-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
              onClick={handleSaveOrder}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
