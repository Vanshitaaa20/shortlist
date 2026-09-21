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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function loadIdeas() {
      setLoading(true);
      setError(false);

      try {
        const snapshot = await getDocs(query(collection(db, "ideas"), orderBy("createdAt", "desc")));
        setIdeas(snapshot.docs.map((idea) => ({ id: idea.id, ...idea.data() } as Idea)));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadIdeas();
  }, [refreshKey, retryKey]);

  return (
    <section className="idea-list">
      <h2>Ideas</h2>
      {loading && <p>Loading ideas...</p>}
      {error && (
        <div className="form-message error">
          <p>Could not load ideas.</p>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button>
        </div>
      )}
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
      {!loading && !error && ideas.length === 0 && <p>No ideas yet. Be the first to post one.</p>}
    </section>
  );
}