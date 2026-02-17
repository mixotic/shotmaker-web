"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Star,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useAssetStore } from "@/stores/asset-store";
import type { NamedStyle } from "@/types/style";

import { IMAGE_MODELS } from "@/lib/gemini";

const CHARACTER_GENDERS = ["Female", "Male", "Non-binary", "Other"];
const CHARACTER_BUILDS = [
  "Slim",
  "Average",
  "Athletic",
  "Curvy",
  "Muscular",
  "Heavyset",
];
const CHARACTER_EXPRESSIONS = [
  "Neutral",
  "Happy",
  "Sad",
  "Angry",
  "Surprised",
  "Determined",
];
const OBJECT_CONDITIONS = [
  "New",
  "Clean",
  "Used",
  "Worn",
  "Damaged",
  "Rusty",
];
const SET_TIMES = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
  "Golden Hour",
];
const SET_WEATHER = [
  "Clear",
  "Overcast",
  "Rainy",
  "Stormy",
  "Snowy",
  "Foggy",
];

type AssetEditorProps = {
  projectId: string;
  styles: NamedStyle[];
  defaultStyleId?: string | null;
  mode: "create" | "edit";
  backHref: string;
};

function getStyleReferenceImages(style?: NamedStyle): string[] {
  return style?.style?.reference?.examples ?? [];
}

