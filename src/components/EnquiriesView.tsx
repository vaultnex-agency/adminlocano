"use client"

import React, { useState } from "react"
import {
  Bell,
  Search,
  CheckCircle,
  Phone,
  Mail,
  Home,
  Trash2,
  Calendar,
  Filter,
  CheckCheck,
} from "lucide-react"

export interface AdminNotificationItem {
  id: string
  notification_type: "enquiry_created" | "signup" | "login" | "listing_submitted" | "listing_approved" | "listing_rejected"
  title: string
  message: string
  read: boolean
  created_at: string
  listing_id?: string | null
  metadata?: {
    student_name?: string
    student_email?: string
    student_phone?: string
    listing_name?: string
    area?: string
    monthly_rent?: number
    [key: string]: unknown
  }
}

interface EnquiriesViewProps {
  notifications: AdminNotificationItem[]
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onDeleteNotification: (id: string) => Promise<void>
  onRefresh: () => Promise<void>
  isLoading: boolean
}

export function EnquiriesView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
}: EnquiriesViewProps) {
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = notifications.filter((item) => {
    // Type filter
    if (filterType === "unread" && item.read) return false
    if (filterType === "enquiries" && item.notification_type !== "enquiry_created") return false
    if (filterType === "submissions" && item.notification_type !== "listing_submitted") return false

    // Search query
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const meta = item.metadata || {}
    return (
      item.title.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      (meta.student_name && String(meta.student_name).toLowerCase().includes(q)) ||
      (meta.student_email && String(meta.student_email).toLowerCase().includes(q)) ||
      (meta.student_phone && String(meta.student_phone).includes(q)) ||
      (meta.listing_name && String(meta.listing_name).toLowerCase().includes(q))
    )
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-indigo-400" />
            Student Enquiries & Activity Feed
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time notifications whenever a student clicks &quot;I&apos;m Interested&quot; or an owner submits a listing.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => onMarkAllRead()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4 text-emerald-400" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, phone, or PG..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
          {[
            { id: "all", label: "All Activity" },
            { id: "unread", label: "Unread" },
            { id: "enquiries", label: "Student Interested Leads" },
            { id: "submissions", label: "Submissions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-slate-300 mt-4">No notifications found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try clearing your search query or changing filters."
              : "When students click 'I'm Interested' on PG or mess listings, their details appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const meta = item.metadata || {}
            const isEnquiry = item.notification_type === "enquiry_created"
            const dateStr = new Date(item.created_at).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.read
                    ? "bg-slate-900/40 border-slate-800/80 text-slate-300"
                    : "bg-slate-900/90 border-indigo-500/30 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isEnquiry
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : item.notification_type === "listing_submitted"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {isEnquiry ? (
                        <Bell className="h-5 w-5" />
                      ) : item.notification_type === "listing_submitted" ? (
                        <Home className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 text-sm">{item.title}</span>
                        {!item.read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                            New Lead
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1">{item.message}</p>

                      {/* Enriched Student / User Contact Information */}
                      {Boolean(meta.student_phone || meta.phone || meta.student_email || meta.email || meta.student_name || meta.full_name) && (
                        <div className="mt-3.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center gap-4 text-xs">
                          {(meta.student_name || meta.full_name) ? (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
                              <span className="font-medium text-slate-200">{String(meta.student_name || meta.full_name)}</span>
                            </div>
                          ) : null}

                          {(meta.student_phone || meta.phone) ? (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                              <a
                                href={`tel:${meta.student_phone || meta.phone}`}
                                className="font-semibold text-teal-400 hover:underline flex items-center gap-1.5"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {String(meta.student_phone || meta.phone)}
                              </a>
                            </div>
                          ) : null}

                          {(meta.student_email || meta.email) ? (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                              <a
                                href={`mailto:${meta.student_email || meta.email}`}
                                className="font-medium text-indigo-300 hover:underline flex items-center gap-1.5"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {String(meta.student_email || meta.email)}
                              </a>
                            </div>
                          ) : null}

                          {meta.listing_name ? (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Property</span>
                              <span className="font-medium text-slate-200">{String(meta.listing_name)}</span>
                            </div>
                          ) : null}

                          {meta.role ? (
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
                              <span className="capitalize font-semibold text-amber-300 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {String(meta.role).replace("_", " ")}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!item.read && (
                      <button
                        onClick={() => onMarkRead(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteNotification(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
