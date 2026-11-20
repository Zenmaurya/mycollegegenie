import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Esc, backdrop and the close button are ignored while false (e.g. while submitting). */
  dismissible?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Modal on >=768px, full-height bottom sheet below. Owns focus trap, Esc, scroll lock, focus return.
export function Sheet({ open, onClose, title, children, dismissible = true, initialFocusRef }: SheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const dismissibleRef = useRef(dismissible)
  const onCloseRef = useRef(onClose)
  const focusRef = useRef(initialFocusRef)
  useEffect(() => {
    dismissibleRef.current = dismissible
    onCloseRef.current = onClose
    focusRef.current = initialFocusRef
  })

  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement as HTMLElement | null
    const t = setTimeout(() => {
      const el = focusRef.current?.current ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      el?.focus()
    }, 30)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissibleRef.current) { onCloseRef.current(); return }
      if (e.key !== "Tab" || !dialogRef.current) return
      const f = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      returnTo?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 md:items-center md:p-4" onClick={() => dismissible && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full flex-col bg-surface md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-lg md:shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} disabled={!dismissible} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
