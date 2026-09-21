"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import IdeaCard, { Idea } from "@/components/IdeaCard";

type Props = {
  currentUserId: string;
  refreshKey: number;
};

export default function IdeaList({ currentUserId, refreshKey }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    async function loadIdeas() {
      const snapshot = await getDocs(query(collection(db, "ideas"), orderBy("createdAt", "desc")));
      setIdeas(snapshot.docs.map((idea) => ({ id: idea.id, ...idea.data() } as Idea)));
    }

    loadIdeas().catch(() => setIdeas([]));
  }, [refreshKey]);

  return (
    <section className="idea-list">
      <h2>Ideas</h2>
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          currentUserId={currentUserId}
          onDeleted={() => setIdeas((current) => current.filter((item) => item.id !== idea.id))}
          onVoted={() => setIdeas((current) => current.map((item) => item.id === idea.id
            ? { ...item, voteCount: item.voteCount + 1 }
            : item))}
        />
      ))}
      {ideas.length === 0 && <p>No ideas yet. Be the first to post one.</p>}
    </section>
  );
}