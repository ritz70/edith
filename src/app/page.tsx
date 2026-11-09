"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSimulationStore } from "@/lib/store";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AppCards } from "@/components/AppCards";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { LiveAccessFeed } from "@/components/LiveAccessFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { AppDetailSheet } from "@/components/AppDetailSheet";
import { HudCursor } from "@/components/HudCursor";
import { HudAmbient } from "@/components/HudAmbient";

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { isRunning, start, step } = useSimulationStore();

  useEffect(() => {
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
      <div className="min-h-screen stark-grid text-slate-100 p-8 font-mono flex items-center justify-center">
        <div className="flex items-center gap-3 bg-[#071228]/80 border border-cyan-500/30 px-5 py-3 rounded-lg shadow-lg shadow-cyan-950/40">
          <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wide">
            Initializing E.D.I.T.H. core...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen stark-grid text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      <HudCursor />
      <HudAmbient />
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
