import type { ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onToggle?: () => void
  removable?: boolean
  onRemove?: () => void
}

// Selected = 2px ink border (brand is never a large fill).
export function Chip({ children, selected = false, onToggle, removable, onRemove }: ChipProps) {
  return (
    <span className={cn("inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border bg-surface text-[13px] font-semibold", selected ? "border-2 border-ink text-ink" : "border-line text-ink-muted")}>
      <button
        type="button"
        aria-pressed={onToggle ? selected : undefined}
        onClick={onToggle}
        className={cn("min-h-11 rounded-full px-4 focus-visible:outline-2 focus-visible:outline-brand", removable && "pr-1")}
      >
        {children}
      </button>
      {removable && (
        <button type="button" aria-label="Remove" onClick={onRemove} className="mr-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </span>
  )
}
