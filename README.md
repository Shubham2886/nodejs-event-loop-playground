# 🔄 nodejs-event-loop-playground

> **Learn how Node.js handles concurrency** — Call Stack, Event Loop, Microtask Queue, Macrotask Queue, Promises, process.nextTick, setImmediate, and Worker Threads.
> Each file is a standalone lesson with working code + interview Q&A in the comments.

---

## 📁 Project Structure at a Glance

```
nodejs-event-loop-playground/
│
├── src/                              ← Core learning modules (run these first)
│   ├── 01-call-stack/index.js        ← What is the call stack? Stack overflow?
│   ├── 02-event-loop/index.js        ← Event loop phases, poll vs check
│   ├── 03-microtask-queue/index.js   ← Microtasks, Promise.then, queueMicrotask
│   ├── 04-macrotask-queue/index.js   ← setTimeout, setInterval, order rules
│   ├── 05-promises/index.js          ← States, chaining, .all .race .any .allSettled
│   ├── 06-process-nexttick/index.js  ← nextTick priority, Zalgo problem
│   ├── 07-set-immediate/index.js     ← setImmediate vs setTimeout, chunking
│   └── 08-worker-threads/index.js    ← Parallel JS, postMessage, SharedArrayBuffer
│
├── pdf-generator/                    ← Real-world comparison demo
│   ├── without-worker/server.js      ← Blocking server (event loop stuck)
│   └── with-worker/
│       ├── server.js                 ← Non-blocking server (event loop free)
│       └── pdf-worker.js            ← Worker that does the heavy lifting
│
├── interview-questions/
│   └── all-questions.js             ← All interview Q&A in one runnable file
│
├── package.json
└── README.md
```

---

## ⚡ Quick Start

```bash
# No dependencies needed — pure Node.js
node --version   # Requires Node 16+

# Run any topic directly
node src/01-call-stack/index.js
node src/02-event-loop/index.js
# ... and so on

# OR use npm scripts
npm run 01:call-stack
npm run 02:event-loop
npm run 03:microtask
npm run 04:macrotask
npm run 05:promises
npm run 06:nexttick
npm run 07:setimmediate
npm run 08:worker-threads

# Interview prep — all questions in one file
npm run interview

# PDF Generator comparison
npm run pdf:without-worker   # Terminal 1 — blocking server (port 3001)
npm run pdf:with-worker      # Terminal 1 — non-blocking server (port 3002)
```

---

## 📚 Topic Guide

### [01] Call Stack → `src/01-call-stack/index.js`

The **LIFO data structure** that tracks which function is currently executing.

```
function third() { ... }    ← PUSHED last, POPPED first
function second() { third() }
function first() { second() }
first()
```

**What you'll learn:**
- Why Node.js is called "single-threaded"
- What a stack overflow error is and how it happens
- How to read a stack trace

**Interview questions inside the file:**
- What is the call stack in Node.js?
- Why is Node.js called single-threaded?
- What happens when the call stack overflows?

---

### [02] Event Loop → `src/02-event-loop/index.js`

The **engine that makes Node.js non-blocking**. It continuously checks: "Is the call stack empty? If yes, pull the next task."

```
Event Loop Phases (in order):
  1. timers          → setTimeout / setInterval
  2. pending I/O     → deferred I/O callbacks
  3. idle, prepare   → internal
  4. poll            → incoming I/O events
  5. check           → setImmediate()
  6. close callbacks → socket.on('close', ...)
```

**What you'll learn:**
- All 6 event loop phases and what runs in each
- Why setImmediate runs before setTimeout inside I/O callbacks
- The difference between poll phase and check phase

**Interview questions inside the file:**
- What is the event loop in Node.js?
- What are the phases of the event loop?
- Is Node.js truly non-blocking?

---

### [03] Microtask Queue → `src/03-microtask-queue/index.js`

Microtasks run **after current sync code, before the next event loop phase**.  
They **ALL drain** before any macrotask runs.

```
Priority order:
  1. process.nextTick  (nextTick queue)
  2. Promise.then      (microtask queue)
  3. queueMicrotask()  (microtask queue, same as Promise)
```

**What you'll learn:**
- Why nextTick beats Promise.then
- What microtask starvation is
- How nested Promises schedule themselves

**Interview questions inside the file:**
- What is the microtask queue?
- What is the difference between process.nextTick and Promise?
- Can microtasks starve the event loop?

---

### [04] Macrotask Queue → `src/04-macrotask-queue/index.js`

Also called the **task queue** or **callback queue**. Only ONE macrotask runs per event loop iteration, then ALL microtasks drain before the next one.

```
Macrotask sources:
  - setTimeout(fn, delay)
  - setInterval(fn, delay)
  - setImmediate(fn)
  - I/O callbacks
```

**What you'll learn:**
- Why microtasks run between each macrotask
- Why setTimeout(fn, 0) doesn't run at exactly 0ms
- The full priority ordering in one demo

**Interview questions inside the file:**
- What is the macrotask queue?
- What is the difference between microtask and macrotask?
- How does setTimeout(fn, 0) actually work?

---

### [05] Promises → `src/05-promises/index.js`

A Promise represents **a value available in the future**.  
States: `pending` → `fulfilled` or `rejected` (immutable once settled).

```js
// The 4 combinators — know these cold
Promise.all([p1, p2])         // all must resolve; fails fast
Promise.allSettled([p1, p2])  // waits for all; never rejects
Promise.race([p1, p2])        // first to settle wins (resolve OR reject)
Promise.any([p1, p2])         // first to RESOLVE wins
```

**What you'll learn:**
- Promise executor runs synchronously (common trick question)
- How chaining works (`.then` returns a new Promise)
- All 4 combinators with practical examples
- How async/await compiles to Promises

