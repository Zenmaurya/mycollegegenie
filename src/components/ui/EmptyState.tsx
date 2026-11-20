import type { ReactNode } from "react"

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[15px] text-ink-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
