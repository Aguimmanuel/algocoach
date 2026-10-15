import { useState } from "react";
import { ArrowRight, Lightbulb, ChevronDown, Check } from "lucide-react";
import type { BeginnerExample } from "../../data/beginner";
export default function WorkedExample({
  example,
  compact = false,
}: {
  example: BeginnerExample;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  return (
    <section className="worked-example">
      <button
        className="example-heading"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="example-icon">
          <Lightbulb size={21} />
        </span>
        <span>
          <small>LET’S DO ONE TOGETHER</small>
          <strong>{example.title}</strong>
        </span>
        <ChevronDown size={18} className={open ? "rotated" : ""} />
      </button>
      {open && (
        <div className="example-body">
          <div className="input-output">
            <div>
              <small>INPUT</small>
              <code>{example.input}</code>
            </div>
            <ArrowRight size={18} />
            <div>
              <small>EXPECTED OUTPUT</small>
              <code>{example.result}</code>
            </div>
          </div>
          <ol className="hand-trace">
            {example.steps.map((s, i) => (
              <li key={s}>
                <span>{i + 1}</span>
                <p>{s}</p>
              </li>
            ))}
          </ol>
          <div className="transfer-example">
            <span>ANOTHER WAY TO SEE IT</span>
            <h4>{example.another.title}</h4>
            <p>{example.another.body}</p>
          </div>
          <div className="plain-words">
            <Check size={17} />
            <p>
              <strong>In plain words.</strong> {example.words}
            </p>
          </div>
          <div className="edge-case">
            <strong>One thing to watch</strong>
            <p>{example.caution}</p>
          </div>
        </div>
      )}
    </section>
  );
}
