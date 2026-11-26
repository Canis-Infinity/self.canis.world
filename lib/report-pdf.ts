export async function createReportPdf() {
  const report = document.getElementById("main");
  if (!report) throw new Error("找不到回診摘要，請重新整理後再試");
  const clone = report.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, iframe, object, embed")
    .forEach((node) => node.remove());
  for (const image of clone.querySelectorAll("img")) {
    const url = new URL(image.src, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/api\/self\/images\/[a-f0-9]{24}$/.test(url.pathname)
    )
      image.remove();
    else {
      image.src = `https://self-pdf.invalid${url.pathname}`;
      image.removeAttribute("srcset");
      image.loading = "eager";
    }
  }
  const css: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.href && new URL(sheet.href).origin !== window.location.origin)
      continue;
    try {
      css.push(Array.from(sheet.cssRules, (rule) => rule.cssText).join("\n"));
    } catch {
      throw new Error("無法讀取列印樣式，請重新整理後再試");
    }
  }
  const response = await fetch("/api/self/report-pdf", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Self-Request": "1" },
    body: JSON.stringify({
      html: clone.outerHTML,
      css: css.join("\n"),
      theme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "PDF 產生失敗，請稍後重試");
  }
  return response.blob();
}
