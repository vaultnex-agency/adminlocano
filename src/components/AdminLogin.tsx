"use client"

import React, { useState } from "react"
import { Lock, Mail, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AdminLoginProps {
  onSuccess: (email: string) => void
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    if (!supabase) {
      // Offline fallback: allow local access
      onSuccess(email || "admin@locano.in")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Verify admin role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profileError || profile?.role !== "admin") {
        // Sign out if not admin
        await supabase.auth.signOut()
        throw new Error("This account does not have Admin privileges in the profiles table.")
      }

      onSuccess(data.user.email || email)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDemo = () => {
    onSuccess("admin@locano.in")
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-xl mx-auto mb-3">
            L
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Locano Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your verified administrator credentials
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@locano.in"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Bypass */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-3">Testing or developing locally?</p>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-indigo-300 border border-slate-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            Direct Administrator Access
          </button>
        </div>
      </div>
    </div>
  )
}
