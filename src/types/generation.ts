import type { CameraParameters } from "./camera";
import type { StyleParameters } from "./style";

export type UUID = string;
export type ISODateString = string;
export type MediaUrl = string;

export type GenerationKind = "style" | "asset" | "frame" | "shot";

export type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled";

export interface GenerationRequest {
  id: UUID;
  kind: GenerationKind;

  /** Prompt text sent to the image model/provider. */
  prompt: string;
  negativePrompt?: string;

  /** Optional camera hints (commonly used for frames). */
  cameraParameters?: CameraParameters;

  /** Optional style snapshot used for this request. */
  style?: StyleParameters;

  /** Provider/model selection */
  provider: string;
  aiModel: string;

  /** Optional linkage */
  projectId?: UUID;
  styleId?: UUID;
  assetId?: UUID;
  frameId?: UUID;
  shotId?: UUID;

  /** Media references (URLs). */
  referenceImages?: MediaUrl[];

  createdAt: ISODateString;
}

export interface GenerationResponse {
  id: UUID;
  requestId: UUID;
  status: GenerationStatus;

  /** Output media URLs when succeeded. */
  images: MediaUrl[];

  /** Provider metadata for debugging / audits. */
  provider?: string;
  aiModel?: string;

  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };

  startedAt?: ISODateString;
  completedAt?: ISODateString;
}
