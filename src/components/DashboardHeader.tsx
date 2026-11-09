"use client";

import Image from "next/image";
import Link from "next/link";
import { useSimulationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  AlertOctagon,
  History,
} from "lucide-react";

export function DashboardHeader() {
  const {
    tick,
    time,
    isRunning,
    demoSuspiciousActive,
    start,
    pause,
    reset,
    toggleDemoSuspicious,
  } = useSimulationStore();

  return (
    <header className="border-b border-cyan-500/25 bg-[#040812]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 shadow-lg shadow-cyan-950/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="E.D.I.T.H. Logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-wider text-white font-heading">
                E.D.I.T.H.
              </h1>
              <Badge
                variant="outline"
                className="bg-amber-950/30 border-amber-500/50 text-amber-300 font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 shadow-xs shadow-amber-500/20"
              >
                Trust Heuristics Core
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              Trust isn&apos;t granted once. It&apos;s earned continuously.
            </p>
          </div>
        </div>

        {/* Center / Right: Clock, Tick, Controls */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Simulated Clock & Tick Card */}
          <div className="flex items-center gap-3 bg-[#071329]/90 border border-cyan-500/30 rounded-lg px-3.5 py-1.5 font-mono shadow-inner shadow-cyan-950/40">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block leading-tight font-mono">
                  Simulated Time
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {time}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-cyan-500/20" />

            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block leading-tight font-mono">
                  Tick
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  #{tick}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-cyan-500/20" />

            <div className="flex items-center gap-1.5 pl-1">
              <span className="relative flex h-2.5 w-2.5">
                {isRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isRunning ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-600"
                  }`}
                />
              </span>
              <span className="text-[11px] font-medium text-slate-300 font-mono">
                {isRunning ? "LIVE" : "PAUSED"}
              </span>
            </div>
          </div>

          {/* SPEC §10: Real "Simulate suspicious behaviour" button (Red) */}
          <Button
            size="sm"
            onClick={toggleDemoSuspicious}
            className={`text-xs font-mono gap-1.5 transition-all font-bold shadow-md cursor-pointer ${
              demoSuspiciousActive
                ? "bg-red-700 hover:bg-red-600 text-white border border-red-400 shadow-red-950/80 animate-pulse ring-2 ring-red-500/50"
                : "bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-lg shadow-red-950/60"
            }`}
            title="SPEC §10 demo scenario: triggers 6x frequency spike on FitPulse, staged requests (contacts, mic, sms), and unauthorized accesses"
          >
            <AlertOctagon
              className={`h-4 w-4 ${
                demoSuspiciousActive ? "animate-spin text-white" : "text-white"
              }`}
            />
            {demoSuspiciousActive
              ? "Stop suspicious demo"
              : "Simulate suspicious behaviour"}
          </Button>

          {/* Action Buttons: Pause/Resume, Reset, History */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={pause}
                className="bg-amber-950/40 border-amber-600/60 text-amber-300 hover:bg-amber-900/60 hover:text-amber-200 text-xs font-mono gap-1.5 shadow-sm"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={start}
                className="bg-emerald-950/40 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200 text-xs font-mono gap-1.5 shadow-sm"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="bg-[#071329] border-cyan-500/30 text-slate-300 hover:border-amber-500/70 hover:text-amber-300 hover:bg-amber-950/30 text-xs font-mono gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset demo
            </Button>

            <Link href="/history">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#071329] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 hover:text-cyan-100 text-xs font-mono gap-1.5 shadow-sm"
                title="Open Activity History / Full Audit Log"
              >
                <History className="h-3.5 w-3.5 text-cyan-400" />
                History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
