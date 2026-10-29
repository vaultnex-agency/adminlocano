"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { uploadListingImage, validateImageFile } from "@/lib/supabase/storage"

interface ImageUploaderProps {
  currentImageUrl?: string | null
  mode: "accommodation" | "mess"
  listingId?: string
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  onDirectReplace?: (url: string) => Promise<void>
}

export function ImageUploader({
  currentImageUrl,
  mode,
  listingId,
  onImageUploaded,
  onImageRemoved,
  onDirectReplace,
}: ImageUploaderProps) {
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null)
  const previewUrl = overrideUrl !== null ? overrideUrl : (currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isReplacingDirectly, setIsReplacingDirectly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setSuccessMsg(null)

    // 1. Client-side file validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "Invalid file format or size.")
      return
    }

    // 2. Set instant local preview
    const objectUrl = URL.createObjectURL(file)
    setOverrideUrl(objectUrl)

    // 3. Upload to Supabase Storage
    setIsUploading(true)
    try {
      const folder = mode === "accommodation" ? "accommodations" : "messes"
      const { publicUrl } = await uploadListingImage(file, folder, listingId)

      setOverrideUrl(publicUrl)
      onImageUploaded(publicUrl)
      setSuccessMsg("Image uploaded successfully to Supabase Storage.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image."
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOverrideUrl("")
    setError(null)
    setSuccessMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (onImageRemoved) onImageRemoved()
  }

  const handleQuickReplaceInDb = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!previewUrl || !onDirectReplace) return

    setIsReplacingDirectly(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await onDirectReplace(previewUrl)
      setSuccessMsg("Listing image replaced in database without altering other fields!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to replace image in database."
      setError(msg)
    } finally {
      setIsReplacingDirectly(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-300">
          Listing Image <span className="text-slate-400 font-normal">(.jpg, .jpeg, .png · Max 5MB)</span>
        </label>
        {listingId && onDirectReplace && previewUrl && (
          <button
            type="button"
            onClick={handleQuickReplaceInDb}
            disabled={isUploading || isReplacingDirectly}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
            title="Update just the image in database immediately without touching other fields"
          >
            {isReplacingDirectly ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Replace Image Only
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-4 ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : previewUrl
            ? "border-slate-700 bg-slate-800/40 hover:border-slate-600"
            : "border-slate-700 hover:border-indigo-500/60 bg-slate-800/20 hover:bg-slate-800/40"
        }`}
      >
        {previewUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Box */}
            <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Listing preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.src = mode === "accommodation" ? "/hero-coast.png" : "/mess-tiffin.jpg"
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  <span className="text-[10px] font-medium">Uploading...</span>
                </div>
              )}
            </div>

            {/* Info and Actions */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
                <span className="text-slate-400 text-[11px] truncate">
                  {previewUrl.startsWith("http") ? "Supabase Storage URL" : "Local Preview"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate mt-1">
                {previewUrl}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  disabled={isUploading}
                  className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Choose New File
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Click to browse or drag and drop image here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="text-slate-300 font-medium">.jpg</span>,{" "}
              <span className="text-slate-300 font-medium">.jpeg</span>, and{" "}
              <span className="text-slate-300 font-medium">.png</span> up to 5 MB
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
