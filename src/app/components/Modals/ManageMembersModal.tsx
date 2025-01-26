/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  collection,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types";

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  members: string[];
  invitations: string[];
}

export default function ManageMembersModal({ 
  projectId,
  isOpen,
  onClose,
  members,
  invitations
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Check if user exists in system
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      const projectRef = doc(db, "projects", projectId);

      if (snapshot.empty) {
        // Add to invitations for unregistered users
        await updateDoc(projectRef, {
          invitations: arrayUnion(email.toLowerCase())
        });
        // Trigger email invitation (requires cloud function)
      } else {
        // Add user ID to members for registered users
        const userId = snapshot.docs[0].id;
        await updateDoc(projectRef, {
          members: arrayUnion(userId)
        });
      }

      setEmail("");
    } catch (err) {
      setError("Failed to process invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, isMember: boolean) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        [isMember ? "members" : "invitations"]: arrayRemove(id)
      });
    } catch (err) {
      setError("Failed to remove");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Manage Team Members
                </Dialog.Title>

                <div className="mt-4">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full p-2 border rounded-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Current Members</h4>
                  {members.map((memberId) => (
                    <MemberItem 
                      key={memberId}
                      id={memberId}
                      onRemove={() => handleRemove(memberId, true)}
                      isMember
                    />
                  ))}

                  <h4 className="font-medium mt-4 mb-2">Pending Invitations</h4>
                  {invitations.map((email) => (
                    <MemberItem
                      key={email}
                      id={email}
                      onRemove={() => handleRemove(email, false)}
                      isMember={false}
                    />
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleInvite}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

const MemberItem = ({ id, onRemove, isMember }: { 
  id: string; 
  onRemove: () => void;
  isMember: boolean;
}) => (
  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
    <span className="text-sm">
      {id}
      {!isMember && <span className="ml-2 text-gray-500 text-xs">(pending)</span>}
    </span>
    <button
      onClick={onRemove}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      Remove
    </button>
  </div>
);