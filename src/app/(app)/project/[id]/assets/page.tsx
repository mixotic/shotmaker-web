"use client";

import { Box } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="flex items-center justify-center h-[60vh] text-slate-400">
      <div className="text-center">
        <Box className="h-12 w-12 mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-medium mb-2">Asset Library</h2>
        <p className="text-sm">Create characters, objects, and sets for your project</p>
      </div>
    </div>
  );
}
