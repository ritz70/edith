"use client";

import { useEffect, useRef } from "react";

export function HudCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Check if fine pointer device
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const container = containerRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!container || !ring || !dot || !label) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let isClicking = false;
    let isVisible = false;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        container.style.opacity = "1";
      }

      // 0ms instant update for primary dot — zero React lag!
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;

      // Fast target detection without React re-renders
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        "button, a, [data-slot='card'], [data-slot='event-row'], [data-slot='recommendation-item'], input, select, .cursor-pointer"
      );

      if (interactive) {
        const text = (interactive.textContent || "").toLowerCase();
        const className = interactive.className || "";

        if (
          text.includes("simulate") ||
          text.includes("suspicious") ||
          text.includes("suspend") ||
          text.includes("deny") ||
          className.includes("rose") ||
          className.includes("red")
        ) {
          ring.className =
            "relative flex items-center justify-center w-8 h-8 -top-4 -left-4 rounded-sm border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all duration-100 scale-110";
          label.textContent = "LOCK";
          label.className = "absolute -right-8 top-0 text-[8px] font-mono font-bold tracking-tighter uppercase text-red-400";
        } else if (
          text.includes("pause") ||
          text.includes("caution") ||
          className.includes("amber")
        ) {
          ring.className =
            "relative flex items-center justify-center w-8 h-8 -top-4 -left-4 rounded-sm border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-100 scale-110";
          label.textContent = "LOCK";
          label.className = "absolute -right-8 top-0 text-[8px] font-mono font-bold tracking-tighter uppercase text-amber-400";
        } else {
          ring.className =
            "relative flex items-center justify-center w-8 h-8 -top-4 -left-4 rounded-sm border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] transition-all duration-100 scale-110";
          label.textContent = "LOCK";
          label.className = "absolute -right-8 top-0 text-[8px] font-mono font-bold tracking-tighter uppercase text-cyan-400";
        }
      } else {
        ring.className =
          "relative flex items-center justify-center w-6 h-6 -top-3 -left-3 rounded-full border border-cyan-500/50 transition-all duration-100 scale-100";
        label.textContent = "";
        label.className = "hidden";
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(0.85)`;
    };

    const onMouseUp = () => {
      isClicking = false;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(1)`;
    };

    const onMouseLeaveWindow = (e: MouseEvent) => {
      // Only hide if the mouse genuinely left the browser viewport
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        isVisible = false;
        container.style.opacity = "0";
      }
    };

    const onMouseEnterWindow = () => {
      isVisible = true;
      container.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeaveWindow);
    document.addEventListener("mouseenter", onMouseEnterWindow);

    // Highly responsive 60fps transform loop for outer ring (lerp factor 0.45 for snappy, lag-free feel)
    const tickLoop = () => {
      ringX += (targetX - ringX) * 0.45;
      ringY += (targetY - ringY) * 0.45;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) ${
        isClicking ? "scale(0.85)" : ""
      }`;

      animId = requestAnimationFrame(tickLoop);
    };

    animId = requestAnimationFrame(tickLoop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeaveWindow);
      document.removeEventListener("mouseenter", onMouseEnterWindow);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none opacity-0 transition-opacity duration-150"
    >
      {/* 1. Fast Primary Center Reticle Dot (0ms lag, direct transform) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-cyan-300 shadow-[0_0_8px_#06b6d4] will-change-transform"
      />

      {/* 2. Snappy Outer Targeting Reticle */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 will-change-transform"
      >
        <span
          ref={labelRef}
          className="hidden"
        />
      </div>
    </div>
  );
}
