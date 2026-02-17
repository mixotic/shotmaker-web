import { create } from "zustand";
import type { NamedStyle, StyleDraft, StyleReference, VisualStyle } from "@/types/style";
import type { StyleParamKey } from "@/types/enums";
import { useProjectStore } from "@/stores/project-store";

const STYLE_PARAM_KEYS: StyleParamKey[] = [
  "lighting",
  "colorPalette",
  "aesthetic",
  "atmosphere",
  "mood",
  "motion",
  "texture",
];

const newId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

function getDrafts(style?: VisualStyle): StyleDraft[] {
  if (!style) return [];
  const history = style.draftHistory ?? [];
  const current = style.currentDraft;
  if (!current) return history;
  if (history.find((draft) => draft.id === current.id)) return history;
  return [current, ...history];
}

function getPreviewImages(style?: VisualStyle, draftIndex = 0): string[] {
  const drafts = getDrafts(style);
  if (drafts.length) return drafts[Math.max(0, Math.min(draftIndex, drafts.length - 1))].examples ?? [];
  return style?.reference?.examples ?? [];
}

interface StyleStoreState {
  currentStyleId: string | null;
  isGenerating: boolean;
  generationProgress: string;
  selectedModel: string;
  previewImages: string[];
  currentDraftIndex: number;

  selectStyle: (styleId: string | null) => void;
  setSelectedModel: (model: string) => void;
  setParameter: (key: string, value: string | number | null, mode?: "preset" | "manual") => void;
  toggleMode: (mode: "preset" | "manual") => void;
  generateStyleExamples: (projectId: string) => Promise<StyleDraft | null>;
  navigateDraft: (direction: "prev" | "next") => void;
  setCurrentDraftIndex: (index: number) => void;
  applyDraft: (projectId: string) => void;
}

