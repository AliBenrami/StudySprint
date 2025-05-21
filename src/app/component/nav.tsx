"use client";
import { useRouter } from "next/navigation";
import { isLoggedIn, signOut, supabase } from "../util/supabase";
import { useEffect, useState } from "react";

const Nav = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setAuthenticated(await isLoggedIn());
    };
    checkAuth();
  }, []);

  return (
    <>
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div
            onClick={() => {
              router.push("/");
            }}
            className="w-8 h-8 bg-teal-500 rounded-md"
          ></div>
          <span className="text-xl font-bold">StudySprint</span>
        </div>
        <div className="space-x-4">
          {authenticated ? (
            <>
              <button
                onClick={() => {
                  router.push("/dashboard");
                }}
                className="px-4 py-2 rounded-md hover:bg-gray-800 transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  signOut();
                  setAuthenticated(false);
                  router.push("/");
                }}
                className="px-4 py-2 rounded-md hover:bg-gray-800 transition"
              >
                logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                router.push("/login");
              }}
              className="px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              Login
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Nav;
