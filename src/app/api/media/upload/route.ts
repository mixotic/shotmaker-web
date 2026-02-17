import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { generatePresignedUploadUrl } from "@/lib/r2";

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  draftIndex: z.number().int().nonnegative().optional(),
  imageIndex: z.number().int().nonnegative().optional(),
  contentType: z.string().min(1),
  filename: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const userId = (session.user as any).id as string;
  const {
    projectId,
    entityType,
    entityId,
    draftIndex,
    imageIndex,
    contentType,
    filename,
  } = parsed.data;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const upload = await generatePresignedUploadUrl({
    userId,
    projectId,
    entityType,
    entityId,
    draftIndex,
    imageIndex,
    contentType,
    filename,
  });

  return NextResponse.json({ url: upload.url, key: upload.r2Key });
}
