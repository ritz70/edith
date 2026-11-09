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
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="E.D.I.T.H. Logo"
            width={38}
            height={38}
            priority
            className="h-9 w-9 shrink-0 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                E.D.I.T.H.
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-950/60 border-emerald-700/60 text-emerald-400 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5"
              >
                Trust Heuristics Core
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Trust isn&apos;t granted once. It&apos;s earned continuously.
            </p>
          </div>
        </div>

        {/* Center / Right: Clock, Tick, Controls */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Simulated Clock & Tick Card */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 font-mono shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block leading-tight">
                  Simulated Time
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {time}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-800" />

            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block leading-tight">
                  Tick
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  #{tick}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-800" />

            <div className="flex items-center gap-1.5 pl-1">
              <span className="relative flex h-2.5 w-2.5">
                {isRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isRunning ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                />
              </span>
              <span className="text-[11px] font-medium text-slate-300">
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
                ? "bg-rose-700 hover:bg-rose-600 text-white border border-rose-400 shadow-rose-950/80 animate-pulse ring-2 ring-rose-500/50"
                : "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-rose-950/60"
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
                className="bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 text-xs font-mono gap-1.5"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={start}
                className="bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-200 text-xs font-mono gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800/60 text-xs font-mono gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset demo
            </Button>

            <Link href="/history">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-900/90 border-slate-800 text-cyan-300 hover:bg-slate-800 hover:text-cyan-200 text-xs font-mono gap-1.5"
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
