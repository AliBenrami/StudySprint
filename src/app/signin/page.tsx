"use client";

import { useState } from "react";
import Nav from "../components/Nav";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const checkIfUserExists = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
    } else {
      console.log(data);
      router.push("/signin/callback");
    }
  };

  const handleSignIn = async () => {
    checkIfUserExists();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error(error);
    } else {
      console.log(data);
    }
    router.push("/signin/callback");
  };
  const googleSignIn = async () => {
    checkIfUserExists();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/signin/callback`,
      },
    });
    if (error) {
      console.error(error);
    } else {
      router.push(data.url!);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Here you would typically handle the authentication
      // For now, we'll just redirect to home
      handleSignIn();
      window.location.href = "/";
      setIsLoading(false);
    }, 1500);
  };

  return (
    <main className="flex min-h-screen flex-col items-center">
      <Nav page="/signin"></Nav>

      {/* Sign In Content */}
      <div className="flex flex-col md:flex-row w-full flex-1">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 py-12 bg-white">
          <div className="max-w-md w-full">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Sign in to continue your learning journey
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 text-black">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember_me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={googleSignIn}
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.4L20.0303 3C17.9502 1.14 15.2353 0 12.0003 0C7.31028 0 3.25527 2.68 1.28027 6.6L5.27028 9.61C6.23528 6.79 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.39C5.02498 13.64 4.88998 12.84 4.88998 12C4.88998 11.16 5.01998 10.36 5.26498 9.61L1.27498 6.6C0.45498 8.25 0.00498 10.07 0.00498 12C0.00498 13.93 0.45498 15.75 1.27498 17.4L5.26498 14.39Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0002 24C15.2402 24 17.9602 22.935 19.9452 21.095L16.0802 18.095C15.0452 18.82 13.6852 19.241 12.0002 19.241C8.87018 19.241 6.23018 17.201 5.26518 14.386L1.27518 17.395C3.25018 21.315 7.31018 24 12.0002 24Z"
                      fill="#34A853"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12C2 16.991 5.657 21.128 10.438 21.878V14.891H7.898V12H10.438V9.797C10.438 7.291 11.93 5.907 14.215 5.907C15.309 5.907 16.453 6.102 16.453 6.102V8.562H15.193C13.95 8.562 13.563 9.333 13.563 10.124V12H16.336L15.893 14.89H13.563V21.878C18.343 21.128 22 16.991 22 12Z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up for free
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wMiIgc3Ryb2tlLXdpZHRoPSIuNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjkuNSIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="absolute top-40 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div
            className="absolute top-20 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
            style={{ animationDelay: "2s" }}
          ></div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12">
            <div className="p-8 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm shadow-lg max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Focus Better Together
              </h3>
              <p className="text-gray-700 mb-4">
                Join StudySprint and connect with fellow learners. Our
                Pomodoro-style study rooms help you stay focused and
                accountable.
              </p>
              <div className="flex items-center space-x-2 mt-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-xs font-bold">
                    JD
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-600 text-xs font-bold">
                    MK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 text-xs font-bold">
                    AS
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  +1 users online now
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
