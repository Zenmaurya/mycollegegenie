import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuProps {
  label: string
  items: { label: string; onSelect: () => void; danger?: boolean }[]
}

export function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", away)
    return () => document.removeEventListener("mousedown", away)
  }, [open])

  const close = () => { setOpen(false); trigger.current?.focus() }

  const onKey = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === "Escape") { e.preventDefault(); close(); return }
    if (e.key === "Tab") { setOpen(false); return }
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const els = Array.from(root.current!.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
    const i = els.indexOf(document.activeElement as HTMLElement)
    els[(i + d + els.length) % els.length].focus()
  }

  return (
    <div ref={root} className="relative inline-block" onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="absolute right-0 z-50 mt-1 min-w-44 rounded-card bg-surface py-1 shadow-float">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => { close(); it.onSelect() }}
              className={cn("flex min-h-11 w-full items-center px-4 text-left text-[15px] hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand", it.danger ? "text-danger" : "text-ink")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
