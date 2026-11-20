import { cn } from "@/lib/utils"

interface SegmentedProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function Segmented({ options, value, onChange, label = "Options" }: SegmentedProps) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-full bg-canvas p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("min-h-11 rounded-full border-2 px-4 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-brand", on ? "border-ink bg-surface text-ink" : "border-transparent text-ink-muted")}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
