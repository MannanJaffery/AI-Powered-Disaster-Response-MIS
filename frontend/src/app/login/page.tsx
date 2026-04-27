"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRole } from "@/context/RoleContext"
import type { Role } from "@/lib/types"

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "operator", "field_officer", "warehouse_manager", "finance"] as const),
})

type FormData = z.infer<typeof schema>

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "operator", label: "Emergency Operator" },
  { value: "field_officer", label: "Field Officer" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "finance", label: "Finance Officer" },
]

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentRole } = useRole()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "admin" },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setCurrentRole(data.role as Role)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <Shield size={24} className="text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">DRMS Portal</h1>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Disaster Response Management System
            </p>
          </div>

          {/* Alert banner */}
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2.5 mb-6">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Authorized personnel only. All access is logged and monitored.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@drms.gov"
                autoComplete="username"
                className="bg-input border-border text-sm h-9"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-input border-border text-sm h-9 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Access Role
              </Label>
              <Select
                defaultValue="admin"
                onValueChange={(v) => setValue("role", v as Role)}
              >
                <SelectTrigger className="bg-input border-border text-sm h-9">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-sm">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 mt-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Authenticating…
                </span>
              ) : (
                "Sign In to Command Center"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo: any email + password ≥ 6 chars
          </p>
        </div>
      </motion.div>
    </div>
  )
}
