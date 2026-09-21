"use client";

import { useEffect, useState } from "react";
import { deleteDoc, doc, getDoc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export type Idea = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  voteCount: number;
};

type Props = {
  idea: Idea;
  currentUserId: string;
  onDeleted: () => void;
  onVoted: () => void;
};

export default function IdeaCard({ idea, currentUserId, onDeleted, onVoted }: Props) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "ideas", idea.id, "votes", currentUserId))
      .then((snapshot) => setHasVoted(snapshot.exists()))
      .catch(() => setHasVoted(false));
  }, [currentUserId, idea.id]);

  async function remove() {
    try {
      await deleteDoc(doc(db, "ideas", idea.id));
      onDeleted();
    } catch {
      // Firestore rules decide whether this delete is allowed.
    }
  }

  async function vote() {
    setVoting(true);
    const batch = writeBatch(db);
    const ideaReference = doc(db, "ideas", idea.id);
    const voteReference = doc(db, "ideas", idea.id, "votes", currentUserId);

    batch.set(voteReference, { createdAt: serverTimestamp() });
    batch.update(ideaReference, { voteCount: increment(1) });

    try {
      await batch.commit();
      setHasVoted(true);
      onVoted();
    } catch {
      // The rules reject duplicate or incomplete votes.
    } finally {
      setVoting(false);
    }
  }

  return (
    <article className="idea-card">
      <div>
        <h3>{idea.title}</h3>
        <p>{idea.body}</p>
        <p className="idea-meta">By {idea.authorName} · {idea.voteCount} votes</p>
      </div>
      <div className="idea-actions">
        <button type="button" onClick={vote} disabled={hasVoted || voting}>
          {hasVoted ? "Voted" : voting ? "Voting..." : "Upvote"}
        </button>
        {idea.authorId === currentUserId && (
          <button className="delete-button" type="button" onClick={remove}>Delete</button>
        )}
      </div>
    </article>
  );
}