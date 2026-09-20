import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body === "object" && body !== null && "email" in body
    ? body.email
    : undefined;
  const validationError = validateEmail(email);

  if (validationError) {
    return Response.json({ ok: false, error: validationError }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_USE_EMULATORS !== "true" && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Waitlist is unavailable: FIREBASE_SERVICE_ACCOUNT is missing outside the emulator.");
    return Response.json({ ok: false, error: "The waitlist is temporarily unavailable." }, { status: 500 });
  }

  const normalizedEmail = (email as string).trim().toLowerCase();
  const id = createHash("sha256").update(normalizedEmail).digest("hex");

  try {
    await adminDb.collection("waitlist").doc(id).create({
      email: normalizedEmail,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 6) {
      return Response.json({ ok: false, error: "That email is already on the list." }, { status: 409 });
    }

    console.error("Waitlist write failed:", error);
    return Response.json({ ok: false, error: "The waitlist is temporarily unavailable." }, { status: 500 });
  }
}