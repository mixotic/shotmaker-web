import {
  AssetType,
  CameraMovement,
  CameraPerspective,
  CharacterAge,
  CharacterBuild,
  CharacterClothing,
  CharacterExpression,
  CharacterHair,
  CharacterPosture,
  CompositionRule,
  LensType,
  LightingStyle,
  MotionBlurEffect,
  ObjectCondition,
  ObjectEra,
  ObjectFunction,
  ObjectMaterial,
  ObjectSize,
  ObjectStyle,
  SetArchitecture,
  SetAtmosphere,
  SetLocation,
  SetScale,
  SetTime,
  SetWeather,
  ShotAngle,
  ViewAngle,
} from "./enums";

export type UUID = string;
export type ISODateString = string;
export type MediaUrl = string;

export type ConversationRole = "system" | "user" | "assistant";

export interface ConversationMessage {
  id: UUID;
  role: ConversationRole;
  text: string;
  imageUrl?: MediaUrl;
  timestamp: ISODateString;
}

export interface ConversationHistory {
  messages: ConversationMessage[];
}

/**
 * All optional attribute fields across Character/Object/Set + basic camera-related hints.
 * (This is a web-friendly mirror of the desktop attribute set.)
 */
export interface AssetAttributeSet {
  // Shared / camera-ish
  viewAngle?: ViewAngle;
  shotAngle?: ShotAngle;
  cameraPerspective?: CameraPerspective;
  compositionRule?: CompositionRule;
  lensType?: LensType;
  motionBlurEffect?: MotionBlurEffect;
  lightingStyle?: LightingStyle;
  cameraMovement?: CameraMovement;

  // Character
  characterAge?: CharacterAge;
  characterBuild?: CharacterBuild;
  characterClothing?: CharacterClothing;
  characterHair?: CharacterHair;
  characterExpression?: CharacterExpression;
  characterPosture?: CharacterPosture;

  // Object
  objectSize?: ObjectSize;
  objectMaterial?: ObjectMaterial;
  objectCondition?: ObjectCondition;
  objectStyle?: ObjectStyle;
  objectEra?: ObjectEra;
  objectFunction?: ObjectFunction;

  // Set
  setLocation?: SetLocation;
  setTime?: SetTime;
  setWeather?: SetWeather;
  setScale?: SetScale;
  setArchitecture?: SetArchitecture;
  setAtmosphere?: SetAtmosphere;
}

export interface AssetParameters {
  prompt: string;
  negativePrompt?: string;
  /** A normalized, serializable snapshot of attributes used for this generation. */
  attributes: Record<string, unknown>;
  aiModel: string;
  usedReference?: boolean;
  referenceImageId?: UUID;
}

export interface AssetDraft {
  id: UUID;
  name: string;
  description?: string;
  images: MediaUrl[];
  parameters: AssetParameters;
  createdAt: ISODateString;
  notes?: string;
  conversationHistory?: ConversationHistory;
}

export interface AssetReference {
  id: UUID;
  name: string;
  description?: string;
  images: MediaUrl[];
  parameters: AssetParameters;
  savedAt: ISODateString;
  modifiedAt?: ISODateString;
  notes?: string;
}

export interface Asset {
  id: UUID;
  type: AssetType;
  name: string;
  description?: string;
  prompt?: string;

  attributeSet: AssetAttributeSet;

  /** If set, generation should use this style (otherwise project default). */
  selectedStyleId?: UUID;

  currentDraft?: AssetDraft | null;
  draftHistory: AssetDraft[];
  reference?: AssetReference | null;

  conversationHistory?: ConversationHistory;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

const newId = (): UUID => {
  const c: any = globalThis as any;
  if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

export const createEmptyAsset = (type: AssetType, name: string): Asset => {
  const now = new Date().toISOString();
  return {
    id: newId(),
    type,
    name,
    description: "",
    prompt: "",
    attributeSet: {},
    selectedStyleId: undefined,
    currentDraft: null,
    draftHistory: [],
    reference: null,
    conversationHistory: { messages: [] },
    createdAt: now,
    updatedAt: now,
  };
};
