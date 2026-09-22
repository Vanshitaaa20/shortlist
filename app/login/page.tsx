"use client";

import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/AuthProvider";
import TopBar from "@/components/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/board");
    }
  }, [loading, router, user]);

  async function signIn() {
    setError("");

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError("Sign-in did not work. Please try again.");
    }
  }

  return (
    <>
      <TopBar />
      <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Threadline</p>
        <h1>Sign in to your board.</h1>
        <p className="hero-copy">Keep product feedback and decisions in one practical place.</p>
        {loading ? (
          <p className="form-message">Checking your session...</p>
        ) : (
          <button type="button" onClick={signIn}>Continue with Google</button>
        )}
        {error && <p className="form-message error">{error}</p>}
      </section>
      </main>
    </>
  );
}