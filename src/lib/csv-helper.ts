export interface ParsedAccommodationRow {
  name: string
  tagline?: string
  type: "PG" | "Hostel" | "Shared Apartment"
  gender: "Boys" | "Girls" | "Co-ed"
  area: string
  approximate_location?: string
  nearest_landmark?: string
  monthly_rent_from: number
  security_deposit?: number
  sharing_options?: string[]
  amenities?: string[]
  room_features?: string[]
  house_rules?: string[]
  food_option?: string
  notice_period_days?: number
  description?: string
  sample_image?: string
  status: "published" | "pending" | "rejected"
}

export interface ParsedMessRow {
  name: string
  tagline?: string
  cuisine?: string
  dietary: "Pure Veg" | "Veg & Non-Veg"
  service_type: "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery"
  area: string
  approximate_location?: string
  nearest_landmark?: string
  monthly_price_from: number
  per_meal_price_from?: number
  meals_served?: string[]
  highlights?: string[]
  description?: string
  sample_image?: string
  status: "published" | "pending" | "rejected"
}

export function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let insideQuotes = false

  // Normalize line breaks
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    const nextChar = cleaned[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim())
      currentField = ""
    } else if (char === "\n" && !insideQuotes) {
      currentRow.push(currentField.trim())
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow)
      }
      currentRow = []
      currentField = ""
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow)
    }
  }

  return lines
}

export function parseAccommodationCSV(csvText: string, defaultStatus: "published" | "pending" = "published"): ParsedAccommodationRow[] {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return []

  const header = rows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ""))
  const colIndex = (keys: string[]): number => {
    return header.findIndex((h) => keys.some((k) => h === k.toLowerCase().replace(/[\s_-]+/g, "")))
  }

  const nameIdx = colIndex(["name", "title", "pgname", "propertyname"])
  const areaIdx = colIndex(["area", "locality", "location", "neighborhood"])
  const rentIdx = colIndex(["monthlyrentfrom", "rent", "monthlyrent", "price", "rentpermonth"])
  const genderIdx = colIndex(["gender", "genderpreference", "for"])
  const typeIdx = colIndex(["type", "accommodationtype", "category"])
  const depositIdx = colIndex(["securitydeposit", "deposit", "advance"])
  const amenitiesIdx = colIndex(["amenities", "facilities", "features"])
  const sharingIdx = colIndex(["sharingoptions", "sharing", "occupancy", "roomtypes"])
  const foodIdx = colIndex(["foodoption", "food", "meals", "messoption"])
  const landmarkIdx = colIndex(["nearestlandmark", "landmark"])
  const descriptionIdx = colIndex(["description", "desc", "details"])
  const imageIdx = colIndex(["sampleimage", "image", "photourl", "photo"])
  const statusIdx = colIndex(["status"])

  if (nameIdx === -1 || areaIdx === -1 || rentIdx === -1) {
    throw new Error("CSV must include columns for Name, Area, and Rent (monthly_rent_from).")
  }

  const items: ParsedAccommodationRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]
    if (!name) continue

    const area = row[areaIdx] || "Central"
    const rentVal = parseInt(row[rentIdx]?.replace(/[^0-9]/g, "") || "0", 10)
    if (isNaN(rentVal) || rentVal <= 0) continue

    // Gender parsing
    const rawGender = (row[genderIdx] || "Co-ed").toLowerCase()
    let gender: "Boys" | "Girls" | "Co-ed" = "Co-ed"
    if (rawGender.includes("boy") || rawGender.includes("male") || rawGender === "m") gender = "Boys"
    else if (rawGender.includes("girl") || rawGender.includes("female") || rawGender === "f") gender = "Girls"

    // Type parsing
    const rawType = (row[typeIdx] || "PG").toLowerCase()
    let type: "PG" | "Hostel" | "Shared Apartment" = "PG"
    if (rawType.includes("hostel")) type = "Hostel"
    else if (rawType.includes("apartment") || rawType.includes("flat")) type = "Shared Apartment"

    // Status parsing
    const rawStatus = (row[statusIdx] || defaultStatus).toLowerCase()
    let status: "published" | "pending" | "rejected" = defaultStatus
    if (rawStatus.includes("publish")) status = "published"
    else if (rawStatus.includes("reject")) status = "rejected"
    else if (rawStatus.includes("pend")) status = "pending"

    // Amenities parsing (split by comma, semicolon or pipe)
    const rawAmenities = row[amenitiesIdx] || "Wi-Fi, 24/7 Power, CCTV, RO Water"
    const amenities = rawAmenities
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean)

    // Sharing parsing
    const rawSharing = row[sharingIdx] || "Single, Double"
    const sharing_options = rawSharing
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean)

    items.push({
      name,
      area,
      monthly_rent_from: rentVal,
      gender,
      security_deposit:
        depositIdx !== -1
          ? (() => {
            const val = parseInt(row[depositIdx]?.replace(/[^0-9]/g, "") || "0", 10)
            return val > 0 && val <= 100000 ? val : rentVal * 2
          })()
          : rentVal * 2,
      type,
      amenities,
      sharing_options,
      nearest_landmark: landmarkIdx !== -1 ? row[landmarkIdx] || "" : "",
      food_option: foodIdx !== -1 ? row[foodIdx] || "Optional" : "Optional",
      description: descriptionIdx !== -1 ? row[descriptionIdx] || "" : `Spacious student accommodation in ${area}`,
      sample_image: imageIdx !== -1 && row[imageIdx] ? row[imageIdx] : "/hero-coast.png",
      status,
    })
  }

  return items
}

