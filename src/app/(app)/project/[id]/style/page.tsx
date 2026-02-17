"use client";

import { Palette } from "lucide-react";

export default function StylePage() {
  return (
    <div className="flex items-center justify-center h-[60vh] text-slate-400">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-medium mb-2">Style Definition</h2>
        <p className="text-sm">Define your visual style and generate reference examples</p>
      </div>
    </div>
  );
}
