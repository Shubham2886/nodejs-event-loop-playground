/**
 * TOPIC: Worker Threads
 * ─────────────────────
 * Node.js is single-threaded for JavaScript execution.
 * Worker Threads allow PARALLEL JS execution — each worker gets
 * its own V8 instance, event loop, and memory space.
 *
 * Worker Threads vs Child Process:
 *   - Worker Threads: same process, share memory via SharedArrayBuffer
 *   - Child Process: separate OS process, communicate via IPC
 *
 * When to use Worker Threads:
 *   ✅ CPU-intensive tasks (image processing, PDF generation, encryption)
 *   ❌ I/O-bound tasks (use async/await and event loop instead)
 *
 * INTERVIEW QUESTIONS covered here:
 *  Q1. What are Worker Threads? When do you use them?
 *  Q2. How do Worker Threads communicate with the main thread?
 *  Q3. What is SharedArrayBuffer?
 *  Q4. Worker Threads vs Child Process vs Cluster?
 */

const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { performance } = require("perf_hooks");
const path = require("path");

// ─── Worker Thread Code ───────────────────────────────────────────────────
// When this file is loaded AS A WORKER, isMainThread = false
if (!isMainThread) {
  const { task, data } = workerData;

  if (task === "fibonacci") {
    // CPU-intensive: calculate Fibonacci (blocking is OK in a worker)
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
    const result = fibonacci(data);
    parentPort.postMessage({ task, result, threadId: require("worker_threads").threadId });
  }

  if (task === "sortArray") {
    // CPU-intensive: sort a large array
    const sorted = [...data].sort((a, b) => a - b);
    parentPort.postMessage({ task, result: sorted.slice(0, 5), threadId: require("worker_threads").threadId });
  }

  return; // Worker exits after sending message
}

// ─── Main Thread Code ─────────────────────────────────────────────────────
console.log("\n=== WORKER THREADS DEMO ===\n");
console.log(`Main thread ID: ${require("worker_threads").threadId} (always 0)\n`);

// Helper: run a task in a worker thread
function runInWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData }); // reuse this file!
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

// ─── Demo 1: Without Worker Thread (BLOCKS the event loop) ────────────────
async function withoutWorker() {
  console.log("--- WITHOUT Worker Thread ---");
  console.log("Starting fibonacci(40) on MAIN THREAD...");
  console.log("Event loop is BLOCKED during this time!");

  const start = performance.now();
  // Synchronous fibonacci — BLOCKS everything
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  const result = fibonacci(40);
  const duration = (performance.now() - start).toFixed(2);

  console.log(`Result: ${result}`);
  console.log(`Time: ${duration}ms`);
  console.log("Event loop was BLOCKED for that entire duration!\n");
}

// ─── Demo 2: With Worker Thread (NON-BLOCKING) ───────────────────────────
async function withWorker() {
  console.log("--- WITH Worker Thread ---");
  console.log("Starting fibonacci(40) in WORKER THREAD...");
  console.log("Main thread is FREE to handle other tasks!\n");

  // Simulate main thread doing other work while worker runs
  let mainThreadTicks = 0;
  const interval = setInterval(() => {
    mainThreadTicks++;
    process.stdout.write(`\r  Main thread tick #${mainThreadTicks} while worker runs...`);
  }, 10);

  const start = performance.now();
  const response = await runInWorker({ task: "fibonacci", data: 40 });
  clearInterval(interval);
  const duration = (performance.now() - start).toFixed(2);

  console.log(`\n\nWorker Thread ID: ${response.threadId}`);
  console.log(`Result: ${response.result}`);
  console.log(`Time: ${duration}ms`);
  console.log(`Main thread processed ${mainThreadTicks} ticks during computation!\n`);
}

// ─── Demo 3: Multiple Workers in Parallel ─────────────────────────────────
async function parallelWorkers() {
  console.log("--- PARALLEL Workers ---");
  const largeArray = Array.from({ length: 100000 }, () => Math.random());

  console.log("Running 3 workers in parallel...");
  const start = performance.now();

  const results = await Promise.all([
    runInWorker({ task: "fibonacci", data: 35 }),
    runInWorker({ task: "fibonacci", data: 36 }),
    runInWorker({ task: "sortArray", data: largeArray }),
  ]);

  const duration = (performance.now() - start).toFixed(2);
  console.log("All workers completed!");
  results.forEach((r) => console.log(`  Worker ${r.threadId}: ${r.task} → ${r.result}`));
  console.log(`Total parallel time: ${duration}ms\n`);
}

// Run all demos sequentially
(async () => {
  await withoutWorker();
  await withWorker();
  await parallelWorkers();

  console.log("=== SUMMARY ===");
  console.log("Use Worker Threads for CPU-heavy work.");
  console.log("Use async/await for I/O-heavy work.");
  console.log("Never block the main thread!\n");
})();

/*
 * INTERVIEW ANSWERS:
 * ──────────────────
 * Q1: Worker Threads provide true parallelism for CPU-intensive JS tasks.
 *     Each worker has its own event loop, V8 instance, and JS heap.
 *     Use them for: image processing, PDF generation, encryption, ML.
 *
 * Q2: Via postMessage() and the 'message' event.
 *     Workers and main thread communicate by passing serialized data.
 *     Use SharedArrayBuffer for zero-copy shared memory.
 *
 * Q3: SharedArrayBuffer allows main thread and workers to share the same
 *     memory region — no copying needed. Use Atomics for safe concurrent
 *     reads/writes to avoid race conditions.
 *
 * Q4: Worker Threads  — same process, shared memory possible, low overhead
 *     Child Process   — separate process, IPC for communication, isolated
 *     Cluster         — multiple processes, each with their own event loop,
 *                       for scaling HTTP servers across CPU cores
 */
