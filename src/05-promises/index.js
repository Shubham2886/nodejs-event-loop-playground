/**
 * TOPIC: Promises
 * ───────────────
 * A Promise represents a value that will be available in the future.
 * States: pending → fulfilled | rejected
 * Promises are ALWAYS resolved asynchronously (even if synchronously resolved).
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What are Promise states?
 *  Q2. What is Promise chaining?
 *  Q3. Promise.all vs Promise.allSettled vs Promise.race vs Promise.any?
 *  Q4. How does async/await relate to Promises?
 *  Q5. What is Promise executor synchronous execution?
 */

const { promisify } = require("util");
const sleep = promisify(setTimeout);

console.log("\n=== PROMISES DEEP DIVE ===\n");

// ─── Example 1: Promise Executor runs SYNCHRONOUSLY ────────────────────────
console.log("[1] Before Promise");

const p = new Promise((resolve) => {
  console.log("[2] Inside executor — SYNC"); // runs immediately
  resolve("done");
});

p.then((val) => console.log(`[4] .then — ASYNC: ${val}`)); // scheduled as microtask

console.log("[3] After Promise\n");
// Output: [1], [2], [3], [4] — executor is sync, .then is async

// ─── Example 2: Promise Chaining ──────────────────────────────────────────
async function chainDemo() {
  await sleep(10); // let previous examples finish

  console.log("=== PROMISE CHAINING ===");
  Promise.resolve(1)
    .then((val) => {
      console.log(`Step 1: ${val}`);
      return val + 1; // passed to next .then
    })
    .then((val) => {
      console.log(`Step 2: ${val}`);
      return Promise.resolve(val + 1); // can return another Promise
    })
    .then((val) => console.log(`Step 3: ${val}`))
    .catch((err) => console.error("Error:", err))
    .finally(() => console.log("Always runs: .finally\n"));
}

// ─── Example 3: Promise Combinators ──────────────────────────────────────
async function combinatorDemo() {
  await sleep(100);

  const fast = () => new Promise((res) => setTimeout(() => res("fast"), 50));
  const slow = () => new Promise((res) => setTimeout(() => res("slow"), 150));
  const failing = () => new Promise((_, rej) => setTimeout(() => rej(new Error("failed")), 80));

  // Promise.all — ALL must resolve; rejects on first rejection
  try {
    const results = await Promise.all([fast(), slow()]);
    console.log("Promise.all:", results); // ['fast', 'slow']
  } catch (e) {
    console.log("Promise.all failed:", e.message);
  }

  // Promise.allSettled — waits for ALL; never rejects; gives status
  const settled = await Promise.allSettled([fast(), failing(), slow()]);
  console.log("Promise.allSettled:");
  settled.forEach((r) =>
    console.log(`  status: ${r.status}, ${r.value || r.reason?.message}`)
  );

  // Promise.race — first to settle (resolve OR reject) wins
  const winner = await Promise.race([fast(), slow()]).catch((e) => e.message);
  console.log("Promise.race winner:", winner); // 'fast'

  // Promise.any — first to RESOLVE wins; rejects if ALL reject
  const first = await Promise.any([failing(), fast(), slow()]).catch((e) => e.message);
  console.log("Promise.any first success:", first); // 'fast'
}

// ─── Example 4: async/await is syntactic sugar ───────────────────────────
async function asyncAwaitDemo() {
  await sleep(500);
  console.log("\n=== ASYNC/AWAIT ===");

  // This async/await code:
  async function fetchUser() {
    const user = await Promise.resolve({ id: 1, name: "Shubham" });
    return user;
  }

  // Is equivalent to this Promise chain:
  function fetchUserPromise() {
    return Promise.resolve({ id: 1, name: "Shubham" });
  }

  const u1 = await fetchUser();
  const u2 = await fetchUserPromise();
  console.log("async/await result:", u1);
  console.log("Promise chain result:", u2);
  console.log("They are equivalent! async/await is just syntactic sugar.\n");
}

chainDemo();
combinatorDemo();
asyncAwaitDemo();

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: pending → fulfilled (resolved with value) | rejected (with error)
 *     Once settled, a Promise is IMMUTABLE — state can't change.
 *
 * Q2: .then() returns a new Promise. You can chain .then().then().catch()
 *     Each .then receives the return value of the previous one.
 *
 * Q3: .all    — waits for all; fails fast on first rejection
 *     .allSettled — waits for all; never rejects; reports each status
 *     .race   — first to settle (resolve or reject) wins
 *     .any    — first to RESOLVE wins; AggregateError if all reject
 *
 * Q4: async functions always return a Promise.
 *     await pauses execution of the async function (not the whole thread)
 *     until the Promise resolves. It's syntactic sugar over .then().
 *
 * Q5: The executor function in new Promise(executor) runs SYNCHRONOUSLY.
 *     Only the .then/.catch callbacks are scheduled as microtasks.
 */
