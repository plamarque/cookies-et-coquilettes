import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import cors from "cors";
import express from "express";
import multer from "multer";
import { parseRecipeWithCloud } from "./parsing-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const app = express();
const upload = multer();
const port = Number(process.env.PORT ?? 8787);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin
  })
);
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/import/url", async (req, res) => {
  const url = req.body?.url as string | undefined;
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const parsed = await parseRecipeWithCloud({ sourceType: "URL", url });
  res.json(parsed);
});

app.post("/api/import/share", async (req, res) => {
  const text = req.body?.text as string | undefined;
  const url = req.body?.url as string | undefined;
  const title = req.body?.title as string | undefined;

  const parsed = await parseRecipeWithCloud({
    sourceType: "SHARE",
    text,
    url,
    shareTitle: title
  });
  res.json(parsed);
});

app.post("/api/import/text", async (req, res) => {
  const text = req.body?.text as string | undefined;
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const parsed = await parseRecipeWithCloud({ sourceType: "TEXT", text });
  res.json(parsed);
});

app.post("/api/import/screenshot", upload.single("file"), async (req, res) => {
  if (!req.file?.buffer) {
    res.status(400).json({ error: "file is required" });
    return;
  }

  const screenshotBase64 = req.file.buffer.toString("base64");
  const parsed = await parseRecipeWithCloud({
    sourceType: "SCREENSHOT",
    screenshotBase64
  });
  res.json(parsed);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`BFF listening on http://localhost:${port} (CORS: ${corsOrigin})`);
});
