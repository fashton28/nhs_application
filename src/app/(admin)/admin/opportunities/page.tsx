"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function OpportunitiesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <p className="text-gray-500 mt-1">
          Manage volunteer opportunities for NHS members
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The opportunities feature is currently under development. You&apos;ll soon be able to post volunteer opportunities and track student participation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-500">
          Check back soon for updates!
        </CardContent>
      </Card>
    </div>
  );
}

