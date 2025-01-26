"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Check email verification status
        if (user.emailVerified) {
          router.push("/projects");
        } else {
          router.push("/email-verification");
        }
      } else {
        setIsLoggedIn(false);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGetStarted = () => {
    router.push(isLoggedIn ? "/projects" : "/signup");
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Nav / Brand */}
      <nav className="fixed top-0 left-0 w-full p-5 bg-white shadow-sm">
        <h1 className="text-2xl font-bold md:text-4xl text-primary">CollabTrack</h1>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-32 px-4 h-screen text-center">
        <h1 className="text-5xl font-extrabold text-primary md:text-7xl mb-6">
          Streamline Your Team&apos;s Workflow
        </h1>
        <p className="mt-4 text-xl font-light text-secondary md:text-2xl max-w-3xl">
          Collaborate in real-time, manage tasks efficiently, and keep projects on track
          with your team.
        </p>

        <button
          onClick={handleGetStarted}
          className="mt-8 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          {isLoggedIn ? "Continue to Dashboard" : "Start Free Today"}
        </button>

        {!isLoggedIn && (
          <p className="mt-4 text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/signin")}
              className="text-blue-600 hover:underline"
            >
              Sign in here
            </button>
          </p>
        )}
      </div>
    </main>
  );
}