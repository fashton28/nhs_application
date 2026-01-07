"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo, useEffect, useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render auth-dependent content during SSR
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );
}
