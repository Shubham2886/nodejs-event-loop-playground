/**
 * PDF Worker
 * ──────────
 * This file runs INSIDE a Worker Thread.
 * It performs CPU-intensive PDF generation without blocking the main thread.
 */

const { parentPort, workerData } = require("worker_threads");

function generatePDFSync(pageCount = 50) {
  const pages = [];
  for (let page = 0; page < pageCount; page++) {
    let content = "";
    for (let i = 0; i < 10000; i++) {
      content += `Page ${page + 1} - Line ${i + 1}: ${Math.random().toString(36)}\n`;
    }
    const encoded = Buffer.from(content).toString("base64");
    pages.push({ page: page + 1, size: encoded.length });
  }
  return pages;
}

const { pageCount, requestId } = workerData;
const start = Date.now();

const pages = generatePDFSync(pageCount);

parentPort.postMessage({
  requestId,
  pages: pages.length,
  duration: Date.now() - start,
  threadId: require("worker_threads").threadId,
});
