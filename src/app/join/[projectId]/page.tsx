"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

interface PageProps {
  params: { projectId: string };
}

export default function JoinProject({ params }: PageProps) {
  const router = useRouter();
  const projectId = params.projectId;

  useEffect(() => {
    const joinProject = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/signin?redirect=/join/${projectId}`);
        return;
      }

      try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
          members: arrayUnion(user.uid),
          invitations: arrayRemove(user.email),
        });
        router.push(`/projects/${projectId}`);
      } catch (error) {
        console.error("Error joining project:", error);
        router.push("/");
      }
    };

    joinProject();
  }, [projectId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Joining project...</p>
    </div>
  );
}
