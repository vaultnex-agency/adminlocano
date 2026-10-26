"use client"

import React from "react"
import {
  LayoutDashboard,
  Bell,
  Home,
  UtensilsCrossed,
  UploadCloud,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from "lucide-react"

export type AdminTab = "overview" | "enquiries" | "accommodations" | "messes" | "bulk-import"

interface AdminSidebarProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  unreadCount: number
  totalEnquiries: number
  isLive: boolean
  onSignOut: () => void
  adminEmail?: string
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  unreadCount,
  isLive,
  onSignOut,
  adminEmail = "admin@locano.in",
}: AdminSidebarProps) {
  const navItems = [
    {
      id: "overview" as AdminTab,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "enquiries" as AdminTab,
      label: "Student Enquiries",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: "bg-rose-500 text-white animate-pulse",
    },
    {
      id: "accommodations" as AdminTab,
      label: "Accommodations",
      icon: Home,
      badge: null,
    },
    {
      id: "messes" as AdminTab,
      label: "Messes & Tiffins",
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: "bulk-import" as AdminTab,
      label: "Bulk CSV Import",
      icon: UploadCloud,
      badge: "Fast",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    },
  ]

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-md">
      {/* Top Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-lg">
              L
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">LOCANO</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-400 block -mt-0.5">
                Admin Command Center
              </span>
            </div>
          </div>

          {/* Connection status tag */}
          <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? "bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-ping" : "bg-amber-400"
                }`}
              />
              {isLive ? "Database Online" : "Preview Mode"}
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.badgeColor || "bg-indigo-500/20 text-indigo-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Visit Live Website */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 rounded-lg transition-colors border border-slate-800"
        >
          <span>Open Student Website</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {/* Admin User Card */}
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">Administrator</p>
            <p className="text-[11px] text-slate-400 truncate">{adminEmail}</p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
