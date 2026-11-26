import assert from "node:assert/strict";
const base = process.env.SELF_SMOKE_URL || "http://127.0.0.1:17347";
if (
  process.env.SELF_E2E !== "1" ||
  !["127.0.0.1", "localhost"].includes(new URL(base).hostname)
)
  throw new Error("Only run against the disposable SELF_E2E local server");
let cookie = "";
async function call(path, method = "GET", body, extra = {}) {
  return fetch(`${base}/api/self${path}`, {
    method,
    headers: {
      Origin: base,
      "X-Self-Request": "1",
      Cookie: cookie,
      ...(!(body instanceof FormData) && {
        "Content-Type": "application/json",
      }),
      ...extra,
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
}
for (const path of [
  "/",
  "/calendar",
  "/report",
  "/records/mood",
  "/records/sleep",
  "/records/body",
  "/records/medication",
  "/records/reflection",
  "/login",
]) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /noindex/);
}
const missing = await fetch(`${base}/missing-page`);
assert.equal(missing.status, 404);
assert.match(await missing.text(), /這一頁暫時找不到/);
const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.icons.length, 3);
for (const path of [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/opengraph-image",
  "/offline.html",
  "/50x.html",
  "/sw.js",
])
  assert.equal((await fetch(`${base}${path}`)).status, 200, path);
assert.match(await (await fetch(`${base}/robots.txt`)).text(), /Disallow: \//);
assert.equal((await call("/entries")).status, 401);
assert.equal(
  (await call("/auth/login", "POST", {}, { Origin: "https://untrusted.test" }))
    .status,
  403,
);
const login = await call("/auth/login", "POST", {
  email: "self@example.test",
  password: "self-e2e-password",
});
assert.equal(login.status, 200);
cookie = login.headers.getSetCookie()[0].split(";")[0];
assert.equal((await call("/auth/me")).status, 200);
const form = new FormData();
form.append(
  "file",
  new Blob(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6OHsAAAAASUVORK5CYII=",
        "base64",
      ),
    ],
    { type: "image/png" },
  ),
  "test.png",
);
const upload = await call("/images", "POST", form);
assert.equal(upload.status, 201);
const image = (await upload.json()).id;
const pic = await call(`/images/${image}`);
assert.equal(pic.status, 200);
assert.equal(pic.headers.get("cache-control"), "no-store");
const input = {
  kind: "appointment",
  title: "HTTP 測試回診",
  occurredAt: new Date().toISOString(),
  note: "僅測試",
  images: [image],
  data: {
    session: "afternoon",
    number: "25",
    questions: "睡眠紀錄",
  },
};
const create = await call("/entries", "POST", input);
assert.equal(create.status, 201);
const record = (await create.json()).entry;
const update = await call(`/entries/${record.id}`, "PUT", {
  ...input,
  title: "已修改",
  version: record.version,
});
assert.equal(update.status, 200);
assert.equal(
  (await call(`/entries/${record.id}`, "DELETE", { version: 1 })).status,
  200,
);
assert.equal((await call("/auth/logout", "POST", {})).status, 200);
assert.equal((await call("/entries")).status, 401);
console.log(
  "HTTP smoke passed: pages, custom 404, metadata/PWA assets, CSRF, login/logout, image upload, appointment CRUD.",
);
