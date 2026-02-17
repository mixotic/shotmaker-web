const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export type ImageModelId =
  | "gemini-2.0-flash-exp-image-generation"
  | "gemini-2.5-flash-image"
  | "nano-banana-pro-preview"
  | "imagen-4.0-generate-001"
  | "imagen-4.0-ultra-generate-001"
  | "imagen-4.0-fast-generate-001";

export type VideoModelId =
  | "veo-2.0-generate-001"
  | "veo-3.0-generate-001"
  | "veo-3.0-fast-generate-001"
  | "veo-3.1-generate-preview"
  | "veo-3.1-fast-generate-preview";

export const IMAGE_MODELS: { id: ImageModelId; label: string; method: "generateContent" | "predict" }[] = [
  { id: "gemini-2.0-flash-exp-image-generation", label: "Gemini 2.0 Flash Image", method: "generateContent" },
  { id: "gemini-2.5-flash-image", label: "Nano Banana 2.5 Flash", method: "generateContent" },
  { id: "nano-banana-pro-preview", label: "Nano Banana 3 Pro", method: "generateContent" },
  { id: "imagen-4.0-fast-generate-001", label: "Imagen 4 Fast", method: "predict" },
  { id: "imagen-4.0-generate-001", label: "Imagen 4", method: "predict" },
  { id: "imagen-4.0-ultra-generate-001", label: "Imagen 4 Ultra", method: "predict" },
];

export const VIDEO_MODELS: {
  id: VideoModelId;
  label: string;
  supportsFirstFrame: boolean;
  supportsLastFrame: boolean;
  supportsReferenceImages: boolean;
  supportsExtension: boolean;
}[] = [
  { id: "veo-3.1-generate-preview", label: "Veo 3.1 Standard", supportsFirstFrame: true, supportsLastFrame: true, supportsReferenceImages: true, supportsExtension: true },
  { id: "veo-3.1-fast-generate-preview", label: "Veo 3.1 Fast", supportsFirstFrame: true, supportsLastFrame: true, supportsReferenceImages: false, supportsExtension: true },
  { id: "veo-3.0-generate-001", label: "Veo 3 Standard", supportsFirstFrame: true, supportsLastFrame: false, supportsReferenceImages: false, supportsExtension: true },
  { id: "veo-3.0-fast-generate-001", label: "Veo 3 Fast", supportsFirstFrame: true, supportsLastFrame: false, supportsReferenceImages: false, supportsExtension: true },
  { id: "veo-2.0-generate-001", label: "Veo 2", supportsFirstFrame: true, supportsLastFrame: false, supportsReferenceImages: false, supportsExtension: true },
];

type GenerateImagesParams = {
  prompt: string;
  model: string;
  apiKey: string;
  referenceImages?: Buffer[];
  aspectRatio?: string;
  numberOfImages?: number;
};

type GenerateVideoParams = {
  prompt: string;
  model: string;
  apiKey: string;
  aspectRatio?: string;
  resolution?: string;
  durationSeconds?: number;
  firstFrame?: Buffer;
  lastFrame?: Buffer;
  referenceImages?: Buffer[];
  extensionVideoUri?: string;
};

type VideoGenerationResult = {
  operationName: string;
};

type VideoStatusResult = {
  done: boolean;
  videoBuffer?: Buffer;
  videoUri?: string;
  mimeType?: string;
  error?: string;
};

function isImageMime(mimeType?: string): boolean {
  if (!mimeType) return false;
  return (
    mimeType.startsWith("image/") &&
    ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType)
  );
}

function getModelMethod(modelId: string): "generateContent" | "predict" {
  const entry = IMAGE_MODELS.find((m) => m.id === modelId);
  return entry?.method ?? "generateContent";
}

