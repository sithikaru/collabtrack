"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Firebase
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 48 48"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.94 0 6.56 1.71 8.07 3.14l5.9-5.91C34.93 3.31 29.98 1 24 1 14.28 1 6.09 6.78 2.67 14.29l6.9 5.34C11.26 13.11 17.12 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.4c0-1.54-.14-3.02-.4-4.46H24v8.42h12.7c-.52 2.27-1.75 4.28-3.54 5.61l5.6 4.35c3.28-3.01 5.74-7.49 5.74-13.92z"
      />
      <path
        fill="#FBBC05"
        d="M9.57 21.41l-6.9-5.34C.94 20.19 0 22.96 0 26c0 3.07.94 5.84 2.67 8.37l6.9-5.34C8.76 27.4 8.5 26.21 8.5 26c0-.21.26-1.4 1.07-4.59z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.91-2.05 15.88-5.58l-5.6-4.35c-2.43 1.66-5.61 2.63-10.28 2.63-6.88 0-12.74-3.61-15.25-8.85l-6.9 5.34C6.09 41.22 14.28 47 24 47z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M12 .297c-6.63 0-12 5.373-12 12
         0 5.302 3.438 9.8 8.205 11.387.6 
         .113.82-.258.82-.577 0-.285-.01-1.04
         -.015-2.04-3.338.725-4.042-1.613
         -4.042-1.613-.546-1.387-1.333-1.757
         -1.333-1.757-1.09-.744.083-.729
         .083-.729 1.205.084 1.838 1.235
         1.838 1.235 1.07 1.835 2.807
         1.304 3.492.997.107-.776.417
         -1.305.757-1.605-2.665-.305-5.466
         -1.332-5.466-5.93 0-1.31.47-2.38
         1.235-3.22-.135-.303-.54-1.523
         .105-3.176 0 0 1.005-.322 3.3
         1.23a11.5 11.5 0 013.003-.403
         c1.018.004 2.041.138 3.003.403
         2.28-1.552 3.285-1.23 3.285-1.23
         .645 1.653.24 2.873.12 3.176
         .765.84 1.235 1.91 1.235 3.22
         0 4.61-2.805 5.625-5.475
         5.92.43.36.81 1.096.81 2.21
         0 1.6-.015 2.88-.015 3.28
         0 .315.21.69.825.57A11.998
         11.998 0 0024 12.297c0-6.627
         -5.373-12-12-12z"
      />
    </svg>
  );
}

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

      router.push("/projects");
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
            <div className="space-y-4">
              <button
                onClick={async () => {
                  await signInWithPopup(auth, new GoogleAuthProvider());
                  router.push("/projects");
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white p-3 rounded"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <button
                onClick={async () => {
                  await signInWithPopup(auth, new GithubAuthProvider());
                  router.push("/projects");
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white p-3 rounded"
              >
                <GithubIcon /> Continue with GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
