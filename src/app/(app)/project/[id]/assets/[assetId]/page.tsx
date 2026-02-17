"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useAssetStore } from "@/stores/asset-store";
import { AssetEditor } from "@/app/(app)/project/[id]/assets/_components/asset-editor";
import type { Asset } from "@/types/asset";
import type { NamedStyle } from "@/types/style";

export default function EditAssetPage() {
  const params = useParams();
  const { currentProject } = useProjectStore();
  const { initEdit } = useAssetStore();

  const projectId = params.id as string;
  const assetId = params.assetId as string;

  const asset = useMemo(() => {
    const assets = (currentProject?.projectData?.assets ?? []) as Asset[];
    return assets.find((item) => item.id === assetId) ?? null;
  }, [currentProject?.projectData?.assets, assetId]);

  useEffect(() => {
    if (asset) initEdit(asset);
  }, [asset, initEdit]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <AlertCircle className="h-5 w-5 mr-2" />
        Asset not found
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
        mode="edit"
        backHref={`/project/${projectId}/assets`}
      />
    </div>
  );
}
