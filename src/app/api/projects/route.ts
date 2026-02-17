import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  pro: 999,
  team: 999,
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      storageUsed: projects.storageUsed,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      projectData: projects.projectData,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  const result = rows.map((r) => {
    const data = r.projectData as any;
    return {
      ...r,
      assetCount: data?.assets?.length ?? 0,
      projectData: undefined,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const plan = (session.user as any).plan ?? "free";
  const limit = PLAN_PROJECT_LIMITS[plan] ?? 1;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.userId, userId));

  if (count >= limit) {
    return NextResponse.json(
      { error: `Project limit reached for ${plan} plan (${limit})` },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const emptyProjectData = {
    styles: [],
    defaultStyleId: null,
    assets: [],
    frames: [],
    shots: [],
    defaultImageProvider: null,
    createdAt: now,
    updatedAt: now,
  };

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      name: parsed.data.name,
      description: parsed.data.description,
      projectData: emptyProjectData,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
