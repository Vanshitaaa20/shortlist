"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function TopBar() {
  const { user, loading } = useAuth();

  return (
    <header className="top-bar">
      <Link className="brand" href="/">Threadline</Link>
      {!loading && (
        <Link className="nav-link" href={user ? "/board" : "/login"}>
          {user ? "Go to board" : "Sign in"}
        </Link>
      )}
    </header>
  );
}
