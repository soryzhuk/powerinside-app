"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  HelpCircle,
  MessagesSquare,
  Share2,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

const navByRole: Record<string, NavItem[]> = {
  ATHLETE: [
    { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { labelKey: "chat", href: "/chat", icon: MessageCircle },
    { labelKey: "multiexpert", href: "/qa", icon: HelpCircle },
    { labelKey: "balance", href: "/balance", icon: Wallet },
    { labelKey: "referrals", href: "/referral", icon: Share2 },
    { labelKey: "profile", href: "/profile", icon: UserCircle },
  ],
  COACH: [
    { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { labelKey: "interview", href: "/interview", icon: ClipboardList },
    { labelKey: "athletesQuestions", href: "/expert-qa", icon: MessagesSquare },
    { labelKey: "knowledgeBase", href: "/knowledge", icon: BookOpen },
    { labelKey: "payouts", href: "/payouts", icon: Banknote },
    { labelKey: "profile", href: "/profile", icon: UserCircle },
  ],
  ADMIN: [
    { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { labelKey: "users", href: "/admin/users", icon: Users },
    { labelKey: "coaches", href: "/admin/coaches", icon: ShieldCheck },
    { labelKey: "analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
  OWNER: [
    { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { labelKey: "users", href: "/admin/users", icon: Users },
    { labelKey: "coaches", href: "/admin/coaches", icon: ShieldCheck },
    { labelKey: "analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
  INVESTOR: [
    { labelKey: "investorReport", href: "/investor", icon: TrendingUp },
    { labelKey: "profile", href: "/profile", icon: UserCircle },
  ],
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tNav = useTranslations("nav");
  const tRoles = useTranslations("roles");

  const role = (session?.user as { role?: string })?.role || "ATHLETE";
  const items = navByRole[role] || navByRole.ATHLETE;
  const roleKey = (["ATHLETE", "COACH", "INVESTOR", "OWNER", "ADMIN"] as const).includes(role as never)
    ? (role as "ATHLETE" | "COACH" | "INVESTOR" | "OWNER" | "ADMIN")
    : "ATHLETE";

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
                {tNav(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="px-3 py-2 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">{tRoles("label")}</p>
            <p className="text-sm font-medium text-primary capitalize">
              {tRoles(roleKey)}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
