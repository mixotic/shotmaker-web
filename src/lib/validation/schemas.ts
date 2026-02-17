import { z } from "zod";

/**
 * Flexible schema for style parameters.
 * Desktop app stores these as objects with an "active"/"activeValue" selection;
 * the web app may also pass simple strings.
 */
export const StyleParamSchema = z.union([
  z.string(),
  z.object({
    active: z.string().optional(),
    activeValue: z.string().optional(),
    value: z.string().optional(),
  }),
]);

export type StyleParam = z.infer<typeof StyleParamSchema>;

export const VisualStyleSchema = z.object({
  // Core outputs
  visualMedium: z.string().optional().default(""),
  filmFormat: z.string().optional().default(""),
  filmGrain: z.string().optional().default(""),
  depthOfField: z.string().optional().default(""),
  motion: z.string().optional().default(""),

  // Selection-driven parameters (use getActiveValue)
  lighting: StyleParamSchema.optional(),
  colorPalette: StyleParamSchema.optional(),
  aesthetic: StyleParamSchema.optional(),
  atmosphere: StyleParamSchema.optional(),
  mood: StyleParamSchema.optional(),
  texture: StyleParamSchema.optional(),
  detailLevel: StyleParamSchema.optional(),

  customPrompt: z.string().optional().default(""),
});

export type VisualStyle = z.infer<typeof VisualStyleSchema>;

export const AssetTypeSchema = z.enum(["character", "object", "set"]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const AssetSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: AssetTypeSchema,
  name: z.string().min(1),
  description: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  entityId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  projectData: z.unknown().optional().default({}),
  storageUsed: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

/** API input schemas */
export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const StyleGenerationInputSchema = z.object({
  projectId: z.string().uuid(),
  subjectType: z.enum(["character", "object", "environment"]),
  style: VisualStyleSchema,
  model: z.string().optional(),
});

export const AssetGenerationInputSchema = z.object({
  projectId: z.string().uuid(),
  type: AssetTypeSchema,
  name: z.string().min(1),
  description: z.string().optional().default(""),
  styleValues: z.record(z.string(), z.string()),
  model: z.string().optional(),
});

export const RefinementInputSchema = z.object({
  projectId: z.string().uuid(),
  type: AssetTypeSchema,
  instructions: z.string().min(1),
  styleValues: z.record(z.string(), z.string()),
  model: z.string().optional(),
});

export const PresignedUploadInputSchema = z.object({
  projectId: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  draftIndex: z.number().int().nonnegative().optional(),
  imageIndex: z.number().int().nonnegative().optional(),
  contentType: z.string().min(1),
  filename: z.string().optional(),
});
