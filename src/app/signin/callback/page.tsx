"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Starting auth callback handling...");

        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          router.replace("/signin");
          return;
        }

        console.log("Session status:", session ? "Found" : "Not found");
        if (session) {
          console.log("Session details:", {
            access_token: session.access_token ? "Present" : "Missing",
            refresh_token: session.refresh_token ? "Present" : "Missing",
            expires_at: session.expires_at,
            user: {
              id: session.user.id,
              email: session.user.email,
              role: session.user.role,
              app_metadata: session.user.app_metadata,
              user_metadata: session.user.user_metadata,
            },
          });
        }

        if (!session) {
          // If no session, try to get the user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error("Error getting user:", userError);
            router.replace("/signin");
            return;
          }

          if (!user) {
            console.log("No user found, redirecting to signin");
            router.replace("/signin");
            return;
          }

          console.log("User found but no session. User details:", {
            id: user.id,
            email: user.email,
            role: user.role,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
          });

          console.log("Waiting for session to be set...");
          // Wait a bit for the session to be set
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Try getting session again
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();

          if (!retrySession) {
            console.log("Still no session after retry, redirecting to signin");
            router.replace("/signin");
            return;
          }

          console.log("Session found after retry. Session details:", {
            access_token: retrySession.access_token ? "Present" : "Missing",
            refresh_token: retrySession.refresh_token ? "Present" : "Missing",
            expires_at: retrySession.expires_at,
            user: {
              id: retrySession.user.id,
              email: retrySession.user.email,
              role: retrySession.user.role,
              app_metadata: retrySession.user.app_metadata,
              user_metadata: retrySession.user.user_metadata,
            },
          });
        }

        // Get the redirect URL from the search params or default to dashboard
        const redirectTo = searchParams.get("redirectedFrom") || "/dashboard";
        console.log("Redirecting to:", redirectTo);

        // Use replace to avoid adding to browser history
        router.replace(redirectTo);
      } catch (error) {
        console.error("Error in callback:", error);
        router.replace("/signin");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
