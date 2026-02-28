#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const env = {
  ...process.env,
  VITE_BASE_PATH: "/"
};

const proc = spawn(
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
    env
  }
);

proc.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

proc.on("exit", (code) => {
  process.exit(code ?? 0);
});
