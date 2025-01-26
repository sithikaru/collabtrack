"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmail() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeSinceCheck, setTimeSinceCheck] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        // If the user is verified, route them to main app
        router.push("/tasks");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Optionally poll the user's emailVerified status
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceCheck((prev) => prev + 1);
      // Reload user to check if they've verified
      if (user) {
        user
          .reload()
          .then(() => {
            if (user.emailVerified) {
              router.push("/tasks");
            }
          })
          .catch((err) => console.error("Error reloading user:", err));
      }
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);
  }, [user, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-md p-6 shadow">
        <h1 className="text-xl font-bold mb-4 text-center">
          Verify Your Email
        </h1>
        <p className="text-center text-gray-700">
          We&apos;ve sent a verification link to your email. Please check your
          inbox and click that link to continue.
        </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          Once you verify, this page will automatically refresh and log you in.
        </p>

        {message && (
          <div className="mt-4 rounded bg-blue-100 p-3 text-blue-700">
            {message}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-md bg-red-500 py-2 text-white hover:bg-red-600"
        >
          Cancel / Logout
        </button>
      </div>
    </main>
  );
}
