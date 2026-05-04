"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import {
  Activity, Truck, Building2, BarChart3, MapPin, 
  ChevronRight, ArrowRight, Sun, Moon, Phone, 
  Menu, X, PlusCircle, HeartPulse, Stethoscope
} from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import axios from "axios"

const API = "http://127.0.0.1:8000"

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-card rounded-2xl p-6 border border-border shadow-sm group cursor-default"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  )
}

/* ─── Location Card ─── */
interface Location {
  location_id: number
  city: string
  district: string
  province: string
  latitude: number | null
  longitude: number | null
}

function LocationCard({ loc, onClick }: { loc: Location; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card border border-border rounded-xl p-4 text-left w-full hover:border-primary/50 transition-colors shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={14} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{loc.city}</p>
          <p className="text-xs text-muted-foreground">{loc.district}, {loc.province}</p>
        </div>
      </div>
    </motion.button>
  )
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [stats, setStats] = useState({ incidents_resolved: 0, teams_ready: 0, resources_available: 0, hospitals_connected: 0 })
  const [locations, setLocations] = useState<Location[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    axios.get(`${API}/api/public/stats`).then(r => setStats(r.data)).catch(() => {})
    axios.get(`${API}/api/public/locations`).then(r => setLocations(r.data as Location[])).catch(() => {})
  }, [])

  const features = [
    { icon: <HeartPulse size={24} />, title: "Medical Emergency Response", desc: "Report medical crises and casualties instantly. Direct line to hospital coordination centers." },
    { icon: <Truck size={24} />, title: "Ambulance & Rescue Dispatch", desc: "Real-time dispatch and tracking of ambulances and specialized medical response units." },
    { icon: <Stethoscope size={24} />, title: "Clinical Resource Allocation", desc: "Track medical supplies, blood banks, and critical care equipment across all facilities." },
    { icon: <Building2 size={24} />, title: "Hospital Bed Management", desc: "Live tracking of ICU and trauma bed availability. Auto-route patients to the nearest capable facility." },
    { icon: <Activity size={24} />, title: "Vitals & Triage Tracking", desc: "Field medics can log casualty severity to prepare receiving hospitals before arrival." },
    { icon: <BarChart3 size={24} />, title: "Healthcare Analytics", desc: "Analyze response times, casualty survival rates, and resource utilization for continuous improvement." },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* ─── Navbar ─── */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-border shadow-sm"
            : "bg-transparent border-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 relative flex items-center justify-center bg-white rounded-lg p-1">
                <Image src="/logo.png" alt="Hospital Logo" width={32} height={32} className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-foreground tracking-tight leading-none">MED-CORE</span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-1">Response System</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
                <a href="#coverage" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Network</a>
              </nav>
              
              <div className="flex items-center gap-4 border-l border-border pl-6">
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <Link
                  href="/auth"
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Staff Login
                </Link>
                <Link
                  href="/report"
                  className="h-9 px-4 rounded-xl bg-accent text-white flex items-center gap-2 text-sm font-bold hover:bg-accent/90 transition-all shadow-sm hover:shadow"
                >
                  <Phone size={14} />
                  Emergency
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <button onClick={toggleTheme} className="text-muted-foreground">
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden bg-background border-b border-border px-4 py-4 space-y-4"
          >
            <a href="#features" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#coverage" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Network</a>
            <hr className="border-border" />
            <Link href="/auth" className="block text-sm font-bold text-primary" onClick={() => setMobileMenuOpen(false)}>Staff Login</Link>
            <Link href="/report" className="flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-white text-sm font-bold w-full" onClick={() => setMobileMenuOpen(false)}>
              <Phone size={16} /> Report Emergency
            </Link>
          </motion.div>
        )}
      </motion.header>

      {/* ─── Hero Section ─── */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden"
      >
        <div className="absolute inset-0 bg-secondary/30 -z-20" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live Response Network
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1] mb-6"
              >
                Coordinating <span className="text-primary">Life-Saving</span> Medical Operations.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl"
              >
                Enterprise-grade healthcare response system. Seamlessly connect hospitals, ambulances, and emergency centers for rapid casualty triage and resource allocation.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/report"
                  className="h-12 px-8 rounded-xl bg-accent text-white flex items-center justify-center gap-2 font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
                >
                  <PlusCircle size={18} />
                  Report Medical Emergency
                </Link>
                <Link
                  href="/auth"
                  className="h-12 px-8 rounded-xl bg-primary text-white flex items-center justify-center gap-2 font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
                >
                  Access Operations Portal
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl -z-10 transform rotate-6" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
                <Image 
                  src="/hero.png" 
                  alt="Medical Command Center" 
                  width={800} 
                  height={600} 
                  className="object-cover w-full h-[500px]"
                  priority
                />
                {/* Overlay UI Element */}
                <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-md rounded-xl p-4 border border-border shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Critical Care Network</p>
                        <p className="text-xs text-muted-foreground">System functioning normally</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-md">
                      OPTIMAL
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>

      {/* ─── Stats Section ─── */}
      <section className="py-12 border-y border-border bg-secondary/30 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-primary mb-1">
                <AnimatedCounter target={stats.hospitals_connected || 42} />
              </p>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Connected Hospitals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-foreground mb-1">
                <AnimatedCounter target={stats.teams_ready || 156} />
              </p>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Medical Teams</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-foreground mb-1">
                <AnimatedCounter target={stats.incidents_resolved || 8420} suffix="+" />
              </p>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Lives Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-black text-foreground mb-1">
                <AnimatedCounter target={Math.floor((stats.resources_available || 125000) / 1000)} suffix="k" />
              </p>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Medical Supplies</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-24 bg-background relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Comprehensive Medical Response
            </h2>
            <p className="text-lg text-muted-foreground">
              A unified platform designed specifically for healthcare emergency management, ensuring no time is lost when lives are on the line.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <FeatureCard key={idx} icon={feat.icon} title={feat.title} desc={feat.desc} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Map Section ─── */}
      <section id="coverage" className="py-24 bg-secondary/30 border-t border-border relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
                National Healthcare Coverage
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Select a region to report an emergency. Our system automatically routes your report to the nearest hospital and available medical response team.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {locations.slice(0, 4).map((loc) => (
                  <LocationCard key={loc.location_id} loc={loc} onClick={() => window.location.href = `/report?location=${loc.location_id}`} />
                ))}
                {locations.length > 4 && (
                  <Link href="/report" className="flex items-center justify-center gap-2 bg-background border border-border rounded-xl p-4 text-sm font-bold text-primary hover:bg-secondary transition-colors">
                    View All Regions <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[500px] bg-card rounded-2xl border border-border shadow-sm flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 noise-overlay opacity-50" />
              <div className="absolute inset-0 grid-bg opacity-30" />
              
              {/* Abstract Map Visualization */}
              <svg viewBox="0 0 400 400" className="w-full h-full opacity-20 dark:opacity-10 absolute">
                <path d="M150,50 Q200,20 250,50 T350,150 Q380,250 300,350 T150,350 Q50,300 50,200 T150,50" fill="currentColor" className="text-primary" />
              </svg>

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-50" />
                  <MapPin size={24} className="text-primary" />
                </div>
                <p className="font-bold text-foreground">Live Tracking Active</p>
                <p className="text-xs text-muted-foreground mt-1">{locations.length} zones monitored</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent to-black/20" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
            Medical Emergency? <br /> Do Not Wait.
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto font-medium">
            Every second counts. Report casualties or medical crises immediately to dispatch the nearest emergency medical services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/report"
              className="h-14 px-8 rounded-xl bg-accent text-white flex items-center justify-center gap-2 text-lg font-bold hover:bg-accent/90 transition-transform hover:-translate-y-1 shadow-2xl"
            >
              <Phone size={20} />
              Report Emergency Now
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Image src="/logo.png" alt="Hospital Logo" width={20} height={20} className="object-contain filter invert brightness-0" />
              </div>
              <span className="text-lg font-black text-foreground tracking-tight">MED-CORE</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} Medical Emergency Response System. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
