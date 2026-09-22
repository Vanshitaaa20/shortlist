# NOTES.md

## What was new to me and how I learned it

I will not lie about this. I do have some experience with Next.js and Firebase already. I built a full stack product before where the frontend, including the dashboard and the landing page, was built in Next.js, so I already understood how routing works and how the App Router is structured. I also have Firebase experience from my previous internship at Little Big Things, where one of the clients stored their data in Firebase and their backend logic was written as Google Cloud Functions. So I already knew how Firebase stores data and how you connect it to your code.

But there were real differences this time. During the internship the Firebase setup was already built for me, I was just working on top of it. This time I built the whole thing from scratch myself, the project, the data model, the Firestore structure, all of it.

Firestore security rules were the part that was genuinely new to me. I had never written them before. I read through the official documentation and then tested every rule directly in the Firestore emulator before trusting it. For the voting feature I had to learn how `existsAfter()` and `getAfter()` work, since a single vote needs two writes to happen together, a new document in a votes subcollection and a plus one on the idea count, and the rule has to check both sides at once or someone could fake a vote. I also had to learn that Firestore rules check `request.time` against the value written by `serverTimestamp()` specifically. A normal JavaScript date, even one created at the exact same moment, does not match, and I ran into this directly while writing my own rules tests, where two tests that should have passed were failing because I had used `new Date()` instead of the server timestamp.

I also had not used the Firebase Emulator Suite before this project. I learned that it needs Java to run at all, and I lost some time early on because Java was not installed on my machine.

## How I used AI

I used an AI coding agent inside VS Code to build most of this project, working milestone by milestone, reviewing every file before approving the next step. I directed it with a written brief and reviewed the diffs myself rather than accepting everything blindly.

It got a lot right. It correctly enforced the vote rule with a paired create and update, it wrote a working waitlist route with proper duplicate handling, and it built out the loading and error states cleanly once I asked for them.

It also got things wrong, and I caught these myself.

First, in an early milestone it reported the setup as complete before it had actually run the required test. It had not started the Firestore emulator or verified that an Admin write and a client read reached the same document. I asked it to show me the real command output instead of just claiming it worked, and only then did it become clear the step had not been finished.

Second, it told me that Google sign in could not work locally through the Firebase Auth emulator, and it built a temporary workaround using an email and password test account instead. I did not accept that at face value. I set up the emulators properly myself and tested the Google sign in popup directly, and it worked fine locally. The agent had simply been wrong about a limitation that did not actually exist.

Third, when I asked it to verify that a Firestore read failure produced the correct error message on screen, it tried to test this by stopping the Firestore emulator. That did not work the way it expected, because Firestore has an offline cache and it returned an empty result instead of an error, so the app just showed the normal empty state instead of the failure state. I asked it to instead test the error path a different way, by pointing the read at a collection the security rules deny, which reliably triggered the real error branch in the UI.

There was also a small but memorable mistake on my side while testing. I manually added a fake extra field to test whether the create rule rejects unexpected fields, and my editor auto imported a Node testing utility into a client side form component that had nothing to do with tests. It caused a lint warning and had to be removed before it could ship.

## Where I got stuck

I got stuck a few times, mostly on environment and deployment issues rather than the core logic.

The biggest deployment issue was that the waitlist signup worked perfectly on my machine but returned a 500 error once deployed on Vercel. It took checking the actual runtime logs on Vercel, not just the browser, to find the real error, which was `ERR_REQUIRE_ESM`, caused by an unused import of the Firebase Admin Auth module pulling in a dependency chain that was not compatible with the Node version Vercel uses. My local machine was running a newer, non standard version of Node that happened to tolerate it, which is why I never saw the problem locally. Removing that one unused import fixed it completely.

## What I cut, and why

I kept the assignment intentionally simple rather than over engineering it, since the instructions do not reward polish or extra complexity, and I need to be able to explain every part of this code on the call.

I did not add a validation library, I wrote plain validation functions instead, since the checks needed were simple enough that a library would only add a dependency for very little benefit.

I did not add CI, a honeypot field, or a rate limiter on the waitlist form. The in memory rate limiter idea in particular would not even be reliable on a serverless platform like Vercel, since each request can land on a different instance with no shared memory, so I decided it was not worth building.

I chose the votes subcollection model for voting instead of storing an array of voter ids directly on the idea document. The array would have been simpler to reason about, but it does not scale as well and every signed in user would be able to see everyone else's vote history on every idea. The subcollection design costs one extra read per idea to check if the current user has voted, but it keeps vote data properly private and avoids the array size limits.

## What I know is wrong or fragile

The redirect on the board page that sends signed out users to the login page is only a frontend convenience. It runs in the browser and can be bypassed. The actual protection is entirely in the Firestore security rules, and I made sure to test that directly by calling Firestore from the browser console as a signed in user and confirming it could not do anything it should not be allowed to do.

When an idea is deleted, its votes subcollection is not deleted along with it, since a client is not able to delete a subcollection directly. It becomes orphaned data. It is harmless for this assignment's scale but it is not clean.

The `authorName` field stored on an idea is not verified against the user's actual account name by the security rules, only its length is checked. Someone could technically post an idea with a different display name attached. Ownership itself is still fully protected through `authorId`, which is checked properly, so this does not create a security hole, just a small display inconsistency.

Checking whether the current user has voted on an idea costs one extra Firestore read per idea shown on the board. For the scale of this assignment that is fine, but it would not scale cleanly to a board with thousands of ideas.

The overall UI overflow fix on mobile relies on `overflow-x: hidden` on the page body rather than fixing the actual element that was causing the extra width. It works, but it is treating the symptom rather than the root cause.

## What I would do with another week

The assignment's optional list includes an admin account that can mark ideas as planned or shipped, and a test around the vote logic. I did not get to either of these, and they would be my first additions.

For the admin account, I would add a simple admin role, checked in the security rules, that can mark an idea as planned or shipped without being able to edit its title or body, which is exactly what the assignment describes as the natural next step.

For the vote logic, I already wrote automated Firestore rules tests, but a test around the actual UI vote logic, the button state and the count update in IdeaCard, is still missing, and I would add that next.

Beyond the assignment's own optional list, I would also rework how vote status is checked. Right now every idea card does its own read to check if the current user already voted, which does not scale well. A better approach would be to keep a small, capped list of voted idea ids on the user's own profile document, so the whole board only needs one extra read instead of one per idea.

I would move the waitlist rate limiting off in memory state, since that does not survive across serverless instances, and instead track attempts in Firestore itself with a short lived document per email or IP, cleaned up automatically.

I would clean up the orphaned votes subcollection problem properly, most likely with a small server action that deletes an idea's votes when the idea itself is deleted, since the client cannot delete a subcollection directly.

I would add a second sign in method, email and password, alongside Google, so the app does not depend on a single provider.