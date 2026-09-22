# Shortlist

A small web app with two surfaces:

- **Landing page (Threadline)** — a public page describing an invented product, with an email waitlist. Signups are validated and written server-side; the browser never writes to Firestore directly.
- **Board** — a signed-in space where users post feature ideas, upvote each idea once, and delete their own ideas.

Built for the Siempi take-home assignment.

**Live site:** https://shortlist-vanshita.vercel.app

## Stack

- Next.js (App Router) + TypeScript
- Firebase Authentication (Google sign-in) + Cloud Firestore
- Deployed on Vercel (Hobby)
- Plain CSS (no component library), `next/font` for typography

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

For **local development**, fill in `.env.local` like this:

```
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-shortlist.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-shortlist
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-shortlist.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
NEXT_PUBLIC_USE_EMULATORS=true
```

These placeholder values work fine because the app talks to the local Firebase emulators, not a real project. `FIREBASE_SERVICE_ACCOUNT` is **not needed locally** — the Admin SDK talks to the emulator without credentials when `NEXT_PUBLIC_USE_EMULATORS=true`.

### 3. Install Java (required for the Firestore emulator)

The Firestore emulator runs on the JVM. Check with:

```bash
java -version
```

If it's missing, install a JDK (Temurin 21 works) and restart your terminal.

### 4. Start the emulators

```bash
npx firebase emulators:start --only auth,firestore --project demo-shortlist
```

Leave this running. The Emulator UI is at `http://127.0.0.1:4000`.

### 5. Start the app (in a second terminal)

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

| Variable | Public or secret | Used in | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | `lib/firebase-client.ts` | From Firebase console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | `lib/firebase-client.ts` | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | `lib/firebase-client.ts`, `lib/firebase-admin.ts` | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | `lib/firebase-client.ts` | Same as above (unused by the app itself; part of the standard config) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | `lib/firebase-client.ts` | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | `lib/firebase-client.ts` | Same as above |
| `NEXT_PUBLIC_USE_EMULATORS` | Public | `lib/firebase-client.ts`, `lib/firebase-admin.ts`, `app/api/waitlist/route.ts` | Set to `true` locally only. Leave unset on Vercel. |
| `FIREBASE_SERVICE_ACCOUNT` | **Secret, server-only** | `lib/firebase-admin.ts`, `app/api/waitlist/route.ts` | The service account JSON (Project settings → Service accounts → Generate new private key), as a single-line string. Required in production, not needed with emulators. Never committed. |

`NEXT_PUBLIC_*` values are inlined into the browser bundle at build time — that's expected and fine, since they're not secret. `FIREBASE_SERVICE_ACCOUNT` has no `NEXT_PUBLIC_` prefix on purpose and is only ever read on the server.

## Firestore rules

Rules are in `firestore.rules` and are deployed separately from the app:

```bash
npx firebase deploy --only firestore --project siempi-assignment-vanshita
```

They enforce, among other things:

- The `waitlist` collection is fully denied to clients (reads and writes) — only the server route can touch it.
- An idea can only be created by its own author, with bounded field lengths and a server-generated timestamp.
- An idea can only be deleted by its own author.
- A vote is a paired write (a `votes/{uid}` document plus a `+1` on the idea's `voteCount`), enforced atomically so neither write is valid without the other — this is what stops a user from voting twice or forging the count, even by calling Firestore directly from the browser console.

## Deploying

1. Push to GitHub and import the repo into Vercel.
2. Set the environment variables above in Vercel (Production). Do **not** set `NEXT_PUBLIC_USE_EMULATORS` there.
3. Deploy.
4. In the Firebase console, under Authentication → Settings → Authorized domains, add the Vercel **production** domain (e.g. `shortlist-vanshita.vercel.app` — not a per-deployment URL with a random hash in it). Google sign-in will fail until this is done.

## Notes

- No part of the app depends on a specific account. Sign up with any Google account to use the board.
- See `NOTES.md` for what was new, where things got stuck, what was cut, and what's known to be fragile.