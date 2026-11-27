import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  items: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  label?: string
}

export function Tabs({ items, value, onChange, label = "Tabs" }: TabsProps) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = items[(i + d + items.length) % items.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-line">
      {items.map((it, i) => {
        const on = it.id === value
        return (
          <button
            key={it.id}
            id={`tab-${it.id}`}
            role="tab"
            aria-selected={on}
            aria-controls={`panel-${it.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(it.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn("-mb-px min-h-11 whitespace-nowrap border-b-2 px-1 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-brand", on ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