async function generateViaGenerateContent(params: GenerateImagesParams): Promise<Buffer[]> {
  const url = `${BASE_URL}/models/${params.model}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const parts: any[] = [
    { text: params.aspectRatio ? `${params.prompt}\n\nAspect ratio: ${params.aspectRatio}` : params.prompt },
  ];

  for (const img of params.referenceImages ?? []) {
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
    const textParts: string[] = [];
    for (const cand of json.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        if (part?.text) textParts.push(part.text.substring(0, 200));
      }
    }
    const hint = textParts.length
      ? ` Model returned text instead: "${textParts[0]}..."`
      : "";
    throw new Error(`Gemini did not return any image data.${hint}`);
  }

  return buffers;
}

async function generateViaPredict(params: GenerateImagesParams): Promise<Buffer[]> {
  const url = `${BASE_URL}/models/${params.model}:predict?key=${encodeURIComponent(params.apiKey)}`;

  const instance: any = { prompt: params.prompt };

  if (params.referenceImages?.length) {
    instance.referenceImages = params.referenceImages.map((img) => ({
      referenceType: "asset",
      image: {
        bytesBase64Encoded: Buffer.from(img).toString("base64"),
        mimeType: "image/png",
      },
    }));
  }

  const body: any = {
    instances: [instance],
    parameters: {
      sampleCount: params.numberOfImages ?? 1,
      aspectRatio: params.aspectRatio ?? "1:1",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Imagen predict failed (${res.status}): ${text}`);
  }

  const json: any = await res.json();

  const buffers: Buffer[] = [];
  for (const prediction of json.predictions ?? []) {
    if (prediction?.bytesBase64Encoded) {
      buffers.push(Buffer.from(prediction.bytesBase64Encoded, "base64"));
    }
  }

  if (!buffers.length) {
    throw new Error("Imagen did not return any image data");
  }

  return buffers;
}

export function isValidImageModel(modelId: string): boolean {
  return IMAGE_MODELS.some((m) => m.id === modelId);
}

export function isValidVideoModel(modelId: string): boolean {
  return VIDEO_MODELS.some((m) => m.id === modelId);
}

export async function generateImages(params: GenerateImagesParams): Promise<Buffer[]> {
  const method = getModelMethod(params.model);
  if (method === "predict") {
    return generateViaPredict(params);
  }
  return generateViaGenerateContent(params);
}

export async function startVideoGeneration(params: GenerateVideoParams): Promise<VideoGenerationResult> {
  const url = `${BASE_URL}/models/${params.model}:predictLongRunning`;

  const instance: any = { prompt: params.prompt };

  if (params.firstFrame) {
    instance.image = {
      bytesBase64Encoded: Buffer.from(params.firstFrame).toString("base64"),
      mimeType: "image/jpeg",
    };
  }

  if (params.lastFrame) {
    instance.lastFrame = {
      bytesBase64Encoded: Buffer.from(params.lastFrame).toString("base64"),
      mimeType: "image/jpeg",
    };
  }

  if (params.referenceImages?.length) {
    instance.referenceImages = params.referenceImages.map((img) => ({
      referenceType: "asset",
      image: {
        bytesBase64Encoded: Buffer.from(img).toString("base64"),
        mimeType: "image/jpeg",
      },
    }));
  }

  if (params.extensionVideoUri) {
    instance.video = {
      uri: params.extensionVideoUri,
    };
  }

  const body: any = {
    instances: [instance],
    parameters: {
      aspectRatio: params.aspectRatio ?? "16:9",
      resolution: params.resolution ?? "720p",
      durationSeconds: params.durationSeconds ?? 8,
      sampleCount: 1,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": params.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Veo predictLongRunning failed (${res.status}): ${text}`);
  }

  const json: any = await res.json();
  if (!json.name) {
    throw new Error("Veo did not return an operation name");
  }

  return { operationName: json.name };
}

export async function pollVideoStatus(operationName: string, apiKey: string): Promise<VideoStatusResult> {
  const url = `${BASE_URL}/${operationName}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Veo poll failed (${res.status}): ${text}`);
  }

  const json: any = await res.json();

  if (json.error) {
    return { done: true, error: json.error.message ?? JSON.stringify(json.error) };
  }

  if (!json.done) {
    return { done: false };
  }

  const predictions = json.response?.predictions ?? [];
  const video = predictions[0]?.video;
  if (video?.bytesBase64Encoded) {
    return {
      done: true,
      videoBuffer: Buffer.from(video.bytesBase64Encoded, "base64"),
      videoUri: video.uri,
      mimeType: video.mimeType ?? "video/mp4",
    };
  }

  if (video?.uri) {
    return {
      done: true,
      videoUri: video.uri,
      mimeType: video.mimeType ?? "video/mp4",
    };
  }

  return { done: true, error: "Veo completed but returned no video data" };
}

export function getAvailableImageModels() {
  return IMAGE_MODELS;
}

export function getAvailableVideoModels() {
  return VIDEO_MODELS;
}

export async function testApiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `${BASE_URL}/models?key=${encodeURIComponent(apiKey)}`;
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
