/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";

interface Project {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt?: any; // Firestore Timestamp
}

export default function ProjectsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // "Create Project" Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If not logged in, redirect to sign in
        router.push("/signin");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch the user's projects in real-time
  useEffect(() => {
    if (!currentUser) return;

    // We assume 'createdBy' or 'members array' helps us filter the user’s projects
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("members", "array-contains", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Project[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Project);
      });
      setProjects(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Handle Create Project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError("Please enter a project name.");
      return;
    }
    setError("");
    try {
      // Add a doc to "projects"
      const projectsRef = collection(db, "projects");
      const docRef = await addDoc(projectsRef, {
        name: newProjectName.trim(),
        createdBy: currentUser?.uid,
        members: [currentUser?.uid], // user is automatically a member
        createdAt: serverTimestamp(),
      });

      setNewProjectName("");
      setIsModalOpen(false);

      // Redirect to the newly created project's tasks page
      router.push(`/projects/${docRef.id}`);
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message || "Could not create project. Try again.");
    }
  };

  // Render
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <p className="text-gray-600">Loading your projects...</p>
      </div>
    );
  }

  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 w-full p-5 bg-white shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">CollabTrack Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Create Project
        </button>
      </div>

      <div className="pt-20 p-4">
        {projects.length === 0 ? (
          <p className="text-gray-700">No projects found. Create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-4 rounded-md shadow cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <h2 className="text-lg font-bold text-gray-800">
                  {project.name}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Members: {project.members.length}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto w-full max-w-md rounded bg-white p-6 shadow">
                <Dialog.Title className="text-lg font-bold">
                  Create New Project
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  {error && (
                    <div className="rounded-md bg-red-100 p-3 text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Project Name
                    </label>
                    <input
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Marketing Launch"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}
