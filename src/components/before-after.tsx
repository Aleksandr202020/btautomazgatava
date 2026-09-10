import { useCallback, useRef, useState } from "react";
import { useLang } from "@/lib/lang";

export function BeforeAfter() {
  const { t } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(52);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, next)));
  }, []);

  return (
    <div
      ref={wrap}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border bg-elevated select-none"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) move(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <img src="/images/after.jpg" alt={t("after")} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src="/images/before.jpg"
          alt={t("before")}
          className="absolute inset-0 size-full max-w-none object-cover"
          style={{ width: wrap.current ? `${wrap.current.clientWidth}px` : "100%", height: "100%" }}
        />
      </div>
      <div className="absolute inset-y-0 w-px bg-fg" style={{ left: `${pos}%` }} />
      <button
        type="button"
        aria-label={t("dragHint")}
        className="absolute top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg text-fg"
        style={{ left: `${pos}%` }}
      >
        <span className="block text-xs tracking-widest">||</span>
      </button>
      <span className="absolute left-3 top-3 rounded-sm bg-bg/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
        {t("before")}
      </span>
      <span className="absolute right-3 top-3 rounded-sm bg-bg/70 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
        {t("after")}
      </span>
    </div>
  );
}
