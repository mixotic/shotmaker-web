import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { generationLog, mediaFiles, projects, userApiKeys, users } from "@/db/schema";
import { buildAssetGenerationPrompt, buildRefinementPrompt } from "@/lib/prompts/asset-generation";
import { generateImages, isValidImageModel } from "@/lib/gemini";
import { uploadMedia } from "@/lib/r2";

const isR2Configured = () =>
  !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
import { checkCredits, deductCredits, CREDIT_COSTS } from "@/lib/credits";
import type { Asset, AssetDraft, AssetParameters, ConversationMessage } from "@/types/asset";
import type { NamedStyle } from "@/types/style";
import { getActiveValue } from "@/types/style";

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  assetId: z.string().uuid().nullable().optional(),
  assetType: z.enum(["character", "object", "set"]),
  attributes: z.record(z.unknown()).optional().default({}),
  name: z.string().optional(),
  description: z.string().optional().default(""),
  selectedStyleId: z.string().uuid().optional().nullable(),
  model: z.string().optional(),
  referenceImageUrls: z.array(z.string().url()).optional().default([]),
  conversationHistory: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(["system", "user", "assistant"]),
        text: z.string(),
        imageUrl: z.string().optional(),
        timestamp: z.string().optional(),
      }),
    )
    .optional(),
  isRefinement: z.boolean().optional().default(false),
  refinementPrompt: z.string().optional(),
});

type AssetType = z.infer<typeof RequestSchema>["assetType"];

type StyleValues = Record<string, string>;

function compileStyleValues(style: NamedStyle["style"]): StyleValues {
  return {
    VISUAL_MEDIUM: style.medium ?? "",
    FILM_FORMAT: style.filmFormat ?? "",
    FILM_GRAIN: style.filmGrain ?? "",
    DEPTH_OF_FIELD: style.depthOfField ?? "",
    LIGHTING: getActiveValue(style, "lighting"),
    COLOR_PALETTE: getActiveValue(style, "colorPalette"),
    AESTHETIC: getActiveValue(style, "aesthetic"),
    ATMOSPHERE: getActiveValue(style, "atmosphere"),
    MOOD: getActiveValue(style, "mood"),
    MOTION: getActiveValue(style, "motion"),
    TEXTURE: getActiveValue(style, "texture"),
    DETAIL_LEVEL: String(style.detailLevel ?? ""),
    CUSTOM_PROMPT: "",
  };
}

function formatConversationHistory(history?: ConversationMessage[]): string {
  if (!history?.length) return "";
  const lines = history.map((msg) => `${msg.role.toUpperCase()}: ${msg.text}`);
  return `\n\nConversation history:\n${lines.join("\n")}`;
}

function resolveCreditCost(type: AssetType, isRefinement: boolean): number {
  if (isRefinement) return CREDIT_COSTS.assetRefinement;
  if (type === "set") return CREDIT_COSTS.setAsset;
  return CREDIT_COSTS.characterAsset;
}

function formatAttributes(attributes: Record<string, unknown>): string {
  const entries = Object.entries(attributes).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

  if (!entries.length) return "";
  const lines = entries.map(([key, value]) => `- ${key}: ${String(value)}`);
  return `\n\nAsset attributes:\n${lines.join("\n")}`;
}

async function resolveApiKey(userId: string): Promise<string> {
  const [row] = await db
    .select({ encryptedKey: userApiKeys.encryptedKey })
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, "google"), eq(userApiKeys.isValid, true)))
    .limit(1);

  const envKey =
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

  const key = row?.encryptedKey ?? envKey;
  if (!key) throw new Error("Missing Gemini API key");
  return key;
}

