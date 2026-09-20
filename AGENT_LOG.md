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
