#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS } from "./screenshot-scenarios.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const screenshotsDir = join(root, "apps", "web", "public", "screenshots");
const BASE_URL = process.env.SCREENSHOTS_URL || "http://localhost:4174";

const VIEWPORTS = {
  "ios/iphone": {
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
    suffix: "iphone-portrait"
  },
  "ios/ipad": {
    viewport: { width: 1366, height: 1024 },
    deviceScaleFactor: 2,
    suffix: "ipad-landscape"
  },
  "android/smartphone": {
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    suffix: "smart-portrait"
  },
  "android/tablet": {
    viewport: { width: 640, height: 360 },
    deviceScaleFactor: 3,
    suffix: "tablet-landscape"
  }
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      ...options
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // ignore until next retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("@playwright/test"));
  } catch {
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      throw new Error(
        "Playwright is not installed. Run: npm install -D @playwright/test && npx playwright install chromium"
      );
    }
  }

  let previewProc = null;

  if (!process.env.SCREENSHOTS_URL) {
    await run("npm", ["run", "build:web"], {
      env: { ...process.env, VITE_BASE_PATH: "/" }
    });

    previewProc = spawn(
      "npm",
      [
        "run",
        "preview",
        "-w",
        "@cookies-et-coquilettes/web",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        "4174",
        "--strictPort"
      ],
      {
        cwd: root,
        stdio: "inherit",
        shell: true,
        env: { ...process.env, VITE_BASE_PATH: "/" }
      }
    );

    const ready = await waitForServer(`${BASE_URL}/`);
    if (!ready) {
      previewProc.kill();
      throw new Error("Preview server not ready in time");
    }
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [viewportKey, config] of Object.entries(VIEWPORTS)) {
      const outDir = join(screenshotsDir, viewportKey);
      await mkdir(outDir, { recursive: true });

      const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.deviceScaleFactor,
        baseURL: BASE_URL
      });

      for (const scenario of SCENARIOS) {
        const page = await context.newPage();
        try {
          await scenario.setup(page);
          await page.waitForLoadState("networkidle").catch(() => {});
          await page.waitForTimeout(500);
          const filename = `cookies-et-coquilettes-${scenario.id}-${config.suffix}.png`;
          const filepath = join(outDir, filename);
          await page.screenshot({ path: filepath, fullPage: false });
          console.log(`${viewportKey}/${filename}`);
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (previewProc) {
      previewProc.kill();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
