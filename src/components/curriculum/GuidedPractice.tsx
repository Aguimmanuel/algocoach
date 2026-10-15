import { useState, useId } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Check } from "lucide-react";
import { PLANS, planExample, type TeachingQuestion } from "../../data/teaching";
import { CASES, lessonTrace, type TraceFrame } from "../../lib/lessonTraces";
import WorkedExample from "./WorkedExample";
import PixelLab from "./PixelLab";
export function PracticeCheck({
  q,
  hint,
  passed,
  onPass,
  label = "Check prediction",
  onReview,
  onAttempt,
}: {
  q: TeachingQuestion;
  hint: string;
  passed: boolean;
  onPass: () => void;
  label?: string;
  onReview?: () => void;
  onAttempt?: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null),
    [wrong, setWrong] = useState(false),
    [recovery, setRecovery] = useState(false);
  return (
    <section className="practice-check">
      <h3>{q.prompt}</h3>
      <div className="practice-options" role="group" aria-label={q.prompt}>
        {q.options.map((s, i) => (
          <button
            key={i}
            aria-pressed={picked === i || (passed && i === q.answer)}
            disabled={passed}
            className={
              (picked === i ? "picked " : "") +
              (passed && i === q.answer ? "right" : "")
            }
            onClick={() => {
              setPicked(i);
              setWrong(false);
            }}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {s}
            {passed && i === q.answer && <Check size={17} />}
          </button>
        ))}
      </div>
      {!passed && (
        <button
          className="studio-button"
          disabled={picked === null}
          onClick={() => {
            onAttempt?.(picked === q.answer);
            if (picked === q.answer) {
              setWrong(false);
              onPass();
            } else setWrong(true);
          }}
        >
          {label}
        </button>
      )}
      {(wrong || passed) && (
        <div
          className={"practice-feedback " + (passed ? "correct" : "")}
          role="status"
        >
          <strong>
            {passed
              ? "Checked. Here is the reason."
              : "Not yet. Try a smaller step."}
          </strong>
          <p>{passed ? q.explain : hint}</p>
          {wrong && (
            <>
              <button
                className="text-button"
                onClick={() => setRecovery(!recovery)}
                aria-expanded={recovery}
              >
                Show the worked recovery
              </button>
              {onReview && (
                <button className="text-button" onClick={onReview}>
                  Reopen the worked example
                </button>
              )}
              {recovery && (
                <p>
                  {q.explain} Now choose the answer that follows this reasoning.
                  Reading the recovery alone does not complete the check.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
export function StructureDiagram({ frame }: { frame: TraceFrame }) {
  const marker = useId().replace(/:/g, "");
  const nodes = frame.nodes ?? [];
  if (!nodes.length) return null;
  if (nodes.every((n) => n.label.includes(": ")))
    return (
      <div className="trace-array" aria-label="List positions and values">
        {nodes.map((n) => (
          <div
            key={n.id}
            className={frame.active?.includes(n.id) ? "active" : ""}
          >
            <small>POSITION {n.id}</small>
            <strong>{n.label.split(": ")[1]}</strong>
            {frame.active?.includes(n.id) && <span>current</span>}
          </div>
        ))}
      </div>
    );
  const height = Math.max(230, ...nodes.map((n) => n.y + 40));
  return (
    <figure className="structure-diagram">
      <svg
        viewBox={`0 0 430 ${height}`}
        role="img"
        aria-label={
          nodes.map((n) => n.label).join(", ") +
          ". " +
          (frame.edges ?? [])
            .map((e) => `${e.from} to ${e.to}${e.label ? " " + e.label : ""}`)
            .join("; ")
        }
      >
        <defs>
          <marker
            id={marker}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="#536b43" />
          </marker>
        </defs>
        {frame.edges?.map((e, i) => {
          const a = nodes.find((n) => n.id === e.from),
            b = nodes.find((n) => n.id === e.to);
          if (!a || !b) return null;
          const dx = b.x - a.x,
            dy = b.y - a.y,
            d = Math.hypot(dx, dy) || 1;
          return (
            <g key={i}>
              <line
                x1={a.x + (dx / d) * 23}
                y1={a.y + (dy / d) * 23}
                x2={b.x - (dx / d) * 25}
                y2={b.y - (dy / d) * 25}
                stroke="#536b43"
                strokeWidth="2"
                markerEnd={`url(#${marker})`}
              />
              {e.label && (
                <text
                  x={(a.x + b.x) / 2 + 7}
                  y={(a.y + b.y) / 2 - 6}
                  fontSize="13"
                  fill="#263e27"
                  paintOrder="stroke"
                  stroke="#fafbf5"
                  strokeWidth="5"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r="23"
              fill={frame.active?.includes(n.id) ? "#d7e8bd" : "#fff"}
              stroke={frame.active?.includes(n.id) ? "#365b2c" : "#819373"}
              strokeWidth="2"
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fontSize={n.label.length > 7 ? "10" : "15"}
              fontWeight="600"
              fill="#233b26"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        Arrows show the links or choices. Highlighted nodes are involved in this
        move; the text below explains what changes.
      </figcaption>
    </figure>
  );
}
export default function GuidedPractice({
  id,
  passed,
  predictionPassed,
  onPrediction,
  onSolved,
}: {
  id: string;
  passed: boolean;
  predictionPassed: boolean;
  onPrediction: () => void;
  onSolved: () => void;
}) {
  const p = PLANS[id],
    cases = CASES[id];
  const [selected, setSelected] = useState(0),
    [step, setStep] = useState(0),
    [review, setReview] = useState(false);
  const frames = lessonTrace(id, cases[selected]);
  const frame = frames[Math.min(step, frames.length - 1)];
  const pixel =
    id === "filtering-images"
      ? "channels"
      : id === "inverting-colors"
        ? "invert"
        : id === "composing-functions"
          ? "compose"
          : id === "debugging-images"
            ? "debug"
            : null;
  return (
    <section className="guided-practice" aria-label="Guided practice">
      <div className="practice-phase">
        <span className="eyebrow">1 · PREDICT ONE MOVE</span>
        <PracticeCheck
          q={p.predict}
          hint={p.hint}
          passed={predictionPassed || passed}
          onPass={onPrediction}
        />
      </div>
      {(predictionPassed || passed) && (
        <>
          <div className="practice-phase">
            <span className="eyebrow">2 · EXPLORE THE RECIPE</span>
            <label className="trace-case">
              Example to explore
              <select
                aria-label="Choose a trace case"
                value={selected}
                onChange={(e) => {
                  setSelected(+e.target.value);
                  setStep(0);
                }}
              >
                {cases.map((c, i) => (
                  <option key={c.label} value={i}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <StructureDiagram frame={frame} />
            <div className="trace-state" aria-live="polite">
              <span>
                MOVE {step + 1} OF {frames.length}
              </span>
              <h3>{frame.title}</h3>
              <p>{frame.explanation}</p>
              <dl>
                {Object.entries(frame.state).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="trace-controls">
              <button
                aria-label="Previous move"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              <button
                aria-label="Reset narrated trace"
                onClick={() => setStep(0)}
              >
                <RotateCcw size={18} />
                Reset trace
              </button>
              <button
                aria-label="Next move"
                disabled={step >= frames.length - 1}
                onClick={() =>
                  setStep((s) => Math.min(frames.length - 1, s + 1))
                }
              >
                Next move
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="trace-legend">
              The state boxes are the recipe’s memory after this move. Use
              Previous to compare changes. Reset affects only the trace, not
              your checked answers.
            </p>
            {pixel && (
              <PixelLab
                mode={pixel}
                key={selected}
                initialSample={
                  cases[selected].pixel! as [number, number, number]
                }
              />
            )}
          </div>
          <div className="practice-phase">
            <span className="eyebrow">3 · APPLY IT TO A DIFFERENT CASE</span>
            <PracticeCheck
              q={p.transfer}
              hint={p.hint}
              label="Check new case"
              passed={passed}
              onPass={onSolved}
            />
            <button
              className="text-button"
              onClick={() => setReview(!review)}
              aria-expanded={review}
            >
              Review the recipe in plain words
            </button>
            {review && <WorkedExample example={planExample(id)} />}
          </div>
        </>
      )}
      {passed && (
        <p className="practice-done" role="status">
          <Check size={18} />
          Practice checked. You can now continue; exploring more cases is
          optional.
        </p>
      )}
    </section>
  );
}
