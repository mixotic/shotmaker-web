"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Info,
  Loader2,
  PlusCircle,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PARAMETER_INFO } from "@/lib/parameterInfo";
import { useProjectStore } from "@/stores/project-store";
import { useStyleStore } from "@/stores/style-store";
import type { StyleReference } from "@/types/style";
import type { NamedStyle, StyleDraft, VisualStyle } from "@/types/style";
import { createNamedStyle } from "@/types/style";
import {
  DepthOfField,
  FilmFormat,
  FilmGrain,
  ImageAspectRatio,
  Medium,
  STYLE_PRESETS,
  StyleParameterOptions,
  StyleParamKey,
  StylePreset,
} from "@/types/enums";

import { IMAGE_MODELS } from "@/lib/gemini";

const PARAM_FIELDS: { key: StyleParamKey; label: string }[] = [
  { key: "lighting", label: "Lighting" },
  { key: "colorPalette", label: "Color palette" },
  { key: "aesthetic", label: "Aesthetic" },
  { key: "atmosphere", label: "Atmosphere" },
  { key: "mood", label: "Mood" },
  { key: "motion", label: "Motion" },
  { key: "texture", label: "Texture" },
];

const QUICK_PRESET_NAMES = [
  "70mm Epic",
  "Anime",
  "Cyberpunk",
  "Documentary",
  "Claymation",
  "Film Noir",
  "Horror",
  "Fantasy",
  "Sci-Fi",
  "Western",
  "Vector Animation",
  "Stop Motion",
  "Watercolor Dream",
  "Pixel Art",
  "Comic Book",
] as const;

const QUICK_PRESETS: Record<(typeof QUICK_PRESET_NAMES)[number], StylePreset> = {
  "70mm Epic": STYLE_PRESETS["70mm Epic"],
  Anime: STYLE_PRESETS.Anime,
  Cyberpunk: STYLE_PRESETS.Cyberpunk,
  Documentary: STYLE_PRESETS.Documentary,
  Claymation: STYLE_PRESETS.Claymation,
  "Film Noir": STYLE_PRESETS["Film Noir"],
  Horror: STYLE_PRESETS.Horror,
  Fantasy: STYLE_PRESETS.Fantasy,
  "Sci-Fi": STYLE_PRESETS["Sci-Fi"],
  Western: STYLE_PRESETS.Western,
  "Vector Animation": STYLE_PRESETS["Vector Animation"],
  "Stop Motion": STYLE_PRESETS["Stop Motion"],
  "Watercolor Dream": STYLE_PRESETS["Watercolor Dream"],
  "Pixel Art": STYLE_PRESETS["Pixel Art"],
  "Comic Book": STYLE_PRESETS["Comic Book"],
};

const STYLE_PARAM_KEYS: StyleParamKey[] = PARAM_FIELDS.map((item) => item.key);

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

