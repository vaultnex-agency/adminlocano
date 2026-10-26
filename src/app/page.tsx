"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminSidebar, AdminTab } from "@/components/AdminSidebar"
import { StatsCards } from "@/components/StatsCards"
import { EnquiriesView, AdminNotificationItem } from "@/components/EnquiriesView"
import { AccommodationsView, AccommodationItem } from "@/components/AccommodationsView"
import { MessesView, MessItem } from "@/components/MessesView"
import { BulkImporterView } from "@/components/BulkImporterView"
import { EditListingModal } from "@/components/EditListingModal"
import { AdminLogin } from "@/components/AdminLogin"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { SAMPLE_NOTIFICATIONS } from "@/lib/sample-data"
import { ParsedAccommodationRow, ParsedMessRow } from "@/lib/csv-helper"

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([])
  const [messes, setMesses] = useState<MessItem[]>([])

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<AccommodationItem | MessItem | null>(null)
  const [editMode, setEditMode] = useState<"accommodation" | "mess">("accommodation")

  // Check auth session on load
  useEffect(() => {
    const saved = localStorage.getItem("locano_admin_session")
    if (saved) {
      setAdminEmail(saved)
    }
  }, [])

  const handleLoginSuccess = (email: string) => {
    setAdminEmail(email)
    localStorage.setItem("locano_admin_session", email)
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    localStorage.removeItem("locano_admin_session")
    setAdminEmail(null)
  }

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Fallback sample data
      setNotifications(SAMPLE_NOTIFICATIONS as AdminNotificationItem[])
      setIsLoading(false)
      return
    }

    try {
      // 1. Fetch notifications
      const { data: notifData } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })

      if (notifData && notifData.length > 0) {
        setNotifications(notifData as AdminNotificationItem[])
      } else {
        setNotifications(SAMPLE_NOTIFICATIONS as AdminNotificationItem[])
      }

      // 2. Fetch accommodations
      const { data: accData } = await supabase
        .from("accommodation_listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (accData) {
        setAccommodations(accData as AccommodationItem[])
      }

      // 3. Fetch messes
      const { data: messData } = await supabase
        .from("mess_listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (messData) {
        setMesses(messData as MessItem[])
      }
    } catch (err) {
      console.error("Error loading admin data:", err)
      setNotifications(SAMPLE_NOTIFICATIONS as AdminNotificationItem[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (adminEmail) {
      loadData()
    }
  }, [adminEmail, loadData])

  // ==========================================
  // Enquiries & Notifications Handlers
  // ==========================================
  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").update({ read: true }).eq("id", id)
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").update({ read: true }).eq("read", false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").delete().eq("id", id)
    }
  }

  // ==========================================
  // Accommodations Handlers
  // ==========================================
  const handleUpdateAccStatus = async (id: string, status: "published" | "pending" | "rejected") => {
    setAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("accommodation_listings").update({ status }).eq("id", id)
    }
  }

  const handleDeleteAcc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accommodation listing?")) return
    setAccommodations((prev) => prev.filter((a) => a.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("accommodation_listings").delete().eq("id", id)
    }
  }

  const handleSaveAccommodation = async (item: Partial<AccommodationItem> & { id?: string }) => {
    const supabase = getSupabaseClient()
    if (!item.id) {
      // Insert new
      const newId = `acc_${Date.now()}`
      const newAcc: AccommodationItem = {
        id: newId,
        name: item.name || "Untitled PG",
        area: item.area || "Saralebettu Road",
        nearest_landmark: item.nearest_landmark || "",
        monthly_rent_from: item.monthly_rent_from || 8000,
        security_deposit: item.security_deposit || 16000,
        gender: item.gender || "Co-ed",
        type: item.type || "PG",
        amenities: item.amenities || [],
        sharing_options: item.sharing_options || [],
        food_option: item.food_option || "Optional",
        status: item.status || "published",
        description: item.description || "",
      }

      setAccommodations((prev) => [newAcc, ...prev])

      if (supabase) {
        await supabase.from("accommodation_listings").insert({
          id: newId,
          name: newAcc.name,
          area: newAcc.area,
          nearest_landmark: newAcc.nearest_landmark,
          monthly_rent_from: newAcc.monthly_rent_from,
          security_deposit: newAcc.security_deposit,
          gender: newAcc.gender,
          type: newAcc.type,
          amenities: newAcc.amenities,
          sharing_options: newAcc.sharing_options,
          food_option: newAcc.food_option,
          status: newAcc.status,
          description: newAcc.description,
        })
      }
    } else {
      // Update existing
      setAccommodations((prev) =>
        prev.map((a) => (a.id === item.id ? ({ ...a, ...item } as AccommodationItem) : a))
      )
      if (supabase) {
        await supabase
          .from("accommodation_listings")
          .update({
            name: item.name,
            area: item.area,
            nearest_landmark: item.nearest_landmark,
            monthly_rent_from: item.monthly_rent_from,
            security_deposit: item.security_deposit,
            gender: item.gender,
            type: item.type,
            amenities: item.amenities,
            sharing_options: item.sharing_options,
            food_option: item.food_option,
            status: item.status,
            description: item.description,
          })
          .eq("id", item.id)
      }
    }
  }

  // ==========================================
  // Messes Handlers
  // ==========================================
  const handleUpdateMessStatus = async (id: string, status: "published" | "pending" | "rejected") => {
    setMesses((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("mess_listings").update({ status }).eq("id", id)
    }
  }

  const handleDeleteMess = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mess listing?")) return
    setMesses((prev) => prev.filter((m) => m.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("mess_listings").delete().eq("id", id)
    }
  }

  const handleSaveMess = async (item: Partial<MessItem> & { id?: string }) => {
    const supabase = getSupabaseClient()
    if (!item.id) {
      // Insert new
      const newId = `mess_${Date.now()}`
      const newMess: MessItem = {
        id: newId,
        name: item.name || "Untitled Mess",
        cuisine: item.cuisine || "South Indian",
        area: item.area || "Tiger Circle",
        nearest_landmark: item.nearest_landmark || "",
        monthly_price_from: item.monthly_price_from || 3000,
        per_meal_price_from: item.per_meal_price_from || 60,
        dietary: item.dietary || "Pure Veg",
        service_type: item.service_type || "Dine-in Mess",
        meals_served: item.meals_served || ["Breakfast", "Lunch", "Dinner"],
        status: item.status || "published",
        description: item.description || "",
      }

      setMesses((prev) => [newMess, ...prev])

      if (supabase) {
        await supabase.from("mess_listings").insert({
          id: newId,
          name: newMess.name,
          cuisine: newMess.cuisine,
          area: newMess.area,
          nearest_landmark: newMess.nearest_landmark,
          monthly_price_from: newMess.monthly_price_from,
          per_meal_price_from: newMess.per_meal_price_from,
          dietary: newMess.dietary,
          service_type: newMess.service_type,
          meals_served: newMess.meals_served,
          status: newMess.status,
          description: newMess.description,
        })
      }
    } else {
      // Update existing
      setMesses((prev) => prev.map((m) => (m.id === item.id ? ({ ...m, ...item } as MessItem) : m)))
      if (supabase) {
        await supabase
          .from("mess_listings")
          .update({
            name: item.name,
            cuisine: item.cuisine,
            area: item.area,
            nearest_landmark: item.nearest_landmark,
            monthly_price_from: item.monthly_price_from,
            per_meal_price_from: item.per_meal_price_from,
            dietary: item.dietary,
            service_type: item.service_type,
            meals_served: item.meals_served,
            status: item.status,
            description: item.description,
          })
          .eq("id", item.id)
      }
    }
  }

  // ==========================================
  // Bulk Import Handlers
  // ==========================================
  const handleBulkImportAccommodations = async (items: ParsedAccommodationRow[]) => {
    const supabase = getSupabaseClient()
    const mappedItems: AccommodationItem[] = items.map((r, i) => ({
      id: `acc_bulk_${Date.now()}_${i}`,
      name: r.name,
      area: r.area,
      nearest_landmark: r.nearest_landmark || "",
      monthly_rent_from: r.monthly_rent_from,
      security_deposit: r.security_deposit || r.monthly_rent_from * 2,
      gender: r.gender,
      type: r.type,
      amenities: r.amenities || [],
      sharing_options: r.sharing_options || [],
      food_option: r.food_option || "Optional",
      status: r.status,
      description: r.description || "",
      sample_image: r.sample_image || "/hero-coast.png",
    }))

    // Update local state immediately
    setAccommodations((prev) => [...mappedItems, ...prev])

    // Save to Supabase in batches of 25
    if (supabase) {
      const batchSize = 25
      for (let i = 0; i < mappedItems.length; i += batchSize) {
        const batch = mappedItems.slice(i, i + batchSize)
        await supabase.from("accommodation_listings").insert(batch as any)
      }

      // Add audit notification
      await supabase.from("admin_notifications").insert({
        notification_type: "listing_submitted",
        title: `Bulk Imported ${items.length} Accommodations`,
        message: `Admin imported ${items.length} PG listings via CSV bulk uploader.`,
        read: false,
        metadata: { count: items.length },
      })
    }

    return { success: items.length, failed: 0 }
  }

  const handleBulkImportMesses = async (items: ParsedMessRow[]) => {
    const supabase = getSupabaseClient()
    const mappedItems: MessItem[] = items.map((r, i) => ({
      id: `mess_bulk_${Date.now()}_${i}`,
      name: r.name,
      cuisine: r.cuisine || "South Indian & Coastal",
      area: r.area,
      nearest_landmark: r.nearest_landmark || "",
      monthly_price_from: r.monthly_price_from,
      per_meal_price_from: r.per_meal_price_from || Math.round(r.monthly_price_from / 60),
      dietary: r.dietary,
      service_type: r.service_type,
      meals_served: r.meals_served || ["Breakfast", "Lunch", "Dinner"],
      status: r.status,
      description: r.description || "",
      sample_image: r.sample_image || "/mess-tiffin.jpg",
    }))

    setMesses((prev) => [...mappedItems, ...prev])

    if (supabase) {
      const batchSize = 25
      for (let i = 0; i < mappedItems.length; i += batchSize) {
        const batch = mappedItems.slice(i, i + batchSize)
        await supabase.from("mess_listings").insert(batch as any)
      }

      await supabase.from("admin_notifications").insert({
        notification_type: "listing_submitted",
        title: `Bulk Imported ${items.length} Messes`,
        message: `Admin imported ${items.length} mess listings via CSV bulk uploader.`,
        read: false,
        metadata: { count: items.length },
      })
    }

    return { success: items.length, failed: 0 }
  }

  // Not logged in -> Show sleek Admin Login
  if (!adminEmail) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  // Counts
  const unreadCount = notifications.filter((n) => !n.read).length
  const publishedAccCount = accommodations.filter((a) => a.status === "published").length
  const pendingAccCount = accommodations.filter((a) => a.status === "pending").length
  const publishedMessCount = messes.filter((m) => m.status === "published").length
  const pendingMessCount = messes.filter((m) => m.status === "pending").length

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        totalEnquiries={notifications.length}
        isLive={isSupabaseConfigured()}
        onSignOut={handleSignOut}
        adminEmail={adminEmail}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Overview</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Live snapshot of student enquiries, accommodations, and messes.
                </p>
              </div>

              {/* Stats Cards */}
              <StatsCards
                totalAccommodations={accommodations.length}
                publishedAccommodations={publishedAccCount}
                pendingAccommodations={pendingAccCount}
                totalMesses={messes.length}
                publishedMesses={publishedMessCount}
                pendingMesses={pendingMessCount}
                unreadEnquiries={unreadCount}
                totalEnquiries={notifications.length}
                onNavigate={(tab) => setActiveTab(tab)}
              />

              {/* Recent Enquiries Preview */}
              <div className="mt-8">
                <EnquiriesView
                  notifications={notifications.slice(0, 5)}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onDeleteNotification={handleDeleteNotification}
                  onRefresh={loadData}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {activeTab === "enquiries" && (
            <EnquiriesView
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onDeleteNotification={handleDeleteNotification}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "accommodations" && (
            <AccommodationsView
              accommodations={accommodations}
              onUpdateStatus={handleUpdateAccStatus}
              onDelete={handleDeleteAcc}
              onEdit={(item) => {
                setEditItem(item)
                setEditMode("accommodation")
                setIsEditModalOpen(true)
              }}
              onAddNew={() => {
                setEditItem(null)
                setEditMode("accommodation")
                setIsEditModalOpen(true)
              }}
              onNavigateBulk={() => setActiveTab("bulk-import")}
              isLoading={isLoading}
            />
          )}

          {activeTab === "messes" && (
            <MessesView
              messes={messes}
              onUpdateStatus={handleUpdateMessStatus}
              onDelete={handleDeleteMess}
              onEdit={(item) => {
                setEditItem(item)
                setEditMode("mess")
                setIsEditModalOpen(true)
              }}
              onAddNew={() => {
                setEditItem(null)
                setEditMode("mess")
                setIsEditModalOpen(true)
              }}
              onNavigateBulk={() => setActiveTab("bulk-import")}
              isLoading={isLoading}
            />
          )}

          {activeTab === "bulk-import" && (
            <BulkImporterView
              onImportAccommodations={handleBulkImportAccommodations}
              onImportMesses={handleBulkImportMesses}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      </main>

      {/* Edit / Add Modal */}
      <EditListingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editItem}
        mode={editMode}
        onSaveAccommodation={handleSaveAccommodation}
        onSaveMess={handleSaveMess}
      />
    </div>
  )
}
