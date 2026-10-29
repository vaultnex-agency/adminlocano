"use client"

import React, { useState } from "react"
import {
  Store,
  Building2,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react"
import type { VendorType, VendorStatus } from "@/types/database"

export interface VendorApplicationItem {
  id: string
  user_id: string
  vendor_type: VendorType
  status: VendorStatus
  business_name: string
  business_address?: string
  business_phone?: string
  pg_property_name?: string | null
  pg_area?: string | null
  pg_gender_preference?: string | null
  pg_approximate_rent?: number | null
  mess_name?: string | null
  mess_area?: string | null
  mess_cuisine?: string | null
  mess_dietary_type?: string | null
  mess_approximate_price?: number | null
  additional_notes?: string
  admin_notes?: string
  reviewed_at?: string | null
  created_at: string
}

interface VendorsViewProps {
  applications: VendorApplicationItem[]
  onUpdateStatus: (id: string, status: VendorStatus) => Promise<void>
  onRefresh: () => void
  isLoading?: boolean
}

export function VendorsView({
  applications,
  onUpdateStatus,
  onRefresh,
  isLoading = false,
}: VendorsViewProps) {
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<VendorType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const filtered = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false
    if (typeFilter !== "all" && app.vendor_type !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = app.business_name?.toLowerCase().includes(q)
      const matchPhone = app.business_phone?.toLowerCase().includes(q)
      const matchPg = app.pg_property_name?.toLowerCase().includes(q) || app.pg_area?.toLowerCase().includes(q)
      const matchMess = app.mess_name?.toLowerCase().includes(q) || app.mess_area?.toLowerCase().includes(q)
      return matchName || matchPhone || matchPg || matchMess
    }
    return true
  })

  const pendingCount = applications.filter((a) => a.status === "pending").length

  const handleAction = async (id: string, status: VendorStatus) => {
    try {
      setProcessingId(id)
      await onUpdateStatus(id, status)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Vendor Applications</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and approve registered PG and Food/Mess vendors before they can publish listings.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors border border-slate-700/60 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business, owner phone, property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Vendor Type Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(
            [
              { key: "all", label: "All Types" },
              { key: "pg_vendor", label: "PG Vendors" },
              { key: "food_mess_vendor", label: "Food/Mess" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === key
                  ? "bg-slate-700 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Application Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No vendor applications found</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "New vendor signups will appear here for admin approval."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((app) => {
            const isPg = app.vendor_type === "pg_vendor"
            const isPending = app.status === "pending"
            const isApproved = app.status === "approved"
            const isBusy = processingId === app.id

            return (
              <div
                key={app.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all space-y-4"
              >
                {/* Top Row: Business Name, Type, Status, and Timestamps */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPg
                          ? "bg-purple-900/40 text-purple-400 border border-purple-800/50"
                          : "bg-amber-900/40 text-amber-400 border border-amber-800/50"
                      }`}
                    >
                      {isPg ? <Building2 className="w-5 h-5" /> : <UtensilsCrossed className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{app.business_name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPg
                              ? "bg-purple-900/60 text-purple-300 border border-purple-700/60"
                              : "bg-amber-900/60 text-amber-300 border border-amber-700/60"
                          }`}
                        >
                          {isPg ? "PG Vendor" : "Food / Mess Vendor"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Submitted {new Date(app.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {app.business_phone && (
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {app.business_phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {app.status !== "approved" && (
                      <button
                        onClick={() => handleAction(app.id, "approved")}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {app.status !== "rejected" && (
                      <button
                        onClick={() => handleAction(app.id, "rejected")}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-900/40 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitted Property or Mess Details */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {isPg ? (
                    <>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Property Name</span>
                        <span className="text-slate-200 font-medium">{app.pg_property_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Area / Locality</span>
                        <span className="text-slate-200 font-medium">{app.pg_area || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Gender Preference</span>
                        <span className="text-slate-200 font-medium">{app.pg_gender_preference || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Approx Rent</span>
                        <span className="text-slate-200 font-medium">
                          {app.pg_approximate_rent ? `₹${app.pg_approximate_rent}/mo` : "—"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Mess / Food Name</span>
                        <span className="text-slate-200 font-medium">{app.mess_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Area / Locality</span>
                        <span className="text-slate-200 font-medium">{app.mess_area || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Cuisine & Diet</span>
                        <span className="text-slate-200 font-medium">{app.mess_cuisine || app.mess_dietary_type || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Approx Price</span>
                        <span className="text-slate-200 font-medium">
                          {app.mess_approximate_price ? `₹${app.mess_approximate_price}/mo` : "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {app.business_address && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{app.business_address}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
