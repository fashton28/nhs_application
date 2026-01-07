"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Mail, GraduationCap, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";

const grades = [
  { value: 9, label: "9th Grade (Freshman)" },
  { value: 10, label: "10th Grade (Sophomore)" },
  { value: 11, label: "11th Grade (Junior)" },
  { value: 12, label: "12th Grade (Senior)" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state for profile creation
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState<9 | 10 | 11 | 12>(11);
  const [studentId, setStudentId] = useState("");

  const createProfileMutation = useMutation(api.functions.users.createProfile);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("nhs_auth_token");
      if (!token) throw new Error("Not authenticated");

      await createProfileMutation({
        token,
        firstName,
        lastName,
        grade,
        studentId: studentId || undefined,
      });

      // Refresh the page to show the new profile
      window.location.reload();
    } catch (err: unknown) {
      console.error("Error creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Show profile creation form if no profile exists
  if (!profile && !isCreating) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome to NHS Companion!</CardTitle>
              <CardDescription>
                Complete your profile to start tracking service hours and attending meetings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {user?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <Button className="w-full" onClick={() => setIsCreating(true)}>
                Set Up Profile
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Profile creation form
  if (!profile && isCreating) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>
                Tell us a bit about yourself
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grade</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {grades.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGrade(g.value)}
                        disabled={isLoading}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          grade === g.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${isLoading ? "opacity-50" : ""}`}
                      >
                        <div className="font-medium text-sm">{g.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID (Optional)</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., 12345"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreating(false)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Profile view (when profile exists)
  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}` : "?";
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown";

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  {profile?.verificationStatus === "verified" && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile?.verificationStatus === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {profile?.verificationStatus === "rejected" && (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>Grade {profile?.grade} • Member since {joinDate}</span>
                </div>
                {user?.role && user.role !== "student" && (
                  <Badge className="mt-2 bg-purple-100 text-purple-700">
                    {user.role === "admin" ? "Administrator" : "Officer"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {profile?.totalApprovedHours || 0}
                  </div>
                  <div className="text-xs text-gray-500">Approved Hours</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {profile?.totalPendingHours || 0}
                  </div>
                  <div className="text-xs text-gray-500">Pending Hours</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {profile?.meetingsAttended || 0}
                  </div>
                  <div className="text-xs text-gray-500">Meetings Attended</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