**Interview questions inside the file:**
- What are Promise states?
- Promise.all vs Promise.allSettled vs Promise.race vs Promise.any?
- Is the Promise executor synchronous?
- How does async/await relate to Promises?

---

### [06] process.nextTick → `src/06-process-nexttick/index.js`

Schedules a callback to run **at the end of the current operation**, before the event loop moves to ANY phase. **Higher priority than Promise.then**.

```js
// Use case 1: Avoid Zalgo (inconsistent sync/async callbacks)
function safeCallback(data, cb) {
  if (cache) {
    process.nextTick(() => cb(null, cache)); // always async
  } else {
    fetchAsync(cb);
  }
}

// Use case 2: Emit events after constructor
class MyEmitter extends EventEmitter {
  constructor() {
    super();
    process.nextTick(() => this.emit('ready')); // listener registered by then
  }
}
```

**Interview questions inside the file:**
- What is process.nextTick?
- How is it different from setImmediate?
- When should you USE it?
- Can it cause starvation?

---

### [07] setImmediate → `src/07-set-immediate/index.js`

Runs in the **CHECK phase** — after the poll phase, before looping back to timers.

```
Top-level:      order vs setTimeout(0) is NON-DETERMINISTIC
Inside I/O:     setImmediate ALWAYS wins (guaranteed)
```

**What you'll learn:**
- Why setImmediate beats setTimeout inside I/O callbacks
- How to use it to chunk CPU-heavy work without blocking I/O
- The complete priority ladder

**Interview questions inside the file:**
- What is setImmediate?
- setImmediate vs setTimeout(fn, 0)?
- When is setImmediate guaranteed to run before setTimeout?

---

### [08] Worker Threads → `src/08-worker-threads/index.js`

**True parallelism for JavaScript**. Each worker has its own V8, event loop, and heap.

```js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (!isMainThread) {
  // This block runs in the worker
  const result = heavyComputation(workerData.input);
  parentPort.postMessage({ result });
} else {
  // This block runs in the main thread
  const worker = new Worker(__filename, { workerData: { input: 42 } });
  worker.on('message', (msg) => console.log(msg.result));
}
```

**What you'll learn:**
- When to use Worker Threads (CPU) vs async/await (I/O)
- How threads communicate via postMessage
- SharedArrayBuffer for zero-copy shared memory
- Worker Threads vs Child Process vs Cluster

**Interview questions inside the file:**
- What are Worker Threads? When do you use them?
- How do they communicate with the main thread?
- What is SharedArrayBuffer?
- Worker Threads vs Child Process vs Cluster?

---

## 🏗️ PDF Generator Demo

### The Problem
**CPU-intensive tasks block the event loop** — no other request can be handled while Node.js is busy generating a PDF on the main thread.

### Without Worker Thread → `pdf-generator/without-worker/server.js`

```bash
npm run pdf:without-worker
# Server on http://localhost:3001

# Test blocking:
curl http://localhost:3001/generate-pdf &   # starts PDF generation
curl http://localhost:3001/health           # health check WAITS — event loop is blocked!
```

**What happens:** `/health` doesn't respond until `/generate-pdf` finishes. Your server appears down during PDF generation.

### With Worker Thread → `pdf-generator/with-worker/server.js`

```bash
npm run pdf:with-worker
# Server on http://localhost:3002

# Test non-blocking:
curl http://localhost:3002/generate-pdf &   # offloads to worker thread
curl http://localhost:3002/health           # responds IMMEDIATELY — event loop is free!
```

**What happens:** `/health` responds instantly. PDF generation happens in parallel. The main thread stays free for other requests.

---

## 🎯 The Complete Priority Ladder

```
HIGHEST PRIORITY
      │
      ▼
  1. Synchronous code          (call stack)
  2. process.nextTick          (nextTick queue)
  3. Promise.then              (microtask queue)
     queueMicrotask()          (microtask queue)
  4. setImmediate              (CHECK phase)
  5. setTimeout / setInterval  (TIMERS phase)
  6. I/O callbacks             (POLL phase)
      │
      ▼
LOWEST PRIORITY

MNEMONIC: "Sync  Next  Promise  Immediate  Timeout"
           S      N     P        I          T
```

**The classic interview question:**

```js
console.log('start');
setTimeout(() => console.log('setTimeout'), 0);
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');

// Output:
// start
// end
// nextTick
// promise
// setTimeout
```

---

## 🧠 Interview Cheat Sheet

| Concept | One-line answer |
|---|---|
| Call Stack | LIFO structure tracking function execution |
| Event Loop | Moves callbacks from queues to the call stack when it's empty |
| Microtask | Runs after current sync code, before next event loop phase |
| Macrotask | Runs one per event loop iteration; microtasks drain between each |
| process.nextTick | Highest-priority async; runs before Promise.then |
| setImmediate | Runs in CHECK phase; beats setTimeout inside I/O callbacks |
| Promise.all | All must resolve; rejects on first failure |
| Promise.allSettled | Waits for all; never rejects; reports each outcome |
| Promise.race | First to settle (resolve or reject) wins |
| Promise.any | First to resolve wins; AggregateError if all reject |
| Worker Threads | True parallel JS for CPU-heavy tasks |
| Child Process | Separate OS process; isolated; communicate via IPC |
| Cluster | Multiple identical processes; scale HTTP across CPU cores |

---

## 🔗 Further Reading

- [Node.js Event Loop Official Docs](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
- [Worker Threads API](https://nodejs.org/api/worker_threads.html)
- [libuv — the C library behind Node.js async I/O](https://libuv.org/)

---

> Made for interview prep and real understanding — not just theory.
> Every file runs standalone. Read the comments. They are the lessons.
