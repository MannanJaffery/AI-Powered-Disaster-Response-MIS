"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"

interface Role {
  role_id: number
  role_name: string
  description: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get("/roles")
      .then((res) => setRoles(res.data as Role[]))
      .catch(() => setError("Failed to load roles. Please refresh."))
      .finally(() => setRolesLoading(false))
  }, [])

  const validate = (): string | null => {
    if (!fullName.trim()) return "Full name is required."
    if (!email.trim()) return "Email address is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address."
    if (!roleId) return "Please select a role."
    if (!password) return "Password is required."
    if (password.length < 8) return "Password must be at least 8 characters."
    if (password !== confirmPassword) return "Passwords do not match."
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)
    try {
      await api.post("/register", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role_id: Number(roleId),
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-sm"
        >
          <div className="bg-card border border-border rounded-lg p-8 shadow-2xl text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4 mx-auto">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Account Created</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your account has been registered successfully. You can now sign in with your credentials.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-9 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Go to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <Shield size={24} className="text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Create Account</h1>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Register for the Disaster Response MIS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-muted-foreground uppercase tracking-wider">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g. Sara Ahmed"
                autoComplete="name"
                className="bg-input border-border text-sm h-9"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@disasterMIS.gov.pk"
                autoComplete="email"
                className="bg-input border-border text-sm h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs text-muted-foreground uppercase tracking-wider">
                Role / Department
              </Label>
              <Select
                value={roleId}
                onValueChange={setRoleId}
                disabled={rolesLoading}
              >
                <SelectTrigger id="role" className="bg-input border-border text-sm h-9">
                  <SelectValue placeholder={rolesLoading ? "Loading roles…" : "Select your role"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {roles.map((r) => (
                    <SelectItem key={r.role_id} value={String(r.role_id)} className="text-sm">
                      <span className="font-medium">{r.role_name}</span>
                      {r.description && (
                        <span className="text-muted-foreground text-xs ml-1.5">— {r.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="bg-input border-border text-sm h-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground uppercase tracking-wider">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="bg-input border-border text-sm h-9 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || rolesLoading}
              className="w-full h-9 mt-1 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
