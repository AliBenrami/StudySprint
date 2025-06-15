"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, getUserId } from "@/app/lib/supabaseClient";

interface StudyRoom {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  participants: number;
}

interface RoomParticipantPayload {
  id: string;
  room_id: string;
  user_id: string;
  is_active: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="p-4 sm:p-6 animate-pulse">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div>
              <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-5 sm:h-6 w-14 sm:w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 sm:h-4 w-16 sm:w-20 bg-gray-200 rounded"></div>
              <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded"></div>
              <div className="h-3 sm:h-4 w-16 sm:w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-9 sm:h-10 w-full bg-gray-200 rounded-lg mt-3 sm:mt-4"></div>
        </Card>
      ))}
    </div>
  );
}

export default function StudyRoomsPage() {
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      if (id) {
        setCurrentUserId(id);
      }
    };
    fetchUserId();
  }, []);

  const disableRoom = async (roomId: string) => {
    try {
      // First, set all participants to inactive
      const { error: participantsError } = await supabase
        .from("sprint_participants")
        .update({ is_active: false })
        .eq("room_id", roomId);

      if (participantsError) {
        console.error("Error updating participants:", participantsError);
        return;
      }

      // Then disable the room
      const { error: roomError } = await supabase
        .from("sprint_rooms")
        .update({ is_active: false })
        .eq("id", roomId);

      if (roomError) {
        console.error("Error disabling room:", roomError);
        return;
      }

      // Immediately remove the room from the local state
      setStudyRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Error disabling room:", error);
    }
  };

  useEffect(() => {
    const fetchStudyRooms = async () => {
      try {
        // Get current user ID
        const userId = await getUserId();
        if (!userId) return;

        // Fetch active rooms
        const { data: rooms, error: roomsError } = await supabase
          .from("sprint_rooms")
          .select("*")
          .eq("is_active", true);

        if (roomsError) {
          console.error("Error fetching rooms:", roomsError);
          return;
        }

        // For each room, get the count of active participants
        const roomsWithParticipants = await Promise.all(
          rooms.map(async (room) => {
            const { count, error: countError } = await supabase
              .from("sprint_participants")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id)
              .eq("is_active", true);

            if (countError) {
              console.error("Error fetching participant count:", countError);
              return { ...room, participants: 0 };
            }

            return { ...room, participants: count || 0 };
          })
        );

        setStudyRooms(roomsWithParticipants);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyRooms();

    // Set up real-time subscriptions
    const roomSubscription = supabase
      .channel("rooms_changes")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "sprint_rooms",
        },
        async (payload) => {
          // Handle room updates
          if (payload.eventType === "UPDATE" && !payload.new.is_active) {
            // Immediately remove disabled room from the list
            setStudyRooms((prev) =>
              prev.filter((room) => room.id !== payload.new.id)
            );
            // Redirect to rooms page if user is in the disabled room
            if (window.location.pathname.includes(payload.new.id)) {
              router.push("/dashboard/rooms");
            }
          } else {
            // For other changes, refetch the rooms
            fetchStudyRooms();
          }
        }
      )
      .subscribe();

    const channel = supabase
      .channel("participant_changes")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "sprint_participants",
        },
        async (payload: { new: RoomParticipantPayload }) => {
          if (payload.new) {
            // If the current user is kicked out (set to inactive), redirect to rooms page
            if (
              !payload.new.is_active &&
              payload.new.user_id === currentUserId
            ) {
              router.push("/dashboard/rooms");
            }
            // Refetch rooms to get updated participant counts
            fetchStudyRooms();
          }
        }
      )
      .subscribe();

    return () => {
      roomSubscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Study Rooms
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Create and join study sessions
        </p>
      </div>

      {/* Create Room Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/rooms/create")}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
        >
          Create Room
        </button>
      </div>

      {/* Active Study Rooms */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {studyRooms.length > 0 ? (
            studyRooms.map((room) => (
              <Card
                key={room.id}
                className="p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                        {room.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {new Date(room.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 px-2 sm:px-3 py-1 rounded-full ml-2">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600"
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
                      <span className="text-xs sm:text-sm font-medium text-blue-600">
                        {room.participants}{" "}
                        {room.participants === 1
                          ? "participant"
                          : "participants"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                    {currentUserId === room.created_by && room.is_active && (
                      <button
                        onClick={() => disableRoom(room.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        Disable
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/rooms/${room.id}`)}
                      disabled={!room.is_active}
                      className={`w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${
                        room.is_active
                          ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      {room.is_active ? "Join Room" : "Room Disabled"}
                    </button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-4 sm:p-6">
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
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
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No Study Rooms Yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Create your first study room to start collaborating with
                    others
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/rooms/create")}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
                  >
                    Create Your First Room
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">
          Quick Tips
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/dashboard/rooms/create">
            <Card className="p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">
                    Set a Duration
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Choose a study session length that works for you and your
                    group
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/invite">
            <Card className="p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
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
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">
                    Invite Friends
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Study together by inviting friends to your study room
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/focus">
            <Card className="p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
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
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">
                    Stay Focused
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
