"use client";

import { useEffect, useState, useRef } from "react";

export function HudCursor() {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [hoverState, setHoverState] = useState<"default" | "cyan" | "gold" | "red">("default");
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const trailingPos = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const [renderTrailing, setRenderTrailing] = useState<{ x: number; y: number }>({
    x: -100,
    y: -100,
  });

  useEffect(() => {
    // Only activate on devices with fine pointer (mouse/trackpad)
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      setPos({ x: e.clientX, y: e.clientY });

      // Detect hover target
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        "button, a, [data-slot='card'], [data-slot='event-row'], [data-slot='recommendation-item'], input, select, .cursor-pointer"
      );

      if (interactive) {
        const text = interactive.textContent?.toLowerCase() || "";
        const className = interactive.className || "";

        if (
          text.includes("simulate") ||
          text.includes("suspicious") ||
          text.includes("suspend") ||
          text.includes("deny") ||
          className.includes("rose") ||
          className.includes("red")
        ) {
          setHoverState("red");
        } else if (
          text.includes("pause") ||
          text.includes("caution") ||
          className.includes("amber")
        ) {
          setHoverState("gold");
        } else {
          setHoverState("cyan");
        }
      } else {
        setHoverState("default");
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    // Smooth trailing lag for the outer target reticle
    const updateTrailing = () => {
      trailingPos.current.x += (pos.x - trailingPos.current.x) * 0.25;
      trailingPos.current.y += (pos.y - trailingPos.current.y) * 0.25;
      setRenderTrailing({
        x: Math.round(trailingPos.current.x * 10) / 10,
        y: Math.round(trailingPos.current.y * 10) / 10,
      });
      animId = requestAnimationFrame(updateTrailing);
    };

    animId = requestAnimationFrame(updateTrailing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [pos.x, pos.y]);

  if (!isVisible) return null;

  const isLocked = hoverState !== "default";

  let accentColor = "#06b6d4"; // Cyan
  let borderColor = "border-cyan-400";
  let textColor = "text-cyan-400";

  if (hoverState === "red") {
    accentColor = "#ef4444";
    borderColor = "border-red-500";
    textColor = "text-red-400";
  } else if (hoverState === "gold") {
    accentColor = "#f59e0b";
    borderColor = "border-amber-400";
    textColor = "text-amber-400";
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* 1. Fast Primary Center Reticle Dot */}
      <div
        className="fixed top-0 left-0 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`,
        }}
      >
        <div
          className={`h-1.5 w-1.5 rounded-full ${
            hoverState === "red"
              ? "bg-red-400 shadow-[0_0_8px_#ef4444]"
              : hoverState === "gold"
              ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
              : "bg-cyan-300 shadow-[0_0_8px_#06b6d4]"
          }`}
        />
      </div>

      {/* 2. Trailing Outer Targeting Box / Ring */}
      <div
        className="fixed top-0 left-0 transition-all duration-150 ease-out"
        style={{
          transform: `translate3d(${renderTrailing.x - 16}px, ${renderTrailing.y - 16}px, 0)`,
        }}
      >
        <div
          className={`relative flex items-center justify-center transition-all duration-200 ${
            isLocked
              ? `h-8 w-8 scale-125 border ${borderColor} rounded-sm shadow-[0_0_15px_${accentColor}50]`
              : "h-8 w-8 rounded-full border border-cyan-500/40"
          } ${isClicking ? "scale-90 opacity-75" : "scale-100 opacity-90"}`}
        >
          {/* Tactical Corner Brackets when locked */}
          {isLocked && (
            <>
              <span className={`absolute -top-1 -left-1 h-1.5 w-1.5 border-t border-l ${borderColor}`} />
              <span className={`absolute -top-1 -right-1 h-1.5 w-1.5 border-t border-r ${borderColor}`} />
              <span className={`absolute -bottom-1 -left-1 h-1.5 w-1.5 border-b border-l ${borderColor}`} />
              <span className={`absolute -bottom-1 -right-1 h-1.5 w-1.5 border-b border-r ${borderColor}`} />
            </>
          )}

          {/* Crosshair ticks */}
          {!isLocked && (
            <>
              <span className="absolute top-0 h-1 w-px bg-cyan-400/60" />
              <span className="absolute bottom-0 h-1 w-px bg-cyan-400/60" />
              <span className="absolute left-0 w-1 h-px bg-cyan-400/60" />
              <span className="absolute right-0 w-1 h-px bg-cyan-400/60" />
            </>
          )}

          {/* Micro Telemetry Readout */}
          <span
            className={`absolute -right-12 top-0 text-[8px] font-mono tracking-tighter uppercase ${textColor} opacity-80 whitespace-nowrap`}
          >
            {isLocked ? "LOCK" : `${pos.x},${pos.y}`}
          </span>
        </div>
      </div>
    </div>
  );
}

