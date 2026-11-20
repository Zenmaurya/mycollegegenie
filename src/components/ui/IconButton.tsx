import type { ButtonHTMLAttributes, ComponentType } from "react"
import { cn } from "@/lib/utils"

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string
  icon: ComponentType<{ className?: string }>
}

export function IconButton({ label, icon: Icon, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50", className)}
      {...props}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
