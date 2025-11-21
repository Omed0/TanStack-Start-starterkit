

import {
    Home,
    LayoutDashboard,
    ListTodo,
    Upload,
    BarChart3,
    Layers,
    Database,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    //SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/layout/mode-toggle";
import UserMenu from "@/components/layout/user-menu";
import LocaleSwitcher from "@/components/layout/locale-switcher";
import { env } from "@/lib/env";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

export function AppSidebar() {
    const pathname = usePathname();
    const locale = useCurrentLocale()
    // Menu items configuration with translation keys
    const menuItems = [
        {
            titleKey: "home",
            url: "/",
            icon: Home,
        },
        {
            titleKey: "dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            titleKey: "todos",
            url: "/todos",
            icon: ListTodo,
        },
        {
            titleKey: "uploadFile",
            url: "/upload-file",
            icon: Upload,
        },
        {
            titleKey: "analytics",
            url: "/analytic",
            icon: BarChart3,
        },
        {
            titleKey: "backup",
            url: "/backup",
            icon: Database,
        },
        {
            titleKey: "queues",
            url: "/ queues",
            icon: Layers,
        },
    ];

    return (
        <Sidebar side={isRTLLocale(locale) ? "right" : "left"}>
            <SidebarHeader className="p-4">
                {env.APP_NAME}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const isActive = pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.titleKey}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link to={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.titleKey}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <div className="flex flex-col gap-2 ">
                    <div className="flex-1 flex gap-2">
                        <Suspense fallback={<SkeletonLocaleSwitcher />}>
                            <LocaleSwitcher />
                        </Suspense>
                        <ModeToggle />
                    </div>
                    <UserMenu />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}


function SkeletonLocaleSwitcher() {
    return (
        <Skeleton className="h-8 w-24 rounded-md" />
    );
}