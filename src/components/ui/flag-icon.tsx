import { cn } from "@/lib/utils"

interface FlagIconProps {
    flag: string
    className?: string
}

/**
 * FlagIcon component that handles both Unicode emoji flags and image-based flags.
 * - If flag is a Unicode emoji (1-2 characters), renders it as text
 * - If flag is a path (starts with / or ./), renders it as an img
 */
export function FlagIcon({ flag, className }: FlagIconProps) {
    // Check if it's an emoji (short string without path indicators)
    const isEmoji = flag.length <= 4 && !flag.startsWith("/") && !flag.startsWith(".")

    if (isEmoji) {
        return (
            <span className={cn("text-base leading-none", className)} aria-hidden>
                {flag}
            </span>
        )
    }

    // It's an image path
    return (
        <img
            alt=""
            src={flag}
            aria-hidden
            className={cn("size-4.5 object-contain rounded-sm", className)}
        />
    )
}