/* ─── Lightbox component ─── */
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── Parameter info popover ─── */
function ParameterInfoButton({ paramKey }: { paramKey: string }) {
  const info = PARAMETER_INFO[paramKey];
  if (!info) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="text-slate-500 hover:text-blue-400 transition-colors ml-1">
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 bg-slate-900 border-slate-700 text-slate-100" side="right">
        <p className="font-semibold text-sm mb-1">{info.title}</p>
        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{info.description}</p>
        {info.examples.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Examples</p>
            <ul className="space-y-0.5">
              {info.examples.map((ex, i) => (
                <li key={i} className="text-[11px] text-slate-400 flex gap-1">
                  <span className="text-slate-600 flex-shrink-0">•</span>
                  {ex}
                </li>
              ))}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function StylePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { currentProject, updateProjectData } = useProjectStore();
  const {
    currentStyleId,
    isGenerating,
    generationProgress,
    selectedModel,
    previewImages,
    currentDraftIndex,
    selectStyle,
    setSelectedModel,
    setParameter,
    toggleMode,
    generateStyleExamples,
    setCurrentDraftIndex,
    applyDraft,
    deleteDraft,
  } = useStyleStore();

  const [error, setError] = useState<string | null>(null);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [saveAsNewName, setSaveAsNewName] = useState<string | null>(null);
  const extractInputRef = useRef<HTMLInputElement>(null);

  const styles = (currentProject?.projectData?.styles ?? []) as NamedStyle[];
  const defaultStyleId = currentProject?.projectData?.defaultStyleId ?? null;

  const styleIdList = useMemo(() => styles.map((style) => style.id).join("|"), [styles]);

  useEffect(() => {
    if (!styles.length) return;
    const fallback = defaultStyleId ?? styles[0]?.id ?? null;
    if (!currentStyleId || !styles.find((style) => style.id === currentStyleId)) {
      selectStyle(fallback);
    }
  }, [styleIdList, defaultStyleId, currentStyleId, selectStyle, styles.length]);

  const activeStyleEntry = useMemo(() => {
    const resolvedId = currentStyleId ?? defaultStyleId ?? styles[0]?.id;
    return styles.find((style) => style.id === resolvedId) ?? styles[0];
  }, [styles, currentStyleId, defaultStyleId]);

  const activeStyle = activeStyleEntry?.style;
  const drafts = getDrafts(activeStyle);
  const activeDraft = drafts[Math.max(0, Math.min(currentDraftIndex, drafts.length - 1))];
  const appliedDraftId = activeStyle?.reference?.id ?? null;
  const isManualMode = !!activeStyle && STYLE_PARAM_KEYS.every((key) => activeStyle.useManual?.[key]);

  const handleCreateStyle = () => {
    if (!currentProject) return;
    const newStyle = createNamedStyle(`Style ${styles.length + 1}`);
    updateProjectData({
      styles: [...styles, newStyle],
      defaultStyleId: defaultStyleId ?? newStyle.id,
    });
    selectStyle(newStyle.id);
  };

  const handleRenameStyle = (styleId: string, newName: string) => {
    if (!currentProject || !newName.trim()) return;
    const updatedStyles = styles.map((s) =>
      s.id === styleId ? { ...s, name: newName.trim() } : s,
    );
    updateProjectData({ styles: updatedStyles });
    setEditingStyleId(null);
  };

  const handleExtractStyle = async (file: File) => {
    if (!activeStyleEntry || !currentProject) return;
    setIsExtracting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/generate/extract-style", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Extraction failed" }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const { style: extracted } = await res.json();

      const updatedStyle: NamedStyle = {
        ...activeStyleEntry,
        style: {
          ...activeStyleEntry.style,
          medium: extracted.medium ?? activeStyleEntry.style.medium,
          filmFormat: extracted.filmFormat ?? activeStyleEntry.style.filmFormat,
          filmGrain: extracted.filmGrain ?? activeStyleEntry.style.filmGrain,
          depthOfField: extracted.depthOfField ?? activeStyleEntry.style.depthOfField,
          detailLevel: extracted.detailLevel ?? activeStyleEntry.style.detailLevel,
          manualValues: { ...extracted.manualValues },
          customPrompt: extracted.customPrompt ?? "",
          isAdvancedMode: true,
        },
        lastUsedAt: new Date().toISOString(),
      };

      const updatedStyles = styles.map((s) =>
        s.id === activeStyleEntry.id ? updatedStyle : s,
      );
      updateProjectData({ styles: updatedStyles });
      toggleMode("manual");
    } catch (e: any) {
      setError(e?.message ?? "Style extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteStyle = (styleId: string) => {
    if (!currentProject) return;
    const nextStyles = styles.filter((style) => style.id !== styleId);
    const nextDefault = defaultStyleId === styleId ? nextStyles[0]?.id ?? null : defaultStyleId;
    updateProjectData({ styles: nextStyles, defaultStyleId: nextDefault });
    if (currentStyleId === styleId) {
      selectStyle(nextStyles[0]?.id ?? null);
    }
  };

  const handleApplyPreset = (preset: StylePreset) => {
    if (!activeStyleEntry || !currentProject) return;

    const updatedStyle: NamedStyle = {
      ...activeStyleEntry,
      style: {
        ...activeStyleEntry.style,
        medium: preset.medium,
        filmFormat: preset.filmFormat,
        filmGrain: preset.filmGrain,
        depthOfField: preset.depthOfField,
        detailLevel: preset.detailLevel,
        presetValues: { ...preset.preset },
        manualValues: { ...preset.manual },
      },
      lastUsedAt: new Date().toISOString(),
    };

    const updatedStyles = styles.map((style) =>
      style.id === activeStyleEntry.id ? updatedStyle : style,
    );

    updateProjectData({ styles: updatedStyles });
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      await generateStyleExamples(projectId);
    } catch (e: any) {
      setError(e?.message ?? "Generation failed");
    }
  };

  const handleApplyDraft = () => {
    if (!activeDraft) return;
    applyDraft(projectId);
  };

  const handleSaveAsNew = () => {
    if (!activeStyleEntry || !currentProject) return;
    const draft = activeDraft ?? activeStyleEntry.style.currentDraft;
    const defaultName = `${activeStyleEntry.name} Copy`;
    const name = window.prompt("Name for new style:", defaultName);
    if (!name?.trim()) return;
    const now = new Date().toISOString();
    const reference: StyleReference | undefined = draft
      ? {
          id: draft.id ?? newId(),
          examples: draft.examples ?? [],
          parameters: draft.parameters,
          prompt: draft.prompt,
          savedAt: now,
          modifiedAt: now,
        }
      : activeStyleEntry.style.reference ?? undefined;
    const newStyle: NamedStyle = {
      ...activeStyleEntry,
      id: newId(),
      name: name.trim(),
      createdAt: now,
      lastUsedAt: now,
      style: {
        ...activeStyleEntry.style,
        reference: reference ?? activeStyleEntry.style.reference,
        currentDraft: draft ?? activeStyleEntry.style.currentDraft ?? null,
        draftHistory: draft ? [draft] : activeStyleEntry.style.draftHistory,
      },
    };
    updateProjectData({ styles: [...styles, newStyle] });
    selectStyle(newStyle.id);
  };

  const handleSetDefault = () => {
    if (!activeStyleEntry) return;
    updateProjectData({ defaultStyleId: activeStyleEntry.id });
  };

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt="Style preview" onClose={closeLightbox} />
      )}

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex-none">
          {error}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 rounded-lg border border-slate-800">
        {/* ─── Left panel: Controls ─── */}
        <ResizablePanel defaultSize={28} minSize={22} className="bg-slate-950/50">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs">Camera styles</Label>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 flex items-center">Aspect ratio<ParameterInfoButton paramKey="aspectRatio" /></Label>
                  <Select
                    value={activeStyle?.aspectRatio ?? ImageAspectRatio.landscape169}
                    onValueChange={(value) => setParameter("aspectRatio", value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ImageAspectRatio).map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 flex items-center">Medium<ParameterInfoButton paramKey="medium" /></Label>
                  <Select
                    value={activeStyle?.medium ?? Medium.photorealistic}
                    onValueChange={(value) => setParameter("medium", value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select medium" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Medium).map((medium) => (
                        <SelectItem key={medium} value={medium}>
                          {medium}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 flex items-center">Film format<ParameterInfoButton paramKey="filmFormat" /></Label>
                  <Select
                    value={activeStyle?.filmFormat ?? "none"}
                    onValueChange={(value) => setParameter("filmFormat", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(FilmFormat).map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 flex items-center">Film grain<ParameterInfoButton paramKey="filmGrain" /></Label>
                  <Select
                    value={activeStyle?.filmGrain ?? "none"}
                    onValueChange={(value) => setParameter("filmGrain", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select grain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(FilmGrain).map((grain) => (
                        <SelectItem key={grain} value={grain}>
                          {grain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400 flex items-center">Depth of field<ParameterInfoButton paramKey="depthOfField" /></Label>
                  <Select
                    value={activeStyle?.depthOfField ?? "none"}
                    onValueChange={(value) => setParameter("depthOfField", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(DepthOfField).map((depth) => (
                        <SelectItem key={depth} value={depth}>
                          {depth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1.5">
                <div>
                  <p className="text-xs font-medium text-slate-100">Manual mode</p>
                  <p className="text-[11px] text-slate-400">Preset vs manual values</p>
                </div>
                <Switch
                  checked={isManualMode}
                  onCheckedChange={(checked) => toggleMode(checked ? "manual" : "preset")}
                  disabled={!activeStyle}
                />
              </div>

              {/* Quick Styles */}
              <div className="space-y-1.5">
                <Label className="text-xs">Quick presets</Label>
                <div className="grid grid-cols-3 gap-1">
                  {QUICK_PRESET_NAMES.map((name) => (
                    <Button
                      key={name}
                      type="button"
                      variant="secondary"
                      className="h-auto justify-start px-2 py-1 text-[11px] leading-tight"
                      onClick={() => handleApplyPreset(QUICK_PRESETS[name])}
                      disabled={!activeStyle}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Extract Style from Image */}
              <div className="space-y-1.5">
                <Label className="text-xs">Extract style from image</Label>
                <input
                  ref={extractInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExtractStyle(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 h-8 text-xs"
                  onClick={() => extractInputRef.current?.click()}
                  disabled={!activeStyle || isExtracting}
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-3.5 w-3.5" />
                      Upload Image to Extract
                    </>
                  )}
                </Button>
              </div>

              {/* Preset mode: dropdown selectors */}
              {!isManualMode && activeStyle && (
                <div className="space-y-3">
                  {PARAM_FIELDS.map((field) => (
                    <div className="space-y-1.5" key={field.key}>
                      <Label className="text-xs flex items-center">{field.label}<ParameterInfoButton paramKey={field.key} /></Label>
                      <Select
                        value={activeStyle.presetValues[field.key] || undefined}
                        onValueChange={(value) => setParameter(field.key, value, "preset")}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {StyleParameterOptions[field.key]
                            .filter((option) => option !== "")
                            .map((option) => (
                              <SelectItem key={`${field.key}-${option}`} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual mode: free-form text inputs */}
              {isManualMode && (
                <div className="space-y-3">
                  {PARAM_FIELDS.map((field) => (
                    <div className="space-y-1.5" key={field.key}>
                      <Label className="text-xs flex items-center">{field.label}<ParameterInfoButton paramKey={field.key} /></Label>
                      <Textarea
                        value={activeStyle?.manualValues[field.key] ?? ""}
                        onChange={(e) => setParameter(field.key, e.target.value, "manual")}
                        placeholder={`Describe ${field.label.toLowerCase()}`}
                        disabled={!activeStyle}
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center">Custom prompt<ParameterInfoButton paramKey="customPrompt" /></Label>
                <Textarea
                  value={activeStyle?.customPrompt ?? ""}
                  onChange={(e) => setParameter("customPrompt", e.target.value)}
                  placeholder="Add any extra style instructions..."
                  className="min-h-[80px] text-xs"
                  disabled={!activeStyle}
                />
              </div>

              <Button
                type="button"
                className="w-full gap-2 h-9"
                onClick={handleGenerate}
                disabled={!activeStyle || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">{generationProgress || "Generating"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs">Generate style examples</span>
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle />

        {/* ─── Center panel: Preview ─── */}
        <ResizablePanel defaultSize={47} minSize={30} className="bg-slate-950/30">
          <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Style preview</h2>
                <p className="text-[11px] text-slate-400">Character · Object · Environment</p>
              </div>
              {activeStyleEntry && (
                <Badge variant="outline" className="border-slate-700 text-[11px] text-slate-300">
                  {activeStyleEntry.name}
                </Badge>
              )}
            </div>

            {/* Square preview images */}
            <div className="grid grid-cols-3 gap-3 mx-auto w-full max-w-[600px]">
              {["Character", "Object", "Set"].map((label, index) => (
                <div key={label} className="flex flex-col">
                  <div
                    className="aspect-square w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60"
                    onDoubleClick={() => {
                      if (previewImages[index]) setLightboxSrc(previewImages[index]);
                    }}
                  >
                    {previewImages[index] ? (
                      <img
                        src={previewImages[index]}
                        alt={`${label} preview`}
                        className="h-full w-full object-cover cursor-zoom-in"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                        No preview
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-center text-[11px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2 flex flex-col gap-1.5">
                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  size="sm"
                  onClick={handleApplyDraft}
                  disabled={!activeDraft}
                >
                  Apply Style
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-700 hover:border-slate-500"
                  size="sm"
                  onClick={handleSaveAsNew}
                  disabled={!activeStyleEntry}
                >
                  Save as New Style
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-slate-200"
                  size="sm"
                  onClick={handleSetDefault}
                  disabled={!activeStyleEntry}
                >
                  Set as Default
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* ─── Right panel: Styles list + Draft history ─── */}
        <ResizablePanel defaultSize={25} minSize={18} className="bg-slate-950/50">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={35} minSize={20} className="border-b border-slate-800">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <h3 className="text-xs font-semibold text-slate-100">Styles</h3>
                  <Button size="sm" className="gap-1 h-7 text-[11px] bg-blue-600 hover:bg-blue-500 text-white" onClick={handleCreateStyle}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    New
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-1 px-2 pb-3">
                    {!styles.length && (
                      <div className="rounded-md border border-dashed border-slate-800 px-3 py-3 text-[11px] text-slate-500">
                        No styles yet. Create one to start.
                      </div>
                    )}
                    {styles.map((style) => {
                      const isActive = style.id === activeStyleEntry?.id;
                      return (
                        <div
                          key={style.id}
                          className={`group flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition ${
                            isActive
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-1.5 text-left"
                            onClick={() => selectStyle(style.id)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              setEditingStyleId(style.id);
                              setEditingName(style.name);
                            }}
                          >
                            {editingStyleId === style.id ? (
                              <Input
                                autoFocus
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleRenameStyle(style.id, editingName)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameStyle(style.id, editingName);
                                  if (e.key === "Escape") setEditingStyleId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 px-1 py-0 text-xs font-medium"
                              />
                            ) : (
                              <span className="font-medium text-slate-100 truncate">{style.name}</span>
                            )}
                            {defaultStyleId === style.id && (
                              <Star className="h-3 w-3 flex-shrink-0 text-amber-400" />
                            )}
                          </button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 transition group-hover:opacity-100"
                            onClick={() => handleDeleteStyle(style.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-slate-100">Draft history</h3>
                    {drafts.length > 0 && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] border-slate-700 text-slate-400">
                        {drafts.length}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-1 px-2 pb-3">
                    {!drafts.length && (
                      <div className="rounded-md border border-dashed border-slate-800 px-3 py-3 text-[11px] text-slate-500">
                        No drafts yet. Generate to populate.
                      </div>
                    )}
                    {drafts.map((draft, index) => {
                      const draftNumber = drafts.length - index;
                      const isSelected = index === currentDraftIndex;
                      const isApplied = draft.id === appliedDraftId;

                      return (
                        <div
                          key={draft.id}
                          className={`group flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 transition ${
                            isSelected
                              ? "border-emerald-500/70 bg-emerald-500/5"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2.5 min-w-0"
                            onClick={() => setCurrentDraftIndex(index)}
                          >
                            <span className="flex-shrink-0 text-[11px] font-medium text-slate-300 w-8 text-left">
                              #{draftNumber}
                            </span>
                            <div className="flex gap-1">
                              {(draft.examples ?? []).slice(0, 3).map((src, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-slate-700 bg-slate-900"
                                >
                                  <img
                                    src={src}
                                    alt={`Draft ${draftNumber} img ${imgIdx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, 3 - (draft.examples?.length ?? 0)) }).map((_, i) => (
                                <div
                                  key={`empty-${i}`}
                                  className="h-10 w-10 flex-shrink-0 rounded border border-slate-800 bg-slate-900/40"
                                />
                              ))}
                            </div>
                            {isApplied && (
                              <span className="ml-auto flex-shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                                APPLIED
                              </span>
                            )}
                          </button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 flex-shrink-0 opacity-0 transition group-hover:opacity-100 text-slate-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDraft(draft.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Expandable: View Full Prompt */}
                {activeDraft?.prompt && (
                  <div className="flex-none border-t border-slate-800">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={() => setPromptExpanded((p) => !p)}
                    >
                      <span className="font-medium">View Full Prompt</span>
                      {promptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {promptExpanded && (
                      <div className="max-h-40 overflow-auto px-3 pb-3">
                        <p className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400 font-mono">
                          {activeDraft.prompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
