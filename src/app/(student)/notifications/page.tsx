"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Calendar, Bell, Megaphone } from "lucide-react";
import Link from "next/link";

// TODO: Replace with actual data from Convex
const mockNotifications = [
  {
    id: "1",
    type: "submission_approved" as const,
    title: "Submission Approved",
    message: "Your hours at Library Reading Program have been approved!",
    time: "2 hours ago",
    isRead: false,
    link: "/submissions/2",
  },
  {
    id: "2",
    type: "meeting_reminder" as const,
    title: "Meeting Reminder",
    message: "General Assembly is tomorrow at 3:30 PM",
    time: "5 hours ago",
    isRead: false,
    link: "/calendar",
  },
  {
    id: "3",
    type: "new_opportunity" as const,
    title: "New Opportunity",
    message: 'Check out "Animal Shelter Volunteering"',
    time: "2 days ago",
    isRead: true,
    link: "/opportunities/1",
  },
  {
    id: "4",
    type: "announcement" as const,
    title: "Chapter Announcement",
    message: "Spring induction ceremony date announced!",
    time: "3 days ago",
    isRead: true,
  },
];

const iconMap = {
  submission_approved: CheckCircle2,
  submission_denied: Clock,
  meeting_reminder: Calendar,
  new_opportunity: Bell,
  announcement: Megaphone,
};

const colorMap = {
  submission_approved: "bg-green-100 text-green-600",
  submission_denied: "bg-red-100 text-red-600",
  meeting_reminder: "bg-blue-100 text-blue-600",
  new_opportunity: "bg-purple-100 text-purple-600",
  announcement: "bg-yellow-100 text-yellow-600",
};

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated on your NHS activity</p>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600">
          Mark all as read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {mockNotifications.map((notification) => {
          const Icon = iconMap[notification.type] || Bell;
          const colorClass = colorMap[notification.type] || "bg-gray-100 text-gray-600";

          const content = (
            <Card
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                !notification.isRead ? "bg-blue-50/50 border-blue-100" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          return notification.link ? (
            <Link key={notification.id} href={notification.link}>
              {content}
            </Link>
          ) : (
            <div key={notification.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
