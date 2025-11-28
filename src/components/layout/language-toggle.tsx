import { FlagIcon } from "@/components/ui/flag-icon"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Languages } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANG_META } from "@/lib/i18n"


export function LanguageToggle() {
    const { i18n, t } = useTranslation()

    const current = i18n.language

    const setLanguage = (lng: string) => {
        if (current !== lng) {
            i18n.changeLanguage(lng)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    aria-label={t("Change language", { defaultValue: "Change language" })}
                >
                    <Languages className="size-4" />
                    <span className="text-sm tabular-nums">
                        {current.toUpperCase()}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel>
                    {t("Language", { defaultValue: "Language" })}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={current}
                    onValueChange={(v) => setLanguage(v)}
                >
                    {LANG_META.map((key) => {
                        return (
                            <DropdownMenuRadioItem
                                key={key.label}
                                value={key.code}
                                className="cursor-pointer"
                            >
                                <FlagIcon flag={key.flag} />
                                <span className="mr-1 font-medium">
                                    {key.code.toUpperCase()}
                                </span>
                                <span className="text-muted-foreground">{key.label}</span>
                            </DropdownMenuRadioItem>
                        )
                    })}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                {/* Fallback items for environments without radio semantics (optional) */}
                <DropdownMenuItem
                    className="hidden"
                    onSelect={(e) => e.preventDefault()}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default LanguageToggle