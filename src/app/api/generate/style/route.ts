import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mediaFiles, projects, userApiKeys, users } from "@/db/schema";
import { checkCredits, deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { compileStyleValues } from "@/lib/prompts/compile-style";
import { buildStyleGenerationPrompt } from "@/lib/prompts/style-generation";
import { generateImages } from "@/lib/gemini";
import { uploadMedia } from "@/lib/r2";
import type { NamedStyle, StyleDraft, StyleParameters, VisualStyle } from "@/types/style";
import { getActiveValue } from "@/types/style";

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  styleId: z.string().uuid(),
  model: z.string().optional(),
});

const STYLE_SUBJECTS = ["character", "object", "environment"] as const;

type StyleSubject = (typeof STYLE_SUBJECTS)[number];

async function resolveApiKey(userId: string): Promise<string> {
  const [row] = await db
    .select({ encryptedKey: userApiKeys.encryptedKey })
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, "google"), eq(userApiKeys.isValid, true)))
    .limit(1);

  const key = row?.encryptedKey ?? process.env.GOOGLE_GEMINI_API_KEY ?? "";
  if (!key) throw new Error("Missing Gemini API key");
  return key;
}

function toPromptStyle(style: VisualStyle) {
  return {
    visualMedium: style.medium ?? "",
    filmFormat: style.filmFormat ?? "",
    filmGrain: style.filmGrain ?? "",
    depthOfField: style.depthOfField ?? "",
    motion: getActiveValue(style, "motion"),
    lighting: getActiveValue(style, "lighting"),
    colorPalette: getActiveValue(style, "colorPalette"),
    aesthetic: getActiveValue(style, "aesthetic"),
    atmosphere: getActiveValue(style, "atmosphere"),
    mood: getActiveValue(style, "mood"),
    texture: getActiveValue(style, "texture"),
    detailLevel: String(style.detailLevel ?? ""),
    customPrompt: style.customPrompt ?? "",
  };
}

function buildParameters(style: VisualStyle): StyleParameters {
  return {
    medium: style.medium,
    filmFormat: style.filmFormat ?? null,
    filmGrain: style.filmGrain ?? null,
    depthOfField: style.depthOfField ?? null,
    detailLevel: style.detailLevel ?? 0,
    values: {
      lighting: getActiveValue(style, "lighting"),
      colorPalette: getActiveValue(style, "colorPalette"),
      aesthetic: getActiveValue(style, "aesthetic"),
      atmosphere: getActiveValue(style, "atmosphere"),
      mood: getActiveValue(style, "mood"),
      motion: getActiveValue(style, "motion"),
      texture: getActiveValue(style, "texture"),
    },
    aspectRatio: style.aspectRatio,
  };
}

function buildPromptSummary(prompts: Record<StyleSubject, string>): string {
  return [
    `Character prompt:\n${prompts.character}`,
    `Object prompt:\n${prompts.object}`,
    `Environment prompt:\n${prompts.environment}`,
  ].join("\n\n");
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

  const { projectId, styleId, model } = parsed.data;

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
  const styleEntry = styles.find((style) => style.id === styleId);

  if (!styleEntry) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  const creditsNeeded = CREDIT_COSTS.styleGeneration;
  const creditCheck = await checkCredits(userId, creditsNeeded);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Insufficient credits", credits: creditCheck.credits },
      { status: 402 },
    );
  }

  const apiKey = await resolveApiKey(userId);
  const styleValues = compileStyleValues(toPromptStyle(styleEntry.style));
  const prompts = {
    character: buildStyleGenerationPrompt(styleValues, "character"),
    object: buildStyleGenerationPrompt(styleValues, "object"),
    environment: buildStyleGenerationPrompt(styleValues, "environment"),
  } as const;

  const modelToUse = model ?? "gemini-2.0-flash-exp";
  const aspectRatio = styleEntry.style.aspectRatio ?? "1:1";

  try {
    const [characterImages, objectImages, environmentImages] = await Promise.all([
      generateImages({
        prompt: prompts.character,
        model: modelToUse,
        apiKey,
        aspectRatio,
        numberOfImages: 1,
      }),
      generateImages({
        prompt: prompts.object,
        model: modelToUse,
        apiKey,
        aspectRatio,
        numberOfImages: 1,
      }),
      generateImages({
        prompt: prompts.environment,
        model: modelToUse,
        apiKey,
        aspectRatio,
        numberOfImages: 1,
      }),
    ]);

    const buffers = [characterImages[0], objectImages[0], environmentImages[0]].filter(
      (buffer): buffer is Buffer => !!buffer,
    );

    if (buffers.length !== 3) {
      throw new Error("Style generation returned incomplete image set");
    }

    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();
    const draftIndex = styleEntry.style.draftHistory?.length ?? 0;

    const uploaded = await Promise.all(
      buffers.map(async (buffer, index) => {
        const upload = await uploadMedia({
          userId,
          projectId,
          entityType: "style",
          entityId: styleEntry.id,
          draftIndex,
          imageIndex: index,
          body: buffer,
          contentType: "image/png",
          filename: `style-${draftId}-${index}.png`,
        });

        await db.insert(mediaFiles).values({
          projectId,
          userId,
          entityType: "style",
          entityId: styleEntry.id,
          draftIndex,
          imageIndex: index,
          r2Key: upload.r2Key,
          fileType: "image/png",
          sizeBytes: buffer.length,
        });

        return { url: upload.publicUrl, size: buffer.length };
      }),
    );

    const draft: StyleDraft = {
      id: draftId,
      examples: uploaded.map((item) => item.url),
      parameters: buildParameters(styleEntry.style),
      prompt: buildPromptSummary(prompts),
      aiModel: modelToUse,
      createdAt: now,
    };

    const updatedStyle: NamedStyle = {
      ...styleEntry,
      style: {
        ...styleEntry.style,
        currentDraft: draft,
        draftHistory: [...(styleEntry.style.draftHistory ?? []), draft].slice(-50),
      },
      lastUsedAt: now,
    };

    const updatedStyles = styles.map((style) =>
      style.id === styleEntry.id ? updatedStyle : style,
    );

    const updatedProjectData = {
      ...projectData,
      styles: updatedStyles,
      updatedAt: now,
    };

    const totalBytes = uploaded.reduce((sum, item) => sum + item.size, 0);

    await db
      .update(projects)
      .set({
        projectData: updatedProjectData,
        updatedAt: sql`now()`,
        storageUsed: sql`${projects.storageUsed} + ${totalBytes}`,
      })
      .where(eq(projects.id, projectId));

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
      "style_generation",
      draftId,
    );

    return NextResponse.json({
      draft,
      creditsUsed: creditsNeeded,
      creditsRemaining: creditResult.credits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Generation failed" },
      { status: 500 },
    );
  }
}
