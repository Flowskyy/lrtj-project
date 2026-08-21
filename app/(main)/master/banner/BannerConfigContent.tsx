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
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";

interface Banner {
  id: number;
  description: string | null;
  image_url: string;
  sequence: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface BannerConfigContentProps {
  // No props needed anymore
}



function SortableBannerCard({ banner, onDelete }: { banner: Banner; onDelete: (banner: Banner) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

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
                src={getImageUrl(banner.image_url)}
                alt={banner.description || "Banner"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {banner.description || "No description"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sequence: {banner.sequence}
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Created:</span> {formatWIBDate(banner.created_at)} by {banner.created_by || "-"}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Updated:</span> {formatWIBDate(banner.updated_at)} by {banner.updated_by || "-"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/master/banner/edit/${banner.id}`}>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(banner)}
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

function BannerDragOverlay({ banner }: { banner: Banner }) {
  return (
    <Card className="bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl scale-105">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>

          {/* Image Thumbnail */}
          <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
            <img
              src={getImageUrl(banner.image_url)}
              alt={banner.description || "Banner"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {banner.description || "No description"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sequence: {banner.sequence}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BannerConfigContent({ }: BannerConfigContentProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Reorder state
  const [originalBanners, setOriginalBanners] = useState<Banner[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  // DnD sensors with modifiers for boundary constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/banners?page=1&limit=100");
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
        setOriginalBanners(data.banners || []);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Failed to fetch banners", err);
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);

      // Update sequence values locally
      const reorderedBanners = newBanners.map((banner, index) => ({
        ...banner,
        sequence: index + 1,
      }));

      setBanners(reorderedBanners);
      setHasUnsavedChanges(true);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (!selectedBanner) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/banners/${selectedBanner.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Banner deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedBanner(null);
        setHasUnsavedChanges(false);
        fetchBanners();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete banner");
      }
    } catch (err) {
      console.error("Failed to delete banner", err);
      toast.error("Failed to delete banner");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    setDeleteDialogOpen(true);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/banners/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: banners.map((b) => ({ id: b.id, sequence: b.sequence })),
        }),
      });

      if (res.ok) {
        toast.success("Banner order updated");
        setOriginalBanners(banners);
        setHasUnsavedChanges(false);
      } else {
        toast.error("Failed to update order");
        setBanners(originalBanners);
      }
    } catch (err) {
      console.error("Failed to reorder banners", err);
      toast.error("Failed to update order");
      setBanners(originalBanners);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = () => {
    setBanners(originalBanners);
    setHasUnsavedChanges(false);
  };

  // Register unsaved changes with global context
  const { registerUnsavedChanges, unregisterUnsavedChanges } = useUnsavedChanges();

  useEffect(() => {
    if (hasUnsavedChanges) {
      registerUnsavedChanges({
        hasUnsavedChanges: true,
        onDiscard: handleCancelOrder,
        description: "You have unsaved changes to the banner order. These changes will be lost if you continue.",
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [hasUnsavedChanges, registerUnsavedChanges, unregisterUnsavedChanges]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner</h1>
          <p className="text-sm text-gray-500 mt-1">Manage banner images and their display order</p>
        </div>
        <Link href="/master/banner/add">
          <Button className="bg-[#E5262C] hover:bg-[#c41e22] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </Link>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No banners found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first banner to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={banners.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {banners.map((banner) => (
                <SortableBannerCard
                  key={banner.id}
                  banner={banner}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <BannerDragOverlay banner={banners.find((b) => b.id === activeId)!} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Banner"
        description="Are you sure you want to delete this banner? This action cannot be undone."
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
