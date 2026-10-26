export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = "student" | "pg_owner" | "admin"
export type ListingStatus = "pending" | "published" | "rejected" | "archived"
export type AccommodationType = "PG" | "Hostel" | "Shared Apartment"
export type GenderPreference = "Boys" | "Girls" | "Co-ed"
export type DietaryType = "Pure Veg" | "Veg & Non-Veg"
export type ServiceType = "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery"
export type NotificationType =
  | "signup"
  | "login"
  | "listing_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "enquiry_created"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; full_name: string; email: string; phone: string
          role: UserRole; metadata: Json; created_at: string; updated_at: string
        }
        Insert: { id: string; full_name: string; email: string; phone: string; role?: UserRole; metadata?: Json }
        Update: { id?: string; full_name?: string; email?: string; phone?: string; role?: UserRole; metadata?: Json }
        Relationships: []
      }
      accommodation_listings: {
        Row: {
          id: string; owner_id: string | null; name: string; tagline: string
          type: AccommodationType; gender: GenderPreference; area: string
          approximate_location: string; nearest_landmark: string
          monthly_rent_from: number; security_deposit: number
          sharing_options: string[]; amenities: string[]; room_features: string[]
          house_rules: string[]; food_option: string; notice_period_days: number
          description: string; sample_image: string | null; images: string[]
          status: ListingStatus; is_demo: boolean; created_at: string; updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { id?: string; status?: ListingStatus; [key: string]: unknown }
        Relationships: []
      }
      mess_listings: {
        Row: {
          id: string; owner_id: string | null; name: string; tagline: string
          cuisine: string; dietary: DietaryType; service_type: ServiceType
          area: string; approximate_location: string; nearest_landmark: string
          monthly_price_from: number; per_meal_price_from: number
          meals_served: string[]; meal_plans: Json; daily_menu_sample: Json
          timings: Json; highlights: string[]; kitchen_features: string[]
          subscription_rules: string[]; description: string
          sample_image: string | null; images: string[]
          status: ListingStatus; is_demo: boolean; created_at: string; updated_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { id?: string; status?: ListingStatus; [key: string]: unknown }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          id: string; notification_type: NotificationType
          user_id: string | null; listing_id: string | null
          title: string; message: string; read: boolean; metadata: Json; created_at: string
        }
        Insert: { [key: string]: unknown }
        Update: { id?: string; read?: boolean; [key: string]: unknown }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      log_user_login: { Args: Record<PropertyKey, never>; Returns: void }
    }
    Enums: {
      user_role: UserRole; listing_status: ListingStatus
      accommodation_type: AccommodationType; gender_preference: GenderPreference
      dietary_type: DietaryType; service_type: ServiceType
      notification_type: NotificationType
    }
  }
}
