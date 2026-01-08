"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function ExportsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exports</h1>
        <p className="text-gray-500 mt-1">
          Export data and generate reports
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <Download className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The exports feature is currently under development. You&apos;ll soon be able to export student data, service hours, and attendance records in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-500">
          Check back soon for updates!
        </CardContent>
      </Card>
    </div>
  );
}

