import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Admin middleware — runs on the Edge before every request.
 *
 * Protected routes: every path that isn't /favicon.ico or a
 * Next.js internal (_next/…).  The only public page is "/" itself,
 * which renders the AdminLogin form when the user has no valid session.
 *
 * Flow:
 *  1. Refresh the Supabase session from the request cookies.
 *  2. If there is no authenticated user → allow "/" through so the
 *     login form is shown; redirect everything else to "/".
 *  3. If there IS a user but their profile role ≠ "admin" → sign them
 *     out by clearing the cookie and redirect to "/".
 *  4. Admin confirmed → forward the request and forward the refreshed
 *     session cookie back to the browser.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured at all, block every route except "/".
  if (!supabaseUrl || !supabaseAnonKey) {
    if (req.nextUrl.pathname === "/") return res
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Build an SSR client that can read + write auth cookies.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  // Always call getUser() (not getSession()) so the JWT is validated
  // server-side and cannot be spoofed by a tampered cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isRoot = req.nextUrl.pathname === "/"

  // No authenticated user → show login form at "/", block everything else.
  if (!user) {
    if (isRoot) return res
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Authenticated but role check required.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    // Clear the Supabase session cookies so the browser is logged out.
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Admin confirmed — let the request through with refreshed cookies.
  return res
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

