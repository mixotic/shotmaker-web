"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Box, Plus, User, Package, Home } from "lucide-react";
import type { Asset } from "@/types/asset";
import { AssetType } from "@/types/enums";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "character", label: "Characters" },
  { id: "object", label: "Objects" },
  { id: "set", label: "Sets" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

type AssetTypeSlug = "character" | "object" | "set";

const typeToSlug = (type: AssetType): AssetTypeSlug =>
  type.toLowerCase() as AssetTypeSlug;

const typeBadge = (type: AssetType) => {
  const slug = typeToSlug(type);
  if (slug === "character") return "Character";
  if (slug === "object") return "Object";
  return "Set";
};

const typeIcon = (slug: AssetTypeSlug) => {
  if (slug === "character") return User;
  if (slug === "object") return Package;
  return Home;
};

function getPrimaryImage(asset: Asset): string | null {
  if (asset.currentDraft?.images?.length) return asset.currentDraft.images[0];
  if (asset.draftHistory?.length) return asset.draftHistory[0]?.images?.[0] ?? null;
  return null;
}

function getDraftCount(asset: Asset): number {
  const draftHistoryCount = asset.draftHistory?.length ?? 0;
  return asset.currentDraft ? Math.max(draftHistoryCount, 1) : draftHistoryCount;
}

export default function AssetsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentProject } = useProjectStore();
  const [filter, setFilter] = useState<FilterId>("all");

  const projectId = params.id as string;

  const assets = (currentProject?.projectData?.assets ?? []) as Asset[];

  const filteredAssets = useMemo(() => {
    if (filter === "all") return assets;
    return assets.filter((asset) => typeToSlug(asset.type) === filter);
  }, [assets, filter]);

  const emptyLabel =
    filter === "all"
      ? "No assets yet"
      : `No ${filter}s yet`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage character, object, and set references
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/project/${projectId}/assets/new/character`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Character
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/project/${projectId}/assets/new/object`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Object
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/project/${projectId}/assets/new/set`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Set
          </Button>
        </div>
      </div>

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => value && setFilter(value as FilterId)}
        className="justify-start"
      >
        {FILTERS.map((item) => (
          <ToggleGroupItem key={item.id} value={item.id}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {filteredAssets.length === 0 ? (
        <Card className="border-dashed border-slate-800 bg-slate-900/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">{emptyLabel}</h3>
            <p className="text-sm text-slate-400 mb-6">
              Create your first asset to populate the library.
            </p>
            <Button asChild>
              <Link href={`/project/${projectId}/assets/new/character`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Asset
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const slug = typeToSlug(asset.type);
            const Icon = typeIcon(slug);
            const image = getPrimaryImage(asset);
            return (
              <Card
                key={asset.id}
                className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-colors cursor-pointer group"
                onClick={() => router.push(`/project/${projectId}/assets/${asset.id}`)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-slate-950 flex items-center justify-center">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={asset.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-slate-700" />
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-sm line-clamp-1">
                        {asset.name}
                      </h3>
                      {asset.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {asset.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {typeBadge(asset.type)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {getDraftCount(asset)} draft{getDraftCount(asset) === 1 ? "" : "s"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
