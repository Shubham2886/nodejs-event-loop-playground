/**
 * TOPIC: Event Loop
 * ──────────────────
 * The Event Loop is what makes Node.js non-blocking.
 * It continuously checks: "Is the call stack empty? If yes, pick the next task."
 *
 * Event Loop PHASES (in order):
 *   1. timers          → executes setTimeout / setInterval callbacks
 *   2. pending I/O     → I/O callbacks deferred from previous iteration
 *   3. idle, prepare   → internal use only
 *   4. poll            → fetch new I/O events; execute I/O callbacks
 *   5. check           → setImmediate() callbacks
 *   6. close callbacks → e.g., socket.on('close', ...)
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is the event loop in Node.js?
 *  Q2. What are the phases of the event loop?
 *  Q3. What is the difference between the poll phase and the check phase?
 *  Q4. Is Node.js truly non-blocking?
 */

const fs = require("fs");

console.log("\n=== EVENT LOOP PHASE DEMO ===\n");

// Sync code runs first (call stack)
console.log("[1] SYNC — Start (call stack)");

// TIMERS phase
setTimeout(() => {
  console.log("[5] TIMERS phase — setTimeout(0)");
}, 0);

// CHECK phase
setImmediate(() => {
  console.log("[6] CHECK phase — setImmediate");
});

// MICROTASK — runs after current operation, before next phase
Promise.resolve().then(() => {
  console.log("[3] MICROTASK — Promise.resolve().then()");
});

// process.nextTick — runs before ANY other async callback
process.nextTick(() => {
  console.log("[2] NEXTTICK — process.nextTick (highest priority async)");
});

// POLL phase — I/O callback
fs.readFile(__filename, () => {
  console.log("[4] POLL phase — fs.readFile callback");

  // Inside an I/O callback: setImmediate runs BEFORE setTimeout
  setImmediate(() => {
    console.log("   [4a] CHECK — setImmediate inside I/O callback");
  });

  setTimeout(() => {
    console.log("   [4b] TIMERS — setTimeout inside I/O callback");
  }, 0);
});

console.log("[1] SYNC — End (call stack)\n");

/*
 * EXPECTED OUTPUT ORDER:
 * [1] SYNC — Start
 * [1] SYNC — End
 * [2] NEXTTICK — process.nextTick
 * [3] MICROTASK — Promise.resolve().then()
 * [4] POLL phase — fs.readFile
 *    [4a] CHECK — setImmediate (guaranteed before setTimeout inside I/O)
 *    [4b] TIMERS — setTimeout
 * [5] TIMERS — setTimeout(0)
 * [6] CHECK — setImmediate
 *
 * NOTE: [5] and [6] order at top-level is NON-DETERMINISTIC
 *       but INSIDE an I/O callback, setImmediate ALWAYS beats setTimeout.
 *
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: The event loop monitors the call stack and task queues.
 *     When the stack is empty, it pushes the next queued callback.
 *
 * Q2: timers → pending callbacks → idle/prepare → poll → check → close
 *
 * Q3: poll — waits for and processes I/O events
 *     check — runs setImmediate callbacks AFTER poll
 *
 * Q4: Node.js is non-blocking for I/O operations (delegated to libuv).
 *     CPU-intensive synchronous code WILL block the event loop.
 */
