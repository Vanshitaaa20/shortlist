"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { validateIdea } from "@/lib/validation";

type Props = {
  authorId: string;
  authorName: string;
  onCreated: () => void;
};

export default function IdeaForm({ authorId, authorName, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateIdea(title, body);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      await addDoc(collection(db, "ideas"), {
        title: title.trim(),
        body: body.trim(),
        authorId,
        authorName: authorName.slice(0, 80),
        createdAt: serverTimestamp(),
        voteCount: 0,
      });
      setTitle("");
      setBody("");
      setMessage("");
      onCreated();
    } catch {
      setMessage("Could not create the idea.");
    }
  }

  return (
    <form className="idea-form" onSubmit={submit}>
      <h2>Share an idea</h2>
      <label htmlFor="idea-title">Title</label>
      <input id="idea-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} />
      <label htmlFor="idea-body">What would it help with?</label>
      <textarea id="idea-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={4} />
      <button type="submit">Post idea</button>
      {message && <p className="form-message error">{message}</p>}
    </form>
  );
}