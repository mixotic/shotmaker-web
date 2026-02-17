import type { Asset, UUID as AssetUUID } from "./asset";
import type { CameraParameters } from "./camera";
import type { NamedStyle, UUID } from "./style";

export type ISODateString = string;

export interface FrameDraft {
  id: UUID;
  images: string[];
  prompt: string;
  aiModel: string;
  cameraParameters?: CameraParameters;
  selectedStyleId?: UUID;
  createdAt: ISODateString;
  notes?: string;
}

export interface ShotDraft {
  id: UUID;
  images: string[];
  prompt: string;
  aiModel: string;
  createdAt: ISODateString;
  notes?: string;
}

export interface Frame {
  id: UUID;
  name: string;
  description?: string;

  assetIds: AssetUUID[];
  cameraParameters?: CameraParameters;

  /** Seconds. */
  duration?: number;

  selectedStyleId?: UUID;

  draftHistory: FrameDraft[];
  primaryDraftIndex?: number;

  createdAt: ISODateString;
}

export interface Shot {
  id: UUID;
  name: string;
  description?: string;
  narrative?: string;

  frameIds: UUID[];

  draftHistory: ShotDraft[];
  primaryDraftIndex?: number;

  createdAt: ISODateString;
}

export interface Project {
  id: UUID;
  name: string;
  description?: string;

  styles: NamedStyle[];
  defaultStyleId?: UUID;

  assets: Asset[];
  frames: Frame[];
  shots: Shot[];

  /** e.g. "openai", "fal", "replicate", "local" */
  defaultImageProvider?: string;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

const newId = (): UUID => {
  const c: any = globalThis as any;
  if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

export const createEmptyProject = (name: string): Project => {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name,
    description: "",
    styles: [],
    defaultStyleId: undefined,
    assets: [],
    frames: [],
    shots: [],
    defaultImageProvider: "",
    createdAt: now,
    updatedAt: now,
  };
};
