"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import {
  BarChart3Icon,
  FlagIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MessagesSquareIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type AdminShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Overview", icon: BarChart3Icon },
  { href: "/admin/messages", label: "Messages", icon: MessagesSquareIcon },
  { href: "/admin/reports", label: "Reports", icon: FlagIcon },
];

type NavContentProps = {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
};

function NavContent({ pathname, onNavigate, onLogout }: NavContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <Link
          className="font-semibold text-sm transition-colors hover:text-primary"
          href="/"
        >
          Roube o emprego das IAs
        </Link>
        <p className="text-muted-foreground text-xs">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2">
        <Button
          className="w-full justify-start"
          onClick={onLogout}
          variant="outline"
        >
          <LogOutIcon className="size-4" />
          Sair do admin
        </Button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = () => {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    router.replace("/");
  };

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh w-full max-w-344 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-border bg-card md:block">
          <NavContent onLogout={onLogout} pathname={pathname} />
        </aside>
        <div className="flex min-h-svh flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-2">
              <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
                <SheetTrigger
                  render={
                    <Button className="md:hidden" size="icon" variant="outline">
                      <MenuIcon className="size-4" />
                    </Button>
                  }
                />
                <SheetContent className="p-0" side="left">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu admin</SheetTitle>
                  </SheetHeader>
                  <NavContent
                    onLogout={onLogout}
                    onNavigate={() => setMobileOpen(false)}
                    pathname={pathname}
                  />
                </SheetContent>
              </Sheet>
              <p className="font-semibold text-sm">
                {pathname === "/admin/messages"
                  ? "Messages"
                  : pathname === "/admin/reports"
                    ? "Reports"
                    : "Overview"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "hidden md:inline-flex",
                )}
                href="/"
              >
                <HomeIcon className="size-4" />
                Site
              </Link>
              <Button
                className="hidden md:inline-flex"
                onClick={onLogout}
                variant="outline"
              >
                <LogOutIcon className="size-4" />
                Sair do admin
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
