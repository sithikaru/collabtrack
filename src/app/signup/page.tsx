"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";

export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!name || !email || !password || !confirmPwd) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPwd) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // 1) Create user with email & password
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) Update displayName if needed
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: name });
      }
      // 3) Send verification email
      //    We can call .sendEmailVerification on userCred.user, or rely on automatic email verification
      //    if "Email Templates" are configured for "When user signs up" in your Firebase Auth settings.
      //    But typically you'd do:
      await sendEmailVerification(userCred.user);

      // 4) Redirect to verification page
      // 4) Redirect to verification page
      router.push("/verify-email");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign-up error:", err);
      setError(err.message || "Failed to create account. Please try again.");
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
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold text-primary text-center md:text-6xl">
            Join the<br />Collaboration!
          </h1>
          <p className="mt-2 text-center text-xl font-light text-secondary">
            Create your account and
            <br />
            let’s build great things together.
          </p>
        </div>

        {/* Right Column: Sign Up Form */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white px-6 py-8 shadow md:px-12 md:py-12 rounded-md">
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Display error if any */}
              {error && (
                <div className="rounded-md bg-red-100 p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="mb-1 block text-sm font-medium text-gray-700"
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  // Simple Tailwind spinner
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
                ) : (
                  "Sign up"
                )}
              </button>

              {/* Sign In Prompt */}
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-blue-500 hover:text-blue-600"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
