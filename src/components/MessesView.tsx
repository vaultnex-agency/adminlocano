"use client"

import React, { useState } from "react"
import {
  UtensilsCrossed,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  MapPin,
} from "lucide-react"

export interface MessItem {
  id: string
  name: string
  area: string
  cuisine: string
  dietary: "Pure Veg" | "Veg & Non-Veg"
  service_type: "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery"
  monthly_price_from: number
  per_meal_price_from?: number
  meals_served: string[]
  status: "published" | "pending" | "rejected" | "archived"
  sample_image?: string | null
  nearest_landmark?: string
  description?: string
}

interface MessesViewProps {
  messes: MessItem[]
  onUpdateStatus: (id: string, status: "published" | "pending" | "rejected") => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (item: MessItem) => void
  onAddNew: () => void
  onNavigateBulk: () => void
  isLoading: boolean
}

export function MessesView({
  messes,
  onUpdateStatus,
  onDelete,
  onEdit,
  onAddNew,
  onNavigateBulk,
  isLoading,
}: MessesViewProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dietaryFilter, setDietaryFilter] = useState<string>("all")

  const filtered = messes.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false
    if (dietaryFilter !== "all" && item.dietary !== dietaryFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.area.toLowerCase().includes(q) ||
      item.cuisine.toLowerCase().includes(q) ||
      (item.nearest_landmark && item.nearest_landmark.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <UtensilsCrossed className="h-5 w-5 text-teal-400" />
            Messes & Tiffins Management
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {messes.length} total
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage student mess passes, tiffin vendors, menus, and monthly rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateBulk}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-colors"
          >
            Bulk Import CSV
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-md shadow-teal-600/30"
          >
            <Plus className="h-4 w-4" />
            Add Single Mess
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by mess name, cuisine, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published (Live)</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Dietary select */}
          <select
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Dietary</option>
            <option value="Pure Veg">Pure Veg Only</option>
            <option value="Veg & Non-Veg">Veg & Non-Veg</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <UtensilsCrossed className="h-10 w-10 text-slate-500 mx-auto" />
          <p className="text-base font-semibold text-slate-300 mt-3">No messes found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? "No messes matched your filter." : "Start by adding a mess listing or importing via CSV."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Mess Name & Cuisine</th>
                <th className="py-3 px-4">Area & Landmark</th>
                <th className="py-3 px-4">Monthly Pass</th>
                <th className="py-3 px-4">Dietary & Service</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filtered.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-100 block">{item.name}</span>
                        <span className="text-[11px] text-teal-400 block mt-0.5">{item.cuisine}</span>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span>{item.area}</span>
                      </div>
                      {item.nearest_landmark && (
                        <span className="text-[11px] text-slate-400 block ml-5">{item.nearest_landmark}</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-100">₹{item.monthly_price_from.toLocaleString("en-IN")}</span>
                      <span className="text-slate-400 text-xs"> /mo</span>
                      {item.per_meal_price_from ? (
                        <span className="text-[11px] text-slate-400 block">₹{item.per_meal_price_from} /meal</span>
                      ) : null}
                    </td>

                    {/* Dietary & Service */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            item.dietary === "Pure Veg"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.dietary}
                        </span>
                        <span className="text-slate-400 text-[11px]">{item.service_type}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "published"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : item.status === "pending"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {item.status === "published" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "pending" && <Clock className="h-3 w-3" />}
                        {item.status === "rejected" && <XCircle className="h-3 w-3" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== "published" ? (
                          <button
                            onClick={() => onUpdateStatus(item.id, "published")}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 transition-colors"
                            title="Publish to website"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item.id, "pending")}
                            className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors"
                            title="Unpublish (set to pending)"
                          >
                            Unpublish
                          </button>
                        )}

                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
