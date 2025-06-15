"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { Card } from "@/app/components/ui/card";
import { use } from "react";

interface StudyRoom {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  current_task: string;
  reflection: string;
  is_active: boolean;
  joined_at: string;
}

interface StudySession {
  id: string;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  duration_minutes: number;
}

interface SessionPayload {
  id: string;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  duration_minutes: number;
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 w-3/4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="h-5 w-24 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function StudyRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(
    null
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState("");
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [sessionDuration, setSessionDuration] = useState<number>(25);
  const [isOwner, setIsOwner] = useState(false);
  const updateTaskTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from("sprint_sessions")
        .update({ is_active: false })
        .eq("id", currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setTimeRemaining(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }, [currentSession]);

  // Timer effect
  useEffect(() => {
    if (currentSession && currentSession.is_active) {
      const endTime = new Date(currentSession.ended_at!).getTime();
      const now = Date.now();
      const initialRemaining = Math.max(0, endTime - now);

      if (initialRemaining === 0) {
        endSession();
        return;
      }

      setTimeRemaining(initialRemaining);

      const interval = setInterval(() => {
        const currentTime = Date.now();
        const remaining = Math.max(0, endTime - currentTime);

        if (remaining === 0) {
          endSession();
          clearInterval(interval);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentSession, endSession]);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        // Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from("sprint_rooms")
          .select("*")
          .eq("id", id)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        // Check if current user is the owner
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          setIsOwner(currentUser.id === roomData.created_by);
        }

        // Fetch active participants
        const { data: participantsData, error: participantsError } =
          await supabase
            .from("sprint_participants")
            .select(
              `
              id,
              user_id,
              current_task,
              reflection,
              is_active,
              joined_at
            `
            )
            .eq("room_id", id)
            .eq("is_active", true)
            .order("joined_at", { ascending: false });

        if (participantsError) throw participantsError;

        // Filter out duplicate user_ids, keeping only the most recent entry
        const uniqueParticipants = participantsData.reduce((acc, current) => {
          const existingParticipant = acc.find(
            (p) => p.user_id === current.user_id
          );
          if (!existingParticipant) {
            acc.push(current);
          }
          return acc;
        }, [] as Participant[]);

        setParticipants(uniqueParticipants);

        // Join the room if not already a participant
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !uniqueParticipants.some((p) => p.user_id === user.id)) {
          const { data: newParticipant, error: joinError } = await supabase
            .from("sprint_participants")
            .insert({
              room_id: id,
              user_id: user.id,
              current_task: "",
              reflection: "",
              is_active: true,
            })
            .select()
            .single();

          if (joinError) throw joinError;

          // Add the new participant to the list
          if (newParticipant) {
            setParticipants((prev) => [newParticipant, ...prev]);
          }
        }

        // Fetch current session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sprint_sessions")
          .select("*")
          .eq("room_id", id)
          .eq("is_active", true)
          .single();

        if (!sessionError && sessionData) {
          setCurrentSession(sessionData);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
        router.push("/dashboard/rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();

    // Set up real-time subscription for participants
    const participantsSubscription = supabase
      .channel("room_participants")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "sprint_participants",
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          // If a participant becomes inactive, remove them immediately
          if (payload.eventType === "UPDATE" && !payload.new.is_active) {
            setParticipants((prev) =>
              prev.filter((p) => p.user_id !== payload.new.user_id)
            );
            return;
          }

          // For other changes, fetch the updated participants list
          const { data: participantsData, error: participantsError } =
            await supabase
              .from("sprint_participants")
              .select(
                `
              id,
              user_id,
              current_task,
              reflection,
              is_active,
              joined_at
            `
              )
              .eq("room_id", id)
              .eq("is_active", true)
              .order("joined_at", { ascending: false });

          if (!participantsError && participantsData) {
            // Filter out duplicate user_ids, keeping only the most recent entry
            const uniqueParticipants = participantsData.reduce(
              (acc, current) => {
                const existingParticipant = acc.find(
                  (p) => p.user_id === current.user_id
                );
                if (!existingParticipant) {
                  acc.push(current);
                }
                return acc;
              },
              [] as Participant[]
            );

            setParticipants(uniqueParticipants);
          }
        }
      )
      .subscribe();

    // Cleanup function that runs when component unmounts
    return () => {
      // Unsubscribe from real-time updates
      participantsSubscription.unsubscribe();

      // Clear any pending task updates
      if (updateTaskTimeoutRef.current) {
        clearTimeout(updateTaskTimeoutRef.current);
      }

      // Leave the room
      const leaveRoom = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          // Update participant status to inactive
          const { error } = await supabase
            .from("sprint_participants")
            .update({ is_active: false })
            .eq("room_id", id)
            .eq("user_id", user.id);

          if (error) throw error;
        } catch (error) {
          console.error("Error leaving room:", error);
        }
      };

      // Execute leave room
      leaveRoom();
    };
  }, [id, router]);

  const startSession = async () => {
    try {
      // Check for existing active session
      const { data: existingSession, error: checkError } = await supabase
        .from("sprint_sessions")
        .select("*")
        .eq("room_id", id)
        .eq("is_active", true)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingSession) {
        console.log("Using existing session:", existingSession);
        setCurrentSession(existingSession as StudySession);
        return;
      }

      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + sessionDuration * 60 * 1000
      );

      // Create new session if none exists
      const { data, error } = await supabase
        .from("sprint_sessions")
        .insert({
          room_id: id,
          started_at: startTime.toISOString(),
          ended_at: endTime.toISOString(),
          duration_minutes: sessionDuration,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Session was not created correctly");
      }

      console.log("New session created:", data);
      setCurrentSession(data);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const updateCurrentTask = async (task: string) => {
    setCurrentTask(task); // Update local state immediately for responsive UI

    // Clear any existing timeout
    if (updateTaskTimeoutRef.current) {
      clearTimeout(updateTaskTimeoutRef.current);
    }

    // Set a new timeout to debounce the database update
    updateTaskTimeoutRef.current = setTimeout(async () => {
      try {
        setIsUpdatingTask(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("sprint_participants")
          .update({ current_task: task })
          .eq("room_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating task:", error);
      } finally {
        setIsUpdatingTask(false);
      }
    }, 500); // Wait 500ms after the user stops typing before updating the database
  };

  useEffect(() => {
    const channel = supabase
      .channel("session_changes")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "sprint_sessions",
          filter: `room_id=eq.${id}`,
        },
        (payload: { new: SessionPayload }) => {
          console.log("Session update received:", payload.new);
          if (payload.new.room_id === id) {
            if (!payload.new.is_active) {
              // Session was disabled
              setCurrentSession(null);
              setTimeRemaining(0);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            } else {
              // New active session
              setCurrentSession(payload.new as StudySession);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Room not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/rooms")}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Rooms
        </button>
        <h1 className="text-4xl font-bold text-gray-900">{room.title}</h1>
        <p className="text-gray-600 mt-2">
          Created {new Date(room.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Study Session Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Study Session
                </h2>
                <p className="text-gray-600">
                  {currentSession
                    ? "Session in progress"
                    : isOwner
                    ? "Start a new session"
                    : "Waiting for session to start"}
                </p>
              </div>
              {isOwner &&
                (currentSession ? (
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                    onClick={endSession}
                  >
                    End Session
                  </button>
                ) : (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    onClick={startSession}
                  >
                    Start Session
                  </button>
                ))}
            </div>

            {!currentSession && isOwner && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-4">
                  <label
                    htmlFor="duration"
                    className="text-sm font-medium text-gray-700"
                  >
                    Session Duration:
                  </label>
                  <select
                    id="duration"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={25}>25 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>
            )}

            {currentSession && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Session Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Started</p>
                    <p className="text-gray-900">
                      {new Date(currentSession.started_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Remaining</p>
                    <p className="text-gray-900 font-mono text-xl">
                      {formatTime(timeRemaining)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Participants Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Participants ({participants.length})
          </h2>
          <div className="space-y-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-gray-900">
                    User {participant.user_id.slice(0, 8)}
                  </p>
                  {participant.current_task && (
                    <p className="text-sm text-gray-600">
                      Task: {participant.current_task}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Joined {new Date(participant.joined_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Current Task Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Task{" "}
            {isUpdatingTask && (
              <span className="text-sm text-gray-500">(Saving...)</span>
            )}
          </h2>
          <div className="space-y-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="What are you working on?"
              value={currentTask}
              onChange={(e) => updateCurrentTask(e.target.value)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
