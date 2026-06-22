/**
 * PDF GENERATOR — With Worker Thread
 * ────────────────────────────────────
 * Same PDF generation task, but offloaded to a Worker Thread.
 * The main thread event loop stays FREE to handle other requests.
 *
 * Run: node pdf-generator/with-worker/server.js
 * Test:
 *   curl http://localhost:3002/generate-pdf   ← starts PDF in worker
 *   curl http://localhost:3002/health         ← responds IMMEDIATELY
 */

const http = require("http");
const { Worker } = require("worker_threads");
const path = require("path");
const { performance } = require("perf_hooks");

const WORKER_FILE = path.join(__dirname, "pdf-worker.js");

// Run PDF generation in a dedicated worker thread
function generatePDFInWorker(pageCount, requestId) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_FILE, {
      workerData: { pageCount, requestId },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}

// Optional: Worker Pool pattern for production
class WorkerPool {
  constructor(size = 4) {
    this.size = size;
    this.queue = [];
    console.log(`Worker pool initialized (max ${size} concurrent workers)`);
  }

  run(pageCount, requestId) {
    // In production, you'd manage idle/busy workers here
    // For simplicity, we create a new worker per request
    return generatePDFInWorker(pageCount, requestId);
  }
}

const pool = new WorkerPool(4);
let requestCount = 0;

const server = http.createServer(async (req, res) => {
  requestCount++;
  const reqId = requestCount;

  if (req.url === "/health") {
    // This responds INSTANTLY even while PDF is being generated
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        message: "Main thread is FREE — responding immediately!",
        activeRequests: requestCount,
      })
    );
    return;
  }

  if (req.url === "/generate-pdf") {
    console.log(`\n[Request #${reqId}] Offloading PDF to worker thread...`);
    console.log("✅ Main thread is FREE to handle other requests!\n");

    const start = performance.now();

    try {
      // NON-BLOCKING: runs in a Worker Thread
      const result = await pool.run(30, reqId);
      const duration = (performance.now() - start).toFixed(2);

      console.log(`[Request #${reqId}] Worker #${result.threadId} done in ${duration}ms`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "PDF generated (WITH worker thread)",
          requestId: reqId,
          pages: result.pages,
          workerDuration: `${result.duration}ms`,
          totalDuration: `${duration}ms`,
          workerThreadId: result.threadId,
          benefit: "Main thread was FREE during generation",
          threadModel: "Worker Thread (non-blocking, parallel)",
        })
      );
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Simulate other business logic endpoint
  if (req.url === "/fast-api") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: "Fast response!", timestamp: Date.now() }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`\n=== PDF Generator (WITH Worker Thread) ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nTest endpoints:`);
  console.log(`  http://localhost:${PORT}/generate-pdf  ← generates PDF in Worker`);
  console.log(`  http://localhost:${PORT}/health        ← always responds instantly`);
  console.log(`  http://localhost:${PORT}/fast-api      ← other business logic\n`);
  console.log(`To see NON-blocking in action:`);
  console.log(`  1. curl http://localhost:${PORT}/generate-pdf &`);
  console.log(`  2. Immediately: curl http://localhost:${PORT}/health`);
  console.log(`  ↪ /health responds INSTANTLY — event loop is free!\n`);
});
