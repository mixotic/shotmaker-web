"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex items-center justify-center h-[60vh] text-slate-400">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-medium mb-2">Settings</h2>
        <p className="text-sm">Account, billing, and API key management</p>
      </div>
    </div>
  );
}
