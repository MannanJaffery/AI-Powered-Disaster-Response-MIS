"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Eye, EyeOff, ArrowLeft, CheckCircle2, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import api from "@/lib/api"

interface Role {
  role_id: number
  role_name: string
  description: string
}

export default function AuthPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Flip state: false = login, true = register
  const [isFlipped, setIsFlipped] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginShowPw, setLoginShowPw] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register state
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regRoleId, setRegRoleId] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regShowPw, setRegShowPw] = useState(false)
  const [regShowConfirm, setRegShowConfirm] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState(false)

  useEffect(() => {
    api.get("/roles")
      .then((res) => setRoles(res.data as Role[]))
      .catch(() => setRegError("Failed to load roles."))
      .finally(() => setRolesLoading(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required.")
      return
    }
    setLoginLoading(true)
    setLoginError(null)
    try {
      await login(loginEmail, loginPassword)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid credentials. Please try again."
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  const validateReg = (): string | null => {
    if (!regName.trim()) return "Full name is required."
    if (!regEmail.trim()) return "Email is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) return "Enter a valid email."
    if (!regRoleId) return "Please select a role."
    if (!regPassword) return "Password is required."
    if (regPassword.length < 8) return "Password must be at least 8 characters."
    if (regPassword !== regConfirm) return "Passwords do not match."
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateReg()
    if (err) { setRegError(err); return }
    setRegLoading(true)
    setRegError(null)
    try {
      await api.post("/register", {
        full_name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role_id: Number(regRoleId),
      })
      setRegSuccess(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again."
      setRegError(msg)
    } finally {
      setRegLoading(false)
    }
  }

  if (regSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm"
        >
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Account Created!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account has been registered successfully. You can now sign in.
            </p>
            <Button
              onClick={() => { setRegSuccess(false); setIsFlipped(false) }}
              className="w-full gradient-primary text-white hover:opacity-90 rounded-xl"
            >
              Go to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 gradient-hero">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Theme toggle + Back */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ─── Flip Card Container ─── */}
      <div className="relative w-full max-w-[900px] min-h-[560px]" style={{ perspective: "1200px" }}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full min-h-[560px]"
        >
          {/* ═══ FRONT — LOGIN ═══ */}
          <div
            className="absolute inset-0 w-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[560px]">
              {/* Left — Decorative */}
              <div className="hidden md:flex md:w-[45%] gradient-primary relative items-center justify-center p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-2 border-white/20 animate-pulse-ring" />
                  <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full border-2 border-white/20 animate-pulse-ring" style={{ animationDelay: "1s" }} />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-float">
                    <Shield size={36} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Welcome Back</h2>
                  <p className="text-white/70 text-sm leading-relaxed max-w-[200px] mx-auto">
                    Access your command center and manage disaster response operations.
                  </p>
                </div>
              </div>

              {/* Right — Login Form */}
              <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
                <div className="md:hidden flex items-center gap-2.5 mb-6">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <span className="text-lg font-bold text-foreground">DRMS</span>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-1">Sign In</h1>
                <p className="text-sm text-muted-foreground mb-8">Enter your credentials to continue</p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      autoComplete="username"
                      className="bg-input border-border rounded-xl h-11"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={loginShowPw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-input border-border rounded-xl h-11 pr-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setLoginShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {loginShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-11 gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Authenticating…
                      </span>
                    ) : "Sign In"}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Default password: <span className="font-mono text-foreground/60">Password123</span>
                </p>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="text-primary font-medium hover:underline underline-offset-2"
                    >
                      Create one →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ BACK — REGISTER ═══ */}
          <div
            className="absolute inset-0 w-full"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[560px]">
              {/* Left — Form */}
              <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center order-2 md:order-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
                <p className="text-sm text-muted-foreground mb-6">Register for the Disaster Response MIS</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="e.g. Sara Ahmed"
                      autoComplete="name"
                      className="bg-input border-border rounded-xl h-10"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="user@email.com"
                      autoComplete="email"
                      className="bg-input border-border rounded-xl h-10"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-role" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</Label>
                    <Select value={regRoleId} onValueChange={setRegRoleId} disabled={rolesLoading}>
                      <SelectTrigger id="reg-role" className="bg-input border-border rounded-xl h-10">
                        <SelectValue placeholder={rolesLoading ? "Loading…" : "Select your role"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border rounded-xl">
                        {roles.map((r) => (
                          <SelectItem key={r.role_id} value={String(r.role_id)} className="text-sm">
                            {r.role_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pw" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                      <div className="relative">
                        <Input
                          id="reg-pw"
                          type={regShowPw ? "text" : "password"}
                          placeholder="Min 8 chars"
                          autoComplete="new-password"
                          className="bg-input border-border rounded-xl h-10 pr-9"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setRegShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {regShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm</Label>
                      <div className="relative">
                        <Input
                          id="reg-confirm"
                          type={regShowConfirm ? "text" : "password"}
                          placeholder="Re-enter"
                          autoComplete="new-password"
                          className="bg-input border-border rounded-xl h-10 pr-9"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                        />
                        <button type="button" onClick={() => setRegShowConfirm(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {regShowConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2"
                    >
                      {regError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={regLoading || rolesLoading}
                    className="w-full h-10 gradient-primary text-white rounded-xl font-medium hover:opacity-90"
                  >
                    {regLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Creating…
                      </span>
                    ) : "Create Account"}
                  </Button>
                </form>

                <div className="mt-5 pt-5 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => setIsFlipped(false)}
                      className="text-primary font-medium hover:underline underline-offset-2"
                    >
                      ← Sign In
                    </button>
                  </p>
                </div>
              </div>

              {/* Right — Decorative */}
              <div className="hidden md:flex md:w-[40%] gradient-primary relative items-center justify-center p-8 overflow-hidden order-1 md:order-2">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-16 right-10 w-28 h-28 rounded-full border-2 border-white/20 animate-pulse-ring" />
                  <div className="absolute bottom-16 left-10 w-20 h-20 rounded-full border-2 border-white/20 animate-pulse-ring" style={{ animationDelay: "1.5s" }} />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-float">
                    <Shield size={36} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Join the Team</h2>
                  <p className="text-white/70 text-sm leading-relaxed max-w-[200px] mx-auto">
                    Create your account to start managing disaster response operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
