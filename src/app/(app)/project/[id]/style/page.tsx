"use client";

import { useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useStyleStore } from "@/stores/style-store";
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

// Quick presets map directly to STYLE_PRESETS — these are the Mac app's 15 presets
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
    navigateDraft,
    setCurrentDraftIndex,
    applyDraft,
  } = useStyleStore();

  const [error, setError] = useState<string | null>(null);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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

    // Preserve current mode — Quick Styles work in both Preset and Manual modes
    // (matches Mac app behavior: DO NOT change mode when applying a preset)
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
    const now = new Date().toISOString();
    const newStyle: NamedStyle = {
      ...activeStyleEntry,
      id: newId(),
      name: `${activeStyleEntry.name} Copy`,
      createdAt: now,
      lastUsedAt: now,
      style: {
        ...activeStyleEntry.style,
        currentDraft: activeDraft ?? activeStyleEntry.style.currentDraft ?? null,
      },
    };
    updateProjectData({ styles: [...styles, newStyle] });
    selectStyle(newStyle.id);
  };

  const handleSetDefault = () => {
    if (!activeStyleEntry) return;
    updateProjectData({ defaultStyleId: activeStyleEntry.id });
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-slate-800">
        <ResizablePanel defaultSize={30} minSize={22} className="bg-slate-950/50">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
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

              <div className="space-y-4">
                <Label>Camera styles</Label>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Aspect ratio</Label>
                  <Select
                    value={activeStyle?.aspectRatio ?? ImageAspectRatio.landscape169}
                    onValueChange={(value) => setParameter("aspectRatio", value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Medium</Label>
                  <Select
                    value={activeStyle?.medium ?? Medium.photorealistic}
                    onValueChange={(value) => setParameter("medium", value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Film format</Label>
                  <Select
                    value={activeStyle?.filmFormat ?? "none"}
                    onValueChange={(value) => setParameter("filmFormat", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Film grain</Label>
                  <Select
                    value={activeStyle?.filmGrain ?? "none"}
                    onValueChange={(value) => setParameter("filmGrain", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Depth of field</Label>
                  <Select
                    value={activeStyle?.depthOfField ?? "none"}
                    onValueChange={(value) => setParameter("depthOfField", value === "none" ? null : value)}
                    disabled={!activeStyle}
                  >
                    <SelectTrigger>
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

              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">Manual mode</p>
                  <p className="text-xs text-slate-400">Switch between preset and manual values</p>
                </div>
                <Switch
                  checked={isManualMode}
                  onCheckedChange={(checked) => toggleMode(checked ? "manual" : "preset")}
                  disabled={!activeStyle}
                />
              </div>

              {/* Quick Styles — always visible in both modes */}
              <div className="space-y-2">
                <Label>Quick presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRESET_NAMES.map((name) => (
                    <Button
                      key={name}
                      type="button"
                      variant="secondary"
                      className="justify-start"
                      onClick={() => handleApplyPreset(QUICK_PRESETS[name])}
                      disabled={!activeStyle}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preset mode: dropdown selectors */}
              {!isManualMode && activeStyle && (
                <div className="space-y-4">
                  {PARAM_FIELDS.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <Label>{field.label}</Label>
                      <Select
                        value={activeStyle.presetValues[field.key] || undefined}
                        onValueChange={(value) => setParameter(field.key, value, "preset")}
                      >
                        <SelectTrigger>
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
                <div className="space-y-4">
                  {PARAM_FIELDS.map((field) => (
                    <div className="space-y-2" key={field.key}>
                      <Label>{field.label}</Label>
                      <Textarea
                        value={activeStyle?.manualValues[field.key] ?? ""}
                        onChange={(e) => setParameter(field.key, e.target.value, "manual")}
                        placeholder={`Describe ${field.label.toLowerCase()}`}
                        disabled={!activeStyle}
                        className="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Custom prompt</Label>
                <Textarea
                  value={activeStyle?.customPrompt ?? ""}
                  onChange={(e) => setParameter("customPrompt", e.target.value)}
                  placeholder="Add any extra style instructions..."
                  className="min-h-[120px]"
                  disabled={!activeStyle}
                />
              </div>

              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={!activeStyle || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {generationProgress || "Generating"}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate style examples
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={45} minSize={30} className="bg-slate-950/30">
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Style preview</h2>
                  <p className="text-xs text-slate-400">Character, object, and environment references</p>
                </div>
                {activeStyleEntry && (
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {activeStyleEntry.name}
                  </Badge>
                )}
              </div>

              <div className="grid h-[70%] grid-cols-3 gap-3">
                {["Character", "Object", "Set"].map((label, index) => (
                  <Card key={label} className="flex h-full flex-col justify-between border-slate-800 bg-slate-900/40">
                    <div className="flex-1 overflow-hidden rounded-md bg-slate-900/60">
                      {previewImages[index] ? (
                        <img
                          src={previewImages[index]}
                          alt={`${label} preview`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2 text-xs text-slate-400">{label}</div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyDraft}
                disabled={!activeDraft}
              >
                Apply Style
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsNew}
                disabled={!activeStyleEntry}
              >
                Save as New Style
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSetDefault}
                disabled={!activeStyleEntry}
              >
                Set as Default
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={25} minSize={20} className="bg-slate-950/50">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={40} minSize={25} className="border-b border-slate-800">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Styles</h3>
                    <p className="text-xs text-slate-500">Manage named presets</p>
                  </div>
                  <Button size="sm" variant="secondary" className="gap-1" onClick={handleCreateStyle}>
                    <PlusCircle className="h-4 w-4" />
                    New
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 px-3 pb-4">
                    {!styles.length && (
                      <div className="rounded-md border border-dashed border-slate-800 px-3 py-4 text-xs text-slate-500">
                        No styles yet. Create one to start.
                      </div>
                    )}
                    {styles.map((style) => {
                      const isActive = style.id === activeStyleEntry?.id;
                      const hasReference = !!style.style?.reference;
                      const hasDraft = !!style.style?.currentDraft;
                      return (
                        <div
                          key={style.id}
                          className={`group flex items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
                            isActive
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2 text-left"
                            onClick={() => selectStyle(style.id)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              setEditingStyleId(style.id);
                              setEditingName(style.name);
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
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
                                    className="h-6 px-1 py-0 text-sm font-medium"
                                  />
                                ) : (
                                  <span className="font-medium text-slate-100">{style.name}</span>
                                )}
                                {defaultStyleId === style.id && (
                                  <Star className="h-3.5 w-3.5 text-amber-400" />
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {hasReference && (
                                  <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                                    Reference
                                  </Badge>
                                )}
                                {hasDraft && (
                                  <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                                    Draft
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="opacity-0 transition group-hover:opacity-100"
                            onClick={() => handleDeleteStyle(style.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={60} minSize={35}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Draft history</h3>
                    <p className="text-xs text-slate-500">Browse generated drafts</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => navigateDraft("prev")}
                      disabled={!drafts.length || currentDraftIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => navigateDraft("next")}
                      disabled={!drafts.length || currentDraftIndex >= drafts.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                    {!drafts.length && (
                      <div className="col-span-2 rounded-md border border-dashed border-slate-800 px-3 py-4 text-xs text-slate-500">
                        No drafts yet. Generate a style to populate this panel.
                      </div>
                    )}
                    {drafts.map((draft, index) => (
                      <button
                        key={draft.id}
                        type="button"
                        className={`overflow-hidden rounded-md border transition ${
                          index === currentDraftIndex
                            ? "border-emerald-500/70"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                        onClick={() => setCurrentDraftIndex(index)}
                      >
                        <div className="aspect-[4/3] w-full bg-slate-900/60">
                          {draft.examples?.[0] ? (
                            <img
                              src={draft.examples[0]}
                              alt={`Draft ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1 text-xs text-slate-400">Draft {index + 1}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
