/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Dialog, Transition } from "@headlessui/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const STATUS_COLUMNS = ["todo", "in-progress", "done"];
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "todo": { label: "To Do", color: "bg-yellow-200" },
  "in-progress": { label: "In Progress", color: "bg-blue-200" },
  "done": { label: "Done", color: "bg-green-200" },
};

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string[];
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function ProjectTasksPage() {
  const router = useRouter();
  const { projectId } = useParams();

  // Check projectId is valid
  if (!projectId || Array.isArray(projectId)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <p className="text-gray-700">Invalid or missing projectId. Please check the URL.</p>
      </div>
    );
  }

  const projectRef = doc(db, "projects", projectId);
  const tasksRef = collection(projectRef, "tasks");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Add task modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Inline edit
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Real-time tasks
  useEffect(() => {
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        fetchedTasks.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Task);
      });
      setTasks(fetchedTasks);
    });
    return () => unsubscribe();
  }, [tasksRef]);

  // Check user auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/signin");
      }
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [router]);

  // Create Task
  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    await addDoc(tasksRef, {
      title: newTitle,
      description: newDescription,
      status: "todo",
      assignedTo: [currentUser?.uid],
      createdBy: currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNewTitle("");
    setNewDescription("");
    setIsAddModalOpen(false);
  };

  // Inline Edit
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  };

  const saveEditingTask = async (taskId: string) => {
    const taskDoc = doc(projectRef, "tasks", taskId);
    await updateDoc(taskDoc, {
      title: editingTitle,
      description: editingDescription,
      updatedAt: serverTimestamp(),
    });
    setEditingTaskId(null);
  };

  // Delete Task
  const confirmDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskDoc = doc(projectRef, "tasks", taskToDelete.id);
    await deleteDoc(taskDoc);
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  // Drag & Drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    // find the dragged task
    const draggedTask = tasks
      .filter((t) => t.status === source.droppableId)
      [source.index];
    if (!draggedTask) return;
    const newStatus = destination.droppableId;
    if (draggedTask.status !== newStatus) {
      const taskDoc = doc(projectRef, "tasks", draggedTask.id);
      await updateDoc(taskDoc, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const lower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(lower) ||
      task.description.toLowerCase().includes(lower)
    );
  });
  const tasksByStatus: Record<string, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };
  filteredTasks.forEach((task) => {
    if (STATUS_COLUMNS.includes(task.status)) {
      tasksByStatus[task.status].push(task);
    }
  });

  // Render
  return (
    <main className="bg-bg min-h-screen w-full">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 w-full p-5 flex items-center justify-between bg-white shadow">
        <h1 className="text-2xl font-bold md:text-4xl text-primary">
          CollabTrack - Kanban
        </h1>
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search tasks..."
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Task
        </button>
      </div>

      {/* Kanban Content */}
      <div className="pt-20 p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUS_COLUMNS.map((statusKey) => {
              const colTasks = tasksByStatus[statusKey] || [];
              const { label, color } = STATUS_LABELS[statusKey];
              return (
                <Droppable droppableId={statusKey} key={statusKey}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-white rounded-md shadow p-4 min-h-[500px]"
                    >
                      <h2
                        className={`text-lg font-bold mb-2 ${color} inline-block px-2 py-1 rounded-md`}
                      >
                        {label} ({colTasks.length})
                      </h2>

                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-gray-100 rounded-md p-3 mb-3"
                            >
                              {editingTaskId === task.id ? (
                                <div className="space-y-2">
                                  <input
                                    className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                  />
                                  <textarea
                                    className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                    value={editingDescription}
                                    onChange={(e) => setEditingDescription(e.target.value)}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => saveEditingTask(task.id)}
                                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTaskId(null)}
                                      className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="font-semibold text-gray-800">{task.title}</h3>
                                  <p className="text-sm text-gray-600 whitespace-pre-line">
                                    {task.description}
                                  </p>
                                  <div className="mt-2 flex justify-end space-x-2">
                                    <button
                                      onClick={() => startEditing(task)}
                                      className="text-sm text-blue-500 hover:text-blue-600"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteTask(task)}
                                      className="text-sm text-red-500 hover:text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* ADD TASK MODAL */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddModalOpen(false)}>
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
                  Add New Task
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                      placeholder="Enter task title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                      placeholder="Enter task description..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* DELETE CONFIRMATION MODAL */}
      <Transition appear show={deleteConfirmOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteConfirmOpen(false)}
        >
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
                  Confirm Deletion
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-gray-700">
                    Are you sure you want to delete this task? This action
                    cannot be undone.
                  </p>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Delete
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
