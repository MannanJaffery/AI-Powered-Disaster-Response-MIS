"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Shield, AlertTriangle, MapPin, ArrowLeft, CheckCircle2,
  Sun, Moon, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/context/ThemeContext"
import axios from "axios"

const API = "http://127.0.0.1:8000"

const DISASTER_TYPES = [
  "Earthquake", "Flood", "Fire", "Hurricane", "Landslide", "Explosion", "Biological", "Other",
]

const SEVERITY_LEVELS = [
  { value: "Low", label: "Low — Minor damage, no immediate danger", color: "bg-blue-500" },
  { value: "Medium", label: "Medium — Moderate damage, some risk", color: "bg-amber-500" },
  { value: "High", label: "High — Significant damage, lives at risk", color: "bg-orange-500" },
  { value: "Critical", label: "Critical — Catastrophic, immediate action needed", color: "bg-red-500" },
]

interface Location {
  location_id: number
  city: string
  district: string
  province: string
}

function ReportFormContent() {
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const preselectedLocation = searchParams.get("location")

  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationId] = useState(preselectedLocation || "")
  const [disasterType, setDisasterType] = useState("")
  const [severity, setSeverity] = useState("")
  const [description, setDescription] = useState("")
  const [reportedBy, setReportedBy] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/public/locations`)
      .then(r => setLocations(r.data as Location[]))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationId || !disasterType || !severity || !description.trim()) {
      setError("Please fill in all required fields.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/api/public/report-incident`, {
        location_id: Number(locationId),
        disaster_type: disasterType,
        severity_level: severity,
        description: description.trim(),
        reported_by: reportedBy.trim() || "Anonymous Citizen",
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to submit report."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="glass rounded-2xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Report Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Thank you for reporting this incident. Our emergency response team has been notified and will review your report immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => { setSuccess(false); setDescription(""); setDisasterType(""); setSeverity(""); setLocationId("") }}
                className="flex-1 gradient-primary text-white rounded-xl hover:opacity-90"
              >
                Report Another
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background gradient-hero">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/" className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
        </Link>
      </div>
      <div className="fixed top-4 right-4 z-50">
        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Report an Incident</h1>
          <p className="text-muted-foreground">
            No account needed. Help keep your community safe by reporting emergencies.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                Incident Location *
              </Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="bg-input border-border rounded-xl h-11">
                  <SelectValue placeholder="Select the location of the incident" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl max-h-60">
                  {locations.map((loc) => (
                    <SelectItem key={loc.location_id} value={String(loc.location_id)}>
                      {loc.city}, {loc.district} — {loc.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disaster Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Type of Disaster *</Label>
              <Select value={disasterType} onValueChange={setDisasterType}>
                <SelectTrigger className="bg-input border-border rounded-xl h-11">
                  <SelectValue placeholder="Select disaster type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {DISASTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Severity Level *</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-input border-border rounded-xl h-11">
                  <SelectValue placeholder="How severe is this incident?" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {SEVERITY_LEVELS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.color}`} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Description *</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened — location details, damage observed, people affected, etc."
                rows={4}
                className="w-full rounded-xl bg-input border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Reporter Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Your Name (optional)</Label>
              <Input
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Anonymous if left blank"
                className="bg-input border-border rounded-xl h-11"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 gradient-primary text-white rounded-xl text-base font-medium hover:opacity-90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting Report…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Submit Incident Report
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <ReportFormContent />
    </Suspense>
  )
}
