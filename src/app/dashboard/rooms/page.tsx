"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  participants: number;
  maxParticipants: number;
  duration: number;
  startTime: string;
  status: "active" | "scheduled" | "completed";
}

export default function StudyRoomsPage() {
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
  const router = useRouter();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Study Rooms</h1>
        <p className="text-gray-600 mt-2">Create and join study sessions</p>
      </div>

      {/* Create Room Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/rooms/create")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create Room
        </button>
      </div>

      {/* Active Study Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyRooms.length > 0 ? (
          studyRooms.map((room) => (
            <Card
              key={room.id}
              className="p-6 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-500">{room.subject}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === "active"
                      ? "bg-green-100 text-green-800"
                      : room.status === "scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-gray-900">{room.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Participants</span>
                  <span className="text-gray-900">
                    {room.participants}/{room.maxParticipants}
                  </span>
                </div>
              </div>
              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Join Room
              </button>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Study Rooms Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first study room to start collaborating with
                  others
                </p>
                <button
                  onClick={() => router.push("/dashboard/rooms/create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Your First Room
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/rooms/create">
            <Card className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
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
                  <h3 className="font-medium text-gray-900">Set a Duration</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose a study session length that works for you and your
                    group
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/invite">
            <Card className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Invite Friends</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Study together by inviting friends to your study room
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/focus">
            <Card className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Stay Focused</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Use the focus timer to maintain productivity during sessions
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