export function parseMessCSV(csvText: string, defaultStatus: "published" | "pending" = "published"): ParsedMessRow[] {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return []

  const header = rows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ""))
  const colIndex = (keys: string[]): number => {
    return header.findIndex((h) => keys.some((k) => h === k.toLowerCase().replace(/[\s_-]+/g, "")))
  }

  const nameIdx = colIndex(["name", "title", "messname"])
  const areaIdx = colIndex(["area", "locality", "location"])
  const priceIdx = colIndex(["monthlypricefrom", "price", "monthlyprice", "monthlyrent", "pricepermonth"])
  const dietaryIdx = colIndex(["dietary", "diet", "vegornonveg", "foodtype"])
  const serviceIdx = colIndex(["servicetype", "service", "type"])
  const mealsIdx = colIndex(["mealsserved", "meals", "timings"])
  const landmarkIdx = colIndex(["nearestlandmark", "landmark"])
  const descriptionIdx = colIndex(["description", "desc"])
  const imageIdx = colIndex(["sampleimage", "image", "photo"])
  const statusIdx = colIndex(["status"])

  if (nameIdx === -1 || areaIdx === -1 || priceIdx === -1) {
    throw new Error("CSV must include columns for Name, Area, and Monthly Price (monthly_price_from).")
  }

  const items: ParsedMessRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[nameIdx]
    if (!name) continue

    const area = row[areaIdx] || "Central"
    const priceVal = parseInt(row[priceIdx]?.replace(/[^0-9]/g, "") || "0", 10)
    if (isNaN(priceVal) || priceVal <= 0) continue

    const rawDietary = (row[dietaryIdx] || "Veg & Non-Veg").toLowerCase()
    const dietary: "Pure Veg" | "Veg & Non-Veg" = rawDietary.includes("pure") || rawDietary === "veg" ? "Pure Veg" : "Veg & Non-Veg"

    const rawService = (row[serviceIdx] || "Dine-in Mess").toLowerCase()
    let service_type: "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery" = "Dine-in Mess"
    if (rawService.includes("tiffin") && rawService.includes("dine")) service_type = "Dine-in & Delivery"
    else if (rawService.includes("tiffin") || rawService.includes("delivery")) service_type = "Tiffin & Delivery"

    const rawStatus = (row[statusIdx] || defaultStatus).toLowerCase()
    let status: "published" | "pending" | "rejected" = defaultStatus
    if (rawStatus.includes("publish")) status = "published"
    else if (rawStatus.includes("reject")) status = "rejected"
    else if (rawStatus.includes("pend")) status = "pending"

    const rawMeals = row[mealsIdx] || "Breakfast, Lunch, Dinner"
    const meals_served = rawMeals.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)

    items.push({
      name,
      area,
      monthly_price_from: priceVal,
      per_meal_price_from: Math.round(priceVal / 60),
      dietary,
      service_type,
      meals_served,
      nearest_landmark: landmarkIdx !== -1 ? row[landmarkIdx] || "" : "",
      description: descriptionIdx !== -1 ? row[descriptionIdx] || "" : `Homestyle hygienic student mess in ${area}`,
      sample_image: imageIdx !== -1 && row[imageIdx] ? row[imageIdx] : "/mess-tiffin.jpg",
      status,
    })
  }

  return items
}

