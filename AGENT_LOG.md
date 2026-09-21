# AGENT_LOG

## M0
- Scaffolded the Next.js + TypeScript + Tailwind app in the lowercase `shortlist` directory.
- Added the initial Firebase emulator and env placeholders with the project ID `demo-shortlist`.
- No secret material has been added or committed.
- The app is intentionally left at a minimal setup state pending review.

## M1
- Chose Threadline as the product concept, with a practical tone.
- Used plain validation functions instead of adding a schema library, keeping the waitlist route readable line by line.
- The waitlist document ID is the SHA-256 hash of the trimmed, lowercased email, so duplicate submissions return `409` without exposing email addresses in the URL.
- The route returns a safe `500` and logs a clear server-side message when Admin credentials are missing outside the emulator.

## M2
- The board guard is client-side: it redirects signed-out users to `/login`; Firestore rules remain the real data protection boundary.
- Google sign-in uses `signInWithPopup` and the Auth emulator connection from the shared Firebase client.
- The Auth emulator cannot complete an external Google identity in this local environment, so the popup was verified to reach the expected error state; the shared provider, board session, and sign-out flow were verified with one temporary emulator account.

## M3
- Used `getDocs` plus a refetch key after creating an idea; deletes update the local list directly, so there is no realtime listener to clean up.
- Voting is intentionally not included until M4.

## M4
- Used a Firestore batch containing the vote document create and the idea count increment; the rules require the two writes to appear together with `existsAfter()` and `getAfter()`.
- Each idea card performs one vote-document lookup for the current user. This is simple and explicit, but at scale the per-card reads would need reconsideration.
- Users can vote on their own ideas; there is no unvote or editing. Deleting an idea leaves its vote subcollection orphaned, which is harmless because clients cannot delete vote documents.

## Tier 2, step 1
- Added local loading and error state to the ideas list, posting state to the idea form, and request state/error messages to idea cards.
- Kept retry behavior as a direct refetch using `getDocs`; no listener, library, or abstraction was added.
