"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, Package, Activity } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FeedItem {
  id: string
  timestamp: string
  type: string
  severity: string
  message: string
}

interface Props {
  items: FeedItem[]
}

const TYPE_CONFIG = {
  alert: { icon: <AlertTriangle size={12} />, color: "text-red-400", border: "border-l-red-500" },
  update: { icon: <Activity size={12} />, color: "text-blue-400", border: "border-l-blue-500" },
  resource: { icon: <Package size={12} />, color: "text-amber-400", border: "border-l-amber-500" },
  info: { icon: <Info size={12} />, color: "text-muted-foreground", border: "border-l-border" },
}

const SEV_BADGE = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/25",
  high: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  low: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
}

export default function EmergencyFeed({ items }: Props) {
  const [displayItems, setDisplayItems] = useState(items)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setDisplayItems(items)
  }, [items])

  useEffect(() => {
    if (items.length < 2) return
    intervalRef.current = setInterval(() => {
      setDisplayItems((prev) => [...prev].sort(() => Math.random() - 0.5))
    }, 7000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [items])

  if (items.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-xs text-muted-foreground">
        No active alerts
      </div>
    )
  }

  return (
    <ScrollArea className="h-80">
      <div className="space-y-1 pr-2">
        <AnimatePresence initial={false}>
          {displayItems.map((item) => {
            const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info
            const sevStyle = SEV_BADGE[item.severity as keyof typeof SEV_BADGE]
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex flex-col gap-1 p-2.5 rounded-md border-l-2 bg-secondary/40 hover:bg-secondary/70 transition-colors",
                  cfg.border
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
                    {cfg.icon}
                    <span className="uppercase tracking-wider">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sevStyle && (
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase", sevStyle)}>
                        {item.severity}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{item.message}</p>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  )
}
