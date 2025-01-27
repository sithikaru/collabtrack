"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

interface PageProps {
  params: {
    projectId: string;
  };
}

export default function JoinProject({ params }: PageProps) {
  const router = useRouter();

  useEffect(() => {
    const joinProject = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push(`/signin?redirect=/join/${params.projectId}`);
        return;
      }

      try {
        const projectRef = doc(db, "projects", params.projectId);
        await updateDoc(projectRef, {
          members: arrayUnion(user.uid),
          invitations: arrayRemove(user.email),
        });
        router.push(`/projects/${params.projectId}`);
      } catch (error) {
        console.error("Error joining project:", error);
        router.push("/");
      }
    };

    joinProject();
  }, [params.projectId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Joining project...</p>
    </div>
  );
}
