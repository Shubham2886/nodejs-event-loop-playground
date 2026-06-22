/**
 * TOPIC: Microtask Queue
 * ──────────────────────
 * Microtasks run AFTER the current synchronous code finishes
 * but BEFORE the event loop moves to the next phase.
 *
 * Microtask sources (in priority order):
 *   1. process.nextTick callbacks (Node.js specific)
 *   2. Promise callbacks (.then / .catch / .finally)
 *   3. queueMicrotask() callbacks
 *
 * KEY RULE: ALL microtasks drain before the next event loop phase.
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is the microtask queue?
 *  Q2. What is the difference between process.nextTick and Promise?
 *  Q3. Can microtasks starve the event loop?
 *  Q4. What is queueMicrotask()?
 */

console.log("\n=== MICROTASK QUEUE DEMO ===\n");

// ─── Example 1: Priority Order ─────────────────────────────────────────────
console.log("[1] Sync start");

Promise.resolve().then(() => console.log("[4] Promise.then — microtask queue"));

process.nextTick(() => console.log("[2] nextTick — nextTick queue (runs FIRST)"));

queueMicrotask(() => console.log("[3] queueMicrotask — same priority as Promise.then"));

setTimeout(() => console.log("[5] setTimeout — macrotask (runs LAST)"), 0);

console.log("[1] Sync end\n");

// ─── Example 2: Microtask Starvation ───────────────────────────────────────
// If you keep adding nextTick or Promises recursively,
// the event loop never moves forward → STARVATION

// Uncomment to see starvation (never exits):
// function starvingNextTick() {
//   process.nextTick(starvingNextTick); // infinite nextTick loop
// }
// starvingNextTick();
// setTimeout(() => console.log("This will NEVER run"), 0);

// ─── Example 3: Nested Promises ────────────────────────────────────────────
setTimeout(() => {
  console.log("\n=== NESTED PROMISE EXAMPLE ===");

  Promise.resolve()
    .then(() => {
      console.log("[A] First .then");
      // Returning a promise schedules its resolution as another microtask
      return Promise.resolve("nested");
    })
    .then((val) => console.log(`[B] Second .then — received: "${val}"`))
    .then(() => console.log("[C] Third .then"));

  process.nextTick(() => console.log("[X] nextTick inside setTimeout"));

  console.log("[Z] Sync inside setTimeout");

  /*
   * Output inside setTimeout:
   * [Z] Sync inside setTimeout
   * [X] nextTick inside setTimeout  ← nextTick drains first
   * [A] First .then
   * [B] Second .then
   * [C] Third .then
   */
}, 100);

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: The microtask queue holds callbacks that run after the current
 *     call stack clears but before the next event loop phase.
 *
 * Q2: process.nextTick runs before Promise callbacks.
 *     Both are microtasks, but nextTick has its own dedicated queue
 *     that is always drained before the Promise microtask queue.
 *
 * Q3: Yes. Recursive nextTick or Promises can prevent timers and I/O
 *     from ever executing — this is microtask starvation.
 *
 * Q4: queueMicrotask() is the W3C-standard way to schedule a microtask.
 *     It has the same priority as Promise.then().
 */
