import { useState } from "react";
import { RotateCcw, ArrowRight } from "lucide-react";
import Visualizer from "../Visualizer";
import ExampleSelector from "./ExampleSelector";
import { PLAYGROUND_EXAMPLES } from "../../data/playgroundExamples";

export default function Playground({ id }: { id: string }) {
  const examples = PLAYGROUND_EXAMPLES[id];
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState(examples?.[0].input.target ?? 10);
  if (
    !["brute", "binary-search", "two-pointers", "sliding-window"].includes(id)
  ) {
    return (
      <div className="embedded-visualizer">
        <Visualizer initialId={id} focused />
      </div>
    );
  }
  const example = examples[selected];
  const arr = example.input.values ?? [];
  const k = example.input.k ?? 1;
  const frames: { active: number[]; text: string }[] = [];
  let result: number | number[] = [-1, -1];
  if (id === "brute") {
    let found = false;
    for (let i = 0; i < arr.length && !found; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const sum = arr[i] + arr[j];
        frames.push({
          active: [i, j],
          text: `Check ${arr[i]} + ${arr[j]} = ${sum}. ${sum === target ? "A match! Return these two positions." : "Not our target. Try the next pair."}`,
        });
        if (sum === target) {
          result = [i, j];
          found = true;
          break;
        }
      }
    }
  }
  if (id === "two-pointers") {
    let left = 0,
      right = arr.length - 1;
    while (left < right) {
      const sum = arr[left] + arr[right];
      frames.push({
        active: [left, right],
        text: `${arr[left]} + ${arr[right]} = ${sum}. ${sum === target ? "Match found. Return these positions." : sum > target ? "Too large: move the right pointer left." : "Too small: move the left pointer right."}`,
      });
      if (sum === target) {
        result = [left, right];
        break;
      }
      if (sum > target) right--;
      else left++;
    }
  }
  if (id === "binary-search") {
    result = -1;
    let left = 0,
      right = arr.length - 1;
    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      frames.push({
        active: [middle],
        text: `Search indices ${left}–${right}. Middle value: ${arr[middle]}. ${arr[middle] === target ? "Found it!" : arr[middle] < target ? "Too small: discard the left half." : "Too large: discard the right half."}`,
      });
      if (arr[middle] === target) {
        result = middle;
        break;
      }
      if (arr[middle] < target) left = middle + 1;
      else right = middle - 1;
    }
  }
  if (id === "sliding-window") {
    let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
    let best = sum;
    for (let start = 0; start <= arr.length - k; start++) {
      if (start > 0) sum += arr[start + k - 1] - arr[start - 1];
      best = Math.max(best, sum);
      const active = Array.from({ length: k }, (_, i) => start + i);
      frames.push({
        active,
        text: `Window ${start}–${start + k - 1}: ${active.map((i) => arr[i]).join(" + ")} = ${sum}. Best so far: ${best}. ${start === 0 ? "Start with the first window." : `Reuse the sum: remove ${arr[start - 1]}, add ${arr[start + k - 1]}.`}`,
      });
    }
    result = best;
  }
  if (frames.length === 0)
    frames.push({
      active: [],
      text: "There are fewer than two positions. A pair requires two different positions, so no comparison can be made.",
    });
  frames.push({
    active: [],
    text: `Result: ${JSON.stringify(result)}. ${id === "sliding-window" ? "This is the largest window sum." : typeof result === "number" ? (result < 0 ? "The search interval is empty; the target is absent." : "This is the zero-based position of the target.") : result[0] < 0 ? "No two different positions sum to the target." : "These are zero-based positions, not the values themselves."}`,
  });
  const current = Math.min(step, frames.length - 1);
  const frame = frames[current];
  return (
    <div className="experiment">
      <div className="experiment-heading">
        <span className="eyebrow">THE PLAYGROUND</span>
        <button onClick={() => setStep(0)}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      <h3>
        {id === "binary-search"
          ? "Find a value. Halve the work."
          : id === "sliding-window"
            ? "A moving window, not a new calculation."
            : "Find the pair. Notice the work."}
      </h3>
      <p>
        Choose one of five examples, then trace the algorithm one step at a
        time.
      </p>
      <ExampleSelector
        id={id}
        selected={selected}
        onSelect={(next) => {
          setSelected(next);
          setTarget(examples[next].input.target ?? 10);
          setStep(0);
        }}
      />
      {id !== "sliding-window" && (
        <label className="target-input">
          Target{" "}
          <input
            type="number"
            min="-100"
            max="100"
            value={target}
            onChange={(event) => {
              setTarget(Number(event.target.value));
              setStep(0);
            }}
          />
        </label>
      )}
      {id !== "sliding-window" && target !== example.input.target && (
        <p className="playground-example-note">
          Custom target: {target}. The trace uses your edit; reselect an example
          to restore its preset.
        </p>
      )}
      <div className="number-array">
        {arr.map((number, index) => (
          <div key={index}>
            <span className={frame.active.includes(index) ? "highlight" : ""}>
              {number}
            </span>
            <small>{index}</small>
          </div>
        ))}
      </div>
      <div
        className="trace-explanation"
        data-testid="playground-trace"
        aria-live="polite"
      >
        {frame.text}
      </div>
      <div className="experiment-controls">
        <span>
          Step {current + 1} of {frames.length}
        </span>
        <button
          className="studio-button secondary"
          disabled={current === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          className="studio-button"
          disabled={current >= frames.length - 1}
          onClick={() => setStep((s) => Math.min(frames.length - 1, s + 1))}
        >
          Next step <ArrowRight size={16} />
        </button>
        <button
          className="text-button"
          disabled={current >= frames.length - 1}
          onClick={() => setStep(frames.length - 1)}
        >
          Jump to result
        </button>
      </div>
    </div>
  );
}
