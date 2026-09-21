"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/AuthProvider";
import IdeaForm from "@/components/IdeaForm";
import IdeaList from "@/components/IdeaList";

export default function BoardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <main className="auth-page"><p>Loading your board...</p></main>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="board-page">
      <section className="board-header">
        <p className="eyebrow">Threadline board</p>
        <h1>Welcome, {user.displayName || user.email}.</h1>
        <button type="button" onClick={() => signOut(auth)}>Sign out</button>
      </section>
      <IdeaForm
        authorId={user.uid}
        authorName={user.displayName || user.email || "Anonymous"}
        onCreated={() => setRefreshKey((value) => value + 1)}
      />
      <IdeaList currentUserId={user.uid} refreshKey={refreshKey} />
    </main>
  );
}