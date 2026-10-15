import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Lightbulb,
  Check,
  Trophy,
  BookOpen,
} from "lucide-react";
import { PATTERN_MAP, PATTERNS } from "../../data/patterns";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import LessonLab from "../LessonLab";
import Playground from "./Playground";
import Artwork from "./Artwork";
import { BEGINNER } from "../../data/beginner";
import WorkedExample from "../curriculum/WorkedExample";
interface Props {
  id: string;
  learned: boolean;
  onExit: () => void;
  onComplete: (id: string) => void;
  onAnswered: (id: string, correct: boolean) => void;
  onNext: (id: string) => void;
}
export default function GuidedLesson({
  id,
  learned,
  onExit,
  onComplete,
  onAnswered,
  onNext,
}: Props) {
  const p = PATTERN_MAP[id];
  const [storedStep, setStep] = useLocalStorage<number>(
    `algocoach-lesson-step-${id}`,
    0,
  );
  const step = Number.isInteger(storedStep)
    ? Math.max(0, Math.min(4, storedStep))
    : 0;
  const [done] = useLocalStorage<string[]>(`algocoach-lab-${id}`, []);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [passed, setPassed] = useLocalStorage<boolean>(
    `algocoach-lesson-check-${id}`,
    false,
  );
  const correct = Array.from(id).reduce((n, c) => n + c.charCodeAt(0), 0) % 3;
  const wrong = [p.pitfalls[0], p.pitfalls[1]];
  const choices = [...wrong];
  choices.splice(correct, 0, p.signals[0]);
  const next = PATTERNS[PATTERNS.findIndex((x) => x.id === id) + 1];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  const finish = () => {
    onComplete(id);
    setStep(4);
  };
  return (
    <div className="lesson-shell">
      <header className="lesson-top">
        <button onClick={onExit} aria-label="Exit lesson">
          <X size={22} />
        </button>
        <span>
          <BookOpen size={18} />
          {p.name}
        </span>
        <div
          className="lesson-progress"
          aria-label={`${Math.min(step + 1, 4)} of 4 sections`}
        >
          {[0, 1, 2, 3].map((n) => (
            <i key={n} className={n <= step ? "filled" : ""} />
          ))}
        </div>
        <span className="lesson-step-label">{Math.min(step + 1, 4)} / 4</span>
      </header>
      {step === 4 ? (
        <div className="lesson-success">
          <span className="success-medal">
            <Trophy size={45} />
          </span>
          <div className="eyebrow">ANOTHER IDEA, UNLOCKED</div>
          <h1>You made it yours.</h1>
          <p>
            You explored {p.name.toLowerCase()}, practiced its recipe, and
            recognized when to use it.
          </p>
          <div className="success-stats">
            <span>
              <Check size={20} /> 4 exercises complete
            </span>
            <span>✦ {learned ? "Lesson saved" : "Progress saved"}</span>
          </div>
          <button
            className="studio-button"
            onClick={() => (next ? onNext(next.id) : onExit())}
          >
            {next ? "Try the next lesson" : "Back to learning"}
            <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={onExit}>
            Back to my dashboard
          </button>
          <button
            className="text-button"
            onClick={() => {
              setStep(0);
              setPicked(null);
            }}
          >
            Revisit this lesson
          </button>
        </div>
      ) : (
        <>
          <div className="lesson-layout">
            <aside className="lesson-outline">
              <span className="eyebrow">
                {p.level.toUpperCase()} · 8–12 MIN
              </span>
              <h3>Make the idea click.</h3>
              {[
                "Meet the idea",
                "See it in motion",
                "Try it yourself",
                "Make it stick",
              ].map((label, i) => (
                <div key={label} className={i === step ? "current" : ""}>
                  <span>{i < step ? <Check size={13} /> : i + 1}</span>
                  {label}
                </div>
              ))}
              <div className="outline-note">
                <Lightbulb size={20} />
                <p>
                  No rush. Experiment, make mistakes, and discover what works.
                </p>
              </div>
            </aside>
            <main className="lesson-content" key={step}>
              <div className="eyebrow">
                {
                  [
                    "01 / THE IDEA",
                    "02 / EXPLORE",
                    "03 / YOUR TURN",
                    "04 / THE TAKEAWAY",
                  ][step]
                }
              </div>
              <h1>
                {
                  [
                    "Every problem has a shape.",
                    "What happens next?",
                    "Learning is a doing thing.",
                    "Can you spot the signal?",
                  ][step]
                }
              </h1>
              {step === 0 && (
                <>
                  <p className="lesson-lead">{p.plain}</p>
                  <div className="lesson-illustration">
                    <Artwork
                      kind={
                        p.level === "Beginner"
                          ? 0
                          : p.level === "Intermediate"
                            ? 1
                            : 2
                      }
                    />
                  </div>
                  <div className="analogy-box">
                    <Lightbulb size={22} />
                    <div>
                      <strong>Think of it this way</strong>
                      <p>{p.analogy}</p>
                    </div>
                  </div>
                  <h3>The idea behind the pattern</h3>
                  <p className="lesson-prose">{p.idea}</p>
                  <WorkedExample example={BEGINNER[id]} />
                </>
              )}
              {step === 1 && (
                <>
                  <p className="lesson-lead">
                    Don’t just read the algorithm. Change the input, step
                    through it, and watch the work happen.
                  </p>
                  <Playground id={id} />
                  <div className="analogy-box">
                    <Lightbulb size={22} />
                    <div>
                      <strong>Pause and predict</strong>
                      <p>{p.hints[0]}</p>
                    </div>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <p className="lesson-lead">
                    Four small challenges turn an idea into intuition. Complete
                    them to continue.
                  </p>
                  <LessonLab
                    pattern={p}
                    onExerciseComplete={() => onAnswered(id, true)}
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <p className="lesson-lead">
                    Which clue suggests that <strong>{p.name}</strong> is a good
                    fit for a problem?
                  </p>
                  <div className="answer-options">
                    {choices.map((text, i) => (
                      <button
                        key={text}
                        onClick={() => {
                          if (passed) return;
                          setPicked(i);
                          onAnswered(id, i === correct);
                          if (i === correct) setPassed(true);
                        }}
                        className={`${picked === i ? "picked" : ""} ${passed && i === correct ? "right" : ""}`}
                        disabled={passed}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {text}
                        {passed && i === correct && <Check size={20} />}
                      </button>
                    ))}
                  </div>
                  {(picked !== null || passed) && (
                    <div
                      className={`answer-feedback ${passed ? "correct" : "incorrect"}`}
                      role="status"
                    >
                      <strong>
                        {passed
                          ? "Exactly. You spotted the clue."
                          : "Not quite. That’s a pitfall to avoid."}
                      </strong>
                      <p>
                        {passed
                          ? p.tagline
                          : "Think about the structure of the input and what the problem asks you to find. Try another answer."}
                      </p>
                    </div>
                  )}
                  <button
                    className="text-button hint-button"
                    onClick={() => setHint((h) => !h)}
                  >
                    <Lightbulb size={16} />
                    {hint ? "Hide the hint" : "A little nudge?"}
                  </button>
                  {hint && (
                    <p className="hint-text">{p.hints[1] ?? p.hints[0]}</p>
                  )}
                </>
              )}
            </main>
          </div>
          <footer className="lesson-bottom">
            <button
              className="text-button"
              onClick={() =>
                step === 0 ? onExit() : setStep((s) => Math.max(0, s - 1))
              }
            >
              <ArrowLeft size={17} /> {step === 0 ? "Exit lesson" : "Back"}
            </button>
            <span>
              {step === 2
                ? `${done.length} / 4 exercises complete`
                : step === 3
                  ? "A little reflection goes a long way."
                  : "Take your time. Curiosity isn’t a race."}
            </span>
            <button
              className="studio-button"
              disabled={
                step === 2 ? done.length < 4 : step === 3 ? !passed : false
              }
              onClick={() =>
                step === 3 ? finish() : setStep((s) => Math.min(3, s + 1))
              }
            >
              {step === 3 ? "Finish lesson" : "Continue"}
              <ArrowRight size={17} />
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
