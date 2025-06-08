"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

// Types for our data
interface StudyStats {
  totalSessions: number;
  studyTime: number;
  focusScore: number;
  streak: number;
}

interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  participants: number;
  maxParticipants: number;
  duration: number;
  startTime: string;
  status: "scheduled" | "active" | "completed";
}

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  timestamp: string;
  focusScore: number;
  roomName?: string;
  participants?: number;
  notes?: string;
  tags?: string[];
}

interface UpcomingSession {
  id: string;
  subject: string;
  scheduledTime: string;
  duration: number;
}

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Template data for when no real data is available
  const templateStats: StudyStats = {
    totalSessions: 0,
    studyTime: 0,
    focusScore: 0,
    streak: 0,
  };

  useEffect(() => {
    const handleScroll = () => {
      const statsSection = document.getElementById("stats");
      if (statsSection) {
        const statsSectionTop = statsSection.getBoundingClientRect().top;
        setIsVisible(statsSectionTop < window.innerHeight * 0.8);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600 mt-2">Track your study progress</p>
      </div>

      {/* Stats Grid */}
      <div
        id="stats"
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">
            {stats?.totalSessions ?? templateStats.totalSessions}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Start your first session!
          </p>
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Study Time</h3>
          <p className="text-2xl font-bold mt-2 text-indigo-600">
            {stats?.studyTime ?? templateStats.studyTime}h
          </p>
          <p className="text-sm text-gray-500 mt-1">Track your study hours</p>
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Focus Score</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">
            {stats?.focusScore ?? templateStats.focusScore}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Measure your focus</p>
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Streak</h3>
          <p className="text-2xl font-bold mt-2 text-purple-600">
            {stats?.streak ?? templateStats.streak} days
          </p>
          <p className="text-sm text-gray-500 mt-1">Build your streak</p>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-2">
              Start a study session to see your activity here
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/rooms">
            <Card className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Create Study Room
                  </h3>
                  <p className="text-sm text-gray-500">
                    Start a new study session
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/history">
            {" "}
            <Card className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">View History</h3>
                  <p className="text-sm text-gray-500">
                    Check your study records
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
