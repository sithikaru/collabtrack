"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Popup from "@/app/components/Popup";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const validateInputs = () => {
    if (!email) {
      setErrorMessage("Email is required.");
      setShowPopup(true);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email.");
      setShowPopup(true);
      return false;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      setShowPopup(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Sign-in successful!");
    } catch (error) {
      setErrorMessage("Invalid email or password.");
      setShowPopup(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#23272a]">
      <div className="mb-4">
        <p className="text-white font-black text-7xl">Collab Track</p>
      </div>
      <div className="p-8 bg-[#2c2f33] rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-white">Welcome back!</h1>
        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 rounded-lg border border-gray-700 bg-[#23272a] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="p-3 rounded-lg border border-gray-700 bg-[#23272a] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Sign In
          </button>
        </form>

        <p className="text-gray-400 mt-4">Don&apos;t have an account?{" "}<a href="/signup" className="text-blue-500 hover:underline">Sign up</a></p>
      </div>

      {showPopup && (
        <Popup
          message={errorMessage}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
