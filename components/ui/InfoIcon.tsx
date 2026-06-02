"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function InfoIcon({ tip }: { tip: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  // useLayoutEffect → position is computed before paint, no flash at (0,0)
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const tw = tipRef.current?.offsetWidth ?? 288;
      const th = tipRef.current?.offsetHeight ?? 60;
      const gap = 8;
      const pad = 10;
      // h-16 sticky TopBar = 64px; never place tooltip behind it
      const topBarH = 64;

      // Prefer bottom; flip to top if bottom overflows; force bottom if top hits TopBar
      let side: "top" | "bottom" = "bottom";
      if (r.bottom + gap + th > window.innerHeight - pad) side = "top";
      if (side === "top" && r.top - gap - th < topBarH + pad) side = "bottom";

      let top = side === "bottom" ? r.bottom + gap : r.top - th - gap;
      let left = r.left + r.width / 2 - tw / 2;

      left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
      top  = Math.max(topBarH + pad, Math.min(top, window.innerHeight - th - pad));

      setPos({ top, left });
    };

    update();
    const id = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Reset when closed so next open starts hidden
  useEffect(() => { if (!open) setPos(null); }, [open]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        className={cn(
          "w-4 h-4 rounded-full border text-[10px] font-semibold cursor-help",
          "flex items-center justify-center",
          "text-muted-foreground border-muted-foreground/50",
        )}
      >
        ?
      </span>

      {open && typeof window !== "undefined" && createPortal(
        <span
          ref={tipRef}
          role="tooltip"
          style={{
            position: "fixed",
            top:  pos?.top  ?? 0,
            left: pos?.left ?? 0,
            zIndex: 9999,
            visibility: pos ? "visible" : "hidden",
          }}
          className={cn(
            "w-72 rounded-lg border p-3 shadow-xl pointer-events-none",
            "text-[12px] leading-relaxed font-normal whitespace-normal",
            "bg-card text-card-foreground border-border",
          )}
        >
          {tip}
        </span>,
        document.body,
      )}
    </span>
  );
}
