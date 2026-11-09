"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/store";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AppCards } from "@/components/AppCards";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { LiveAccessFeed } from "@/components/LiveAccessFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppDetailSheet } from "@/components/AppDetailSheet";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { isRunning, start, step } = useSimulationStore();

  useEffect(() => {
    setMounted(true);
    start();
  }, [start]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      step();
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, step]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">
            Initializing E.D.I.T.H. Trust Heuristics Core...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <DashboardHeader />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Main Grid: Left = App Cards & Alerts Panel, Right = Live Access Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 3 App Cards + Recommendations + Alerts Panel */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            <AppCards />
            <RecommendationsPanel />
            <AlertsPanel />
          </div>

          {/* Right Column: Live Access Feed beside the cards */}
          <div className="lg:col-span-7 xl:col-span-7 sticky top-24">
            <LiveAccessFeed />
          </div>
        </div>
      </main>

      {/* App Detail Slide-over Sheet */}
      <AppDetailSheet />

      {/* Footer banner */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        NITSHACKS 9.0 — E.D.I.T.H. Enhanced Digital Identity, Trust &amp;
        Heuristics
      </footer>
    </div>
  );
}
