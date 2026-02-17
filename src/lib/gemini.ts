type GenerateImagesParams = {
  prompt: string;
  model: string;
  apiKey: string;
  referenceImages?: Buffer[];
  aspectRatio?: string;
  numberOfImages?: number;
};

function isImageMime(mimeType?: string): boolean {
  if (!mimeType) return false;
  return (
    mimeType.startsWith("image/") &&
    ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType)
  );
}

export async function generateImages(params: GenerateImagesParams): Promise<Buffer[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const parts: any[] = [{ text: params.aspectRatio ? `${params.prompt}\n\nAspect ratio: ${params.aspectRatio}` : params.prompt }];

  for (const img of params.referenceImages ?? []) {
    // Default to PNG for reference images; callers can pre-encode if needed.
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: Buffer.from(img).toString("base64"),
      },
    });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      candidateCount: params.numberOfImages ?? 1,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini generateContent failed (${res.status}): ${text}`);
  }

  const json: any = await res.json();

  const buffers: Buffer[] = [];
  for (const cand of json.candidates ?? []) {
    for (const part of cand?.content?.parts ?? []) {
      const inlineData = part?.inlineData;
      if (inlineData?.data && isImageMime(inlineData?.mimeType)) {
        buffers.push(Buffer.from(inlineData.data, "base64"));
      }
    }
  }

  if (!buffers.length) {
    throw new Error("Gemini did not return any image inlineData parts");
  }

  return buffers;
}

export function getAvailableModels(): string[] {
  return ["gemini-2.0-flash-exp", "gemini-2.0-flash-preview-image-generation"];
}

export async function testApiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Minimal call: list models from the API to validate the key.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini list models failed (${res.status}): ${text}`);
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
