import { useState } from "react";
import { ArrowRight, Search, Check, Clock3 } from "lucide-react";
import { PATTERNS, type Level } from "../../data/patterns";
import Artwork from "./Artwork";
export const TRACKS: {
  level: Level;
  title: string;
  description: string;
  label: string;
}[] = [
  {
    level: "Beginner",
    title: "The algorithmic mindset",
    description:
      "Build your intuition. Turn a tricky problem into a familiar pattern.",
    label: "FOUNDATIONS",
  },
  {
    level: "Intermediate",
    title: "Think in connections",
    description:
      "Explore relationships, break problems down, and find smarter paths.",
    label: "BUILD YOUR TOOLKIT",
  },
  {
    level: "Advanced",
    title: "Make the complex simple",
    description: "Tackle bigger ideas with elegant, efficient strategies.",
    label: "GO DEEPER",
  },
];
export default function Courses({
  learned,
  onLesson,
}: {
  learned: string[];
  onLesson: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All courses");
  const [query, setQuery] = useState("");
  const list = PATTERNS.filter(
    (p) =>
      (filter === "All courses" || p.level === filter) &&
      (p.name + " " + p.tagline).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="studio-page">
      <div className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</div>
      <h1>Discover your next idea.</h1>
      <p className="page-intro">
        Less memorizing. More understanding. Learn algorithms by doing.
      </p>
      <div className="catalog-tools">
        <div
          className="filter-pills"
          role="group"
          aria-label="Filter by difficulty"
        >
          {["All courses", "Beginner", "Intermediate", "Advanced"].map((x) => (
            <button
              key={x}
              onClick={() => setFilter(x)}
              className={filter === x ? "selected" : ""}
            >
              {x}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a pattern…"
            aria-label="Search courses"
          />
        </label>
      </div>
      {!query && (
        <div className="track-grid">
          {TRACKS.filter(
            (t) => filter === "All courses" || filter === t.level,
          ).map((t) => {
            const i = TRACKS.indexOf(t);
            const ps = PATTERNS.filter((p) => p.level === t.level);
            const n = ps.filter((p) => learned.includes(p.id)).length;
            return (
              <button
                className={`track-card tone-${i}`}
                key={t.level}
                onClick={() =>
                  onLesson(
                    (ps.find((p) => !learned.includes(p.id)) ?? ps[0]).id,
                  )
                }
              >
                <div className="track-image">
                  <Artwork kind={i} />
                  <span className="track-level">{t.level}</span>
                </div>
                <div className="track-copy">
                  <span className="eyebrow">{t.label}</span>
                  <h3>{t.title}</h3>
                  <p>{t.description}</p>
                  <div className="track-meta">
                    <span>
                      {ps.length} lessons · {n} completed
                    </span>
                    <ArrowRight size={18} />
                  </div>
                  <div className="thin-progress">
                    <i style={{ width: `${(n / ps.length) * 100}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="section-heading">
        <h2>{query ? "Search results" : "Explore the lessons"}</h2>
        <span>{list.length} patterns</span>
      </div>
      <div className="lesson-grid">
        {list.map((p) => (
          <button
            className="lesson-tile"
            key={p.id}
            onClick={() => onLesson(p.id)}
          >
            <span
              className={`pattern-token tone-${TRACKS.findIndex((t) => t.level === p.level)}`}
            >
              {learned.includes(p.id) ? <Check size={22} /> : p.emoji}
            </span>
            <span>
              <small>{p.level}</small>
              <strong>{p.name}</strong>
              <span className="tile-description">{p.tagline}</span>
              <span className="lesson-duration">
                <Clock3 size={13} /> 8–12 min · 4 exercises
              </span>
            </span>
            <ArrowRight className="tile-arrow" size={18} />
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Search size={30} />
          <h3>No patterns found</h3>
          <p>Try a shorter search or another difficulty.</p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("All courses");
            }}
            className="studio-button secondary"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
