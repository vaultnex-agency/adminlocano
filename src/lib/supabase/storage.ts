import { getSupabaseClient } from "./client"

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"]
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"]
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const DEFAULT_STORAGE_BUCKET = "listings"
export const FALLBACK_STORAGE_BUCKET = "listing-images"

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates file type and size on client before upload.
 * Only .jpg, .jpeg, and .png up to 5MB are permitted.
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: "No file was selected." }
  }

  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty (0 bytes)." }
  }

  // Check extension
  const dotIndex = file.name.lastIndexOf(".")
  if (dotIndex === -1) {
    return {
      valid: false,
      error: "File has no extension. Please select a .jpg, .jpeg, or .png image.",
    }
  }

  const ext = file.name.slice(dotIndex).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file format (${ext}). Only .jpg, .jpeg, and .png images are permitted.`,
    }
  }

  // Check MIME type if present
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type (${file.type}). Only JPEG and PNG images are allowed.`,
    }
  }

  // Check size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`,
    }
  }

  return { valid: true }
}

/**
 * Ensures the current session belongs to an authorized admin before upload.
 * Strictly verifies authenticated user session and 'admin' role in Supabase profiles.
 */
export async function ensureAdminAuthorized(): Promise<{ authorized: boolean; error?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { authorized: false, error: "Supabase client is not configured." }
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        error: "Unauthorized: You must be logged in as an administrator to upload images.",
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return {
        authorized: false,
        error: "Access denied: Your account does not have Admin privileges in the profiles table.",
      }
    }

    return { authorized: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to verify admin status."
    return { authorized: false, error: msg }
  }
}

/**
 * Uploads a listing image to Supabase Storage with unique path,
 * validating file type/size and admin authorization.
 */
export async function uploadListingImage(
  file: File,
  folder: "accommodations" | "messes",
  listingId?: string
): Promise<{ publicUrl: string; path: string }> {
  // 1. Client-side file validation
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file.")
  }

  // 2. Admin authorization check
  const authCheck = await ensureAdminAuthorized()
  if (!authCheck.authorized) {
    throw new Error(authCheck.error || "Administrator authorization required.")
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  // 3. Generate sanitized unique file path to prevent collision or stale caching
  const baseName = file.name.split(/[/\\]/).pop() || "image.jpg"
  const sanitizedName = baseName
    .replace(/\.{2,}/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase()
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const cleanListingId = (listingId || "new")
    .replace(/\.{2,}/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
  const filePath = `${folder}/${cleanListingId}_${timestamp}_${randomSuffix}_${sanitizedName}`

  // 4. Upload to primary bucket 'listings', fallback to 'listing-images' if primary bucket not found
  let targetBucket = DEFAULT_STORAGE_BUCKET
  let uploadResult = await supabase.storage.from(targetBucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/jpeg",
  })

  if (uploadResult.error) {
    const errMsg = uploadResult.error.message.toLowerCase()
    if (errMsg.includes("bucket not found") || errMsg.includes("does not exist")) {
      // Try fallback bucket
      targetBucket = FALLBACK_STORAGE_BUCKET
      uploadResult = await supabase.storage.from(targetBucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      })
    }
  }

  if (uploadResult.error) {
    console.error("Storage upload error:", uploadResult.error)
    const errText = uploadResult.error.message
    if (errText.includes("row-level security") || errText.includes("RLS")) {
      throw new Error(
        "Upload failed: Storage Row-Level Security policy blocked this upload. Please execute '20261030000001_storage_setup.sql' in the Supabase SQL editor."
      )
    }
    if (errText.toLowerCase().includes("bucket not found")) {
      throw new Error(
        "Upload failed: Storage bucket 'listings' was not found. Please run the storage migration in Supabase SQL Editor."
      )
    }
    throw new Error(`Upload failed: ${errText}`)
  }

  // 5. Retrieve public URL for shared persistence on Vercel and customer website
  const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(filePath)
  if (!urlData || !urlData.publicUrl) {
    throw new Error("Failed to retrieve public URL from Supabase Storage.")
  }

  return {
    publicUrl: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Replaces image for an existing listing in Supabase without modifying other fields.
 */
export async function replaceListingImageInDb(
  listingId: string,
  type: "accommodation" | "mess",
  imageUrl: string
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error("Supabase is not configured.")
  }

  const table = type === "accommodation" ? "accommodation_listings" : "mess_listings"
  const { error } = await supabase
    .from(table)
    .update({
      sample_image: imageUrl,
      images: [imageUrl],
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)

  if (error) {
    throw new Error(`Failed to update listing image in database: ${error.message}`)
  }
}
