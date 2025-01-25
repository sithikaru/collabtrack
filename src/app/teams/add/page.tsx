"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CreateTeam() {
    const [teamName, setTeamName] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) {
            setError("Team name is required");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            setError("You must be logged in to create a team.");
            return;
        }

        try {
            const teamRef = doc(collection(db, "teams"));
            const teamId = teamRef.id;
            await setDoc(teamRef, {
                name: teamName,
                privacy,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                members: [
                    {
                        userId: user.uid,
                        role: "admin",
                    },
                ],
            });

            const userRef = doc(db, "users", user.uid);
            await setDoc(
                userRef,
                {
                    teams: [{ teamId, role: "admin" }],
                },
                { merge: true }
            );

            alert("Team created successfully!");
        } catch {
            setError("Could not create team. Please try again.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 bg-[#23272a]">
            <div className="w-full max-w-md bg-[#2c2f33] p-8 rounded shadow space-y-6 ">
                <h1 className="text-2xl font-bold text-white">Create a New Team</h1>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team Name"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <select
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        Create Team
                    </button>
                </form>
            </div>
        </div>
    );
}
