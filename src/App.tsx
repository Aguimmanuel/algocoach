import { useState } from "react";
import Coach from "./components/Coach";
import Library from "./components/Library";
import Visualizer from "./components/Visualizer";
import CheatSheet from "./components/CheatSheet";
import { PATTERNS } from "./data/patterns";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { cn } from "./utils/cn";

type Tab = "coach" | "library" | "visualize" | "cheat";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "coach", label: "Coach", emoji: "🎓" },
  { id: "library", label: "Patterns", emoji: "📚" },
  { id: "visualize", label: "Visualize", emoji: "🎬" },
  { id: "cheat", label: "Cheat Sheet", emoji: "📏" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("coach");
  const [libraryId, setLibraryId] = useState<string | undefined>();
  const [learned, setLearned] = useLocalStorage<string[]>("algocoach-learned", []);

  const toggleLearned = (id: string) =>
    setLearned((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const openInLibrary = (id: string) => {
    setLibraryId(id);
    setTab("library");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pct = Math.round((learned.length / PATTERNS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg shadow-sm shadow-indigo-200">
              🧭
            </div>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-slate-900">AlgoCoach</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">Learn to choose the right algorithm</p>
            </div>
          </div>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto px-1 sm:order-none sm:w-auto sm:flex-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                  tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setTab("library")}
            className="ml-auto flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left transition hover:border-indigo-300"
            title="Your progress through the patterns"
          >
            <div className="relative h-8 w-8">
              <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-100" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-emerald-500 transition-all duration-500"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{pct}%</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold text-slate-700">
                {learned.length}/{PATTERNS.length} patterns
              </p>
              <p className="text-[11px] text-slate-400">learned</p>
            </div>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "coach" && <Coach learned={learned} onToggleLearned={toggleLearned} />}
        {tab === "library" && <Library learned={learned} onToggleLearned={toggleLearned} initialId={libraryId} />}
        {tab === "visualize" && <Visualizer onOpenPattern={openInLibrary} />}
        {tab === "cheat" && <CheatSheet onOpenPattern={openInLibrary} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-slate-400">
        Learn the <em>thinking</em>, not the answers. Every problem is a known pattern in disguise.
      </footer>
    </div>
  );
}
