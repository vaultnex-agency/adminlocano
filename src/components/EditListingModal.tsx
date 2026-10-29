"use client"

import React, { useState, useEffect } from "react"
import { X, Save, Home, UtensilsCrossed, Loader2 } from "lucide-react"
import { AccommodationItem } from "./AccommodationsView"
import { MessItem } from "./MessesView"
import { ImageUploader } from "./ImageUploader"

interface EditListingModalProps {
  isOpen: boolean
  onClose: () => void
  item: AccommodationItem | MessItem | null
  mode: "accommodation" | "mess"
  onSaveAccommodation: (item: Partial<AccommodationItem> & { id?: string }) => Promise<void>
  onSaveMess: (item: Partial<MessItem> & { id?: string }) => Promise<void>
  onReplaceListingImage?: (id: string, mode: "accommodation" | "mess", imageUrl: string) => Promise<void>
}

type FormData = {
  name: string
  area: string
  nearest_landmark: string
  // accommodation fields
  monthly_rent_from?: number | string
  security_deposit?: number | string
  gender?: "Boys" | "Girls" | "Co-ed"
  type?: "PG" | "Hostel" | "Shared Apartment"
  amenitiesStr?: string
  sharingStr?: string
  food_option?: string
  // mess fields
  cuisine?: string
  monthly_price_from?: number | string
  per_meal_price_from?: number | string
  dietary?: "Pure Veg" | "Veg & Non-Veg"
  service_type?: "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery"
  mealsStr?: string
  // shared
  status: "published" | "pending" | "rejected" | "archived"
  description: string
  id?: string
  sample_image?: string | null
  [key: string]: unknown
}