export const useStyleStore = create<StyleStoreState>((set, get) => ({
  currentStyleId: null,
  isGenerating: false,
  generationProgress: "",
  selectedModel: "gemini-2.0-flash-exp",
  previewImages: [],
  currentDraftIndex: 0,

  selectStyle: (styleId) => {
    const { currentProject } = useProjectStore.getState();
    const styles = (currentProject?.projectData?.styles ?? []) as NamedStyle[];
    const resolvedId = styleId ?? styles[0]?.id ?? null;
    const entry = styles.find((style) => style.id === resolvedId);
    const previewImages = getPreviewImages(entry?.style, 0);

    set({
      currentStyleId: resolvedId,
      currentDraftIndex: 0,
      previewImages,
    });
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  setParameter: (key, value, mode) => {
    const { currentProject, updateProjectData } = useProjectStore.getState();
    if (!currentProject) return;

    const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
    const styleId = get().currentStyleId ?? styles[0]?.id;
    if (!styleId) return;

    const styleIndex = styles.findIndex((style) => style.id === styleId);
    if (styleIndex < 0) return;

    const styleEntry = styles[styleIndex];
    const nextStyle: VisualStyle = { ...styleEntry.style };

    if (STYLE_PARAM_KEYS.includes(key as StyleParamKey)) {
      const paramKey = key as StyleParamKey;
      const useManual = mode ? mode === "manual" : !!nextStyle.useManual?.[paramKey];
      if (useManual) {
        nextStyle.manualValues = { ...nextStyle.manualValues, [paramKey]: String(value ?? "") };
      } else {
        nextStyle.presetValues = { ...nextStyle.presetValues, [paramKey]: String(value ?? "") };
      }
    } else if (key === "medium") {
      nextStyle.medium = value as any;
    } else if (key === "filmFormat") {
      nextStyle.filmFormat = (value as any) ?? null;
    } else if (key === "filmGrain") {
      nextStyle.filmGrain = (value as any) ?? null;
    } else if (key === "depthOfField") {
      nextStyle.depthOfField = (value as any) ?? null;
    } else if (key === "aspectRatio") {
      nextStyle.aspectRatio = value as any;
    } else if (key === "detailLevel") {
      nextStyle.detailLevel = typeof value === "number" ? value : Number(value ?? 0);
    } else if (key === "customPrompt") {
      nextStyle.customPrompt = String(value ?? "");
    }

    const updatedStyle: NamedStyle = {
      ...styleEntry,
      style: nextStyle,
      lastUsedAt: new Date().toISOString(),
    };

    const updatedStyles = styles.map((style, index) =>
      index === styleIndex ? updatedStyle : style,
    );

    updateProjectData({ styles: updatedStyles });
  },

  toggleMode: (mode) => {
    const { currentProject, updateProjectData } = useProjectStore.getState();
    if (!currentProject) return;

    const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
    const styleId = get().currentStyleId ?? styles[0]?.id;
    if (!styleId) return;

    const styleIndex = styles.findIndex((style) => style.id === styleId);
    if (styleIndex < 0) return;

    const styleEntry = styles[styleIndex];
    const useManual = mode === "manual";

    const nextUseManual = STYLE_PARAM_KEYS.reduce((acc, key) => {
      acc[key] = useManual;
      return acc;
    }, {} as Record<StyleParamKey, boolean>);

    const updatedStyle: NamedStyle = {
      ...styleEntry,
      style: {
        ...styleEntry.style,
        isAdvancedMode: useManual,
        useManual: nextUseManual,
      },
      lastUsedAt: new Date().toISOString(),
    };

    const updatedStyles = styles.map((style, index) =>
      index === styleIndex ? updatedStyle : style,
    );

    updateProjectData({ styles: updatedStyles });
  },

  generateStyleExamples: async (projectId) => {
    const state = get();
    const styleId = state.currentStyleId;
    if (!styleId) return null;

    set({ isGenerating: true, generationProgress: "Generating" });

    try {
      const res = await fetch("/api/generate/style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          styleId,
          model: state.selectedModel,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Generation failed");
      }

      const data = await res.json();
      const draft = data.draft as StyleDraft;

      const { currentProject, updateProjectData } = useProjectStore.getState();
      if (currentProject) {
        const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
        const styleIndex = styles.findIndex((style) => style.id === styleId);
        if (styleIndex >= 0) {
          const styleEntry = styles[styleIndex];
          const updatedStyle: NamedStyle = {
            ...styleEntry,
            style: {
              ...styleEntry.style,
              currentDraft: draft,
              draftHistory: [...(styleEntry.style.draftHistory ?? []), draft].slice(-50),
            },
            lastUsedAt: new Date().toISOString(),
          };

          const updatedStyles = styles.map((style, index) =>
            index === styleIndex ? updatedStyle : style,
          );

          updateProjectData({ styles: updatedStyles });
        }
      }

      set({
        previewImages: draft.examples ?? [],
        currentDraftIndex: 0,
        isGenerating: false,
        generationProgress: "",
      });

      return draft;
    } catch (error) {
      set({ isGenerating: false, generationProgress: "" });
      throw error;
    }
  },

  navigateDraft: (direction) => {
    const { currentProject } = useProjectStore.getState();
    if (!currentProject) return;

    const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
    const styleId = get().currentStyleId ?? styles[0]?.id;
    if (!styleId) return;

    const styleEntry = styles.find((style) => style.id === styleId);
    const drafts = getDrafts(styleEntry?.style);
    if (!drafts.length) return;

    set((state) => {
      const max = drafts.length - 1;
      const nextIndex =
        direction === "prev"
          ? Math.max(0, state.currentDraftIndex - 1)
          : Math.min(max, state.currentDraftIndex + 1);

      return {
        currentDraftIndex: nextIndex,
        previewImages: drafts[nextIndex]?.examples ?? state.previewImages,
      };
    });
  },

  setCurrentDraftIndex: (index) => {
    const { currentProject } = useProjectStore.getState();
    if (!currentProject) return;

    const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
    const styleId = get().currentStyleId ?? styles[0]?.id;
    if (!styleId) return;

    const styleEntry = styles.find((style) => style.id === styleId);
    const drafts = getDrafts(styleEntry?.style);
    if (!drafts.length) return;

    const nextIndex = Math.max(0, Math.min(index, drafts.length - 1));
    set({
      currentDraftIndex: nextIndex,
      previewImages: drafts[nextIndex]?.examples ?? [],
    });
  },

  applyDraft: (projectId) => {
    const { currentProject, updateProjectData } = useProjectStore.getState();
    if (!currentProject || currentProject.id !== projectId) return;

    const styles = (currentProject.projectData?.styles ?? []) as NamedStyle[];
    const styleId = get().currentStyleId ?? styles[0]?.id;
    if (!styleId) return;

    const styleIndex = styles.findIndex((style) => style.id === styleId);
    if (styleIndex < 0) return;

    const styleEntry = styles[styleIndex];
    const drafts = getDrafts(styleEntry.style);
    const draft = drafts[get().currentDraftIndex] ?? styleEntry.style.currentDraft;
    if (!draft) return;

    const now = new Date().toISOString();
    const reference: StyleReference = {
      id: draft.id ?? newId(),
      examples: draft.examples ?? [],
      parameters: draft.parameters,
      prompt: draft.prompt,
      savedAt: now,
      modifiedAt: now,
    };

    const updatedStyle: NamedStyle = {
      ...styleEntry,
      style: {
        ...styleEntry.style,
        reference,
        currentDraft: draft,
      },
      lastUsedAt: now,
    };

    const updatedStyles = styles.map((style, index) =>
      index === styleIndex ? updatedStyle : style,
    );

    updateProjectData({ styles: updatedStyles });
  },
}));
