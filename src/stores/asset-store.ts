import { create } from "zustand";
import type {
  Asset,
  AssetAttributeSet,
  AssetDraft,
  ConversationMessage,
} from "@/types/asset";
import { AssetType } from "@/types/enums";
import { useProjectStore } from "@/stores/project-store";

export type AssetMode = "create" | "edit";
export type AssetTypeSlug = "character" | "object" | "set";

const typeLabelToSlug = (type: AssetType): AssetTypeSlug =>
  type.toLowerCase() as AssetTypeSlug;

const typeSlugToLabel = (type: AssetTypeSlug): AssetType => {
  const label = type[0]?.toUpperCase() + type.slice(1);
  return label as AssetType;
};

const newId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

interface AssetStoreState {
  mode: AssetMode;
  assetId: string | null;
  assetType: AssetTypeSlug;
  name: string;
  description: string;
  attributes: AssetAttributeSet;
  selectedStyleId: string | null;
  selectedModel: string;
  drafts: AssetDraft[];
  currentDraftIndex: number;
  primaryDraftIndex: number;
  isGenerating: boolean;
  generationProgress: string;
  conversationHistory: ConversationMessage[];
  hasUnsavedChanges: boolean;

  initCreate: (type: AssetTypeSlug) => void;
  initEdit: (asset: Asset) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setSelectedStyleId: (styleId: string | null) => void;
  setSelectedModel: (model: string) => void;
  setAttribute: (key: keyof AssetAttributeSet | string, value: string) => void;
  navigateDraft: (direction: "prev" | "next") => void;
  setCurrentDraftIndex: (index: number) => void;
  setPrimaryDraft: (index: number) => void;
  deleteDraft: (index: number) => void;
  generate: (options: {
    projectId: string;
    referenceImageUrls: string[];
    isRefinement?: boolean;
    refinementPrompt?: string;
  }) => Promise<AssetDraft | null>;
  refine: (options: {
    projectId: string;
    referenceImageUrls: string[];
    prompt: string;
  }) => Promise<AssetDraft | null>;
  saveToLibrary: (projectId: string) => void;
  saveAsNew: (projectId: string) => void;
}

