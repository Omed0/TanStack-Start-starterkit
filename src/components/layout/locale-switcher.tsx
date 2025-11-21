import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChangeLocale, useCurrentLocale } from "@/locale/client"
import { fullname_locales } from "@/locale/config"


export default function LocaleSwitcher() {
    const locale = useCurrentLocale()
    const currentFullNameLocale = fullname_locales.find(loc => loc.code === locale);

    const changeLocale = useChangeLocale({
        preserveSearchParams: true,
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-2">
                    <GlobeIcon className="size-5" />
                    <span>{currentFullNameLocale?.code.toUpperCase()}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 ms-2">
                {fullname_locales.map((loc) => (
                    <DropdownMenuItem
                        onClick={() => changeLocale(loc.code)}
                        className={loc.font}
                        key={loc.code}
                    >
                        {loc.name}
                        {loc.code === locale && <CheckIcon className="size-5" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}