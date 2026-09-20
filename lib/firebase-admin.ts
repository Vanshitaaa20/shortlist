import "server-only";

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const fixedPrivateKey = parsed.private_key?.replace(/\\n/g, "\n");

    if (!parsed.project_id) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing project_id.");
    }

    return {
      ...parsed,
      private_key: fixedPrivateKey,
    };
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not valid JSON. Check the service account value in .env.local."
    );
  }
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-shortlist",
  });
}

const adminApp = getAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
}

export { adminApp, adminAuth, adminDb };
