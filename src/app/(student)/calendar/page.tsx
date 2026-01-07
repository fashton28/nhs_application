"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// TODO: Replace with actual data from Convex
const mockEvents = [
  {
    id: "1",
    title: "General Assembly",
    date: "2024-01-15",
    time: "3:30 PM",
    type: "meeting" as const,
    location: "Room 204",
  },
  {
    id: "2",
    title: "Food Bank Signup Deadline",
    date: "2024-01-15",
    type: "deadline" as const,
  },
  {
    id: "3",
    title: "Officer Meeting",
    date: "2024-01-18",
    time: "2:00 PM",
    type: "meeting" as const,
    location: "Room 102",
  },
];

export default function CalendarPage() {
  // TODO: Implement actual calendar logic
  const currentMonth = "January 2024";
  const selectedDate = "January 15";

  const todayEvents = mockEvents.filter((e) => e.date === "2024-01-15");

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 mt-1">View upcoming meetings and events</p>
      </div>

      {/* Month Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-gray-900">{currentMonth}</h2>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Simple Calendar Grid Placeholder */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="py-2 text-gray-500 font-medium">
                {day}
              </div>
            ))}
            {/* Placeholder dates */}
            {Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className={`py-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                  i + 1 === 15
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                } ${[14, 17].includes(i + 1) ? "relative" : ""}`}
              >
                {i + 1}
                {[14, 17].includes(i + 1) && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{selectedDate}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      event.type === "meeting"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Calendar
                      className={`h-5 w-5 ${
                        event.type === "meeting"
                          ? "text-blue-600"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    {event.time && (
                      <div className="text-sm text-gray-500">{event.time}</div>
                    )}
                    {event.location && (
                      <div className="text-xs text-gray-400">{event.location}</div>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      event.type === "meeting"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {event.type === "meeting" ? "Meeting" : "Deadline"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No events on this day</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
