import { useState } from "react";
import { Code2, ChevronDown } from "lucide-react";
export function explainLine(line: string): string {
  const s = line.trim();
  if (!s) return "A blank line separates related parts of the template.";
  if (s.startsWith("#"))
    return "This is a comment for the reader. Python does not execute it.";
  if (s.startsWith("import "))
    return "Load a reusable library so its functions can be called below.";
  if (s.startsWith("def "))
    return "Define a function. The values inside the parentheses are its inputs. The indented block is its recipe.";
  if (s.startsWith("return "))
    return "Send this result back to whoever called the function, and stop this function call.";
  if (s.includes("continue"))
    return "Skip the remainder of this loop iteration and move to the next iteration.";
  if (s.startsWith("for "))
    return "Repeat the indented steps for each item in this collection.";
  if (s.startsWith("while "))
    return "Repeat the indented steps while this condition remains true. The loop must eventually change that condition.";
  if (s.startsWith("if ") || s.startsWith("elif "))
    return "Check a condition. Run the indented block only when the condition is true.";
  if (s.startsWith("else"))
    return "Use this branch when the earlier condition was false.";
  if (s.includes("heappop"))
    return "Remove the smallest-priority entry from the heap. The heap restores its ordering after removal.";
  if (s.includes("heappush"))
    return "Add an entry to the heap while preserving its priority ordering.";
  if (s.includes(".popleft()"))
    return "Remove the oldest entry from the queue, which preserves breadth-first order.";
  if (s.includes(".append("))
    return "Add this item at the end of the collection. In a stack, the end is the top.";
  if (s.includes(".pop("))
    return "Remove an item from the collection. Check the surrounding code to see which position is removed.";
  if (s.includes(".sort("))
    return "Rearrange the items into order. The key tells Python which part of each item to compare.";
  if (s.includes("//"))
    return "Compute a value using integer floor division: // discards the fractional part by rounding downward.";
  if (s.includes("min(255") || s.includes("max(0"))
    return "Clamp channel values to the valid range. This prevents overly bright or negative colors.";
  if (s.includes("=") && !s.includes("=="))
    return "Compute the expression on the right, then store its result using the name or location on the left. Several names can be updated together.";
  return "This statement performs one part of the recipe. Relate the names and helper functions to the small worked example before adapting the template.";
}
export default function CodeWalkthrough({
  title,
  lang,
  text,
  expected,
  maskedLine,
}: {
  title: string;
  lang: string;
  text: string;
  expected?: string;
  maskedLine?: string;
}) {
  const [line, setLine] = useState(0);
  const originalLines = text.split("\n");
  const lines = originalLines.map((s) =>
    maskedLine && s.split(" # ")[0].includes(maskedLine)
      ? s.slice(0, s.length - s.trimStart().length) +
        "# YOUR TURN: choose the missing line below"
      : s,
  );
  return (
    <section className="course-code">
      <div>
        <Code2 size={17} />
        <strong>{title}</strong>
        <span>{lang} · complete example</span>
      </div>
      <pre>
        {lines.map((s, i) => (
          <button
            key={i}
            className={line === i ? "selected-line" : ""}
            onClick={() => setLine(i)}
            aria-label={`Explain line ${i + 1}`}
            aria-pressed={line === i}
          >
            <i>{i + 1}</i>
            <code>{s || " "}</code>
          </button>
        ))}
      </pre>
      <div className="code-line-explanation" aria-live="polite">
        <span>LINE {line + 1}, IN PLAIN ENGLISH</span>
        <p>
          {originalLines[line].includes(" # ")
            ? originalLines[line].split(" # ").slice(1).join(" # ")
            : explainLine(originalLines[line])}
        </p>
      </div>
      {expected && (
        <div className="verified-output">
          <span>EXPECTED OUTPUT</span>
          <code>{expected}</code>
          <button
            className="text-button"
            onClick={async (e) => {
              const button = e.currentTarget;
              try {
                await navigator.clipboard.writeText(text);
                button.textContent = "Copied complete example";
              } catch {
                button.textContent = "Select the code to copy";
              }
            }}
          >
            Copy complete Python example
          </button>
        </div>
      )}
      <details>
        <summary>
          Python reading key
          <ChevronDown size={15} />
        </summary>
        <p>
          To try this example, save it as lesson.py and run python lesson.py
          with Python 3. Indentation groups instructions; def defines a recipe,
          return sends its result, len counts items, range stops before its
          upper bound, enumerate gives position and value, [-1] means last item,
          and lambda names a small inline recipe such as a sort key. Curly
          braces make dictionaries or sets; square brackets make lists. Read a
          line’s comment to connect these words to this task.
        </p>
      </details>
    </section>
  );
}
