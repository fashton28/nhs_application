"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  Calendar,
  Bell,
  User,
  Users,
  Clock,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type UserRole = "student" | "officer" | "admin";

interface MobileNavProps {
  role: UserRole;
  unreadCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Hours", href: "/submissions", icon: <FileText className="h-5 w-5" /> },
  { label: "Check In", href: "/check-in", icon: <CheckSquare className="h-5 w-5" /> },
  { label: "Calendar", href: "/calendar", icon: <Calendar className="h-5 w-5" /> },
  { label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
  { label: "Home", href: "/admin/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Review", href: "/admin/submissions", icon: <Clock className="h-5 w-5" /> },
  { label: "Students", href: "/admin/students", icon: <Users className="h-5 w-5" /> },
  { label: "Meetings", href: "/admin/meetings", icon: <Calendar className="h-5 w-5" /> },
  { label: "Profile", href: "/admin/profile", icon: <User className="h-5 w-5" /> },
];

export function MobileNav({ role, unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? adminNavItems : studentNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.label === "Profile" && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
