"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

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

interface RecentActivity {
  id: string;
  room_id: string;
  room_title: string;
  subject: string;
  created_at: string;
  participants: number;
}

interface RoomData {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

interface ParticipantData {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  sprint_rooms: {
    title: string;
  };
}

interface ParticipantWithRoom {
  id: string;
  room_id: string;
  joined_at: string;
  sprint_rooms: {
    id: string;
    title: string;
    subject: string;
    created_at: string;
  };
}

function ActivitySkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            {/* Book icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              {/* Title skeleton */}
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-[pulse_2s_ease-in-out_infinite]"></div>

              {/* Details skeleton */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-[pulse_2s_ease-in-out_infinite]"></div>
                <div className="h-4 w-1 bg-gray-200 rounded animate-[pulse_2s_ease-in-out_infinite]"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {/* Date skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24 animate-[pulse_2s_ease-in-out_infinite]"></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const router = useRouter();

  // Template data for when no real data is available
  const templateStats: StudyStats = {
    totalSessions: 0,
    studyTime: 0,
    focusScore: 0,
    streak: 0,
  };

  useEffect(() => {
    const fetchUserStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setStats(data);
      }
      setIsLoading(false);
    };

    fetchUserStats();

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

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoading(true);
        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No user found");
          setRecentActivity([]);
          setIsLoading(false);
          return;
        }

        // First get the room IDs the user has participated in
        const { data: participantData, error: participantError } =
          await supabase
            .from("sprint_participants")
            .select("room_id, joined_at")
            .eq("user_id", user.id)
            .order("joined_at", { ascending: false })
            .limit(5);

        if (participantError) {
          console.error("Error fetching participant data:", participantError);
          setRecentActivity([]);
          setIsLoading(false);
          return;
        }

        if (!participantData || participantData.length === 0) {
          setRecentActivity([]);
          setIsLoading(false);
          return;
        }

        // Then fetch the room details for these rooms
        const roomIds = participantData.map((p) => p.room_id);
        const { data: roomsData, error: roomsError } = await supabase
          .from("sprint_rooms")
          .select("*")
          .in("id", roomIds);

        if (roomsError) {
          console.error("Error fetching rooms:", roomsError);
          setRecentActivity([]);
          setIsLoading(false);
          return;
        }

        // Get participant counts for each room
        const roomsWithParticipants = await Promise.all(
          roomsData.map(async (room) => {
            const { count, error: countError } = await supabase
              .from("sprint_participants")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id)
              .eq("is_active", true);

            if (countError) {
              console.error("Error fetching participant count:", countError);
              return {
                id: room.id,
                room_id: room.id,
                room_title: room.title,
                subject: room.subject,
                created_at: room.created_at,
                participants: 0,
              };
            }

            return {
              id: room.id,
              room_id: room.id,
              room_title: room.title,
              subject: room.subject,
              created_at: room.created_at,
              participants: count || 0,
            };
          })
        );

        // Only update state and loading after all data is ready
        setRecentActivity(roomsWithParticipants);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in fetchRecentActivity:", error);
        setRecentActivity([]);
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const getActivityIcon = () => {
    return (
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
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    );
  };

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
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-1"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold mt-2 text-blue-600">
                {stats?.totalSessions ?? templateStats.totalSessions}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Start your first session!
              </p>
            </>
          )}
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Study Time</h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-1"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold mt-2 text-indigo-600">
                {stats?.studyTime ?? templateStats.studyTime}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Track your study hours
              </p>
            </>
          )}
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Focus Score</h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-1"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold mt-2 text-green-600">
                {stats?.focusScore ?? templateStats.focusScore}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Measure your focus</p>
            </>
          )}
        </Card>
        <Card className="p-6 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all">
          <h3 className="text-sm font-medium text-gray-500">Streak</h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-1"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold mt-2 text-purple-600">
                {stats?.streak ?? templateStats.streak} days
              </p>
              <p className="text-sm text-gray-500 mt-1">Build your streak</p>
            </>
          )}
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Recent Study Rooms
        </h2>
        {isLoading ? (
          <ActivitySkeleton />
        ) : recentActivity.length > 0 ? (
          <Card className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon()}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {activity.room_title}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{activity.subject}</span>
                      <span>•</span>
                      <span>
                        {activity.participants}{" "}
                        {activity.participants === 1
                          ? "participant"
                          : "participants"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">No recent study rooms</p>
              <p className="text-sm text-gray-500 mt-2">
                Join a study room to see it here
              </p>
            </div>
          </Card>
        )}
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
