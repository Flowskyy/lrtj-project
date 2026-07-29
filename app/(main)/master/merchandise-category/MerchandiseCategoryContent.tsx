"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, Package, Check, X } from "lucide-react";

interface Category {
  id: number;
  category_name: string | null;
  status: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MerchandiseCategoryContentProps {
  username: string;
}

export default function MerchandiseCategoryContent({ username }: MerchandiseCategoryContentProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cascadeDeleteDialogOpen, setCascadeDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [affectedItems, setAffectedItems] = useState<{ id: number; name: string }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    category_name: "",
    status: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/merchandise-category?all=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const handleAdd = async () => {
    if (!formData.category_name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const res = await fetch("/api/merchandise-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Category created successfully");
        setAddDialogOpen(false);
        setFormData({ category_name: "", status: true });
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Failed to create category", err);
      toast.error("Failed to create category");
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.category_name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const res = await fetch(`/api/merchandise-category/${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Category updated successfully");
        setEditDialogOpen(false);
        setSelectedCategory(null);
        setFormData({ category_name: "", status: true });
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update category");
      }
    } catch (err) {
      console.error("Failed to update category", err);
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      const res = await fetch(`/api/merchandise-category/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Category deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedCategory(null);
        fetchCategories();
      } else if (res.status === 400) {
        const error = await res.json();
        if (error.affectedItems && error.affectedItems.length > 0) {
          // Show cascade delete confirmation dialog
          setAffectedItems(error.affectedItems);
          setDeleteDialogOpen(false);
          setCascadeDeleteDialogOpen(true);
        } else {
          toast.error(error.error || "Failed to delete category");
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete category");
      }
    } catch (err) {
      console.error("Failed to delete category", err);
      toast.error("Failed to delete category");
    }
  };

  const handleForceDelete = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/merchandise-category/${selectedCategory.id}?force=true`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Category and ${affectedItems.length} merchandise item(s) deleted successfully`);
        setCascadeDeleteDialogOpen(false);
        setSelectedCategory(null);
        setAffectedItems([]);
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete category");
      }
    } catch (err) {
      console.error("Failed to force delete category", err);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (category: Category) => {
    try {
      const res = await fetch(`/api/merchandise-category/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: category.category_name,
          status: !category.status,
        }),
      });

      if (res.ok) {
        toast.success("Status updated successfully");
        fetchCategories();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      category_name: category.category_name || "",
      status: category.status ?? true,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchandise Category</h1>
          <p className="text-sm text-gray-500 mt-1">Manage merchandise categories</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-[#E5262C] hover:bg-[#c41e22] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "..." : categories.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Active
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {loading ? "..." : categories.filter(c => c.status).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-gray-500 mt-1">
                  {loading ? "..." : categories.filter(c => !c.status).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <X className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-40">Created At</TableHead>
                    <TableHead className="w-40">Updated At</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.category_name || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={category.status ?? false}
                            onCheckedChange={() => handleStatusToggle(category)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(category.created_at)}</TableCell>
                        <TableCell>{formatDate(category.updated_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="Enter category name"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.status}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-[#E5262C] hover:bg-[#c41e22] text-white">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="Enter category name"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.status}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-[#E5262C] hover:bg-[#c41e22] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.category_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cascade Delete Confirmation Dialog */}
      <AlertDialog open={cascadeDeleteDialogOpen} onOpenChange={setCascadeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Category in Use - Force Delete</AlertDialogTitle>
            <AlertDialogDescription>
              This category is used by the following merchandise item(s):
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 px-4">
            <ul className="list-disc list-inside space-y-1 text-sm font-medium">
              {affectedItems.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
            <p className="text-red-600 font-semibold pt-2 text-sm">
              Deleting this category will also permanently delete the following merchandise item(s): {affectedItems.map(i => i.name).join(", ")}. This action cannot be undone.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCascadeDeleteDialogOpen(false);
              setSelectedCategory(null);
              setAffectedItems([]);
            }}>
              Never Mind
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Just Do It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