export function AssetEditor({
  projectId,
  styles,
  defaultStyleId,
  mode,
  backHref,
}: AssetEditorProps) {
  const {
    assetType,
    name,
    description,
    attributes,
    selectedStyleId,
    selectedModel,
    drafts,
    currentDraftIndex,
    primaryDraftIndex,
    isGenerating,
    hasUnsavedChanges,
    setName,
    setDescription,
    setSelectedStyleId,
    setSelectedModel,
    setAttribute,
    navigateDraft,
    setCurrentDraftIndex,
    setPrimaryDraft,
    deleteDraft,
    generate,
    refine,
    saveToLibrary,
    saveAsNew,
  } = useAssetStore();

  const [refinementText, setRefinementText] = useState("");
  const [refSelections, setRefSelections] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStyleId && defaultStyleId) {
      setSelectedStyleId(defaultStyleId);
    }
  }, [selectedStyleId, defaultStyleId, setSelectedStyleId]);

  const activeStyle = useMemo(() => {
    const styleId = selectedStyleId ?? defaultStyleId ?? styles[0]?.id;
    return styles.find((style) => style.id === styleId) ?? styles[0];
  }, [styles, selectedStyleId, defaultStyleId]);

  const referenceImages = getStyleReferenceImages(activeStyle);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    referenceImages.forEach((url) => {
      next[url] = refSelections[url] ?? true;
    });
    setRefSelections(next);
  }, [referenceImages.join("|")]);

  const includedReferenceUrls = referenceImages.filter((url) => refSelections[url]);

  const currentDraft = drafts[currentDraftIndex];

  async function handleGenerate() {
    setError(null);
    try {
      await generate({
        projectId,
        referenceImageUrls: includedReferenceUrls,
      });
    } catch (err: any) {
      setError(err?.message ?? "Generation failed");
    }
  }

  async function handleRefine() {
    if (!refinementText.trim()) return;
    setError(null);
    try {
      await refine({
        projectId,
        referenceImageUrls: includedReferenceUrls,
        prompt: refinementText.trim(),
      });
      setRefinementText("");
    } catch (err: any) {
      setError(err?.message ?? "Refinement failed");
    }
  }

  const DraftThumb = ({ draft, index }: { draft: typeof drafts[number]; index: number }) => (
    <div
      key={draft.id}
      role="button"
      tabIndex={0}
      onClick={() => setCurrentDraftIndex(index)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setCurrentDraftIndex(index);
        }
      }}
      className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition ${
        index === currentDraftIndex
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70"
      }`}
    >
      <div className="h-12 w-16 overflow-hidden rounded bg-slate-950 flex items-center justify-center">
        {draft.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.images[0]} alt={draft.name} className="h-full w-full object-cover" />
        ) : (
          <PlusCircle className="h-4 w-4 text-slate-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-200">Draft {index + 1}</div>
        <div className="text-[11px] text-slate-500">{draft.createdAt?.slice(0, 10)}</div>
      </div>
      {primaryDraftIndex === index && (
        <Star className="h-4 w-4 text-yellow-400" />
      )}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          deleteDraft(index);
        }}
        className="rounded p-1 text-slate-500 hover:text-red-400"
        aria-label="Delete draft"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-slate-800">
        <ResizablePanel defaultSize={28} minSize={20} className="bg-slate-950/50">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset name</Label>
                <Input
                  id="asset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Main character"
                />
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={selectedStyleId ?? undefined}
                  onValueChange={(value) => setSelectedStyleId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {assetType === "character" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      value={(attributes as any).characterAge ?? ""}
                      onChange={(e) => setAttribute("characterAge", e.target.value)}
                      placeholder="Early 30s"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={(attributes as any).characterGender || undefined}
                      onValueChange={(value) => setAttribute("characterGender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARACTER_GENDERS.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Build</Label>
                    <Select
                      value={(attributes as any).characterBuild || undefined}
                      onValueChange={(value) => setAttribute("characterBuild", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select build" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARACTER_BUILDS.map((build) => (
                          <SelectItem key={build} value={build}>
                            {build}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hair style</Label>
                    <Input
                      value={(attributes as any).characterHairStyle ?? ""}
                      onChange={(e) => setAttribute("characterHairStyle", e.target.value)}
                      placeholder="Messy bob"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hair color</Label>
                    <Input
                      value={(attributes as any).characterHairColor ?? ""}
                      onChange={(e) => setAttribute("characterHairColor", e.target.value)}
                      placeholder="Dark brown"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Skin tone</Label>
                    <Input
                      value={(attributes as any).characterSkinTone ?? ""}
                      onChange={(e) => setAttribute("characterSkinTone", e.target.value)}
                      placeholder="Warm olive"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Clothing</Label>
                    <Textarea
                      value={(attributes as any).characterClothing ?? ""}
                      onChange={(e) => setAttribute("characterClothing", e.target.value)}
                      rows={3}
                      placeholder="Trench coat, leather boots"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distinguishing features</Label>
                    <Textarea
                      value={(attributes as any).characterDistinguishingFeatures ?? ""}
                      onChange={(e) =>
                        setAttribute("characterDistinguishingFeatures", e.target.value)
                      }
                      rows={3}
                      placeholder="Scar above left eyebrow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pose</Label>
                    <Input
                      value={(attributes as any).characterPose ?? ""}
                      onChange={(e) => setAttribute("characterPose", e.target.value)}
                      placeholder="Relaxed stance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expression</Label>
                    <Select
                      value={(attributes as any).characterExpression || undefined}
                      onValueChange={(value) => setAttribute("characterExpression", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expression" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARACTER_EXPRESSIONS.map((expression) => (
                          <SelectItem key={expression} value={expression}>
                            {expression}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {assetType === "object" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input
                      value={(attributes as any).objectMaterial ?? ""}
                      onChange={(e) => setAttribute("objectMaterial", e.target.value)}
                      placeholder="Brushed steel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Input
                      value={(attributes as any).objectSize ?? ""}
                      onChange={(e) => setAttribute("objectSize", e.target.value)}
                      placeholder="Handheld"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={(attributes as any).objectCondition || undefined}
                      onValueChange={(value) => setAttribute("objectCondition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {OBJECT_CONDITIONS.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      value={(attributes as any).objectColor ?? ""}
                      onChange={(e) => setAttribute("objectColor", e.target.value)}
                      placeholder="Oxidized copper"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distinguishing features</Label>
                    <Textarea
                      value={(attributes as any).objectDistinguishingFeatures ?? ""}
                      onChange={(e) =>
                        setAttribute("objectDistinguishingFeatures", e.target.value)
                      }
                      rows={3}
                      placeholder="Engraved markings"
                    />
                  </div>
                </div>
              )}

              {assetType === "set" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Location type</Label>
                    <Input
                      value={(attributes as any).setLocation ?? ""}
                      onChange={(e) => setAttribute("setLocation", e.target.value)}
                      placeholder="Industrial rooftop"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time of day</Label>
                    <Select
                      value={(attributes as any).setTime || undefined}
                      onValueChange={(value) => setAttribute("setTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {SET_TIMES.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weather</Label>
                    <Select
                      value={(attributes as any).setWeather || undefined}
                      onValueChange={(value) => setAttribute("setWeather", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select weather" />
                      </SelectTrigger>
                      <SelectContent>
                        {SET_WEATHER.map((weather) => (
                          <SelectItem key={weather} value={weather}>
                            {weather}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Architecture style</Label>
                    <Input
                      value={(attributes as any).setArchitectureStyle ?? ""}
                      onChange={(e) => setAttribute("setArchitectureStyle", e.target.value)}
                      placeholder="Brutalist concrete"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Key elements</Label>
                    <Textarea
                      value={(attributes as any).setKeyElements ?? ""}
                      onChange={(e) => setAttribute("setKeyElements", e.target.value)}
                      rows={3}
                      placeholder="Satellite dishes, neon signage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Atmosphere</Label>
                    <Input
                      value={(attributes as any).setAtmosphere ?? ""}
                      onChange={(e) => setAttribute("setAtmosphere", e.target.value)}
                      placeholder="Mist, distant sirens"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Give context and mood for the asset"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Style reference images</Label>
                </div>
                {referenceImages.length === 0 ? (
                  <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-500">
                    No reference images in the selected style.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referenceImages.map((url) => (
                      <div key={url} className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="reference" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 text-xs text-slate-400">Include for context</div>
                        <Switch
                          checked={refSelections[url] ?? true}
                          onCheckedChange={(checked) =>
                            setRefSelections((prev) => ({ ...prev, [url]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedModel}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={44} minSize={30} className="bg-slate-950">
          <div className="flex h-full flex-col">
            <div className="flex-1 p-4">
              <div className="h-full rounded-lg border border-slate-800 bg-slate-950/40 flex items-center justify-center">
                {currentDraft?.images?.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentDraft.images[0]}
                    alt="Draft preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    Generate a draft to see previews here.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDraft("prev")}
                  disabled={currentDraftIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs text-slate-400">
                  Draft {drafts.length ? currentDraftIndex + 1 : 0} of {drafts.length}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDraft("next")}
                  disabled={currentDraftIndex >= drafts.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Refine</Label>
                <Textarea
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="Make the coat darker with sharper edges"
                  rows={2}
                />
                <Button
                  variant="secondary"
                  onClick={handleRefine}
                  disabled={isGenerating || !refinementText.trim()}
                  className="w-full"
                >
                  Refine Draft
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={28} minSize={20} className="bg-slate-950/50">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium">
              Draft History
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {drafts.length === 0 ? (
                  <Card className="border-dashed border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-500">
                    No drafts yet.
                  </Card>
                ) : (
                  drafts.map((draft, index) => (
                    <DraftThumb key={draft.id} draft={draft} index={index} />
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-slate-800 p-4 space-y-2">
              <Button
                variant="secondary"
                onClick={() => setPrimaryDraft(currentDraftIndex)}
                disabled={!drafts.length || currentDraftIndex === primaryDraftIndex}
                className="w-full"
              >
                Set as Primary
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href={backHref}>Back to Library</Link>
          </Button>
          <Button onClick={() => saveToLibrary(projectId)} disabled={!name.trim()}>
            Save to Library
          </Button>
          {mode === "edit" && (
            <Button variant="secondary" onClick={() => saveAsNew(projectId)}>
              Save as New Asset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
