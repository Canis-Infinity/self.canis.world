import type { Entry } from "./records";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/self${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "X-Self-Request": "1",
      ...(!(options.body instanceof FormData) && {
        "Content-Type": "application/json",
      }),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      body.message || "服務暫時無法使用，請稍後重試",
      response.status,
    );
  return body;
}
export async function getEntries(signal?: AbortSignal, params = "") {
  const records: Entry[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const result = await api<{ entries: Entry[]; pages: number }>(
      `/entries?${params}&limit=100&page=${page}`,
      { signal },
    );
    records.push(...result.entries);
    pages = result.pages;
  }
  return records;
}
