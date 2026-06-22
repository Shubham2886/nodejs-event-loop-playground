/**
 * TOPIC: Macrotask Queue (Task Queue)
 * ────────────────────────────────────
 * Also called the "callback queue" or "task queue".
 * Contains: setTimeout, setInterval, setImmediate, I/O callbacks
 *
 * KEY DIFFERENCE from Microtask Queue:
 *   - Only ONE macrotask is processed per event loop iteration
 *   - After each macrotask, ALL microtasks drain before the next macrotask
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is the macrotask queue?
 *  Q2. What is the difference between microtask and macrotask?
 *  Q3. How does setTimeout(fn, 0) actually work?
 *  Q4. Why does setTimeout(fn, 0) not always run at exactly 0ms?
 */

console.log("\n=== MACROTASK QUEUE DEMO ===\n");

// ─── Example 1: Microtask drains between each Macrotask ────────────────────
setTimeout(() => {
  console.log("[MacroTask 1] setTimeout #1");
  Promise.resolve().then(() => console.log("  [Micro after MacroTask 1]"));
}, 0);

setTimeout(() => {
  console.log("[MacroTask 2] setTimeout #2");
  Promise.resolve().then(() => console.log("  [Micro after MacroTask 2]"));
}, 0);

/*
 * OUTPUT:
 * [MacroTask 1] setTimeout #1
 *   [Micro after MacroTask 1]   ← microtasks drain BEFORE next macro
 * [MacroTask 2] setTimeout #2
 *   [Micro after MacroTask 2]
 */

// ─── Example 2: setTimeout min delay ──────────────────────────────────────
// HTML spec: min delay is 4ms (clamped for nested timers)
// Node.js: min delay is 1ms (but can vary under load)
const start = Date.now();
setTimeout(() => {
  console.log(`\nsetTimeout(0) actually ran after: ${Date.now() - start}ms`);
}, 0);

// ─── Example 3: setInterval demo ──────────────────────────────────────────
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log(`[setInterval] tick #${count}`);
  if (count === 3) {
    clearInterval(interval);
    console.log("[setInterval] cleared after 3 ticks\n");
  }
}, 50);

// ─── Example 4: The Full Priority Order ───────────────────────────────────
console.log("\n=== FULL PRIORITY DEMO ===");
console.log("[SYNC] 1");

setTimeout(() => console.log("[MACRO] setTimeout"), 0);
setImmediate(() => console.log("[MACRO] setImmediate"));
Promise.resolve().then(() => console.log("[MICRO] Promise.then"));
process.nextTick(() => console.log("[MICRO] process.nextTick"));

console.log("[SYNC] 2");

/*
 * Output order:
 * [SYNC] 1
 * [SYNC] 2
 * [MICRO] process.nextTick    ← highest priority
 * [MICRO] Promise.then        ← microtask queue
 * [MACRO] setTimeout          ← timers phase (may swap with setImmediate)
 * [MACRO] setImmediate        ← check phase
 *
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: The macrotask queue holds callbacks scheduled by setTimeout,
 *     setInterval, setImmediate, and I/O. ONE runs per loop iteration.
 *
 * Q2: After EACH macrotask, the ENTIRE microtask queue drains.
 *     Microtasks = high priority; macrotasks = lower priority.
 *
 * Q3: setTimeout(fn, 0) doesn't run immediately. It schedules fn to run
 *     in the next event loop iteration (timers phase), after all
 *     synchronous code and microtasks finish.
 *
 * Q4: Node.js has a minimum timer resolution (~1ms). Under heavy load,
 *     timers can be delayed further. 0ms means "as soon as possible"
 *     not "immediately".
 */
