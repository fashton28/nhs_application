"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

export default function SubmitHoursPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [organizationName, setOrganizationName] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");

  const submitHoursMutation = useMutation(api.functions.serviceHours.submitServiceHours);

  // Calculate estimated hours for display
  const calculateHours = () => {
    if (!startTime || !endTime) return null;
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    if (diffMinutes <= 0) return null;
    const hours = Math.round((diffMinutes / 60) * 4) / 4;
    return hours;
  };

  const estimatedHours = calculateHours();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("nhs_auth_token");
      if (!token) {
        throw new Error("Please log in to submit hours");
      }

      // Validate
      if (description.length < 10) {
        throw new Error("Description must be at least 10 characters");
      }

      if (!estimatedHours || estimatedHours <= 0) {
        throw new Error("End time must be after start time");
      }

      await submitHoursMutation({
        token,
        organizationName,
        serviceDate,
        startTime,
        endTime,
        description,
        supervisorName,
        supervisorEmail,
        supervisorPhone: supervisorPhone || undefined,
        // TODO: Handle file upload when implementing Convex storage
      });

      router.push("/submissions");
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit hours");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Service Hours</h1>
        <p className="text-gray-500 mt-1">Log your community service time</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name *</Label>
              <Input
                id="organization"
                placeholder="e.g., Local Food Bank"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Service Date *</Label>
              <Input
                id="date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
                disabled={isLoading}
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Hours Display */}
            {estimatedHours !== null && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                Total hours: <span className="font-medium text-blue-700">{estimatedHours} hours</span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description * <span className="text-gray-400 font-normal">(min 10 characters)</span></Label>
              <Textarea
                id="description"
                placeholder="Describe what you did during your service..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400">{description.length}/10 characters minimum</p>
            </div>

            {/* Supervisor Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-gray-900">Supervisor Information</h3>
              <div className="space-y-2">
                <Label htmlFor="supervisorName">Name *</Label>
                <Input
                  id="supervisorName"
                  placeholder="John Smith"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Email *</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  placeholder="supervisor@organization.org"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisorPhone">Phone (optional)</Label>
                <Input
                  id="supervisorPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={supervisorPhone}
                  onChange={(e) => setSupervisorPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Proof of Service (optional)</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Photo or PDF (max 10MB)</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={isLoading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400">File upload coming soon - submission works without file for now</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Hours"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
