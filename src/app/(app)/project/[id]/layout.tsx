"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Check,
  Gem,
  Loader2,
  Lock,
  Palette,
  Box,
  Frame,
  Clapperboard,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { currentProject, loadProject, updateProjectName, saveStatus } =
    useProjectStore();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [loadError, setLoadError] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      loadProject(projectId).catch(() => setLoadError(true));
    }
  }, [projectId, currentProject?.id, loadProject]);

  useEffect(() => {
    if (currentProject) setNameValue(currentProject.name);
  }, [currentProject?.name]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <AlertCircle className="h-5 w-5 mr-2" />
        Project not found
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
  const hasStyleRef = projectData?.styles?.some((s: any) => s.style?.reference);
  const assetCount = projectData?.assets?.length ?? 0;

  const tabs = [
    {
      href: `/project/${projectId}/style`,
      label: "Style",
      icon: Palette,
      status: hasStyleRef ? "done" : undefined,
      locked: false,
    },
    {
      href: `/project/${projectId}/assets`,
      label: "Assets",
      icon: Box,
      status: assetCount > 0 ? `(${assetCount})` : undefined,
      locked: false,
    },
    {
      href: `/project/${projectId}/frames`,
      label: "Frames",
      icon: Frame,
      status: "--",
      locked: true,
    },
    {
      href: `/project/${projectId}/shots`,
      label: "Shots",
      icon: Clapperboard,
      status: "--",
      locked: true,
    },
  ];

  function handleNameBlur() {
    setEditingName(false);
    if (nameValue.trim() && nameValue !== currentProject?.name) {
      updateProjectName(nameValue.trim());
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center h-12 px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>

          <div className="h-5 w-px bg-slate-800" />

          {/* Editable name */}
          {editingName ? (
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameBlur();
                if (e.key === "Escape") {
                  setNameValue(currentProject.name);
                  setEditingName(false);
                }
              }}
              className="h-8 w-64 border-slate-700 bg-slate-800 text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium hover:text-white transition-colors"
            >
              {currentProject.name}
            </button>
          )}

          {/* Save status */}
          <span className="text-xs text-slate-500">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-green-500">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-400">Save failed</span>
            )}
          </span>

          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-sm">
            <Gem className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium">
              {(session?.user as any)?.credits ?? 0}
            </span>
          </div>
        </div>

        {/* Workflow tabs */}
        <TooltipProvider>
          <div className="flex items-center gap-1 px-4 pb-0">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              if (tab.locked) {
                return (
                  <Tooltip key={tab.label}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 cursor-not-allowed">
                        <Lock className="h-3.5 w-3.5" />
                        {tab.label}
                        <span className="text-xs">{tab.status}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Coming Soon</TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <Link key={tab.label} href={tab.href}>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                      isActive
                        ? "border-blue-500 text-white"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.status === "done" && (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                    {tab.status && tab.status !== "done" && (
                      <span className="text-xs text-slate-500">
                        {tab.status}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {children}
    </div>
  );
}
