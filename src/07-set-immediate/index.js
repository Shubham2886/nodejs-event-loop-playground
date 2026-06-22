/**
 * TOPIC: setImmediate
 * ───────────────────
 * setImmediate schedules a callback to execute in the CHECK phase
 * of the event loop — AFTER the poll phase completes.
 *
 * Designed for: "run this callback after I/O events, but before timers"
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is setImmediate?
 *  Q2. setImmediate vs setTimeout(fn, 0) — what's the difference?
 *  Q3. When is setImmediate guaranteed to run before setTimeout?
 *  Q4. setImmediate vs process.nextTick?
 */

const fs = require("fs");

console.log("\n=== setImmediate DEMO ===\n");

// ─── Example 1: Top-level — order is NON-DETERMINISTIC ────────────────────
// At the top level, setTimeout(0) and setImmediate order depends on
// how fast the timers are initialized — it's non-deterministic.
console.log("--- Top level (non-deterministic order) ---");
setTimeout(() => console.log("setTimeout(0)  — could be 1st or 2nd"), 0);
setImmediate(() => console.log("setImmediate   — could be 1st or 2nd"));

// ─── Example 2: Inside I/O callback — setImmediate ALWAYS wins ────────────
fs.readFile(__filename, () => {
  console.log("\n--- Inside I/O callback (DETERMINISTIC order) ---");
  setTimeout(() => console.log("setTimeout(0)  — ALWAYS 2nd here"), 0);
  setImmediate(() => console.log("setImmediate   — ALWAYS 1st here"));
  // Why? We're already in the POLL phase.
  // CHECK phase (setImmediate) comes BEFORE cycling back to timers.
});

// ─── Example 3: Practical Use — Break up CPU-intensive work ──────────────
function processLargeArray(items, callback) {
  const results = [];
  let index = 0;

  function processChunk() {
    // Process 100 items at a time, then yield to event loop
    const end = Math.min(index + 100, items.length);
    while (index < end) {
      results.push(items[index] * 2); // simulate work
      index++;
    }

    if (index < items.length) {
      // Yield control back to event loop between chunks
      // This allows I/O callbacks and other tasks to run
      setImmediate(processChunk);
    } else {
      callback(results);
    }
  }

  processChunk();
}

const largeArray = Array.from({ length: 500 }, (_, i) => i + 1);
processLargeArray(largeArray, (results) => {
  console.log(`\nProcessed ${results.length} items with setImmediate chunking`);
  console.log(`Last 3 results: ${results.slice(-3)}`);
});

// ─── Example 4: Priority ladder recap ─────────────────────────────────────
setTimeout(() => {
  console.log("\n=== PRIORITY LADDER ===");
  process.nextTick(() => console.log("1. process.nextTick (highest)"));
  Promise.resolve().then(() => console.log("2. Promise.then"));
  setImmediate(() => console.log("4. setImmediate (CHECK phase)"));
  setTimeout(() => console.log("5. setTimeout (TIMERS phase, next iter)"), 0);
  console.log("3. Synchronous code runs first within phase");
}, 200);

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: setImmediate() runs its callback in the CHECK phase of the event
 *     loop — after poll phase, before going back to timers.
 *
 * Q2: Both aim to run "soon", but:
 *     • At top level: order is non-deterministic (depends on OS timing)
 *     • Inside I/O callback: setImmediate ALWAYS runs before setTimeout(0)
 *       because CHECK phase comes before TIMERS in the loop order.
 *
 * Q3: Inside an I/O callback. This is the main use case for setImmediate.
 *
 * Q4: nextTick > setImmediate (nextTick runs before the next phase starts,
 *     setImmediate runs in the CHECK phase)
 *     Use nextTick for high-priority tasks, setImmediate for I/O follow-up.
 */
