import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

let _r2: S3Client | null = null;
function getR2(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: envOrThrow("R2_ENDPOINT"),
      credentials: {
        accessKeyId: envOrThrow("R2_ACCESS_KEY_ID"),
        secretAccessKey: envOrThrow("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _r2;
}

function getBucket(): string {
  return envOrThrow("R2_BUCKET");
}

function getPublicUrl(): string {
  return envOrThrow("R2_PUBLIC_URL").replace(/\/+$/, "");
}

export function getMediaUrl(r2Key: string): string {
  return `${getPublicUrl()}/${r2Key}`;
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

  await getR2().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: r2Key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return { r2Key, publicUrl: getMediaUrl(r2Key) };
}

export async function deleteMedia(r2Key: string): Promise<void> {
  await getR2().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
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
    const res = await getR2().send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (res.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.includes(`/${projectId}/`));

    if (keys.length) {
      for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000);
        const delRes = await getR2().send(
          new DeleteObjectsCommand({
            Bucket: getBucket(),
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
    getR2(),
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: r2Key,
      ContentType: params.contentType,
    }),
    { expiresIn: params.expiresInSeconds ?? 900 },
  );

  return { url, r2Key, publicUrl: getMediaUrl(r2Key) };
}
