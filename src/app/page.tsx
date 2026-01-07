"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-500">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-500">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <div className="text-2xl font-bold text-white drop-shadow-md">
            NHS Companion
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 hover:text-white"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-blue-600 hover:bg-white/90 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg max-w-4xl leading-tight">
            Track your service.{" "}
            <span className="italic">Make an impact.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md">
            The easiest way to log community service hours, verify meeting
            attendance, and stay connected with your NHS chapter.
          </p>

          <div className="mt-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 shadow-xl text-lg px-8 py-6 h-auto font-semibold"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-white/70 text-sm">
          <p>National Honor Society Chapter Management</p>
        </footer>
      </div>
    </div>
  );
}
