#!/usr/bin/env node
/**
 * Stream smoke tester for /api/ai/summarize/stream
 * Works with SSE (text/event-stream) and NDJSON.
 *
 * Usage:
 *  node scripts/stream_smoke.mjs \
 *    --url=https://your.app \
 *    --path=/api/ai/summarize/stream \
 *    --text="Summarize this CI memo" \
 *    --idToken=$ID_TOKEN \
 *    --appCheck=$APP_CHECK
 */

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, ...rest] = s.split("=");
  return [k.replace(/^--/, ""), rest.join("=")];
}));

const base = (args.url || "http://localhost:3000").replace(/\/$/, "");
const path = args.path || "/api/ai/summarize/stream";
const text = args.text || "Summarize this CI memo about evidence handling.";
const idToken = args.idToken || args["id-token"] || "";
const appCheck = args.appCheck || args["app-check"] || "";

const controller = new AbortController();
const timeoutMs = Number(args.timeoutMs || 20000);
const to = setTimeout(() => controller.abort(), timeoutMs);

const headers = { "Content-Type": "application/json" };
if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
if (appCheck) headers["X-Firebase-AppCheck"] = appCheck;

const url = `${base}${path}`;

function fail(msg){
  console.error(String(msg));
  process.exit(1);
}

function parseSSEFrames(chunk) {
  const frames = chunk.split("\n\n");
  const out = [];
  for (const f of frames) {
    if (!f.trim()) continue;
    const ev = f.split("\n").reduce((acc, line) => {
      if (line.startsWith("event:")) acc.event = line.slice(6).trim();
      if (line.startsWith("data:")) acc.data = line.slice(5).trim();
      return acc;
    }, { event: "message", data: "" });
    out.push(ev);
  }
  return out;
}

(async () => {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
    signal: controller.signal
  }).catch(e => ({ ok:false, statusText:String(e) }));

  if (!res || !res.ok || !res.body) fail(`stream HTTP error: ${res?.status} ${res?.statusText}`);

  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawOpen = false; // 'open' or 'start'
  let sawDone = false; // 'done' or 'complete'
  let gotText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream:true });

    if (ctype.includes("event-stream")) {
      // SSE mode
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evs = parseSSEFrames(frame);
        for (const ev of evs) {
          try {
            const data = ev.data ? JSON.parse(ev.data) : {};
            const evt = (ev.event || "message").toLowerCase();
            if (evt === "open" || evt === "start") { sawOpen = true; }
            if (evt === "chunk" || evt === "delta") { gotText += data.text || ""; }
            if (evt === "done" || evt === "complete") { gotText += data.text || ""; sawDone = true; }
            if (evt === "error") fail(`stream error: ${data.message || data.error || "unknown"}`);
          } catch {
            // ignore JSON parse errors
          }
        }
      }
    } else {
      // NDJSON mode (one JSON per line)
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line);
          const t = (obj.type || "").toLowerCase();
          if (t === "open" || t === "start") sawOpen = true;
          if (t === "chunk" || t === "delta") gotText += obj.text || "";
          if (t === "done" || t === "complete") { gotText += obj.text || ""; sawDone = true; }
          if (t === "error") fail(`stream error: ${obj.message || obj.error || "unknown"}`);
        } catch {
          // ignore non-JSON lines
        }
      }
    }

    if (sawDone) break;
  }

  clearTimeout(to);
  if (!sawOpen) fail("stream: did not receive open/start");
  if (!sawDone) fail("stream: did not receive done/complete");
  if (!gotText) fail("stream: no output text");
  console.log("stream OK:", gotText.slice(0, 80).replace(/\s+/g, " "), "…");
  process.exit(0);
})();

