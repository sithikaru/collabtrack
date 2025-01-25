"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase"; // Import auth to get the current user
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AddTask() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Validate inputs
  const validateInputs = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return false;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return false;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    try {
      const user = auth.currentUser; // Get the current logged-in user
      if (!user) {
        setError("User not authenticated. Please log in.");
        return;
      }

      await addDoc(collection(db, "tasks"), {
        title,
        description,
        priority,
        dueDate: new Date(dueDate), // Convert string to Date
        createdAt: serverTimestamp(),
        status: "pending", // Default status
        createdBy: user.uid, // Use the user's actual UID
        assignedTo: [], // Optional array of assignees
      });

      alert("Task added successfully!");
      router.push("/tasks"); // Navigate to the task list
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add the task. Try again.");
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Add a New Task</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 rounded">
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleAddTask}
        className="flex flex-col space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full"
      >
        {/* Title */}
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Description */}
        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* Due Date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Add Task
        </button>
      </form>
    </div>
  );
}