export function EditListingModal({
  isOpen,
  onClose,
  item,
  mode,
  onSaveAccommodation,
  onSaveMess,
  onReplaceListingImage,
}: EditListingModalProps) {
  const [formData, setFormData] = useState<FormData>({ name: "", area: "", nearest_landmark: "", status: "published", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      if (item) {
        setFormData({
          ...item,
          sample_image: item.sample_image || (item as unknown as { images?: string[] }).images?.[0] || null,
          amenitiesStr: (item as AccommodationItem).amenities?.join(", ") || "",
          sharingStr: (item as AccommodationItem).sharing_options?.join(", ") || "",
          mealsStr: (item as MessItem).meals_served?.join(", ") || "",
        } as FormData)
      } else {
        // New item defaults
        if (mode === "accommodation") {
          setFormData({
            name: "",
            area: "Saralebettu Road",
            nearest_landmark: "",
            monthly_rent_from: 8000,
            security_deposit: 16000,
            gender: "Boys",
            type: "PG",
            amenitiesStr: "Wi-Fi, 24/7 Power Backup, CCTV, RO Water",
            sharingStr: "Single, Double",
            food_option: "Optional / Available",
            status: "published",
            description: "",
            sample_image: null,
          })
        } else {
          setFormData({
            name: "",
            cuisine: "South Indian & Coastal",
            area: "Tiger Circle",
            nearest_landmark: "",
            monthly_price_from: 3200,
            per_meal_price_from: 60,
            dietary: "Pure Veg",
            service_type: "Dine-in Mess",
            mealsStr: "Breakfast, Lunch, Dinner",
            status: "published",
            description: "",
            sample_image: null,
          })
        }
      }
      setError(null)
    }
    queueMicrotask(update)
  }, [item, mode, isOpen])

  if (!isOpen) return null

  const isAccommodation = mode === "accommodation"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (isAccommodation) {
        const amenities = formData.amenitiesStr
          ? formData.amenitiesStr.split(",").map((s: string) => s.trim()).filter(Boolean)
          : []
        const sharing_options = formData.sharingStr
          ? formData.sharingStr.split(",").map((s: string) => s.trim()).filter(Boolean)
          : []

        await onSaveAccommodation({
          id: item?.id,
          name: formData.name,
          area: formData.area,
          nearest_landmark: formData.nearest_landmark,
          monthly_rent_from: Number(formData.monthly_rent_from),
          security_deposit: Number(formData.security_deposit || 0),
          gender: formData.gender,
          type: formData.type,
          amenities,
          sharing_options,
          food_option: formData.food_option,
          status: formData.status,
          description: formData.description,
          sample_image: formData.sample_image || (item as AccommodationItem)?.sample_image || null,
        })
      } else {
        const meals_served = formData.mealsStr
          ? formData.mealsStr.split(",").map((s: string) => s.trim()).filter(Boolean)
          : []

        await onSaveMess({
          id: item?.id,
          name: formData.name,
          cuisine: formData.cuisine,
          area: formData.area,
          nearest_landmark: formData.nearest_landmark,
          monthly_price_from: Number(formData.monthly_price_from),
          per_meal_price_from: Number(formData.per_meal_price_from || 0),
          dietary: formData.dietary,
          service_type: formData.service_type,
          meals_served,
          status: formData.status,
          description: formData.description,
          sample_image: formData.sample_image || (item as MessItem)?.sample_image || null,
        })
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save listing."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isAccommodation ? "bg-indigo-500/10 text-indigo-400" : "bg-teal-500/10 text-teal-400"
              }`}
            >
              {isAccommodation ? <Home className="h-5 w-5" /> : <UtensilsCrossed className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {item ? `Edit ${isAccommodation ? "Accommodation" : "Mess"}` : `Add New ${isAccommodation ? "Accommodation" : "Mess"}`}
              </h3>
              <p className="text-xs text-slate-400">
                {item?.id ? `ID: ${item.id}` : "Will be published directly to Supabase"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {error}
            </div>
          )}

          {/* Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Listing Name *</label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status || "published"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "published" | "pending" | "rejected" | "archived",
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Image Selection, Preview & Upload */}
          <ImageUploader
            currentImageUrl={formData.sample_image}
            mode={mode}
            listingId={item?.id}
            onImageUploaded={(url) => setFormData((prev) => ({ ...prev, sample_image: url }))}
            onImageRemoved={() => setFormData((prev) => ({ ...prev, sample_image: null }))}
            onDirectReplace={
              item?.id && onReplaceListingImage
                ? async (url) => {
                    await onReplaceListingImage(item.id, mode, url)
                    setFormData((prev) => ({ ...prev, sample_image: url }))
                  }
                : undefined
            }
          />

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Area / Locality *</label>
              <input
                type="text"
                required
                value={formData.area || ""}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nearest Landmark</label>
              <input
                type="text"
                value={formData.nearest_landmark || ""}
                onChange={(e) => setFormData({ ...formData, nearest_landmark: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Specific Accommodation fields */}
          {isAccommodation && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rent / Mo (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthly_rent_from || ""}
                    onChange={(e) => setFormData({ ...formData, monthly_rent_from: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    value={formData.security_deposit || ""}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">PG Type / Gender</label>
                  <select
                    value={formData.gender || "Boys"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as "Boys" | "Girls" | "Co-ed",
                        type: "PG",
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Boys">Boys PG</option>
                    <option value="Girls">Girls PG</option>
                    <option value="Co-ed">Co-ed PG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amenities (comma separated)</label>
                <input
                  type="text"
                  value={formData.amenitiesStr || ""}
                  onChange={(e) => setFormData({ ...formData, amenitiesStr: e.target.value })}
                  placeholder="Wi-Fi, 24/7 Power, CCTV, RO Water..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Sharing Options (comma separated)</label>
                <input
                  type="text"
                  value={formData.sharingStr || ""}
                  onChange={(e) => setFormData({ ...formData, sharingStr: e.target.value })}
                  placeholder="Single, Double, Triple..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </>
          )}

          {/* Specific Mess fields */}
          {!isAccommodation && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Cuisine</label>
                  <input
                    type="text"
                    value={formData.cuisine || ""}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly Pass (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthly_price_from || ""}
                    onChange={(e) => setFormData({ ...formData, monthly_price_from: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Per Meal (₹)</label>
                  <input
                    type="number"
                    value={formData.per_meal_price_from || ""}
                    onChange={(e) => setFormData({ ...formData, per_meal_price_from: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dietary</label>
                  <select
                    value={formData.dietary || "Pure Veg"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dietary: e.target.value as "Pure Veg" | "Veg & Non-Veg",
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Veg & Non-Veg">Veg & Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Service Type</label>
                  <select
                    value={formData.service_type || "Dine-in Mess"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_type: e.target.value as
                          | "Dine-in Mess"
                          | "Tiffin & Delivery"
                          | "Dine-in & Delivery",
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Dine-in Mess">Dine-in Mess</option>
                    <option value="Tiffin & Delivery">Tiffin & Delivery</option>
                    <option value="Dine-in & Delivery">Dine-in & Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Meals Served (comma separated)</label>
                <input
                  type="text"
                  value={formData.mealsStr || ""}
                  onChange={(e) => setFormData({ ...formData, mealsStr: e.target.value })}
                  placeholder="Breakfast, Lunch, Dinner..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
