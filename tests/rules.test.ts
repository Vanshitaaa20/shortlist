import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-shortlist",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const USER_A = "user-a-uid";
const USER_B = "user-b-uid";

function ctx(uid: string | null) {
  return uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();
}

describe("ideas: create", () => {
  it("allows a valid idea create", async () => {
    const db = ctx(USER_A).firestore();
    await assertSucceeds(
      db.collection("ideas").add({
        title: "Better onboarding",
        body: "Make the first run smoother.",
        authorId: USER_A,
        authorName: "User A",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        voteCount: 0,
      })
    );
  });

  it("denies create with someone else's authorId", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "Spoofed",
        body: "Not really mine.",
        authorId: USER_B,
        authorName: "User A",
        createdAt: new Date(),
        voteCount: 0,
      })
    );
  });

  it("denies create with a non-zero voteCount", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "Fake votes",
        body: "Starts ahead.",
        authorId: USER_A,
        authorName: "User A",
        createdAt: new Date(),
        voteCount: 5,
      })
    );
  });

  it("denies create with an extra field", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "Extra field",
        body: "Has something extra.",
        authorId: USER_A,
        authorName: "User A",
        createdAt: new Date(),
        voteCount: 0,
        sneaky: true,
      })
    );
  });

  it("denies a title longer than 100 characters", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "x".repeat(101),
        body: "Body.",
        authorId: USER_A,
        authorName: "User A",
        createdAt: new Date(),
        voteCount: 0,
      })
    );
  });

  it("denies a fake createdAt", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "Fake time",
        body: "Body.",
        authorId: USER_A,
        authorName: "User A",
        createdAt: new Date("2000-01-01"),
        voteCount: 0,
      })
    );
  });

  it("denies signed-out create", async () => {
    const db = ctx(null).firestore();
    await assertFails(
      db.collection("ideas").add({
        title: "No auth",
        body: "Body.",
        authorId: USER_A,
        authorName: "Nobody",
        createdAt: new Date(),
        voteCount: 0,
      })
    );
  });
});

describe("ideas: read", () => {
  it("denies signed-out reads", async () => {
    const db = ctx(null).firestore();
    await assertFails(db.collection("ideas").get());
  });

  it("allows signed-in reads", async () => {
    const db = ctx(USER_A).firestore();
    await assertSucceeds(db.collection("ideas").get());
  });
});

describe("ideas: delete", () => {
  async function seedIdea() {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx
        .firestore()
        .collection("ideas")
        .doc("idea-1")
        .set({
          title: "Seed idea",
          body: "Body.",
          authorId: USER_A,
          authorName: "User A",
          createdAt: new Date(),
          voteCount: 0,
        });
    });
  }

  it("lets the author delete their own idea", async () => {
    await seedIdea();
    const db = ctx(USER_A).firestore();
    await assertSucceeds(db.collection("ideas").doc("idea-1").delete());
  });

  it("denies another user deleting the idea", async () => {
    await seedIdea();
    const db = ctx(USER_B).firestore();
    await assertFails(db.collection("ideas").doc("idea-1").delete());
  });
});

describe("ideas: edit is blocked, only voteCount +1 is allowed", () => {
  async function seedIdea() {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx
        .firestore()
        .collection("ideas")
        .doc("idea-1")
        .set({
          title: "Seed idea",
          body: "Body.",
          authorId: USER_A,
          authorName: "User A",
          createdAt: new Date(),
          voteCount: 0,
        });
    });
  }

  it("denies editing the title", async () => {
    await seedIdea();
    const db = ctx(USER_A).firestore();
    await assertFails(db.collection("ideas").doc("idea-1").update({ title: "Changed" }));
  });

  it("denies voteCount jumping by 2", async () => {
    await seedIdea();
    const db = ctx(USER_A).firestore();
    await assertFails(db.collection("ideas").doc("idea-1").update({ voteCount: 2 }));
  });
});

describe("votes: the paired batch", () => {
  async function seedIdea() {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx
        .firestore()
        .collection("ideas")
        .doc("idea-1")
        .set({
          title: "Seed idea",
          body: "Body.",
          authorId: USER_A,
          authorName: "User A",
          createdAt: new Date(),
          voteCount: 0,
        });
    });
  }

  it("allows a valid vote: create vote doc + voteCount +1 together", async () => {
    await seedIdea();
    const db = ctx(USER_B).firestore();
    const batch = db.batch();
    batch.set(db.collection("ideas").doc("idea-1").collection("votes").doc(USER_B), {
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(db.collection("ideas").doc("idea-1"), { voteCount: 1 });
    await assertSucceeds(batch.commit());
  });

  it("denies a second vote by the same user", async () => {
    await seedIdea();
    // seed an existing vote directly
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx
        .firestore()
        .collection("ideas")
        .doc("idea-1")
        .collection("votes")
        .doc(USER_B)
        .set({ createdAt: new Date() });
      await adminCtx.firestore().collection("ideas").doc("idea-1").update({ voteCount: 1 });
    });

    const db = ctx(USER_B).firestore();
    const batch = db.batch();
    batch.set(db.collection("ideas").doc("idea-1").collection("votes").doc(USER_B), {
      createdAt: new Date(),
    });
    batch.update(db.collection("ideas").doc("idea-1"), { voteCount: 2 });
    await assertFails(batch.commit());
  });

  it("denies creating a vote doc without incrementing voteCount", async () => {
    await seedIdea();
    const db = ctx(USER_B).firestore();
    await assertFails(
      db.collection("ideas").doc("idea-1").collection("votes").doc(USER_B).set({
        createdAt: new Date(),
      })
    );
  });

  it("denies incrementing voteCount without a vote doc", async () => {
    await seedIdea();
    const db = ctx(USER_B).firestore();
    await assertFails(db.collection("ideas").doc("idea-1").update({ voteCount: 1 }));
  });

  it("denies a vote doc under another user's uid", async () => {
    await seedIdea();
    const db = ctx(USER_B).firestore();
    const batch = db.batch();
    batch.set(db.collection("ideas").doc("idea-1").collection("votes").doc(USER_A), {
      createdAt: new Date(),
    });
    batch.update(db.collection("ideas").doc("idea-1"), { voteCount: 1 });
    await assertFails(batch.commit());
  });

  it("denies reading another user's vote doc", async () => {
    await seedIdea();
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx
        .firestore()
        .collection("ideas")
        .doc("idea-1")
        .collection("votes")
        .doc(USER_A)
        .set({ createdAt: new Date() });
    });
    const db = ctx(USER_B).firestore();
    await assertFails(
      db.collection("ideas").doc("idea-1").collection("votes").doc(USER_A).get()
    );
  });

  it("denies listing votes", async () => {
    await seedIdea();
    const db = ctx(USER_A).firestore();
    await assertFails(db.collection("ideas").doc("idea-1").collection("votes").get());
  });
});

describe("waitlist", () => {
  it("denies client read", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(db.collection("waitlist").get());
  });

  it("denies client write", async () => {
    const db = ctx(USER_A).firestore();
    await assertFails(db.collection("waitlist").doc("someone@example.com").set({ email: "someone@example.com" }));
  });
});