#!/usr/bin/env node
// Screenshots pages of a running Mosaic dev server so an agent can look at UI
// changes. Usage:
//   node scripts/screenshot-pages.mjs / /help /use?url=https://example.com
//   node scripts/screenshot-pages.mjs --mobile --dark --out /tmp/shots /help
// Writes full-page PNGs (default: test-results/screenshots/), prints one
// "status url -> file" line per page, and exits 1 if any page errors or
// answers with an HTTP status of 400 or above.
import { chromium } from "@playwright/test";
import console from "node:console";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { URL } from "node:url";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    out: { type: "string", default: "test-results/screenshots" },
    mobile: { type: "boolean", default: false },
    dark: { type: "boolean", default: false },
  },
});

const paths = positionals.length > 0 ? positionals : ["/"];
// Playwright creates missing directories when it writes a screenshot.
const outDir = resolve(values.out);

// Claude Code cloud containers ship Chromium here and block browser downloads.
const cloudChromium = "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  executablePath: existsSync(cloudChromium) ? cloudChromium : undefined,
});

const viewports = [{ name: "desktop", width: 1440, height: 900 }];
if (values.mobile) viewports.push({ name: "mobile", width: 390, height: 844 });

let failed = false;
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: values.dark ? "dark" : "light",
    });
    // The app defaults to the light theme whatever the browser prefers, so
    // pick the theme the way the theme toggle does (next-themes' storage key).
    const theme = values.dark ? "dark" : "light";
    await page.addInitScript((value) => {
      localStorage.setItem("theme", value);
    }, theme);

    for (const path of paths) {
      const url = new URL(path, values.base).toString();
      const slug =
        path.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-") || "home";
      const file = join(
        outDir,
        `${slug}-${viewport.name}${values.dark ? "-dark" : ""}.png`,
      );

      try {
        const response = await page.goto(url, { waitUntil: "networkidle" });
        await page.screenshot({ path: file, fullPage: true });
        const status = response?.status();
        // Keep the screenshot of an error page, but fail the run.
        if (status === undefined || status >= 400) failed = true;
        console.log(`${status ?? "?"} ${url} -> ${file}`);
      } catch (error) {
        failed = true;
        console.error(`FAILED ${url}: ${error.message}`);
      }
    }

    await page.close();
  }
} finally {
  await browser.close();
}

process.exitCode = failed ? 1 : 0;
