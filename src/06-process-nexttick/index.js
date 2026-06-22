/**
 * TOPIC: process.nextTick
 * ───────────────────────
 * process.nextTick schedules a callback to run at the END of the
 * current operation, before the event loop continues to the next phase.
 *
 * It has HIGHER priority than Promise.then() — nextTick queue drains
 * completely before any Promise callbacks run.
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is process.nextTick?
 *  Q2. How is process.nextTick different from setImmediate?
 *  Q3. When should you USE process.nextTick?
 *  Q4. Can process.nextTick cause starvation?
 */

console.log("\n=== process.nextTick DEMO ===\n");

// ─── Example 1: Basic nextTick Priority ───────────────────────────────────
console.log("[SYNC] Start");

process.nextTick(() => {
  console.log("[nextTick] Runs before Promise");
});

Promise.resolve().then(() => {
  console.log("[Promise] Runs after nextTick");
});

setTimeout(() => {
  console.log("[setTimeout] Runs last");
}, 0);

console.log("[SYNC] End\n");

// ─── Example 2: Practical Use Case — Ensure callback is async ─────────────
// BAD: sometimes sync, sometimes async — inconsistent
function readDataBad(callback) {
  const cache = null; // pretend cache miss
  if (cache) {
    callback(null, cache); // SYNC call — bad!
  } else {
    setTimeout(() => callback(null, "fresh data"), 10); // ASYNC call
  }
}

// GOOD: always async using process.nextTick
function readDataGood(callback) {
  const cache = "cached!"; // pretend cache hit
  if (cache) {
    process.nextTick(() => callback(null, cache)); // ALWAYS async
  } else {
    setTimeout(() => callback(null, "fresh data"), 10);
  }
}

console.log("Before readDataGood()");
readDataGood((err, data) => {
  console.log(`readDataGood callback: ${data}`); // always runs async
});
console.log("After readDataGood() — callback hasn't run yet\n");

// ─── Example 3: nextTick in Event Emitters ────────────────────────────────
const EventEmitter = require("events");

class MyEmitter extends EventEmitter {
  constructor() {
    super();
    // Without nextTick: event fires before .on() listener is attached
    // With nextTick: listener is guaranteed to be registered first
    process.nextTick(() => {
      this.emit("ready"); // guaranteed to run after constructor returns
    });
  }
}

setTimeout(() => {
  const emitter = new MyEmitter();
  emitter.on("ready", () => {
    console.log("EventEmitter: 'ready' event received via nextTick trick!");
  });
}, 50);

// ─── Example 4: nextTick Starvation Example ───────────────────────────────
// Uncomment to see starvation — setTimeout NEVER runs
//
// let i = 0;
// function recurse() {
//   if (i++ < 1000000) process.nextTick(recurse);
// }
// recurse();
// setTimeout(() => console.log("I never run"), 0);

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: process.nextTick() schedules a callback to execute at the end of
 *     the current phase, before moving to the next event loop phase.
 *     It's Node.js specific (not in browsers).
 *
 * Q2: nextTick   — runs before the next event loop phase (after current op)
 *     setImmediate — runs in the CHECK phase (after poll phase)
 *     nextTick always wins over setImmediate.
 *
 * Q3: Use nextTick to:
 *     • Make callbacks consistently async (avoid Zalgo problem)
 *     • Emit events after constructor completes
 *     • Run cleanup before the event loop continues
 *
 * Q4: Yes. Recursive nextTick calls prevent the event loop from
 *     progressing. Node.js added a maxCallDepth for this reason.
 */
