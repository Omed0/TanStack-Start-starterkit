

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LogOut, User } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter } from "@tanstack/react-router";


export default function UserMenu() {
  const router = useRouter();
  const { isPending, data } = authClient.useSession.get();
  const { setOpen } = useSidebar();

  if (isPending) {
    return <Skeleton className="h-12 w-full rounded-md" />;
  }

  if (!data) {
    return null;
  }

  const user = data.user;
  const initials = user.name.charAt(0) || "U";

  return (
    <DropdownMenu>
      <Separator />
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 px-3 py-2 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left flex-1 min-w-0">
            <span className="text-sm font-medium truncate w-full">
              {user?.name}
            </span>
            <span className="text-xs text-muted-foreground truncate w-full">
              {user?.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={"/dashboard"} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  setOpen(false);
                  toast.success('Logout successful');
                  router.navigate({ to: "/login", replace: true, reloadDocument: true });
                },
              },
            });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
