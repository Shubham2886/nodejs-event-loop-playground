/**
 * TOPIC: Call Stack
 * ─────────────────
 * The Call Stack is a LIFO (Last In, First Out) data structure.
 * Node.js is single-threaded — only ONE function executes at a time.
 * When a function is called, it is PUSHED onto the stack.
 * When it returns, it is POPPED off the stack.
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What is the call stack in Node.js?
 *  Q2. Why is Node.js called single-threaded?
 *  Q3. What happens when the call stack overflows?
 */

// ─── Example 1: Basic Call Stack ───────────────────────────────────────────
function third() {
  console.log("  [3] third() — TOP of stack");
  // Stack at this point: main → first → second → third
}

function second() {
  console.log("  [2] second() — calling third()");
  third();
  // After third() returns, second() resumes here
  console.log("  [2] second() — third() has returned");
}

function first() {
  console.log("  [1] first() — calling second()");
  second();
  console.log("  [1] first() — second() has returned");
}

console.log("\n=== CALL STACK DEMO ===\n");
console.log("[0] main — calling first()");
first();
console.log("[0] main — first() has returned\n");

// ─── Example 2: Stack Overflow ─────────────────────────────────────────────
// Uncomment the code below to see a stack overflow error.
// Node.js will throw: "RangeError: Maximum call stack size exceeded"
//
// function recurse() {
//   return recurse(); // no base case → infinite recursion
// }
// recurse();

// ─── Example 3: Error Stack Trace ──────────────────────────────────────────
function causeError() {
  throw new Error("Something went wrong!");
}

function wrapper() {
  causeError();
}

try {
  wrapper();
} catch (err) {
  console.log("=== STACK TRACE SHOWS CALL STACK ORDER ===");
  console.log(err.stack);
}

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: The call stack tracks which function is currently executing and
 *     where to return after it finishes. It is a LIFO structure.
 *
 * Q2: Node.js uses a single-threaded event loop model. The call stack
 *     processes ONE frame at a time. Async I/O is handled separately
 *     by libuv's thread pool, but JS code itself is single-threaded.
 *
 * Q3: If recursive calls never terminate, the call stack grows until
 *     it exceeds its limit → RangeError: Maximum call stack size exceeded.
 */
