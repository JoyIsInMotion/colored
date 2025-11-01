// src/components/CategoryRow.jsx
import React from "react";
import ItemCard from "./ItemCard";

export default function CategoryRow({ label, items, onSelect }) {
  const ref = React.useRef(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, items?.length]);

  function scrollByDir(dir) {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Scrollable row */}
      <div
        ref={ref}
        role="region"
        aria-label={`${label} items`}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar
          overscroll-x-contain px-10
        "
      >
        <div className="flex gap-4 pr-8">
          {items.map((it) => (
            <div
              key={`${it.id}:${it.image_url || ""}`}
              className="min-w-[220px] max-w-[220px] snap-start"
            >
              <ItemCard
                item={it}
                variant="mono"
                onClick={() => onSelect?.(it)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white to-transparent" />

      {/* Controls */}
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        disabled={atStart}
        aria-label={`Scroll ${label} left`}
        className="absolute -left-10 top-1/2 -translate-y-1/2 z-10
                   rounded-full border bg-white/90 backdrop-blur px-3 py-2
                   shadow-md hover:bg-white disabled:opacity-40"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        disabled={atEnd}
        aria-label={`Scroll ${label} right`}
        className="absolute -right-10 top-1/2 -translate-y-1/2 z-10
                   rounded-full border bg-white/90 backdrop-blur px-3 py-2
                   shadow-md hover:bg-white disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}
