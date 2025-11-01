import React, { useEffect, useState, useMemo } from "react";
import DetailsModal from "../components/DetailsModal";
import { supabase } from "../lib/supabase";
import { listMyItemsCurrent } from "../api/items";
import CategoryRow from "../components/CategoryRow";

export default function CollectionPage() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading"); // "loading" | "ready" | "anon" | "error"
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await listMyItemsCurrent();
        if (!cancelled) {
          setItems(rows);
          setState("ready");
        }
      } catch (e) {
        if ((e?.message || "").includes("Not signed in")) setState("anon");
        else { console.error(e); setState("error"); }
      }
    }

    load(); // initial

    // re-fetch when auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setState("loading");
      load();
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);


  const CATEGORY_ORDER = [
    "top",
    "bottom",
    "outerwear",
    "dress",
    "shoes",
    "bag",
    "accessories",
    "other",
  ];

  const CATEGORY_LABELS = {
    top: "Tops",
    bottom: "Bottoms",
    outerwear: "Outerwear",
    dress: "Dresses",
    shoes: "Shoes",
    bag: "Bags",
    accessories: "Accessories",
    other: "Other",
  };

  const itemsByCategory = useMemo(() => {
    const map = {};
    for (const it of items) {
      const cat = it.category || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(it);
    }
    return map;
  }, [items]);

  function AddButton({ label }) {
    return (
      <button
        onClick={() => setSelected({ isNew: true })}
        className="
          inline-flex items-center gap-2
          px-4 py-2 text-sm font-medium
          rounded-lg border border-neutral-900
          bg-neutral-900 text-white
          hover:bg-white hover:text-neutral-900
          transition
        "
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-full border border-neutral-400 text-lg leading-none">
          ＋
        </span>
        <span>{label}</span>
      </button>
    );
  }


  return (
    <main className="max-w-screen-xl mx-auto px-6 pt-12 pb-24" style={{ fontFamily: '"Playfair Display", serif' }}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,180px] gap-8">

        <section>
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-wide text-neutral-900">My Collection</h1>
            <p className="text-neutral-600 mt-2 text-sm md:text-base leading-relaxed max-w-lg">All your pieces in one place.</p>
          </header>

          {state === "loading" && <div className="text-neutral-600 text-sm">Loading…</div>}
          {state === "anon" && <div className="text-neutral-600 text-sm">Please sign in to view your collection.</div>}
          {state === "error" && <div className="text-red-600 text-sm">Couldn’t load items.</div>}

          {state === "ready" && (
            <>
              {items.length === 0 && (
                <section className="mb-10 flex justify-center">
                  <div className="border border-neutral-200 rounded-xl p-10 text-center max-w-md bg-neutral-50/50 shadow-sm">
                    <h2 className="text-xl font-medium text-neutral-900 mb-2">Your wardrobe is empty</h2>
                    <p className="text-neutral-600 text-sm mb-6 leading-relaxed">Add your first item to start tracking what you own.</p>
                    <AddButton label="Add first item" />
                  </div>
                </section>
              )}

              {items.length > 0 && (
                <>
                  {CATEGORY_ORDER.map((catKey) => {
                    const group = itemsByCategory[catKey] || [];
                    if (group.length === 0) return null;

                    const label = CATEGORY_LABELS[catKey] || catKey[0].toUpperCase() + catKey.slice(1);

                    return (
                      <section key={catKey} className="mb-10">
                        <div className="flex items-baseline justify-between mb-4">
                          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                            <span>{label}</span>
                            <span className="text-neutral-400 text-sm font-normal">({group.length})</span>
                          </h2>
                        </div>

                        {/* One row per category */}
                        <CategoryRow
                          label={label}
                          items={group}
                          onSelect={(it) => setSelected(it)}
                        />
                      </section>
                    );
                  })}
                </>
              )}
            </>
          )}
        </section>

        {/* Right-side floating Add (noticeable) */}
        {state === "ready" && (
          <button
            onClick={() => setSelected({ isNew: true })}
            aria-label="Add item"
            className=" fixed bottom-6 z-0
             right-[max(1rem,calc((100vw-1280px)/2+2.2rem))]
             m:right-[max(1.25rem,calc((100vw-1280px)/2+2rem))]
             inline-flex items-center gap-3 px-5 py-4 rounded-full
             shadow-2xl border border-neutral-900/70
              bg-gradient-to-r from-neutral-900 to-neutral-700
               text-white hover:from-white
                hover:to-white hover:text-neutral-900
                 transition transform hover:scale-105 active:scale-95
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/30 backdrop-blur "
          >
            <span aria-hidden="true" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400" />
            <span aria-hidden="true" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-xl leading-none">＋</span>
            <span className="font-semibold tracking-wide">Add item</span>
          </button>
        )}
      </div>



      {selected && (
        <DetailsModal
          item={selected}
          onClose={() => setSelected(null)}
          onCreated={(newItem) => {
            setItems((prev) => [newItem, ...prev]);
            setSelected(null);
          }}
          onUpdated={(savedItem) => {
            setItems((prev) => prev.map((it) => (it.id === savedItem.id ? savedItem : it)));
            setSelected(savedItem);
          }}
          onDeleted={(deletedId) => {
            setItems((prev) => prev.filter((it) => it.id !== deletedId));
            setSelected(null);
          }}
        />
      )}
    </main>
  );


}
