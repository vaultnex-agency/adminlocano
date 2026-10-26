"use client"

import React, { useState } from "react"
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Home,
  UtensilsCrossed,
  Sparkles,
  FileText,
} from "lucide-react"
import {
  parseAccommodationCSV,
  parseMessCSV,
  SAMPLE_ACCOMMODATIONS_CSV,
  SAMPLE_MESS_CSV,
  ParsedAccommodationRow,
  ParsedMessRow,
} from "@/lib/csv-helper"

interface BulkImporterViewProps {
  onImportAccommodations: (items: ParsedAccommodationRow[]) => Promise<{ success: number; failed: number }>
  onImportMesses: (items: ParsedMessRow[]) => Promise<{ success: number; failed: number }>
  onNavigateTab: (tab: "accommodations" | "messes") => void
}

export function BulkImporterView({
  onImportAccommodations,
  onImportMesses,
  onNavigateTab,
}: BulkImporterViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"accommodations" | "messes">("accommodations")
  const [csvContent, setCsvContent] = useState<string>("")
  const [defaultStatus, setDefaultStatus] = useState<"published" | "pending">("published")
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedAcc, setParsedAcc] = useState<ParsedAccommodationRow[]>([])
  const [parsedMess, setParsedMess] = useState<ParsedMessRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  // Download Sample CSV
  const handleDownloadSample = () => {
    const isAcc = activeSubTab === "accommodations"
    const text = isAcc ? SAMPLE_ACCOMMODATIONS_CSV : SAMPLE_MESS_CSV
    const filename = isAcc ? "locano_accommodations_template.csv" : "locano_messes_template.csv"
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Load Sample Data into text area
  const handleLoadSample = () => {
    setImportResult(null)
    setParseError(null)
    if (activeSubTab === "accommodations") {
      setCsvContent(SAMPLE_ACCOMMODATIONS_CSV)
      handleParse(SAMPLE_ACCOMMODATIONS_CSV, "accommodations")
    } else {
      setCsvContent(SAMPLE_MESS_CSV)
      handleParse(SAMPLE_MESS_CSV, "messes")
    }
  }

  // Handle file drop or upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvContent(text)
      handleParse(text, activeSubTab)
    }
    reader.readAsText(file)
  }

  // Parse text
  const handleParse = (text: string, type: "accommodations" | "messes") => {
    setParseError(null)
    setImportResult(null)
    if (!text.trim()) {
      setParsedAcc([])
      setParsedMess([])
      return
    }

    try {
      if (type === "accommodations") {
        const result = parseAccommodationCSV(text, defaultStatus)
        setParsedAcc(result)
        setParsedMess([])
      } else {
        const result = parseMessCSV(text, defaultStatus)
        setParsedMess(result)
        setParsedAcc([])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse CSV format."
      setParseError(msg)
      setParsedAcc([])
      setParsedMess([])
    }
  }

  // Trigger import
  const handleExecuteImport = async () => {
    setIsSubmitting(true)
    setImportResult(null)
    try {
      if (activeSubTab === "accommodations" && parsedAcc.length > 0) {
        const res = await onImportAccommodations(parsedAcc)
        setImportResult(res)
      } else if (activeSubTab === "messes" && parsedMess.length > 0) {
        const res = await onImportMesses(parsedMess)
        setImportResult(res)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed."
      setParseError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentCount = activeSubTab === "accommodations" ? parsedAcc.length : parsedMess.length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <UploadCloud className="h-6 w-6 text-emerald-400" />
          Bulk Data Seeder & CSV Importer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload spreadsheets containing up to hundreds of PGs or Messes directly into the Supabase database in seconds.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => {
            setActiveSubTab("accommodations")
            setCsvContent("")
            setParsedAcc([])
            setParsedMess([])
            setParseError(null)
            setImportResult(null)
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "accommodations"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Home className="h-4 w-4" />
          Accommodations (PGs & Hostels)
        </button>
        <button
          onClick={() => {
            setActiveSubTab("messes")
            setCsvContent("")
            setParsedAcc([])
            setParsedMess([])
            setParseError(null)
            setImportResult(null)
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "messes"
              ? "border-teal-500 text-teal-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Messes & Tiffins
        </button>
      </div>

      {/* Guide Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-indigo-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-300">
              Need a spreadsheet template for {activeSubTab === "accommodations" ? "Accommodations" : "Messes"}?
            </p>
            <p className="text-[11px] text-slate-400">
              Download our ready-made CSV template with headers pre-configured for your Google Sheets or Excel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            Download Sample CSV
          </button>
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Try Demo Data
          </button>
        </div>
      </div>

      {/* Upload & Paste Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Upload box */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-slate-700 transition-colors flex flex-col items-center justify-center text-center">
          <UploadCloud className="h-10 w-10 text-slate-500 mb-3" />
          <p className="text-sm font-semibold text-slate-200">Upload CSV File</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Export your 100+ items from Excel or Sheets as a .csv file and select it here.
          </p>
          <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors">
            <FileText className="h-3.5 w-3.5 text-teal-400" />
            Choose .csv file
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Options */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Default Publish Status
            </label>
            <select
              value={defaultStatus}
              onChange={(e) => {
                const val = e.target.value as "published" | "pending"
                setDefaultStatus(val)
                if (csvContent) handleParse(csvContent, activeSubTab)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="published">Published (Immediately live on student website)</option>
              <option value="pending">Pending (Review in Admin first before publishing)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Choose whether listings go live right away or stay in pending queue.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Paste Raw CSV Content
            </label>
            <textarea
              rows={4}
              placeholder="Or paste comma-separated CSV text directly here..."
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value)
                handleParse(e.target.value, activeSubTab)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Success Result */}
      {importResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>
              Successfully imported <strong>{importResult.success}</strong> {activeSubTab} into Supabase database!
            </span>
          </div>
          <button
            onClick={() => onNavigateTab(activeSubTab)}
            className="text-xs font-bold underline hover:text-emerald-200"
          >
            View in {activeSubTab === "accommodations" ? "Accommodations" : "Messes"} →
          </button>
        </div>
      )}

      {/* Preview Table & Action */}
      {currentCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Found {currentCount} valid {activeSubTab} ready for database import:
            </span>

            <button
              onClick={handleExecuteImport}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing into Supabase...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Import {currentCount} {activeSubTab === "accommodations" ? "Accommodations" : "Messes"} to Database
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Area</th>
                  <th className="py-2.5 px-3">{activeSubTab === "accommodations" ? "Rent/Mo" : "Price/Mo"}</th>
                  <th className="py-2.5 px-3">{activeSubTab === "accommodations" ? "Gender & Type" : "Dietary & Service"}</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {activeSubTab === "accommodations"
                  ? parsedAcc.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-100">{row.name}</td>
                        <td className="py-2 px-3">{row.area}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">₹{row.monthly_rent_from}</td>
                        <td className="py-2 px-3">
                          {row.gender} · {row.type}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-400">{row.status}</td>
                      </tr>
                    ))
                  : parsedMess.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-100">{row.name}</td>
                        <td className="py-2 px-3">{row.area}</td>
                        <td className="py-2 px-3 font-semibold text-teal-400">₹{row.monthly_price_from}</td>
                        <td className="py-2 px-3">
                          {row.dietary} · {row.service_type}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-400">{row.status}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {currentCount > 15 && (
            <p className="text-center text-xs text-slate-500">
              ...and {currentCount - 15} more rows will be imported simultaneously.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
