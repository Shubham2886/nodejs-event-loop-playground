/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║        NODE.JS CONCURRENCY — INTERVIEW QUESTIONS MASTER         ║
 * ║                   (With Code Answers)                           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Run this file: node interview-questions/all-questions.js
 * Each section is self-contained and runnable.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: CALL STACK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What is the call stack?
 * A: A LIFO stack that tracks currently executing functions.
 *    When a function is called, it's pushed. When it returns, it's popped.
 */

/**
 * Q: Why does this throw an error?
 */
// function inf() { return inf(); }
// inf(); // RangeError: Maximum call stack size exceeded

/**
 * Q: What is the output?
 */
function a() { console.log("a"); b(); }
function b() { console.log("b"); }
// a() → prints: "a", "b"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: EVENT LOOP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What is the Node.js event loop?
 * A: A loop that processes callbacks from queues when the call stack is empty.
 *    It has phases: timers → pending I/O → poll → check → close callbacks.
 */

/**
 * Q: What is the output and WHY?
 */
console.log("\n=== Q: Output prediction ===");
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1, 3, 2
// Why: console.log is sync, setTimeout is async (macrotask)

/**
 * Q: Explain each event loop phase.
 * A:
 *   timers          → runs setTimeout / setInterval callbacks
 *   pending I/O     → I/O callbacks from previous iteration
 *   idle/prepare    → internal Node.js use
 *   poll            → waits for new I/O events, executes them
 *   check           → setImmediate() callbacks
 *   close callbacks → cleanup (socket.on('close', ...))
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: MICROTASK vs MACROTASK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What is the output? This is a CLASSIC interview question.
 */
console.log("\n=== Classic Interview Question ===");
console.log("start");

setTimeout(() => console.log("setTimeout"), 0);

Promise.resolve()
  .then(() => console.log("promise 1"))
  .then(() => console.log("promise 2"));

process.nextTick(() => console.log("nextTick"));

console.log("end");

/*
 * ANSWER:
 *   start
 *   end
 *   nextTick        ← nextTick queue (highest async priority)
 *   promise 1       ← microtask queue
 *   promise 2       ← microtask queue (chained from promise 1)
 *   setTimeout      ← macrotask (timers phase)
 */

/**
 * Q: What runs after each macrotask?
 * A: ALL microtasks drain (nextTick queue + Promise queue) before
 *    the event loop picks the NEXT macrotask.
 */

/**
 * Q: What is the difference between microtask and macrotask?
 * A: Microtask — process.nextTick, Promise.then, queueMicrotask
 *              — runs after current sync code, before next event loop phase
 *              — ALL drain before next macrotask
 *    Macrotask — setTimeout, setInterval, setImmediate, I/O callbacks
 *              — one runs per event loop iteration
 *              — microtasks drain between each macrotask
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: process.nextTick
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What is process.nextTick?
 * A: Schedules a callback to run at the END of the current operation,
 *    before the event loop moves to any phase.
 *    It runs BEFORE Promise.then callbacks.
 */

/**
 * Q: When would you use process.nextTick?
 * A: 1. Ensure callback is always async (avoid Zalgo problem):
 */
function consistentlyAsync(data, callback) {
  if (data) {
    process.nextTick(() => callback(null, data)); // always async
  } else {
    fetchData(callback); // also async
  }
}

function fetchData(cb) { setTimeout(() => cb(null, "fetched"), 10); }

/**
 *    2. Emit events after constructor returns:
 */
const { EventEmitter } = require("events");
class Safe extends EventEmitter {
  constructor() {
    super();
    process.nextTick(() => this.emit("ready")); // listener registered by then
  }
}

/**
 * Q: Can nextTick starve the event loop?
 * A: YES. If nextTick callbacks keep adding more nextTick callbacks,
 *    the event loop never moves forward.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: setImmediate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: setImmediate vs setTimeout(fn, 0) — what's the difference?
 * A: At TOP LEVEL: order is non-deterministic (depends on OS timing).
 *    INSIDE I/O callback: setImmediate ALWAYS runs before setTimeout(0).
 *    This is because inside I/O we're in the POLL phase, and CHECK
 *    (setImmediate) comes before cycling back to TIMERS.
 */

/**
 * Q: What is the output?
 */
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => {}, 0);    // timers — runs SECOND
  setImmediate(() => {});     // check  — runs FIRST
  // setImmediate is always guaranteed to run before setTimeout here
});

