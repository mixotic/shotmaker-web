import {
  DepthOfField,
  FilmFormat,
  FilmGrain,
  ImageAspectRatio,
  Medium,
  StyleParamKey,
} from "./enums";

export type UUID = string;
export type ISODateString = string;
export type MediaUrl = string;

export interface StyleParameterValues {
  lighting: string;
  colorPalette: string;
  aesthetic: string;
  atmosphere: string;
  mood: string;
  motion: string;
  texture: string;
}

export interface StyleParameters {
  // Core style
  medium: Medium;
  filmFormat: FilmFormat | null;
  filmGrain: FilmGrain | null;
  depthOfField: DepthOfField | null;
  detailLevel: number;

  // 7 style params
  values: StyleParameterValues;

  // Presentation / output
  aspectRatio: ImageAspectRatio;
}

export interface StyleDraft {
  id: UUID;
  examples: MediaUrl[];
  parameters: StyleParameters;
  prompt: string;
  aiModel: string;
  createdAt: ISODateString;
  notes?: string;
}

export interface StyleReference {
  id: UUID;
  examples: MediaUrl[];
  parameters: StyleParameters;
  prompt: string;
  savedAt: ISODateString;
  modifiedAt?: ISODateString;
  notes?: string;
}

/**
 * VisualStyle is the editable live style state.
 * Includes both preset/manual storage for the 7 style parameters.
 */
export interface VisualStyle {
  // Core params
  medium: Medium;
  filmFormat: FilmFormat | null;
  filmGrain: FilmGrain | null;
  depthOfField: DepthOfField | null;
  detailLevel: number; // 0-100

  // 7 style params are stored in preset/manual “banks”, plus per-param override switches.
  presetValues: StyleParameterValues;
  manualValues: StyleParameterValues;
  useManual: Record<StyleParamKey, boolean>;

  // UI
  isAdvancedMode: boolean;
  aspectRatio: ImageAspectRatio;

  // Draft / reference system
  currentDraft?: StyleDraft | null;
  draftHistory: StyleDraft[];
  reference?: StyleReference | null;
}

export interface NamedStyle {
  id: UUID;
  name: string;
  style: VisualStyle;
  createdAt: ISODateString;
  lastUsedAt?: ISODateString;
}

const newId = (): UUID => {
  // Browser + modern runtimes
  const c: any = globalThis as any;
  if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  // Fallback (not a real UUID, but stable enough for local drafts)
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

export const createDefaultVisualStyle = (): VisualStyle => {
  const empty: StyleParameterValues = {
    lighting: "",
    colorPalette: "",
    aesthetic: "",
    atmosphere: "",
    mood: "",
    motion: "",
    texture: "",
  };

  return {
    medium: Medium.photorealistic,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 80,

    presetValues: { ...empty },
    manualValues: { ...empty },
    useManual: {
      lighting: false,
      colorPalette: false,
      aesthetic: false,
      atmosphere: false,
      mood: false,
      motion: false,
      texture: false,
    },

    isAdvancedMode: false,
    aspectRatio: ImageAspectRatio.landscape169,

    currentDraft: null,
    draftHistory: [],
    reference: null,
  };
};

export const createNamedStyle = (name: string): NamedStyle => {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name,
    style: createDefaultVisualStyle(),
    createdAt: now,
    lastUsedAt: now,
  };
};

export const getActiveValue = (
  style: VisualStyle,
  param: StyleParamKey,
): string => {
  return style.useManual[param] ? style.manualValues[param] : style.presetValues[param];
};
