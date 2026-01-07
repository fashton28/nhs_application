"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout";
import { useEffect } from "react";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, unreadNotificationCount, isAuthenticated, isLoading } = useAuth();

  // Handle auth redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle non-admin redirect in useEffect
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  // Show loading while auth is being determined or redirecting
  if (isLoading || !isAuthenticated) {
    return <LoadingSpinner />;
  }

  // Show loading while redirecting non-admin users
  if (user?.role !== "admin") {
    return <LoadingSpinner />;
  }

  // Build user display info
  const displayUser = {
    name: profile
      ? `${profile.firstName} ${profile.lastName}`
      : user?.name || "Admin",
    email: user?.email || "admin@example.com",
  };

  return (
    <AppShell
      role="admin"
      user={displayUser}
      unreadCount={unreadNotificationCount}
    >
      <div className="pb-20 md:pb-0">{children}</div>
    </AppShell>
  );
}
