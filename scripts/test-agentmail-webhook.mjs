// Verifies the webhook gate end-to-end against the built server: a correctly
// signed Svix delivery must pass verification, and a tampered one must not.
//
//   node scripts/test-agentmail-webhook.mjs [port]

import { createHmac } from "node:crypto";

const PORT = process.argv[2] || "3111";
const SECRET = "whsec_" + Buffer.from("local-test-secret-key").toString("base64");
const URL = `http://127.0.0.1:${PORT}/api/webhooks/agentmail`;

function sign(body, { id, timestamp, secret = SECRET }) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const mac = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return `v1,${mac}`;
}

async function post(body, headers) {
  const res = await fetch(URL, { method: "POST", headers, body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

const results = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, pass, actual, expected });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) console.log(`      expected ${JSON.stringify(expected)}\n      actual   ${JSON.stringify(actual)}`);
}

// 1. Correctly signed, non-message event -> acknowledged and skipped.
const skipBody = JSON.stringify({ type: "event", event_type: "domain.verified" });
let r = await post(skipBody, {
  "content-type": "application/json",
  "svix-id": "msg_1",
  "svix-timestamp": String(Math.floor(Date.now() / 1000)),
  "svix-signature": sign(skipBody, { id: "msg_1", timestamp: String(Math.floor(Date.now() / 1000)) }),
});
check("signed non-message event is accepted", [r.status, r.json.ok, r.json.skipped], [200, true, "domain.verified"]);

// 2. Wrong secret -> rejected.
const ts2 = String(Math.floor(Date.now() / 1000));
r = await post(skipBody, {
  "content-type": "application/json",
  "svix-id": "msg_2",
  "svix-timestamp": ts2,
  "svix-signature": sign(skipBody, { id: "msg_2", timestamp: ts2, secret: "whsec_" + Buffer.from("wrong").toString("base64") }),
});
check("bad signature is rejected", [r.status, r.json.error], [400, "INVALID_SIGNATURE"]);

// 3. Signature bound to a different svix-id -> rejected (prevents replay
//    with a swapped header).
const ts3 = String(Math.floor(Date.now() / 1000));
r = await post(skipBody, {
  "content-type": "application/json",
  "svix-id": "msg_3",
  "svix-timestamp": ts3,
  "svix-signature": sign(skipBody, { id: "msg_other", timestamp: ts3 }),
});
check("signature replayed under a different svix-id is rejected", [r.status, r.json.error], [400, "INVALID_SIGNATURE"]);

// 4. Body tampered after signing -> rejected.
const ts4 = String(Math.floor(Date.now() / 1000));
r = await post(JSON.stringify({ type: "event", event_type: "message.received" }), {
  "content-type": "application/json",
  "svix-id": "msg_4",
  "svix-timestamp": ts4,
  "svix-signature": sign(skipBody, { id: "msg_4", timestamp: ts4 }),
});
check("tampered body is rejected", [r.status, r.json.error], [400, "INVALID_SIGNATURE"]);

// 5. Stale timestamp -> rejected.
const old = String(Math.floor(Date.now() / 1000) - 3600);
r = await post(skipBody, {
  "content-type": "application/json",
  "svix-id": "msg_5",
  "svix-timestamp": old,
  "svix-signature": sign(skipBody, { id: "msg_5", timestamp: old }),
});
check("replayed delivery outside the tolerance window is rejected", [r.status, r.json.error], [400, "INVALID_SIGNATURE"]);

// 6. Missing headers -> rejected.
r = await post(skipBody, { "content-type": "application/json" });
check("missing svix headers is rejected", [r.status, r.json.error], [400, "INVALID_SIGNATURE"]);

// 7. A signed message.received passes the gate and reaches the storage step.
//    SUPABASE_SECRET_KEY is unset here, so 500 is the expected "verified but
//    not configured" outcome -- not a 400.
const ts7 = String(Math.floor(Date.now() / 1000));
const msgBody = JSON.stringify({
  type: "event",
  event_type: "message.received",
  message: {
    message_id: "m1",
    thread_id: "t1",
    inbox_id: "foujroux-9018@agentmail.to",
    from: "Buyer <buyer@example.com>",
    subject: "Is this still available?",
    extracted_text: "Bonjour, est-ce toujours disponible ?",
    timestamp: new Date().toISOString(),
  },
});
r = await post(msgBody, {
  "content-type": "application/json",
  "svix-id": "msg_7",
  "svix-timestamp": ts7,
  "svix-signature": sign(msgBody, { id: "msg_7", timestamp: ts7 }),
});
check("signed inbound mail passes verification and reaches storage", r.status, 500);
check("  ...and reports the missing service-role key", r.json.error, "SERVICE_ROLE_NOT_CONFIGURED");

const failed = results.filter((x) => !x.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);