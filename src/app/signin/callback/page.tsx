"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function SignInCallback() {
  const router = useRouter();

  useEffect(() => {
    const createUserStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No user found");
          router.push("/signin");
          return;
        }

        // Check if user stats already exist
        const { data: existingStats } = await supabase
          .from("user_stats")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!existingStats) {
          // Create new user stats
          const { error } = await supabase.from("user_stats").insert({
            id: user.id,
          });

          if (error) {
            console.error("Error creating user stats:", error);
          }
        }

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (error) {
        console.error("Error in callback:", error);
        router.push("/signin");
      }
    };

    createUserStats();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