export const useAssetStore = create<AssetStoreState>((set, get) => ({
  mode: "create",
  assetId: null,
  assetType: "character",
  name: "",
  description: "",
  attributes: {},
  selectedStyleId: null,
  selectedModel: "gemini-2.5-flash-image",
  drafts: [],
  currentDraftIndex: 0,
  primaryDraftIndex: 0,
  isGenerating: false,
  generationProgress: "",
  conversationHistory: [],
  hasUnsavedChanges: false,

  initCreate: (type) => {
    set({
      mode: "create",
      assetId: newId(),
      assetType: type,
      name: "",
      description: "",
      attributes: {},
      selectedStyleId: null,
      selectedModel: "gemini-2.5-flash-image",
      drafts: [],
      currentDraftIndex: 0,
      primaryDraftIndex: 0,
      isGenerating: false,
      generationProgress: "",
      conversationHistory: [],
      hasUnsavedChanges: false,
    });
  },

  initEdit: (asset) => {
    const history = asset.draftHistory ?? [];
    const drafts = asset.currentDraft
      ? [asset.currentDraft, ...history.filter((d) => d.id !== asset.currentDraft?.id)]
      : history;
    const currentDraftIndex = asset.currentDraft ? 0 : 0;

    set({
      mode: "edit",
      assetId: asset.id,
      assetType: typeLabelToSlug(asset.type),
      name: asset.name ?? "",
      description: asset.description ?? "",
      attributes: asset.attributeSet ?? {},
      selectedStyleId: asset.selectedStyleId ?? null,
      selectedModel: drafts[0]?.parameters?.aiModel ?? "gemini-2.5-flash-image",
      drafts,
      currentDraftIndex,
      primaryDraftIndex: currentDraftIndex,
      isGenerating: false,
      generationProgress: "",
      conversationHistory: asset.conversationHistory?.messages ?? [],
      hasUnsavedChanges: false,
    });
  },

  setName: (name) =>
    set({ name, hasUnsavedChanges: true }),

  setDescription: (description) =>
    set({ description, hasUnsavedChanges: true }),

  setSelectedStyleId: (styleId) =>
    set({ selectedStyleId: styleId, hasUnsavedChanges: true }),

  setSelectedModel: (model) =>
    set({ selectedModel: model, hasUnsavedChanges: true }),

  setAttribute: (key, value) =>
    set((state) => ({
      attributes: { ...state.attributes, [key]: value } as AssetAttributeSet,
      hasUnsavedChanges: true,
    })),

  navigateDraft: (direction) =>
    set((state) => {
      if (!state.drafts.length) return state;
      const max = state.drafts.length - 1;
      const nextIndex =
        direction === "prev"
          ? Math.max(0, state.currentDraftIndex - 1)
          : Math.min(max, state.currentDraftIndex + 1);
      return { currentDraftIndex: nextIndex };
    }),

  setCurrentDraftIndex: (index) =>
    set((state) => ({
      currentDraftIndex: Math.max(0, Math.min(index, state.drafts.length - 1)),
    })),

  setPrimaryDraft: (index) =>
    set((state) => ({
      primaryDraftIndex: Math.max(0, Math.min(index, state.drafts.length - 1)),
      hasUnsavedChanges: true,
    })),

  deleteDraft: (index) =>
    set((state) => {
      if (index < 0 || index >= state.drafts.length) return state;
      const nextDrafts = state.drafts.filter((_, i) => i !== index);
      const nextCurrent = Math.max(0, Math.min(state.currentDraftIndex, nextDrafts.length - 1));
      const nextPrimary =
        state.primaryDraftIndex === index
          ? 0
          : state.primaryDraftIndex > index
            ? state.primaryDraftIndex - 1
            : state.primaryDraftIndex;
      return {
        drafts: nextDrafts,
        currentDraftIndex: nextCurrent,
        primaryDraftIndex: Math.max(0, Math.min(nextPrimary, nextDrafts.length - 1)),
        hasUnsavedChanges: true,
      };
    }),

  generate: async ({ projectId, referenceImageUrls, isRefinement, refinementPrompt }) => {
    const state = get();
    set({ isGenerating: true, generationProgress: "Generating" });

    try {
      const res = await fetch("/api/generate/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          assetId: state.mode === "edit" ? state.assetId : null,
          assetType: state.assetType,
          attributes: state.attributes,
          name: state.name,
          description: state.description,
          selectedStyleId: state.selectedStyleId,
          model: state.selectedModel,
          referenceImageUrls,
          conversationHistory: state.conversationHistory,
          isRefinement: !!isRefinement,
          refinementPrompt: refinementPrompt?.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Generation failed");
      }

      const data = await res.json();
      const draft = data.draft as AssetDraft;

      set((s) => ({
        drafts: [...s.drafts, draft],
        currentDraftIndex: s.drafts.length,
        isGenerating: false,
        generationProgress: "",
        hasUnsavedChanges: true,
      }));

      return draft;
    } catch (error) {
      set({ isGenerating: false, generationProgress: "" });
      throw error;
    }
  },

  refine: async ({ projectId, referenceImageUrls, prompt }) => {
    return get().generate({
      projectId,
      referenceImageUrls,
      isRefinement: true,
      refinementPrompt: prompt,
    });
  },

  saveToLibrary: (projectId) => {
    const state = get();
    const { currentProject, updateProjectData } = useProjectStore.getState();
    if (!currentProject || currentProject.id !== projectId) return;

    const now = new Date().toISOString();
    const assets: Asset[] = (currentProject.projectData?.assets ?? []) as Asset[];
    const assetId = state.assetId ?? newId();

    const primaryDraft = state.drafts[state.primaryDraftIndex] ?? null;
    const updatedAsset: Asset = {
      id: assetId,
      type: typeSlugToLabel(state.assetType),
      name: state.name || "Untitled Asset",
      description: state.description,
      prompt: primaryDraft?.parameters?.prompt ?? "",
      attributeSet: state.attributes,
      selectedStyleId: state.selectedStyleId ?? undefined,
      currentDraft: primaryDraft,
      draftHistory: state.drafts,
      reference: null,
      conversationHistory: state.conversationHistory.length
        ? { messages: state.conversationHistory }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const existingIndex = assets.findIndex((asset) => asset.id === assetId);
    const nextAssets = [...assets];

    if (existingIndex >= 0) {
      const existingAsset = assets[existingIndex];
      nextAssets[existingIndex] = {
        ...existingAsset,
        ...updatedAsset,
        reference: existingAsset?.reference ?? updatedAsset.reference,
        createdAt: existingAsset?.createdAt ?? now,
      };
    } else {
      nextAssets.push(updatedAsset);
    }

    updateProjectData({ assets: nextAssets });
    set({ hasUnsavedChanges: false, mode: "edit", assetId });
  },

  saveAsNew: (projectId) => {
    const state = get();
    const { currentProject, updateProjectData } = useProjectStore.getState();
    if (!currentProject || currentProject.id !== projectId) return;

    const now = new Date().toISOString();
    const assets: Asset[] = (currentProject.projectData?.assets ?? []) as Asset[];
    const newAssetId = newId();

    const primaryDraft = state.drafts[state.primaryDraftIndex] ?? null;
    const newAsset: Asset = {
      id: newAssetId,
      type: typeSlugToLabel(state.assetType),
      name: state.name || "Untitled Asset",
      description: state.description,
      prompt: primaryDraft?.parameters?.prompt ?? "",
      attributeSet: state.attributes,
      selectedStyleId: state.selectedStyleId ?? undefined,
      currentDraft: primaryDraft,
      draftHistory: state.drafts,
      reference: null,
      conversationHistory: state.conversationHistory.length
        ? { messages: state.conversationHistory }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    updateProjectData({ assets: [...assets, newAsset] });
    set({ hasUnsavedChanges: false, mode: "edit", assetId: newAssetId });
  },
}));