async function fetchReferenceBuffers(urls: string[]): Promise<Buffer[]> {
  if (!urls.length) return [];
  const results = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }),
  );
  return results.filter((buf): buf is Buffer<ArrayBuffer> => buf !== null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const {
    projectId,
    assetId,
    assetType,
    attributes,
    name,
    description,
    selectedStyleId,
    model,
    referenceImageUrls,
    conversationHistory,
    isRefinement,
    refinementPrompt,
  } = parsed.data;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectData = (project.projectData ?? {}) as any;
  const styles = (projectData.styles ?? []) as NamedStyle[];
  const resolvedStyleId =
    selectedStyleId ?? projectData.defaultStyleId ?? styles[0]?.id;
  const styleEntry = styles.find((style) => style.id === resolvedStyleId);

  if (!styleEntry) {
    return NextResponse.json({ error: "Style not found" }, { status: 400 });
  }

  const creditsNeeded = resolveCreditCost(assetType, isRefinement);
  const creditCheck = await checkCredits(userId, creditsNeeded);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", credits: creditCheck.credits },
      { status: 402 },
    );
  }

  const apiKey = await resolveApiKey(userId);
  const styleValues = compileStyleValues(styleEntry.style);

  const assets = (projectData.assets ?? []) as Asset[];
  const existingAsset = assetId
    ? assets.find((asset) => asset.id === assetId)
    : null;

  const assetName = name?.trim() || existingAsset?.name || "Untitled Asset";
  const assetDescription = description?.trim() || existingAsset?.description || "";

  const basePrompt = buildAssetGenerationPrompt({
    type: assetType,
    name: assetName,
    description: assetDescription,
    styleValues,
  }) + formatAttributes(attributes);

  let prompt = basePrompt;
  if (isRefinement && refinementPrompt?.trim()) {
    const originalPrompt =
      existingAsset?.currentDraft?.parameters?.prompt ||
      existingAsset?.prompt ||
      basePrompt;

    prompt = buildRefinementPrompt({
      type: assetType,
      originalPrompt,
      instructions: refinementPrompt.trim(),
      styleValues,
    });

    prompt += formatConversationHistory(conversationHistory as ConversationMessage[] | undefined);
  }

  const modelToUse = model ?? "gemini-2.5-flash-image";
  if (model && !isValidImageModel(modelToUse)) {
    return NextResponse.json({ error: "Invalid image model selected" }, { status: 400 });
  }

  const generationId = crypto.randomUUID();
  const startedAt = Date.now();

  await db.insert(generationLog).values({
    id: generationId,
    userId,
    projectId,
    entityType: "asset",
    entityId: assetId ?? null,
    generationType: isRefinement ? "asset_refinement" : "asset",
    model: model ?? null,
    creditsUsed: creditsNeeded,
    status: "running",
  });

  try {
    const referenceBuffers = await fetchReferenceBuffers(referenceImageUrls);
    const images = await generateImages({
      prompt,
      model: modelToUse,
      apiKey,
      referenceImages: referenceBuffers,
      aspectRatio: assetType === "set" ? "16:9" : "4:3",
      numberOfImages: 1,
    });

    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();

    const draftIndex = existingAsset?.draftHistory?.length ?? 0;
    const entityIdForStorage = assetId ?? draftId;

    const uploaded = await Promise.all(
      images.map(async (buffer, index) => {
        if (isR2Configured()) {
          const upload = await uploadMedia({
            userId,
            projectId,
            entityType: "asset",
            entityId: entityIdForStorage,
            draftIndex,
            imageIndex: index,
            body: buffer,
            contentType: "image/png",
            filename: `asset-${draftId}-${index}.png`,
          });

          await db.insert(mediaFiles).values({
            projectId,
            userId,
            entityType: "asset",
            entityId: entityIdForStorage,
            draftIndex,
            imageIndex: index,
            r2Key: upload.r2Key,
            fileType: "image/png",
            sizeBytes: buffer.length,
          });

          return { url: upload.publicUrl, size: buffer.length };
        } else {
          const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
          return { url: dataUrl, size: buffer.length };
        }
      }),
    );

    const parameters: AssetParameters = {
      prompt,
      attributes,
      aiModel: modelToUse,
      usedReference: referenceImageUrls.length > 0,
    };

    const draft: AssetDraft = {
      id: draftId,
      name: assetName,
      description: assetDescription,
      images: uploaded.map((item) => item.url),
      parameters,
      createdAt: now,
      conversationHistory: conversationHistory
        ? { messages: conversationHistory.map((m) => ({ ...m, id: m.id ?? crypto.randomUUID(), timestamp: m.timestamp ?? now })) }
        : undefined,
    };

    let creditsRemaining = creditCheck.credits;
    let updatedProjectData = projectData;
    const totalBytes = uploaded.reduce((sum, item) => sum + item.size, 0);

    if (existingAsset) {
      const nextConversation = conversationHistory?.length
        ? { messages: conversationHistory.map((m) => ({ ...m, id: m.id ?? crypto.randomUUID(), timestamp: m.timestamp ?? now })) }
        : existingAsset.conversationHistory;

      const updatedAsset: Asset = {
        ...existingAsset,
        name: assetName,
        description: assetDescription,
        attributeSet: {
          ...(existingAsset.attributeSet ?? {}),
          ...(attributes as any),
        },
        selectedStyleId: resolvedStyleId ?? existingAsset.selectedStyleId,
        prompt,
        currentDraft: draft,
        draftHistory: [...(existingAsset.draftHistory ?? []), draft].slice(-50),
        conversationHistory: nextConversation,
        updatedAt: now,
      };

      const nextAssets = assets.map((asset) =>
        asset.id === existingAsset.id ? updatedAsset : asset,
      );

      updatedProjectData = {
        ...projectData,
        assets: nextAssets,
        updatedAt: now,
      };

      await db
        .update(projects)
        .set({
          projectData: updatedProjectData,
          updatedAt: sql`now()`,
          storageUsed: sql`${projects.storageUsed} + ${totalBytes}`,
        })
        .where(eq(projects.id, projectId));
    } else {
      await db
        .update(projects)
        .set({
          storageUsed: sql`${projects.storageUsed} + ${totalBytes}`,
        })
        .where(eq(projects.id, projectId));
    }

    if (totalBytes > 0) {
      await db
        .update(users)
        .set({
          storageUsed: sql`${users.storageUsed} + ${totalBytes}`,
        })
        .where(eq(users.id, userId));
    }

    const creditResult = await deductCredits(
      userId,
      creditsNeeded,
      isRefinement ? "asset_refinement" : "asset_generation",
      draftId,
    );
    creditsRemaining = creditResult.credits;

    await db
      .update(generationLog)
      .set({
        status: "succeeded",
        durationMs: Date.now() - startedAt,
      })
      .where(eq(generationLog.id, generationId));

    return NextResponse.json({
      draft,
      creditsUsed: creditsNeeded,
      creditsRemaining,
      projectData: existingAsset ? updatedProjectData : undefined,
    });
  } catch (error: any) {
    await db
      .update(generationLog)
      .set({
        status: "failed",
        errorMessage: error?.message ?? String(error),
        durationMs: Date.now() - startedAt,
      })
      .where(eq(generationLog.id, generationId));

    return NextResponse.json(
      { error: error?.message ?? "Generation failed" },
      { status: 500 },
    );
  }
}