export const SAMPLE_ACCOMMODATIONS_CSV = `name,type,gender,area,nearest_landmark,monthly_rent_from,security_deposit,sharing_options,amenities,food_option,description,status
"Royal Palm Luxury PG",PG,Boys,"Saralebettu Road","Opposite MIT Gate 2",9500,19000,"Single; Double","High-speed Wi-Fi, 24/7 Power Backup, CCTV, RO Water, Washing Machine, Housekeeping","Optional / Available","Premium boys PG with attached bathrooms and study desks. High hygiene standard.",published
"Green View Women's PG",PG,Girls,"Vidyaratna Nagar","Near DC Office",7500,15000,"Double; Triple","Biometric Security, Wi-Fi, Hot Water, CCTV, Wardrobes, Study Table","3 Meals Included","Safe, gated girls PG with curfew monitoring and home cooked meals.",published
"Cozy Nest Boys Residence",PG,Boys,"Eshwar Nagar","Behind KMC Hospital",11000,22000,"Single; Double","AC, High-speed Wi-Fi, Kitchen Access, Microwave, Balcony, Covered Parking","Self Cooking / Kitchen Access","Modern PG accommodation for students and young researchers.",published
"Sunshine PG for Boys",PG,Boys,"Tiger Circle","Above Syndicate Bank",8000,16000,"Double; Triple","Wi-Fi, Power Backup, RO Drinking Water, Daily Cleaning","Optional / Available","Affordable and centrally located right at Tiger Circle bus stop.",published
"Coastal Breeze Girls PG",PG,Girls,"End Point Road","Near TAPMI Campus",9000,18000,"Single; Double","Wi-Fi, Security Guard, Solar Water Heater, Study Lounge","2 Meals Included (Breakfast & Dinner)","Scenic greenery view, peaceful reading atmosphere with spacious rooms.",published`

export const SAMPLE_MESS_CSV = `name,cuisine,dietary,service_type,area,nearest_landmark,monthly_price_from,per_meal_price_from,meals_served,description,status
"Annapoorna Coastal Mess","South Indian & Coastal","Pure Veg","Dine-in Mess","Tiger Circle","Opposite Bus Stand",3200,60,"Breakfast, Lunch, Dinner","Authentic Udupi style vegetarian unlimited meals. Fresh coconut chutneys and hot sambar.",published
"Malabar Treats & Tiffin","Kerala & Coastal","Veg & Non-Veg","Dine-in & Delivery","Saralebettu Road","Near MIT Gate 1",3800,75,"Lunch, Dinner","Specializes in authentic Malabar biryanis, fish curry meals, and daily tiffin boxes.",published
"Swadisht North Indian Bhojnalaya","North Indian Punjabi","Pure Veg","Dine-in Mess","Vidyaratna Nagar","Near Syndicate Bank",3400,65,"Lunch, Dinner","Unlimited phulkas with ghee, seasonal sabzis, dal tadka, and homestyle chaas.",published`
