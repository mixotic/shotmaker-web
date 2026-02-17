"use client";

import { Clapperboard } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="mb-8 flex items-center gap-3">
        <Clapperboard className="h-10 w-10 text-blue-500" />
        <h1 className="text-3xl font-bold text-white">ShotMaker</h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
