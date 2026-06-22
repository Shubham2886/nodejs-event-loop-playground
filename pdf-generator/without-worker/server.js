/**
 * PDF GENERATOR — Without Worker Thread
 * ───────────────────────────────────────
 * This simulates generating a PDF using synchronous (CPU-heavy) code
 * directly on the MAIN THREAD.
 *
 * PROBLEM: The event loop is BLOCKED while the PDF is being generated.
 * No other requests can be handled until this finishes.
 *
 * Run: node pdf-generator/without-worker/server.js
 * Test: curl http://localhost:3001/generate-pdf
 *       curl http://localhost:3001/health   ← try this WHILE pdf is generating
 */

const http = require("http");
const { performance } = require("perf_hooks");

// Simulate a CPU-intensive PDF generation task
// (In reality: pdfkit, puppeteer, etc. — but those are I/O-based.
//  This simulates the COMPUTATION portion: layout, rendering, encoding)
function generatePDFSync(pageCount = 50) {
  const pages = [];
  for (let page = 0; page < pageCount; page++) {
    // Simulate heavy computation per page
    let content = "";
    for (let i = 0; i < 10000; i++) {
      content += `Page ${page + 1} - Line ${i + 1}: ${Math.random().toString(36)}\n`;
    }
    // Simulate compression/encoding
    const encoded = Buffer.from(content).toString("base64");
    pages.push({ page: page + 1, size: encoded.length });
  }
  return pages;
}

let requestCount = 0;

const server = http.createServer((req, res) => {
  requestCount++;
  const reqId = requestCount;

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", message: "Server is responding" }));
    return;
  }

  if (req.url === "/generate-pdf") {
    console.log(`\n[Request #${reqId}] Starting PDF generation on MAIN THREAD...`);
    console.log("⚠️  Event loop is BLOCKED — no other requests can be handled!\n");

    const start = performance.now();

    // BLOCKING: This runs on the main thread
    const pages = generatePDFSync(30);

    const duration = (performance.now() - start).toFixed(2);

    console.log(`[Request #${reqId}] PDF generation complete in ${duration}ms`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "PDF generated (WITHOUT worker thread)",
        pages: pages.length,
        duration: `${duration}ms`,
        warning: "Event loop was BLOCKED during generation",
        threadModel: "Main thread (single-threaded, blocking)",
      })
    );
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n=== PDF Generator (WITHOUT Worker Thread) ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nTest endpoints:`);
  console.log(`  http://localhost:${PORT}/generate-pdf  ← generates PDF (BLOCKS)`);
  console.log(`  http://localhost:${PORT}/health        ← health check`);
  console.log(`\nTo see blocking in action:`);
  console.log(`  1. curl http://localhost:${PORT}/generate-pdf &`);
  console.log(`  2. Immediately: curl http://localhost:${PORT}/health`);
  console.log(`  ↪ /health will NOT respond until /generate-pdf finishes!\n`);
});
