"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "invalid" | "duplicate" | "failed";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.status === 201) {
        setState("success");
      } else if (response.status === 400) {
        setState("invalid");
      } else if (response.status === 409) {
        setState("duplicate");
      } else {
        setState("failed");
      }
    } catch {
      setState("failed");
    }
  }

  if (state === "success") {
    return <p className="form-message success">You are on the list. We will be in touch.</p>;
  }

  return (
    <form className="waitlist-form" onSubmit={submit}>
      <label htmlFor="email">Your email address</label>
      <div className="form-row">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Joining..." : "Join the waitlist"}
        </button>
      </div>
      {state === "invalid" && <p className="form-message error">Enter a valid email address.</p>}
      {state === "duplicate" && <p className="form-message error">That email is already on the list.</p>}
      {state === "failed" && <p className="form-message error">Something went wrong. Please try again.</p>}
    </form>
  );
}