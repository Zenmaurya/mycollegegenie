import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const tones = {
  brand: "bg-brand-soft text-brand-hover",
  success: "bg-success/10 text-[#0B6E3E]",
  neutral: "bg-canvas text-ink-muted",
}

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold", tones[tone])}>{children}</span>
}
