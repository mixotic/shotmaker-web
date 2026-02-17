"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useAssetStore, type AssetTypeSlug } from "@/stores/asset-store";
import { AssetEditor } from "@/app/(app)/project/[id]/assets/_components/asset-editor";
import type { NamedStyle } from "@/types/style";

const VALID_TYPES: AssetTypeSlug[] = ["character", "object", "set"];

export default function NewAssetPage() {
  const params = useParams();
  const { currentProject } = useProjectStore();
  const { initCreate } = useAssetStore();

  const projectId = params.id as string;
  const typeParam = params.type as AssetTypeSlug;

  const assetType = useMemo(() => {
    if (VALID_TYPES.includes(typeParam)) return typeParam;
    return null;
  }, [typeParam]);

  useEffect(() => {
    if (assetType) initCreate(assetType);
  }, [assetType, initCreate]);

  if (!assetType) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <AlertCircle className="h-5 w-5 mr-2" />
        Invalid asset type
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const projectData = currentProject.projectData as any;
  const styles = (projectData?.styles ?? []) as NamedStyle[];

  return (
    <div className="p-4">
      <AssetEditor
        projectId={projectId}
        styles={styles}
        defaultStyleId={projectData?.defaultStyleId}
        mode="create"
        backHref={`/project/${projectId}/assets`}
      />
    </div>
  );
}
