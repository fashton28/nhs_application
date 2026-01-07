"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

// TODO: Replace with actual data from Convex
const mockOpportunities = [
  {
    id: "1",
    title: "Animal Shelter Volunteering",
    organization: "Local Animal Shelter",
    description: "Help with dog walking, cat socialization, and general animal care.",
    tags: ["Animals", "Outdoors"],
    estimatedHours: "2-4 hrs/week",
    isOngoing: true,
    location: "123 Shelter Lane",
  },
  {
    id: "2",
    title: "Library Tutoring Program",
    organization: "Public Library",
    description: "Tutor elementary students in reading and math after school.",
    tags: ["Education", "Indoors"],
    estimatedHours: "2 hrs/session",
    isOngoing: false,
    startDate: "Jan 20",
    endDate: "May 15",
    location: "Main Branch Library",
  },
  {
    id: "3",
    title: "Community Garden Cleanup",
    organization: "Parks Department",
    description: "Help maintain the community garden with planting, weeding, and cleanup.",
    tags: ["Environment", "Outdoors"],
    estimatedHours: "3 hrs",
    isOngoing: false,
    startDate: "Feb 1",
    location: "Central Park Garden",
  },
];

export default function OpportunitiesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <p className="text-gray-500 mt-1">Find volunteer opportunities in your community</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Badge variant="default" className="cursor-pointer">All</Badge>
        <Badge variant="outline" className="cursor-pointer">Ongoing</Badge>
        <Badge variant="outline" className="cursor-pointer">Upcoming</Badge>
      </div>

      {/* Tag Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Badge variant="outline" className="cursor-pointer text-xs">Animals</Badge>
        <Badge variant="outline" className="cursor-pointer text-xs">Education</Badge>
        <Badge variant="outline" className="cursor-pointer text-xs">Environment</Badge>
        <Badge variant="outline" className="cursor-pointer text-xs">Health</Badge>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {mockOpportunities.map((opp) => (
          <Card key={opp.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                  <p className="text-sm text-gray-500">{opp.organization}</p>
                </div>
                {opp.isOngoing && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Ongoing
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {opp.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {opp.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{opp.estimatedHours}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{opp.location}</span>
                </div>
              </div>

              {!opp.isOngoing && (
                <p className="text-xs text-gray-400 mt-2">
                  {opp.startDate} - {opp.endDate || "TBD"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
