"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 mt-1">
          Create and manage announcements for NHS members
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Megaphone className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The announcements feature is currently under development. You&apos;ll soon be able to create, schedule, and manage announcements for all NHS members.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-500">
          Check back soon for updates!
        </CardContent>
      </Card>
    </div>
  );
}

