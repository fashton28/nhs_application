"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface User {
  _id: string;
  email: string;
  name: string;
  role: "student" | "officer" | "admin";
  isActive: boolean;
  profileId?: string;
  createdAt?: number;
}

interface Profile {
  _id: string;
  firstName: string;
  lastName: string;
  grade: 9 | 10 | 11 | 12;
  verificationStatus: "pending" | "verified" | "rejected";
  totalApprovedHours: number;
  totalPendingHours: number;
  meetingsAttended: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  unreadNotificationCount: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: "student" | "officer" | "admin") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "nhs_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutations
  const signInMutation = useMutation(api.functions.auth.signIn);
  const signUpMutation = useMutation(api.functions.auth.signUp);
  const signOutMutation = useMutation(api.functions.auth.signOut);

  // Query current user based on token
  const userData = useQuery(
    api.functions.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Update loading state based on query
  useEffect(() => {
    if (token && userData === undefined) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [token, userData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInMutation({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  }, [signInMutation]);

  const signUp = useCallback(async (email: string, password: string, name: string, role?: "student" | "officer" | "admin") => {
    const result = await signUpMutation({ email, password, name, role });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  }, [signUpMutation]);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await signOutMutation({ token });
      } catch (e) {
        // Ignore errors on sign out
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, [token, signOutMutation]);

  const value: AuthContextType = {
    user: userData?.user as User | null,
    profile: userData?.profile as Profile | null,
    unreadNotificationCount: userData?.unreadNotificationCount || 0,
    isAuthenticated: !!userData?.user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
