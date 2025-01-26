"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Firebase
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

export default function SignIn() {
  const router = useRouter();

  // Local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation and sign-in
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true); // Show loader
      await signInWithEmailAndPassword(auth, email, password);

      // after signInWithEmailAndPassword(auth, email, password);
      const currentUser = auth.currentUser;

      // If user is not verified, sign them out and show an error
      if (currentUser && !currentUser.emailVerified) {
        await signOut(auth);
        setError("Please verify your email address before signing in.");
        return;
      }

      router.push("/tasks");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password logic
  const handleForgotPassword = async () => {
    setError("");
    if (!email) {
      setError("Please provide your email address to reset password.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setError(
        "Password reset link has been sent to your email address. Please check your inbox."
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(
        "Error sending password reset email. Double-check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Nav / Brand */}
      <div className="fixed top-0 left-0 w-full p-5">
        <h1 className="text-2xl font-bold md:text-4xl">CollabTrak</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row pt-20 h-screen w-full">
        {/* Left Column: Hero Heading */}
        <div className="flex flex-1 flex-col items-center justify-center p-4 h-fit mt-auto mb-auto">
          <h1 className="text-4xl font-bold text-center text-primary md:text-6xl">
            Welcome Back, Collaborator!
          </h1>
          <p className="mt-2 text-center text-xl font-light text-secondary">
            Sign in to continue your journey and
            <br />
            keep those tasks on track.
          </p>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white px-6 py-8 shadow md:px-12 md:py-12 rounded-md">
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Show error or status message if any */}
              {error && (
                <div className="rounded-md bg-red-100 p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-secondary"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-500 hover:text-blue-600"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button with Loader */}
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    {/* Tailwind Spinner */}
                    <svg
                      className="mr-2 h-5 w-5 animate-spin text-white"
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
                        d="M4 12a8 8 0 018-8v4l2 2-2 2V4a8 8 0 000 16v-4l2-2-2-2v4a8 8 0 01-8-8z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              {/* Sign Up Prompt */}
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-blue-500 hover:text-blue-600"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
