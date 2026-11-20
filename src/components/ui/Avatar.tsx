import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const sizes = { sm: "h-8 w-8 text-[12px]", md: "h-10 w-10 text-[14px]", lg: "h-14 w-14 text-[18px]" }

interface AvatarProps {
  src?: string | null
  name: string
  size?: keyof typeof sizes
  verified?: boolean
}

export function Avatar({ src, name, size = "md", verified }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <span className={cn("relative inline-flex shrink-0", sizes[size])}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span role="img" aria-label={name} className="flex h-full w-full items-center justify-center rounded-full bg-brand-soft font-bold text-brand-hover">{initial}</span>
      )}
      {verified && <BadgeCheck aria-label="Verified" className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-surface text-highlight" />}
    </span>
  )
}
