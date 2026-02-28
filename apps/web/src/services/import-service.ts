import type {
  ImportService,
  ParsedRecipeDraft,
  ShareImportPayload
} from "@cookies-et-coquilettes/domain";

const API_BASE_URL = import.meta.env.VITE_BFF_URL || "http://localhost:8787";

async function parseResponse(response: Response): Promise<ParsedRecipeDraft> {
  if (!response.ok) {
    throw new Error(`Import failed: ${response.status}`);
  }
  return (await response.json()) as ParsedRecipeDraft;
}

class BffImportService implements ImportService {
  async importFromUrl(url: string): Promise<ParsedRecipeDraft> {
    const response = await fetch(`${API_BASE_URL}/api/import/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    return parseResponse(response);
  }

  async importFromShare(payload: ShareImportPayload): Promise<ParsedRecipeDraft> {
    const response = await fetch(`${API_BASE_URL}/api/import/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  }

  async importFromScreenshot(file: File): Promise<ParsedRecipeDraft> {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/import/screenshot`, {
      method: "POST",
      body
    });
    return parseResponse(response);
  }

  async importFromText(text: string): Promise<ParsedRecipeDraft> {
    const response = await fetch(`${API_BASE_URL}/api/import/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    return parseResponse(response);
  }
}

export const bffImportService = new BffImportService();
