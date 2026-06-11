import { fileURLToPath } from "node:url";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), "..");
const lighthouseDir = path.join(rootDir, "lighthouse-json");
const allureResultsDir = path.join(rootDir, "allure-results");

const ensureDir = (dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const buildStatus = (score) => {
  if (typeof score !== "number") {
    return "broken";
  }

  return score >= 0.6 ? "passed" : "failed";
};

ensureDir(allureResultsDir);

if (!existsSync(lighthouseDir)) {
  console.log(`Lighthouse JSON directory not found: ${lighthouseDir}`);
  process.exit(0);
}

const files = readdirSync(lighthouseDir).filter((file) =>
  file.endsWith(".json"),
);

if (files.length === 0) {
  console.log(`No Lighthouse JSON files found in ${lighthouseDir}`);
  process.exit(0);
}

for (const file of files) {
  const reportPath = path.join(lighthouseDir, file);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const reportName = report.finalDisplayedUrl || report.finalUrl || file;
  const suiteName = report.fetchTime
    ? `Lighthouse ${new Date(report.fetchTime).toLocaleDateString("ru-RU")}`
    : "Lighthouse";

  const categories = report.categories ?? {};
  const relevantCategories = [
    ["performance", "Performance"],
    ["accessibility", "Accessibility"],
    ["best-practices", "Best Practices"],
    ["seo", "SEO"],
    ["pwa", "PWA"],
  ].filter(([key]) => categories[key]);

  for (const [categoryKey, categoryLabel] of relevantCategories) {
    const category = categories[categoryKey];
    const uuid = randomUUID();
    const score = category.score;
    const status = buildStatus(score);
    const attachmentName = `${uuid}-attachment.html`;
    const fullName = `${reportName} / ${categoryLabel}`;
    const htmlAttachment = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeXml(fullName)}</title></head><body><h1>${escapeXml(fullName)}</h1><p>Score: ${escapeXml((score * 100).toFixed(0))}</p><p>Категория: ${escapeXml(category.title || categoryLabel)}</p><p>URL: ${escapeXml(reportName)}</p></body></html>`;

    writeFileSync(
      path.join(allureResultsDir, attachmentName),
      htmlAttachment,
      "utf8",
    );

    const now = Date.now();
    const result = {
      uuid,
      name: `${categoryLabel}: ${file.replace(/\.json$/i, "")}`,
      fullName,
      historyId: `${file}:${categoryKey}`,
      status,
      stage: "finished",
      statusDetails:
        status === "failed"
          ? {
              message: `Lighthouse ${categoryLabel} score ${(score * 100).toFixed(0)} is below the threshold of 90`,
            }
          : {},
      labels: [
        { name: "parentSuite", value: "Аудит клиентских страниц" },
        { name: "suite", value: suiteName },
        { name: "subSuite", value: reportName },
        { name: "tag", value: "lighthouse" },
      ],
      parameters: [
        { name: "url", value: reportName },
        { name: "category", value: categoryLabel },
        { name: "score", value: (score * 100).toFixed(0) },
      ],
      attachments: [
        {
          name: "summary",
          source: attachmentName,
          type: "text/html",
        },
      ],
      steps: [],
      start: now,
      stop: now,
    };

    writeFileSync(
      path.join(allureResultsDir, `${uuid}-result.json`),
      JSON.stringify(result, null, 2),
      "utf8",
    );
  }
}

console.log(
  `Imported ${files.length} Lighthouse JSON report(s) into ${allureResultsDir}`,
);
