/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface Project {
  id: string;
  name: string;
  members: string[];
  admin: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export default function JoinProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const { projectId } = params;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const projectRef = doc(db, "projects", projectId);
  const tasksRef = collection(projectRef, "tasks");

  // Fetch project data
  useEffect(() => {
    const unsubscribeProject = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const projectData = doc.data() as Project;
        setProject({
          ...projectData,
          id: doc.id,
        });
      } else {
        router.push("/projects");
      }
      setLoading(false);
    });

    return () => unsubscribeProject();
  }, [projectRef, router]);

  // Fetch tasks data
  useEffect(() => {
    if (!projectId) return;

    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(fetchedTasks);
    });

    return () => unsubscribeTasks();
  }, [tasksRef, projectId]);

  // Fetch current user and check access
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleJoinProject = useCallback(async () => {
    if (!currentUser || !project) return;

    try {
      const updatedMembers = [...project.members, currentUser.uid];
      await updateDoc(projectRef, { members: updatedMembers });
      setProject({ ...project, members: updatedMembers });
    } catch (error) {
      console.error("Error joining project:", error);
    }
  }, [currentUser, project, projectRef]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-700">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
        <p className="mb-6">Admin: {project.admin}</p>
        <button
          onClick={handleJoinProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Join Project
        </button>
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Tasks</h2>
          {tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="p-4 bg-gray-50 rounded-md shadow">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600">{task.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No tasks available</p>
          )}
        </div>
      </div>
    </div>
  );
}
