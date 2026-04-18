#!/usr/bin/env node
/**
 * Netlify 빌드에서는 Puppeteer용 Chrome 바이너리를 받지 않습니다.
 * 런타임에는 @sparticuz/chromium 을 사용합니다.
 */
import { execSync } from "node:child_process";

if (process.env.NETLIFY === "true") {
  console.log(
    "[postinstall] Skipping Puppeteer Chrome download on Netlify (uses @sparticuz/chromium)."
  );
  process.exit(0);
}

execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
