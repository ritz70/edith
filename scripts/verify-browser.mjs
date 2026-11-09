import { spawn } from "child_process";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9222;

console.log("Launching Edge headless...");
const edgeProcess = spawn(edgePath, [
  `--remote-debugging-port=${port}`,
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "http://localhost:3000",
]);

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  try {
    // Wait for CDP endpoint to be ready
    let targets = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        targets = await res.json();
        if (targets && targets.length > 0) break;
      } catch (e) {
        await sleep(500);
      }
    }

    if (!targets || targets.length === 0) {
      throw new Error("Could not connect to Edge DevTools");
    }

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    console.log("Found page target:", pageTarget.title, pageTarget.url);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let messageId = 1;
    const callbacks = new Map();

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = messageId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const consoleMessages = [];
    const errors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        resolve(msg.result);
      } else if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(" ");
        consoleMessages.push(`[${msg.params.type}] ${text}`);
        if (msg.params.type === "error") {
          errors.push(text);
        }
      } else if (msg.method === "Runtime.exceptionThrown") {
        errors.push(msg.params.exceptionDetails.text);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    // Enable Runtime and Page
    await send("Runtime.enable");
    await send("Page.enable");

    console.log("Connected to browser session. Waiting for simulation ticks (12 seconds)...");
    await sleep(12000);

    // Evaluate tick, clock, app names, and events from DOM
    const result = await send("Runtime.evaluate", {
      expression: `(() => {
        const headerText = document.querySelector('header')?.innerText || '';
        const apps = Array.from(document.querySelectorAll('h3')).map(el => el.innerText);
        const rows = Array.from(document.querySelectorAll('tbody tr')).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).join(' | ');
        });
        return {
          header: headerText,
          apps: apps,
          rowCount: rows.length,
          latestRows: rows.slice(0, 5)
        };
      })()`,
      returnByValue: true,
    });

    console.log("=== BROWSER STATE INSPECTION ===");
    console.log("Header text:", result.result.value.header);
    console.log("Apps found on page:", result.result.value.apps);
    console.log("Total event rows rendered:", result.result.value.rowCount);
    console.log("Sample rendered rows:");
    result.result.value.latestRows.forEach((r, idx) => console.log(`  [${idx + 1}] ${r}`));

    console.log("\n=== CONSOLE INSPECTION ===");
    console.log("Console messages logged:", consoleMessages.length);
    console.log("Errors / Hydration issues found:", errors.length);
    if (errors.length > 0) {
      console.error("Errors found:", errors);
    } else {
      console.log("ZERO hydration errors or runtime errors in browser console!");
    }

    ws.close();
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    edgeProcess.kill();
    console.log("Edge process closed.");
  }
}

run();
