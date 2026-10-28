"use client"

import React from "react"
import { Home, UtensilsCrossed, Bell, CheckCircle2 } from "lucide-react"

interface StatsCardsProps {
  totalAccommodations: number
  publishedAccommodations: number
  pendingAccommodations: number
  totalMesses: number
  publishedMesses: number
  pendingMesses: number
  unreadEnquiries: number
  totalEnquiries: number
  onNavigate: (tab: "enquiries" | "accommodations" | "messes") => void
}

export function StatsCards({
  totalAccommodations,
  publishedAccommodations,
  pendingAccommodations,
  totalMesses,
  publishedMesses,
  pendingMesses,
  unreadEnquiries,
  totalEnquiries,
  onNavigate,
}: StatsCardsProps) {
  const cards = [
    {
      title: "Student Enquiries",
      count: totalEnquiries,
      subtext: `${unreadEnquiries} new unread leads`,
      subtextColor: unreadEnquiries > 0 ? "text-rose-400 font-semibold" : "text-slate-400",
      icon: Bell,
      iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      gradient: "from-rose-500/10 to-transparent",
      action: () => onNavigate("enquiries"),
      actionLabel: "View enquiries",
    },
    {
      title: "Accommodations",
      count: totalAccommodations,
      subtext: `${publishedAccommodations} Live · ${pendingAccommodations} Pending`,
      subtextColor: "text-emerald-400",
      icon: Home,
      iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      gradient: "from-indigo-500/10 to-transparent",
      action: () => onNavigate("accommodations"),
      actionLabel: "Manage PGs",
    },
    {
      title: "Messes & Tiffins",
      count: totalMesses,
      subtext: `${publishedMesses} Live · ${pendingMesses} Pending`,
      subtextColor: "text-teal-400",
      icon: UtensilsCrossed,
      iconColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      gradient: "from-teal-500/10 to-transparent",
      action: () => onNavigate("messes"),
      actionLabel: "Manage messes",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br ${card.gradient}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{card.count}</h3>
                <p className={`text-xs mt-1.5 ${card.subtextColor}`}>{card.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${card.iconColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Updated real-time
              </span>
              <button
                onClick={card.action}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {card.actionLabel} →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
