"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MerchandiseItem {
  id: number;
  editedBy?: string;
  creator_email?: string;
  name: string;
  image_url: string;
  points: number;
  description: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: number;
}

interface MerchandiseContentProps {
  username: string;
}

export default function MerchandiseContent({ username }: MerchandiseContentProps) {
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and Sort states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<MerchandiseItem | null>(null);
  const [editItem, setEditItem] = useState<MerchandiseItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MerchandiseItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("order", sortOrder);

      const res = await fetch(`/api/merchandise?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, sortBy, sortOrder]);

  const resetForm = () => {
    setFormName("");
    setFormPoints(100);
    setFormImageUrl("");
    setFormDescription("");
    setFormStatus(1);
  };

  // Add Item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          points: formPoints,
          image_url: formImageUrl,
          description: formDescription,
          editedBy: username,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setIsAdding(false);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  // Edit Item
  const openEdit = (item: MerchandiseItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormPoints(item.points);
    setFormImageUrl(item.image_url);
    setFormDescription(item.description);
    setFormStatus(item.status);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const res = await fetch(`/api/merchandise/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          points: formPoints,
          image_url: formImageUrl,
          description: formDescription,
          editedBy: username,
          status: formStatus,
        }),
      });
      if (res.ok) {
        await fetchItems();
        setEditItem(null);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to edit item", err);
    }
  };

  // Delete Item
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/merchandise/${deleteItem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchItems();
        setDeleteItem(null);
      }
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  // Computed values
  const total = items.length;
  const active = items.filter((i) => i.status === 1).length;
  const inactive = items.filter((i) => i.status === 0).length;

  // Render modal form
  const renderModalForm = ({
    title,
    onClose,
    onSubmit,
  }: {
    title: string;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-900">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name *
              </label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20 placeholder-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Points *
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={formPoints}
                  onChange={(e) => setFormPoints(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(parseInt(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C]"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Image Path
              </label>
              <input
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="storage/2024/..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description (HTML)
              </label>
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#E5262C] focus:ring-2 focus:ring-[#E5262C]/20"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold text-white rounded-full cursor-pointer transition-all hover:scale-105 bg-[#E5262C] hover:bg-[#c91e24] shadow-[0_4px_15px_rgba(229,38,44,0.25)]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Merchandise
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? "..." : total}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#E5262C]/10 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-[#E5262C]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Active
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {loading ? "..." : active}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Inactive
              </p>
              <p className="text-3xl font-bold text-gray-500 mt-2">
                {loading ? "..." : inactive}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Merchandise Management</h2>
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 bg-[#E5262C] hover:bg-[#c91e24] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow-[0_4px_15px_rgba(229,38,44,0.25)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Merchandise
          </button>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] bg-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] bg-white"
            >
              <option value="id">ID</option>
              <option value="createdAt">Created Date</option>
              <option value="editedBy">Edited By</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E5262C] bg-white"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-100 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last Edited By
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400 font-medium">
                    Loading data...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100">
                        <img
                          src={`/${item.image_url}`}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/lrt-logo.png";
                            (e.target as HTMLImageElement).className = "h-5 w-auto object-contain brightness-95";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px]">
                      <span className="block truncate" title={item.name}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#E5262C]">
                      {item.points} pts
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 1 ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[140px]" title={item.editedBy || ""}>
                      {item.editedBy || "-"}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setViewItem(item)}
                        className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs font-medium px-3 py-1.5 border border-[#E5262C]/30 rounded-full text-[#E5262C] hover:bg-[#E5262C]/5 cursor-pointer transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="text-xs font-medium px-3 py-1.5 border border-red-200 rounded-full text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    No merchandise items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW */}
      {viewItem && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-base font-semibold text-gray-900">{viewItem.name}</span>
              <button
                onClick={() => setViewItem(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex gap-5 items-start">
                <div className="h-20 w-20 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={`/${viewItem.image_url}`}
                    alt={viewItem.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/lrt-logo.png";
                      (e.target as HTMLImageElement).className = "h-10 w-auto object-contain";
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-gray-900 text-lg">#{viewItem.id} – {viewItem.name}</div>
                  <div className="text-[#E5262C] font-bold text-sm">{viewItem.points} Points</div>
                  <div>
                    {viewItem.status === 1 ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 text-[11px] font-semibold px-3 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-semibold px-3 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Edited by: {viewItem.editedBy || "-"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </div>
                <div
                  className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: viewItem.description }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-gray-600 mb-1 tracking-wider">
                    Created
                  </span>
                  {viewItem.createdAt}
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-gray-600 mb-1 tracking-wider">
                    Updated
                  </span>
                  {viewItem.updatedAt}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60 rounded-b-2xl">
              <button
                onClick={() => {
                  setViewItem(null);
                  openEdit(viewItem);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#E5262C]/30 rounded-full text-[#E5262C] hover:bg-[#E5262C]/5 cursor-pointer transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: ADD */}
      {isAdding && typeof document !== "undefined" && createPortal(
        renderModalForm({
          title: "Add Merchandise",
          onClose: () => {
            setIsAdding(false);
            resetForm();
          },
          onSubmit: handleAdd,
        }),
        document.body
      )}

      {/* MODAL: EDIT */}
      {editItem && typeof document !== "undefined" && createPortal(
        renderModalForm({
          title: `Edit – ${editItem.name}`,
          onClose: () => {
            setEditItem(null);
            resetForm();
          },
          onSubmit: handleEdit,
        }),
        document.body
      )}

      {/* MODAL: DELETE */}
      {deleteItem && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-100 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-base font-semibold text-red-600">Delete Merchandise</span>
              <button
                onClick={() => setDeleteItem(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteItem.name}"</span>? This
              action cannot be undone.
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60 rounded-b-2xl">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white rounded-full cursor-pointer transition-all hover:scale-105 bg-[#E5262C] hover:bg-[#c91e24] shadow-[0_4px_15px_rgba(229,38,44,0.25)]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
