"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface CategoryItem {
  name: string
  value: number
  color: string
}

interface Props {
  data: CategoryItem[]
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">{d.name}</p>
      <p className="text-muted-foreground">{d.value.toLocaleString()} units</p>
    </div>
  )
}

export default function InventoryDonutChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">
        No inventory data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
