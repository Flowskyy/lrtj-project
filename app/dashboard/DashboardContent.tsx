"use client"

import { useEffect, useState } from "react"
import { INITIAL_MERCHANDISE, MerchandiseItem } from "@/lib/initialMerchandise"

interface DashboardContentProps {
  username: string
}

export default function DashboardContent({ username }: DashboardContentProps) {
  const [items, setItems] = useState<MerchandiseItem[]>([])

  // Modal and CRUD states
  const [viewItem, setViewItem] = useState<MerchandiseItem | null>(null)
  const [editItem, setEditItem] = useState<MerchandiseItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MerchandiseItem | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Form states
  const [formName, setFormName] = useState("")
  const [formPoints, setFormPoints] = useState(100)
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formStatus, setFormStatus] = useState<number>(1)

  // Welcome animation states
  const [showWelcome, setShowWelcome] = useState(true)
  const [isFading, setIsFading] = useState(false)

  // Helper functions declared first to avoid hoisting warnings
  const seed = () => {
    setItems(INITIAL_MERCHANDISE)
    localStorage.setItem("lrtj_merchandise", JSON.stringify(INITIAL_MERCHANDISE))
  }

  const saveItems = (updated: MerchandiseItem[]) => {
    setItems(updated)
    localStorage.setItem("lrtj_merchandise", JSON.stringify(updated))
  }

  const resetForm = () => {
    setFormName("")
    setFormPoints(100)
    setFormImageUrl("")
    setFormDescription("")
    setFormStatus(1)
  }

  // Load items from localStorage on mount (async load via setTimeout to prevent ESLint warnings)
  useEffect(() => {
    const STORAGE_VERSION = "v3"
    const storedVersion = localStorage.getItem("lrtj_merchandise_version")
    const stored = localStorage.getItem("lrtj_merchandise")

    if (storedVersion !== STORAGE_VERSION || !stored) {
      // Version mismatch or no data → re-seed
      setTimeout(() => { seed() }, 0)
      localStorage.setItem("lrtj_merchandise_version", STORAGE_VERSION)
    } else {
      try {
        const parsed = JSON.parse(stored)
        setTimeout(() => { setItems(parsed) }, 0)
      } catch {
        setTimeout(() => { seed() }, 0)
      }
    }

    // Welcome message: start fade after 10s, unmount after 11s
    const fadeTimer = setTimeout(() => setIsFading(true), 10000)
    const hideTimer = setTimeout(() => setShowWelcome(false), 11000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  // Computed values instead of state to prevent cascading renders
  const total = items.length
  const active = items.filter((i) => i.status === 1).length
  const inactive = items.filter((i) => i.status === 0).length

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1
    const newItem: MerchandiseItem = {
      id: nextId,
      editedBy: username,
      name: formName,
      image_url: formImageUrl || "storage/placeholder.png",
      points: formPoints,
      description: formDescription || "<p>-</p>",
      createdAt: now,
      updatedAt: now,
      status: formStatus,
    }
    saveItems([newItem, ...items])
    setIsAdding(false)
    resetForm()
  }

  const openEdit = (item: MerchandiseItem) => {
    setEditItem(item)
    setFormName(item.name)
    setFormPoints(item.points)
    setFormImageUrl(item.image_url)
    setFormDescription(item.description)
    setFormStatus(item.status)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    saveItems(
      items.map((i) =>
        i.id === editItem.id
          ? {
              ...i,
              name: formName,
              points: formPoints,
              image_url: formImageUrl,
              editedBy: username,
              description: formDescription,
              status: formStatus,
              updatedAt: now,
            }
          : i
      )
    )
    setEditItem(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!deleteItem) return
    saveItems(items.filter((i) => i.id !== deleteItem.id))
    setDeleteItem(null)
  }

  const displayName = username.includes("@") ? username.split("@")[0] : username

  const renderModalForm = ({ title, onClose, onSubmit }: { title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="text-sm font-bold text-gray-800">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none">×</button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">NAME *</label>
              <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E5262C]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">POINTS *</label>
                <input required type="number" min={0} value={formPoints} onChange={e => setFormPoints(parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E5262C]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">STATUS</label>
                <select value={formStatus} onChange={e => setFormStatus(parseInt(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E5262C]">
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">IMAGE PATH</label>
              <input value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} placeholder="storage/2024/..." className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#E5262C]" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">DESCRIPTION (HTML)</label>
              <textarea rows={4} value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#E5262C]" />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs bg-[#BD8226] hover:bg-[#a06d1a] text-white rounded cursor-pointer font-bold">Save</button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Title — fades out and collapses after 10s */}
      {showWelcome && (
        <div
          className="text-center overflow-hidden transition-all duration-1000 ease-in-out"
          style={{
            opacity: isFading ? 0 : 1,
            maxHeight: isFading ? 0 : 120,
            paddingTop: isFading ? 0 : undefined,
            paddingBottom: isFading ? 0 : undefined,
            marginBottom: isFading ? 0 : undefined,
          }}
        >
          <div className="py-4">
            <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
              Welcome <span className="text-[#E5262C] font-semibold">{displayName}</span>, To Admin Dashboard!
            </h1>
          </div>
        </div>
      )}

      {/* Main card panel: Merchandise Preview */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        
        <h2 className="text-[22px] font-bold text-[#BD8226] mb-5 tracking-wide">Merchandise Preview</h2>

        {/* Stats & Add Row */}
        <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
          {/* Stats count */}
          <div className="flex gap-4 flex-wrap flex-1">
            <div className="border border-gray-200 rounded-xl p-4 min-w-[140px] flex-1 max-w-[200px]">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">TOTAL MERCHANDISE</p>
              <p className="text-3xl font-bold text-gray-800">{total}</p>
            </div>
            <div className="border border-green-200 rounded-xl p-4 min-w-[140px] bg-green-50/40 flex-1 max-w-[200px]">
              <p className="text-[10px] text-[#10B981] uppercase font-bold tracking-wider mb-1">ACTIVE</p>
              <p className="text-3xl font-bold text-green-600">{active}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 min-w-[140px] bg-gray-50/50 flex-1 max-w-[200px]">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">INACTIVE</p>
              <p className="text-3xl font-bold text-gray-500">{inactive}</p>
            </div>
          </div>

          {/* Add Merchandise Button */}
          <div>
            <button
              onClick={() => { resetForm(); setIsAdding(true) }}
              className="bg-[#BDAD2A] hover:bg-[#a39422] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              + Add Merchandise
            </button>
          </div>
        </div>

        {/* Merchandise Table inside card */}
        <div className="border border-gray-200/80 rounded-xl overflow-hidden max-h-[480px] overflow-y-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 720 }}>
            <thead className="bg-[#F8F9FA] sticky top-0 border-b border-gray-200 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-12">ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">Img</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">Points</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-40">Edited By</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-36 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-medium">#{item.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200/40">
                      <img
                        src={`/${item.image_url}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/lrt-logo.png"
                          e.currentTarget.className = "w-6 h-auto object-contain brightness-95"
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 max-w-[240px]">
                    <span className="block truncate" title={item.name}>{item.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-[#BD8226]">{item.points} pts</td>
                  <td className="px-4 py-3.5">
                    {item.status === 1 ? (
                      <span className="inline-block bg-green-50 text-green-700 border border-green-200/80 text-[9px] font-bold px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-500 border border-gray-200/80 text-[9px] font-bold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[10px] text-gray-400 truncate max-w-[160px]" title={item.editedBy || ""}>
                    {item.editedBy || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-center space-x-1.5 whitespace-nowrap">
                    <button onClick={() => setViewItem(item)} className="text-[10px] font-semibold px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600 cursor-pointer transition-colors">View</button>
                    <button onClick={() => openEdit(item)} className="text-[10px] font-semibold px-2.5 py-1 border border-[#BD8226]/40 rounded text-[#BD8226] hover:bg-[#BD8226]/5 cursor-pointer transition-colors">Edit</button>
                    <button onClick={() => setDeleteItem(item)} className="text-[10px] font-semibold px-2.5 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50 cursor-pointer transition-colors">Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-800">{viewItem.name}</span>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none">×</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={`/${viewItem.image_url}`} alt={viewItem.name} className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = "/lrt-logo.png"; e.currentTarget.className = "w-12 h-auto object-contain" }} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-bold text-gray-800">#{viewItem.id} — {viewItem.name}</div>
                  <div className="text-[#BD8226] font-bold text-xs">{viewItem.points} Points</div>
                  <div>{viewItem.status === 1
                    ? <span className="bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold px-2 py-0.5 rounded-full">Active</span>
                    : <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="text-[10px] text-gray-400">Edited by: {viewItem.editedBy || "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Description</div>
                <div
                  className="text-xs text-gray-900 bg-gray-50 border border-gray-100 rounded-lg p-3 leading-relaxed
                    [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: viewItem.description }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                <div><span className="block text-[9px] uppercase font-bold text-gray-300 mb-0.5">Created</span>{viewItem.createdAt}</div>
                <div><span className="block text-[9px] uppercase font-bold text-gray-300 mb-0.5">Updated</span>{viewItem.updatedAt}</div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <button onClick={() => { setViewItem(null); openEdit(viewItem) }} className="px-3 py-1.5 text-xs border border-[#BD8226]/45 rounded text-[#BD8226] hover:bg-[#BD8226]/5 cursor-pointer font-semibold">Edit</button>
              <button onClick={() => setViewItem(null)} className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD */}
      {isAdding && renderModalForm({ title: "Add Merchandise", onClose: () => { setIsAdding(false); resetForm() }, onSubmit: handleAdd })}

      {/* MODAL: EDIT */}
      {editItem && renderModalForm({ title: `Edit — ${editItem.name}`, onClose: () => { setEditItem(null); resetForm() }, onSubmit: handleEdit })}

      {/* MODAL: DELETE */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-red-600">Delete Merchandise</span>
              <button onClick={() => setDeleteItem(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none">×</button>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              Are you sure you want to delete <span className="font-bold">&quot;{deleteItem.name}&quot;</span>? This action cannot be undone.
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-1.5 text-xs bg-[#E5262C] hover:bg-[#c91e24] text-white rounded cursor-pointer font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
