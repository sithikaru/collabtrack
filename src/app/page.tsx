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
      // If user is logged in, set isLoggedIn = true
      setIsLoggedIn(!!user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/tasks");
    } else {
      router.push("/signup");
    }
  };
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Nav / Brand */}
      <div className="fixed top-0 left-0 w-full p-5">
        <h1 className="text-2xl font-bold md:text-4xl">CollabTrack</h1>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-20 px-4 h-screen text-center">
        <h1 className="text-5xl font-extrabold text-primary md:text-7xl">
          Welcome to CollabTrack
        </h1>
        <p className="mt-4 text-xl font-light text-secondary md:text-2xl">
          Where teams collaborate, assign tasks, and achieve more—together.
        </p>

        <button
          onClick={handleGetStarted}
          className="mt-8 rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700 transition duration-200"
        >
          Let&apos;s Get Started
        </button>
      </div>
    </main>
  );
}
