/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState, useEffect, Fragment, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Dialog, Transition } from "@headlessui/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import ManageMembersModal from "../../components/Modals/ManageMembersModal";
import router from "next/router";

interface Project {
  id: string;
  name: string;
  members: string[];
  invitations: string[];
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

const STATUS_COLUMNS = ["todo", "in-progress", "done"];
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-yellow-200" },
  "in-progress": { label: "In Progress", color: "bg-blue-200" },
  done: { label: "Done", color: "bg-green-200" },
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push("/signin");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export default function ProjectTasksPage() {
  const router = useRouter();
  const { projectId } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});

  // Validate projectId
  if (!projectId || Array.isArray(projectId)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <p className="text-gray-700">Invalid project ID</p>
      </div>
    );
  }

  const projectRef = doc(db, "projects", projectId);
  const tasksRef = collection(projectRef, "tasks");

  // Real-time project data
  useEffect(() => {
    const unsubscribeProject = onSnapshot(projectRef, async (doc) => {
      if (doc.exists()) {
        const projectData = doc.data() as Project;
        setProject({
          ...projectData,
          id: doc.id,
        });

        // Fetch member details
        if (projectData.members.length > 0) {
          const usersSnapshot = await getDocs(
            query(collection(db, "users"), where("uid", "in", projectData.members))
          );
          const usersData: Record<string, User> = {};
          usersSnapshot.forEach((userDoc) => {
            const user = userDoc.data() as User;
            usersData[user.uid] = user;
          });
          setUsers(usersData);
        }
      }
    });
    return () => unsubscribeProject();
  }, [projectId]);

  // Real-time tasks
  useEffect(() => {
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(fetchedTasks);
    });
    return () => unsubscribeTasks();
  }, [projectId]);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/signin");
      } else if (project && !project.members.includes(user.uid)) {
        router.push("/projects");
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router, project]);

  const handleCreateTask = useCallback(async () => {
    if (!newTitle.trim() || !currentUser?.uid) return;

    try {
      await addDoc(tasksRef, {
        title: newTitle,
        description: newDescription,
        status: "todo",
        assignedTo: [currentUser.uid],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewDescription("");
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }, [newTitle, newDescription, currentUser]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !currentUser) return;

      const task = tasks.find((t) => t.id === result.draggableId);
      if (!task) return;

      const newStatus = result.destination.droppableId;
      if (task.status !== newStatus) {
        try {
          await updateDoc(doc(tasksRef, task.id), {
            status: newStatus,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error updating task status:", error);
        }
      }
    },
    [tasks, currentUser]
  );

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.assignedTo.some((uid) =>
        users[uid]?.email?.toLowerCase().includes(searchLower)
      )
    );
  });

  const tasksByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = filteredTasks.filter((task) => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const startEditing = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  }, []);

  const saveEditingTask = useCallback(
    async (taskId: string) => {
      if (!editingTitle.trim()) return;

      try {
        await updateDoc(doc(tasksRef, taskId), {
          title: editingTitle,
          description: editingDescription,
          updatedAt: serverTimestamp(),
        });
        setEditingTaskId(null);
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },
    [editingTitle, editingDescription]
  );

  const confirmDeleteTask = useCallback((task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;

    try {
      await deleteDoc(doc(tasksRef, taskToDelete.id));
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [taskToDelete]);

  if (!project || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Navigation */}
      <div className="fixed top-0 w-full p-4 bg-white shadow-lg flex items-center justify-between z-10">
  <div className="flex items-center space-x-4">
    <h1 className="text-2xl font-bold">{project.name}</h1>
    <button
      onClick={() => setIsMembersModalOpen(true)}
      className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
    >
      Manage Team ({project.members.length})
    </button>
  </div>

  <div className="flex items-center space-x-4">
    <input
      type="text"
      placeholder="Search tasks..."
      className="px-4 py-2 border rounded-md w-64"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button
      onClick={() => setIsAddModalOpen(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      + New Task
    </button>
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Log Out
    </button>
  </div>
</div>

      {/* Kanban Board */}
      <div className="pt-20 p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATUS_COLUMNS.map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-50 rounded-lg p-4 shadow-sm"
                  >
                    <div
                      className={`${STATUS_LABELS[status].color} px-4 py-2 rounded-t-lg`}
                    >
                      <h3 className="font-bold">
                        {STATUS_LABELS[status].label} ({tasksByStatus[status].length})
                      </h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      {tasksByStatus[status].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-shadow"
                            >
                              {editingTaskId === task.id ? (
                                <div className="space-y-4">
                                  <input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full p-2 border rounded"
                                  />
                                  <textarea
                                    value={editingDescription}
                                    onChange={(e) => setEditingDescription(e.target.value)}
                                    className="w-full p-2 border rounded h-32"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => setEditingTaskId(null)}
                                      className="px-4 py-2 bg-gray-200 rounded"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => saveEditingTask(task.id)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="font-semibold text-lg">{task.title}</h3>
                                  <p className="text-gray-600 mt-2 whitespace-pre-line">
                                    {task.description}
                                  </p>
                                  <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {task.assignedTo.map((uid) => (
                                        <span
                                          key={uid}
                                          className="text-sm bg-gray-100 px-2 py-1 rounded"
                                        >
                                          {users[uid]?.email || "Unknown"}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => startEditing(task)}
                                        className="text-blue-500 hover:text-blue-600"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => confirmDeleteTask(task)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <ManageMembersModal
        projectId={projectId}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={project.members}
        invitations={project.invitations || []}
      />

      {/* Add Task Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsAddModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Create New Task
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                    onClick={handleCreateTask}
                  >
                    Create Task
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={deleteConfirmOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Delete Task
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this task? This action cannot be
                    undone.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                    onClick={handleDeleteTask}
                  >
                    Delete Task
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