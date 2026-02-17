import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const R2_BUCKET = requiredEnv("R2_BUCKET");
const R2_PUBLIC_URL = requiredEnv("R2_PUBLIC_URL").replace(/\/+$/, "");

const r2 = new S3Client({
  region: "auto",
  endpoint: requiredEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
  },
});

export function getMediaUrl(r2Key: string): string {
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

function extFromContentType(contentType?: string): string {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("gif")) return "gif";
  return "bin";
}

function extFromFilename(filename?: string): string | undefined {
  if (!filename) return undefined;
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m?.[1];
}

export type UploadMediaParams = {
  userId: string;
  projectId: string;
  entityType: string;
  entityId: string;
  draftIndex?: number;
  imageIndex?: number;
  body: Buffer | Uint8Array;
  contentType?: string;
  filename?: string;
};

export async function uploadMedia(params: UploadMediaParams): Promise<{
  r2Key: string;
  publicUrl: string;
}> {
  const draftIndex = params.draftIndex ?? 0;
  const imageIndex = params.imageIndex ?? 0;
  const ext =
    extFromFilename(params.filename) ?? extFromContentType(params.contentType);

  const r2Key = `${params.userId}/${params.projectId}/${params.entityType}/${params.entityId}/draft-${draftIndex}-${imageIndex}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return { r2Key, publicUrl: getMediaUrl(r2Key) };
}

export async function deleteMedia(r2Key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    }),
  );
}

export async function deleteProjectMedia(projectId: string): Promise<number> {
  // Keys are stored as {userId}/{projectId}/..., so we list by `/${projectId}/`
  // across all user prefixes by listing the bucket and filtering client-side.
  // For predictable deletes, prefer storing the full key list in DB.
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (res.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.includes(`/${projectId}/`));

    if (keys.length) {
      // Delete in chunks of 1000
      for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000);
        const delRes = await r2.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET,
            Delete: { Objects: chunk.map((Key) => ({ Key })) },
          }),
        );
        deleted += delRes.Deleted?.length ?? chunk.length;
      }
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return deleted;
}

export type PresignedUploadParams = {
  userId: string;
  projectId: string;
  entityType: string;
  entityId: string;
  draftIndex?: number;
  imageIndex?: number;
  contentType: string;
  filename?: string;
  expiresInSeconds?: number;
};

export async function generatePresignedUploadUrl(
  params: PresignedUploadParams,
): Promise<{ url: string; r2Key: string; publicUrl: string }> {
  const draftIndex = params.draftIndex ?? 0;
  const imageIndex = params.imageIndex ?? 0;
  const ext = extFromFilename(params.filename) ?? extFromContentType(params.contentType);
  const r2Key = `${params.userId}/${params.projectId}/${params.entityType}/${params.entityId}/draft-${draftIndex}-${imageIndex}.${ext}`;

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      ContentType: params.contentType,
    }),
    { expiresIn: params.expiresInSeconds ?? 900 },
  );

  return { url, r2Key, publicUrl: getMediaUrl(r2Key) };
}
