"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/card";

interface StudySession {
  id: string;
  subject: string;
  roomName: string;
  participants: number;
  duration: number;
  timestamp: string;
  focusScore: number;
  notes?: string;
  tags?: string[];
}

export default function StudyHistoryPage() {
  const [studyHistory, setStudyHistory] = useState<StudySession[]>([]);
  const [filters, setFilters] = useState({
    subject: "",
    startDate: "",
    endDate: "",
    minFocusScore: 0,
  });
  const [sortBy, setSortBy] = useState<"date" | "duration" | "focusScore">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getFilteredHistory = () => {
    return studyHistory
      .filter((session) => {
        const matchesSubject = filters.subject
          ? session.subject
              .toLowerCase()
              .includes(filters.subject.toLowerCase())
          : true;
        const matchesDate =
          (!filters.startDate ||
            new Date(session.timestamp) >= new Date(filters.startDate)) &&
          (!filters.endDate ||
            new Date(session.timestamp) <= new Date(filters.endDate));
        const matchesFocusScore = session.focusScore >= filters.minFocusScore;
        return matchesSubject && matchesDate && matchesFocusScore;
      })
      .sort((a, b) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;
        switch (sortBy) {
          case "date":
            return (
              multiplier *
              (new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime())
            );
          case "duration":
            return multiplier * (a.duration - b.duration);
          case "focusScore":
            return multiplier * (a.focusScore - b.focusScore);
          default:
            return 0;
        }
      });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Study History</h1>
        <p className="text-gray-600 mt-2">
          Track your study progress over time
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Focus Score
            </label>
            <input
              type="number"
              value={filters.minFocusScore}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minFocusScore: parseInt(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
          </div>
        </div>
      </Card>

      {/* Sort Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "duration" | "focusScore")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="duration">Sort by Duration</option>
            <option value="focusScore">Sort by Focus Score</option>
          </select>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
          </button>
        </div>
      </div>

      {/* Study History List */}
      <div className="space-y-4">
        {studyHistory.length > 0 ? (
          getFilteredHistory().map((session) => (
            <Card key={session.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {session.subject}
                  </h3>
                  <p className="text-sm text-gray-500">{session.roomName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.duration} minutes
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {session.participants} participants
                    </span>
                  </div>
                  {session.tags && (
                    <div className="flex space-x-2">
                      {session.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.focusScore >= 80
                      ? "bg-green-100 text-green-800"
                      : session.focusScore >= 60
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {session.focusScore}% Focus
                </div>
              </div>
              {session.notes && (
                <p className="mt-4 text-sm text-gray-600">{session.notes}</p>
              )}
            </Card>
          ))
        ) : (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Study History Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Your study sessions will appear here once you complete them
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard/rooms")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Start a Study Session
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Study Tips */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Track Your Progress
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Monitor your study habits and focus scores to improve over
                  time
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Set Goals</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Use your history to set realistic study goals and track your
                  progress
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Stay Consistent</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Regular study sessions help build better learning habits
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