/**
 * Q: What is setImmediate used for in practice?
 * A: Breaking up CPU-intensive work into chunks so the event loop
 *    can handle I/O between chunks:
 */
function processChunk(items, index, callback) {
  if (index >= items.length) return callback();
  // Process 100 items
  index = Math.min(index + 100, items.length);
  setImmediate(() => processChunk(items, index, callback)); // yield to event loop
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: PROMISES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What are Promise states?
 * A: pending → fulfilled (resolved) | rejected
 *    Once settled, IMMUTABLE — cannot change state.
 */

/**
 * Q: Promise.all vs Promise.allSettled vs Promise.race vs Promise.any?
 * A: .all        — all must resolve; fails fast on first rejection
 *    .allSettled — waits for all; never throws; reports each status
 *    .race       — first to settle (resolve OR reject) wins
 *    .any        — first to RESOLVE wins; AggregateError if all reject
 */

/**
 * Q: Is the Promise executor synchronous?
 * A: YES. The executor runs synchronously. Only .then callbacks are async.
 */
console.log("\n=== Promise executor is SYNC ===");
console.log("A");
new Promise((resolve) => {
  console.log("B"); // SYNC — prints before "C"
  resolve();
}).then(() => console.log("D")); // ASYNC — microtask
console.log("C");
// Output: A, B, C, D

/**
 * Q: What is async/await?
 * A: Syntactic sugar over Promises. async functions always return a Promise.
 *    await pauses the async function (not the thread) until the Promise settles.
 *    Errors can be caught with try/catch instead of .catch().
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: WORKER THREADS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Q: What are Worker Threads?
 * A: True parallel JS execution. Each worker has its own V8 instance,
 *    event loop, and memory. Introduced in Node.js 12 (stable).
 */

/**
 * Q: When should you use Worker Threads?
 * A: ✅ CPU-intensive tasks: image processing, PDF generation, video encoding,
 *       cryptography, ML inference, data compression.
 *    ❌ I/O-bound tasks: use async/await; the event loop handles these well.
 */

/**
 * Q: How do Worker Threads communicate?
 * A: Via postMessage() / on('message') — passes serialized (copied) data.
 *    For zero-copy shared memory: SharedArrayBuffer + Atomics.
 */

/**
 * Q: Worker Threads vs Child Process vs Cluster?
 * A: Worker Threads — same process, shared memory possible, lightweight
 *    Child Process   — separate OS process, full isolation, IPC via pipe
 *    Cluster         — multiple identical processes, HTTP load balancing
 *
 *    For a Node.js HTTP server:
 *    • Use Cluster to utilize all CPU cores for request handling
 *    • Use Worker Threads per request for CPU-heavy work within each process
 */

/**
 * Q: Can Worker Threads share memory?
 * A: YES, via SharedArrayBuffer. Use Atomics for thread-safe operations:
 */
const { Worker: W, isMainThread: isMT, workerData: wd } = require("worker_threads");
if (isMT) {
  const sharedBuffer = new SharedArrayBuffer(4);
  const shared = new Int32Array(sharedBuffer);
  Atomics.store(shared, 0, 42); // thread-safe write
  // Pass to worker: new Worker('./worker.js', { workerData: { sharedBuffer } })
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: COMPLETE PRIORITY LADDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PRIORITY ORDER (highest to lowest):
 * ─────────────────────────────────────
 * 1. Synchronous code (call stack)
 * 2. process.nextTick callbacks
 * 3. Promise.then / queueMicrotask callbacks
 * 4. setImmediate callbacks (CHECK phase)
 * 5. setTimeout / setInterval callbacks (TIMERS phase)
 * 6. I/O callbacks (POLL phase)
 * 7. close callbacks
 *
 * MNEMONIC: "Sync Next Promise Immediate Timeout"
 *           S N P I T
 */

console.log("\n=== FULL PRIORITY LADDER (run to verify) ===");
setTimeout(() => console.log("5. setTimeout"), 0);
setImmediate(() => console.log("4. setImmediate"));
Promise.resolve().then(() => console.log("3. Promise.then"));
process.nextTick(() => console.log("2. nextTick"));
console.log("1. Sync");
// Output: 1, 2, 3, 4/5 (4 and 5 may swap at top level), 5/4

console.log("\n✅ Interview Questions complete — check comments for answers!\n");
