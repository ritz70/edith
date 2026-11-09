"use client";

import { useSimulationStore } from "@/lib/store";
import { Cpu } from "lucide-react";

export function HudAmbient() {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const demoSuspiciousActive = useSimulationStore((s) => s.demoSuspiciousActive);

  return (
    <>
      {/* Tactical Corner HUD Reticles */}
      <div className="pointer-events-none fixed top-2 left-2 z-40 text-[9px] font-mono text-cyan-500/40 select-none">
        ┌ EDITH-SYS-9.0
      </div>
      <div className="pointer-events-none fixed top-2 right-2 z-40 text-[9px] font-mono text-cyan-500/40 select-none">
        HEURISTICS-CORE ┐
      </div>
      <div className="pointer-events-none fixed bottom-2 left-2 z-40 text-[9px] font-mono text-cyan-500/40 select-none">
        └ ZERO-TRUST-AUDIT
      </div>
      <div className="pointer-events-none fixed bottom-2 right-2 z-40 text-[9px] font-mono text-cyan-500/40 select-none">
        QUANTUM-ENCR-OK ┘
      </div>

      {/* Top Interactive HUD Status Bar Strip */}
      <div className="border-b border-cyan-500/20 bg-[#02050f]/90 px-6 py-1.5 text-[10px] font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Security Protocol & Threat Level */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    demoSuspiciousActive ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    demoSuspiciousActive ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              <span className="font-bold tracking-wider text-slate-200">
                THREAT LEVEL:
              </span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                  demoSuspiciousActive
                    ? "bg-red-950/80 text-red-300 border border-red-700/80 animate-pulse"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-700/80"
                }`}
              >
                {demoSuspiciousActive ? "ELEVATED // ANOMALY DETECTED" : "NOMINAL // TRUSTED"}
              </span>
            </div>

            <span className="text-cyan-500/40">•</span>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span>CORE FREQ:</span>
              <span className="text-cyan-300 font-bold">2.0s / TICK</span>
            </div>
          </div>

          {/* Center / Right: Live Audio / Data Stream Visualizer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden md:inline">STREAM ACTIVITY:</span>
              <div className="flex items-end gap-0.5 h-3 px-1">
                <span
                  className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${
                    isRunning ? "h-3" : "h-1 opacity-40"
                  }`}
                />
                <span
                  className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${
                    isRunning ? "h-2" : "h-1 opacity-40"
                  }`}
                />
                <span
                  className={`w-0.5 bg-cyan-300 rounded-full transition-all duration-300 ${
                    isRunning ? "h-3.5" : "h-1 opacity-40"
                  }`}
                />
                <span
                  className={`w-0.5 bg-amber-400 rounded-full transition-all duration-300 ${
                    demoSuspiciousActive ? "h-3" : "h-1 opacity-40"
                  }`}
                />
                <span
                  className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${
                    isRunning ? "h-2.5" : "h-1 opacity-40"
                  }`}
                />
              </div>
            </div>

            <span className="text-cyan-500/40">•</span>

            <div className="text-[9px] text-cyan-400/80 font-bold">
              HEURISTICS OS v9.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
