"use client";

import { useEffect, useRef } from "react";

export function HudCursor() {
  const reticleRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only activate on devices with fine pointer (mouse/trackpad)
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const reticle = reticleRef.current;
    const ring = ringRef.current;
    if (!reticle || !ring) return;

    let isVisible = false;

    // Hide native cursor while HUD reticle is active
    document.documentElement.classList.add("hud-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      // Use left/top for placement so CSS transform (-50%,-50%) keeps centering intact
      reticle.style.left = `${e.clientX}px`;
      reticle.style.top = `${e.clientY}px`;

      if (!isVisible) {
        isVisible = true;
        reticle.style.opacity = "1";
      }

      // Fast target detection for color & scale state
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
          ring.setAttribute("data-state", "red");
        } else if (
          text.includes("pause") ||
          text.includes("caution") ||
          className.includes("amber")
        ) {
          ring.setAttribute("data-state", "gold");
        } else {
          ring.setAttribute("data-state", "cyan");
        }
      } else {
        ring.setAttribute("data-state", "default");
      }
    };

    const onMouseDown = () => {
      ring.setAttribute("data-clicking", "true");
    };

    const onMouseUp = () => {
      ring.removeAttribute("data-clicking");
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        isVisible = false;
        reticle.style.opacity = "0";
      }
    };

    const onMouseEnter = () => {
      isVisible = true;
      reticle.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      document.documentElement.classList.remove("hud-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    /*
     * The wrapper is fixed, positioned via left/top in JS.
     * -translate-x-1/2 -translate-y-1/2 centers the whole reticle on that point.
     * Both the dot and ring are absolute inside, also centered independently.
     * This guarantees dot center === ring center === mouse hotspot.
     */
    <div
      ref={reticleRef}
      className="pointer-events-none fixed z-[999999] opacity-0 select-none"
      style={{
        top: "-100px",
        left: "-100px",
        transform: "translate(-50%, -50%)",
        willChange: "left, top",
      }}
    >
      {/* Outer Targeting Ring — absolute centered, same origin as dot */}
      <div
        ref={ringRef}
        data-state="default"
        className="hud-reticle-ring absolute top-1/2 left-1/2 rounded-full"
      >
        {/* Cardinal Crosshair Ticks */}
        <span className="crosshair-tick crosshair-top" />
        <span className="crosshair-tick crosshair-bottom" />
        <span className="crosshair-tick crosshair-left" />
        <span className="crosshair-tick crosshair-right" />
      </div>

      {/* Precision Center Dot — absolute centered, painted above ring */}
      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee] z-10" />
    </div>
  );
}
