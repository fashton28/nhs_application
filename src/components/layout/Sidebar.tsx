"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Clock,
  FileText,
  Calendar,
  Search,
  Bell,
  User,
  Users,
  CheckSquare,
  Megaphone,
  Download,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type UserRole = "student" | "officer" | "admin";

interface SidebarProps {
  role: UserRole;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  unreadCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface QuickFilter {
  label: string;
  href: string;
  color: string;
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Submit Hours", href: "/submit-hours", icon: <Plus className="h-4 w-4" /> },
  { label: "My Submissions", href: "/submissions", icon: <FileText className="h-4 w-4" /> },
  { label: "Check In", href: "/check-in", icon: <CheckSquare className="h-4 w-4" /> },
  { label: "Calendar", href: "/calendar", icon: <Calendar className="h-4 w-4" /> },
  { label: "Opportunities", href: "/opportunities", icon: <Search className="h-4 w-4" /> },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Review Hours", href: "/admin/submissions", icon: <Clock className="h-4 w-4" /> },
  { label: "Students", href: "/admin/students", icon: <Users className="h-4 w-4" /> },
  { label: "Meetings", href: "/admin/meetings", icon: <Calendar className="h-4 w-4" /> },
  { label: "Opportunities", href: "/admin/opportunities", icon: <Search className="h-4 w-4" /> },
  { label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Exports", href: "/admin/exports", icon: <Download className="h-4 w-4" /> },
];

const studentQuickFilters: QuickFilter[] = [
  { label: "Pending", href: "/submissions?status=pending", color: "bg-yellow-500" },
  { label: "Approved", href: "/submissions?status=approved", color: "bg-green-500" },
  { label: "This Month", href: "/submissions?period=month", color: "bg-blue-500" },
];

const adminQuickFilters: QuickFilter[] = [
  { label: "Pending Review", href: "/admin/submissions?status=pending", color: "bg-yellow-500" },
  { label: "Unverified Students", href: "/admin/students?status=pending", color: "bg-orange-500" },
  { label: "Today's Meetings", href: "/admin/meetings?date=today", color: "bg-blue-500" },
];

export function Sidebar({ role, user, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(true);

  const navItems = role === "admin" ? adminNavItems : studentNavItems;
  const quickFilters = role === "admin" ? adminQuickFilters : studentQuickFilters;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <Link href={role === "admin" ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              NHS
            </div>
            <span className="font-semibold text-gray-900">Companion</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Notifications - separate item */}
          <div className="mt-2">
            <Link
              href={role === "admin" ? "/admin/notifications" : "/notifications"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.includes("/notifications")
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="ml-auto bg-red-500 text-white h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          </div>

          <Separator className="my-4" />

          {/* Quick Filters */}
          <div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-gray-500 hover:text-gray-700"
            >
              <span>Quick Filters</span>
              {filtersOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {filtersOpen && (
              <ul className="mt-1 space-y-1">
                {quickFilters.map((filter) => (
                  <li key={filter.href}>
                    <Link
                      href={filter.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className={cn("h-2 w-2 rounded-full", filter.color)} />
                      <span>{filter.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-3">
          <Link
            href={role === "admin" ? "/admin/profile" : "/profile"}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
