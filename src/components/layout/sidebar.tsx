"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageCircle,
  Wallet,
  UserCircle,
  ClipboardList,
  BookOpen,
  Banknote,
  Users,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navByRole: Record<string, NavItem[]> = {
  ATHLETE: [
    { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { label: "Чат", href: "/chat", icon: MessageCircle },
    { label: "Баланс", href: "/balance", icon: Wallet },
    { label: "Профіль", href: "/profile", icon: UserCircle },
  ],
  COACH: [
    { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { label: "Інтерв'ю", href: "/interview", icon: ClipboardList },
    { label: "База знань", href: "/knowledge", icon: BookOpen },
    { label: "Виплати", href: "/payouts", icon: Banknote },
    { label: "Профіль", href: "/profile", icon: UserCircle },
  ],
  ADMIN: [
    { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { label: "Користувачі", href: "/admin/users", icon: Users },
    { label: "Тренери", href: "/admin/coaches", icon: ShieldCheck },
    { label: "Аналітика", href: "/admin/analytics", icon: BarChart3 },
  ],
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = (session?.user as { role?: string })?.role || "ATHLETE";
  const items = navByRole[role] || navByRole.ATHLETE;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64
          bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted hover:text-foreground hover:bg-secondary"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="px-3 py-2 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Роль</p>
            <p className="text-sm font-medium text-primary capitalize">
              {role === "ATHLETE"
                ? "Атлет"
                : role === "COACH"
                  ? "Тренер"
                  : "Адмін"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
