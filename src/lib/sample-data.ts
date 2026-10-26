export interface MockAdminNotification {
  id: string
  notification_type: "enquiry_created" | "signup" | "login" | "listing_submitted"
  title: string
  message: string
  read: boolean
  created_at: string
  listing_id?: string
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

export const SAMPLE_NOTIFICATIONS: MockAdminNotification[] = [
  {
    id: "notif-1",
    notification_type: "enquiry_created",
    title: "Student Interested: Royal Palm Luxury PG",
    message: "A student is interested in Royal Palm Luxury PG (Saralebettu Road). Click to view details.",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    listing_id: "pg-01",
    metadata: {
      student_name: "Rahul Sharma",
      student_email: "rahul.s@learner.manipal.edu",
      student_phone: "+91 98451 23456",
      listing_name: "Royal Palm Luxury PG",
      area: "Saralebettu Road",
      monthly_rent: 9500,
    },
  },
  {
    id: "notif-2",
    notification_type: "enquiry_created",
    title: "Student Interested: Green View Women's Hostel",
    message: "A student clicked 'I am Interested' for Green View Women's Hostel (Vidyaratna Nagar).",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // 1.5 hrs ago
    listing_id: "pg-02",
    metadata: {
      student_name: "Pooja Hegde",
      student_email: "pooja.hegde@gmail.com",
      student_phone: "+91 94812 77410",
      listing_name: "Green View Women's Hostel",
      area: "Vidyaratna Nagar",
      monthly_rent: 7500,
    },
  },
  {
    id: "notif-3",
    notification_type: "listing_submitted",
    title: "New Mess Listing Submitted",
    message: "Annapoorna Coastal Mess submitted their mess listing for verification.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    listing_id: "mess-01",
    metadata: {
      listing_name: "Annapoorna Coastal Mess",
      area: "Tiger Circle",
    },
  },
  {
    id: "notif-4",
    notification_type: "signup",
    title: "New Student Registered",
    message: "Aditya Nair (aditya.n@gmail.com) registered an account.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    metadata: {
      student_name: "Aditya Nair",
      student_email: "aditya.n@gmail.com",
    },
  },
]
