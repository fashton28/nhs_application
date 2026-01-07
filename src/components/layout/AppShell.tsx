"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

type UserRole = "student" | "officer" | "admin";

interface AppShellProps {
  children: React.ReactNode;
  role: UserRole;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  unreadCount?: number;
}

export function AppShell({ children, role, user, unreadCount = 0 }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar role={role} user={user} unreadCount={unreadCount} />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <MobileNav role={role} unreadCount={unreadCount} />
      </div>

      {/* Main Content */}
      <main className="md:ml-60">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
