import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, MoveRight, Code2 } from "lucide-react";
import {
  filterPixel,
  pipelinePixel,
  type Filter,
  type RGB,
} from "../../lib/experiments";
const NAMES: Record<Filter, string> = {
  identity: "Original",
  red: "Red only",
  green: "Green only",
  blue: "Blue only",
  gray: "Grayscale",
  invert: "Invert",
  brighten: "Brighten",
  threshold: "Threshold",
  poster: "Posterize",
};
function drawScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#b9dddc";
  ctx.fillRect(0, 0, 360, 240);
  ctx.fillStyle = "#f4d888";
  ctx.beginPath();
  ctx.arc(278, 52, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#708d9a";
  ctx.beginPath();
  ctx.moveTo(0, 160);
  ctx.lineTo(112, 65);
  ctx.lineTo(230, 160);
  ctx.fill();
  ctx.fillStyle = "#516d80";
  ctx.beginPath();
  ctx.moveTo(100, 167);
  ctx.lineTo(218, 48);
  ctx.lineTo(360, 168);
  ctx.fill();
  ctx.fillStyle = "#eaf2e7";
  ctx.beginPath();
  ctx.moveTo(199, 69);
  ctx.lineTo(218, 48);
  ctx.lineTo(241, 73);
  ctx.lineTo(220, 67);
  ctx.fill();
  ctx.fillStyle = "#81ad74";
  ctx.fillRect(0, 160, 360, 80);
  ctx.fillStyle = "#a2cec5";
  ctx.beginPath();
  ctx.ellipse(233, 201, 95, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6b271";
  ctx.fillRect(65, 145, 54, 47);
  ctx.fillStyle = "#896757";
  ctx.beginPath();
  ctx.moveTo(53, 146);
  ctx.lineTo(91, 116);
  ctx.lineTo(132, 146);
  ctx.fill();
  ctx.fillStyle = "#496951";
  ctx.fillRect(87, 170, 14, 22);
  ["#d38387", "#f0d69b", "#dfae73"].forEach((c, k) => {
    ctx.fillStyle = c;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(
        10 + ((i * 29 + k * 11) % 350),
        207 + ((i * 13 + k * 5) % 29),
        2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
}
export default function PixelLab({
  mode = "channels",
  initialSample,
}: {
  mode?: "channels" | "invert" | "compose" | "debug";
  initialSample?: RGB;
}) {
  const before = useRef<HTMLCanvasElement>(null),
    after = useRef<HTMLCanvasElement>(null);
  const [fx, setFx] = useState<Filter>(
    mode === "invert" ? "invert" : mode === "compose" ? "brighten" : "identity",
  );
  const [amount, setAmount] = useState(mode === "compose" ? 100 : 40),
    [threshold, setThreshold] = useState(128);
  const [stages, setStages] = useState<Filter[]>(["brighten", "threshold"]);
  const [sample, setSample] = useState<RGB>(
    initialSample ?? (mode === "compose" ? [60, 60, 60] : [30, 60, 90]),
  );
  const [fixed, setFixed] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  const inspectCoordinates = (x: number, y: number) => {
    const data = before.current
      ?.getContext("2d")
      ?.getImageData(x, y, 1, 1).data;
    if (data) setSample([data[0], data[1], data[2]]);
    setCoords([x, y]);
  };
  const filters = mode === "compose" ? stages : [fx];
  const out =
    mode === "debug" && !fixed
      ? ([Math.floor((sample[0] + sample[1] + sample[2]) / 3), 0, 0] as RGB)
      : mode === "debug"
        ? filterPixel(sample, "gray")
        : pipelinePixel(sample, filters, amount, threshold);
  useEffect(() => {
    const ctx = before.current?.getContext("2d"),
      dest = after.current?.getContext("2d");
    if (!ctx || !dest) return;
    drawScene(ctx);
    const image = ctx.getImageData(0, 0, 360, 240);
    for (let i = 0; i < image.data.length; i += 4) {
      const px: RGB = [image.data[i], image.data[i + 1], image.data[i + 2]];
      const avg = Math.floor((px[0] + px[1] + px[2]) / 3);
      const rgb =
        mode === "debug"
          ? fixed
            ? filterPixel(px, "gray")
            : [avg, 0, 0]
          : pipelinePixel(
              px,
              mode === "compose" ? stages : [fx],
              amount,
              threshold,
            );
      image.data[i] = rgb[0];
      image.data[i + 1] = rgb[1];
      image.data[i + 2] = rgb[2];
    }
    dest.putImageData(image, 0, 0);
  }, [fx, amount, threshold, stages, fixed, mode]);
  const inspect = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
        0,
        Math.min(359, Math.floor(((e.clientX - rect.left) / rect.width) * 360)),
      ),
      y = Math.max(
        0,
        Math.min(239, Math.floor(((e.clientY - rect.top) / rect.height) * 240)),
      );
    inspectCoordinates(x, y);
  };
  return (
    <section
      className="pixel-lab"
      aria-label="Interactive image filter laboratory"
    >
      <div className="lab-title">
        <div>
          <span className="eyebrow">LIVE EXPERIMENT · 86,400 PIXELS</span>
          <h3>
            {mode === "compose"
              ? "Small functions. A bigger picture."
              : mode === "debug"
                ? "Find the bug. Watch the fix."
                : "Make the invisible visible."}
          </h3>
        </div>
        <button
          className="icon-button"
          aria-label="Reset image experiment"
          onClick={() => {
            setFx(mode === "invert" ? "invert" : "identity");
            setAmount(mode === "compose" ? 100 : 40);
            setThreshold(128);
            setStages(["brighten", "threshold"]);
            setFixed(false);
            setSample(
              initialSample ??
                (mode === "compose" ? [60, 60, 60] : [30, 60, 90]),
            );
            setCoords([0, 0]);
          }}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="canvas-pair">
        <figure>
          <canvas
            width="360"
            height="240"
            ref={before}
            onClick={inspect}
            aria-label="Original generated landscape; click to inspect a pixel"
          />
          <figcaption>
            Before <span>click a pixel to inspect</span>
          </figcaption>
        </figure>
        <span className="canvas-arrow">
          <MoveRight size={20} />
        </span>
        <figure>
          <canvas
            width="360"
            height="240"
            ref={after}
            onClick={inspect}
            aria-label="Filtered landscape"
          />
          <figcaption>
            After{" "}
            <span>
              {mode === "debug"
                ? fixed
                  ? "fixed grayscale"
                  : "broken grayscale"
                : filters.map((f) => NAMES[f]).join(" → ")}
            </span>
          </figcaption>
        </figure>
      </div>
      {mode === "compose" ? (
        <div className="pipeline-controls">
          <span>Pipeline order</span>
          {stages.map((f, i) => (
            <div key={i}>
              <span className="stage-number">{i + 1}</span>
              <select
                value={f}
                aria-label={`Pipeline stage ${i + 1}`}
                onChange={(e) =>
                  setStages((s) =>
                    s.map((x, k) => (k === i ? (e.target.value as Filter) : x)),
                  )
                }
              >
                {[
                  "gray",
                  "invert",
                  "brighten",
                  "threshold",
                  "red",
                  "green",
                ].map((f) => (
                  <option key={f} value={f}>
                    {NAMES[f as Filter]}
                  </option>
                ))}
              </select>
              {i === 0 && <ArrowRight size={17} />}
            </div>
          ))}
          <button
            className="text-button"
            onClick={() => setStages((s) => [...s].reverse())}
          >
            Swap the order
          </button>
        </div>
      ) : mode === "debug" ? (
        <div className="debug-panel">
          <Code2 size={19} />
          <code>return (avg, {fixed ? "avg, avg" : "0, 0"})</code>
          <fieldset className="debug-choices">
            <legend>Choose the repaired return</legend>
            <button aria-pressed={fixed} onClick={() => setFixed(true)}>
              return (avg, avg, avg)
            </button>
            <button aria-pressed={!fixed} onClick={() => setFixed(false)}>
              return (avg, 0, 0) · broken
            </button>
          </fieldset>
          <p>
            {fixed
              ? "Equal channels produce gray, as intended."
              : "The average is correct, but only the red channel receives it. Why does the picture turn red?"}
          </p>
        </div>
      ) : (
        <div
          className="filter-pills pixel-filters"
          role="group"
          aria-label="Choose an image filter"
        >
          {(
            [
              "identity",
              "red",
              "green",
              "blue",
              "gray",
              "invert",
              "brighten",
              "threshold",
              "poster",
            ].filter((f) =>
              mode === "invert"
                ? ["identity", "invert", "brighten"].includes(f)
                : ["identity", "red", "green", "blue", "gray"].includes(f),
            ) as Filter[]
          ).map((f) => (
            <button
              key={f}
              className={fx === f ? "selected" : ""}
              aria-pressed={fx === f}
              onClick={() => setFx(f)}
            >
              {NAMES[f]}
            </button>
          ))}
        </div>
      )}
      {((mode === "compose" && stages.includes("brighten")) ||
        fx === "brighten") && (
        <label className="lab-slider">
          Brightness{" "}
          <input
            aria-label="Brightness amount"
            type="range"
            min="-100"
            max="100"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
          />
          <strong>
            {amount > 0 ? "+" : ""}
            {amount}
          </strong>
        </label>
      )}
      {((mode === "compose" && stages.includes("threshold")) ||
        fx === "threshold") && (
        <label className="lab-slider">
          Threshold{" "}
          <input
            aria-label="Threshold value"
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={(e) => setThreshold(+e.target.value)}
          />
          <strong>{threshold}</strong>
        </label>
      )}
      <details className="pixel-keyboard">
        <summary>Inspect an image pixel with a keyboard</summary>
        <p>
          X is a horizontal position from 0 to 359; Y is a vertical position
          from 0 to 239. Or edit the sample RGB numbers below to test an
          invented pixel.
        </p>
        <div>
          {["X", "Y"].map((label, i) => (
            <label key={label}>
              {label}
              <input
                aria-label={`Pixel ${label} coordinate`}
                type="number"
                min="0"
                max={i === 0 ? 359 : 239}
                value={coords[i]}
                onChange={(e) =>
                  setCoords(
                    (old) =>
                      old.map((v, k) =>
                        k === i
                          ? Math.max(
                              0,
                              Math.min(
                                i === 0 ? 359 : 239,
                                Math.floor(+e.target.value),
                              ),
                            )
                          : v,
                      ) as [number, number],
                  )
                }
              />
            </label>
          ))}
          <button
            className="studio-button secondary"
            onClick={() => inspectCoordinates(...coords)}
          >
            Inspect coordinate
          </button>
        </div>
      </details>
      <div className="pixel-inspector">
        <div>
          <span className="eyebrow">TEST ONE PIXEL</span>
          <div className="channel-inputs">
            {["R", "G", "B"].map((label, i) => (
              <label key={label}>
                {label}
                <input
                  type="number"
                  aria-label={`Sample ${label}`}
                  min="0"
                  max="255"
                  value={sample[i]}
                  onChange={(e) =>
                    setSample(
                      (s) =>
                        s.map((v, k) =>
                          k === i
                            ? Math.max(
                                0,
                                Math.min(255, Math.floor(+e.target.value)),
                              )
                            : v,
                        ) as RGB,
                    )
                  }
                />
              </label>
            ))}
          </div>
        </div>
        <ArrowRight size={21} />
        <div className="pixel-result" aria-live="polite">
          <i style={{ background: `rgb(${out.join(",")})` }} />
          <strong>({out.join(", ")})</strong>
          <small>output tuple</small>
        </div>
      </div>
      {mode === "compose" && (
        <div className="pipeline-trace">
          {stages.map((f, i) => {
            const input = pipelinePixel(
                sample,
                stages.slice(0, i),
                amount,
                threshold,
              ),
              result = filterPixel(input, f, amount, threshold);
            return (
              <p key={i}>
                <b>
                  {i + 1}. {NAMES[f]}
                </b>{" "}
                ({input.join(", ")}) → ({result.join(", ")})
              </p>
            );
          })}
        </div>
      )}
      <p className="lab-footnote">
        Preset buttons select one whole filter, not individual on/off channels.
        The landscape is drawn locally. A filter transforms each RGB pixel. No
        image uploads or API calls are needed.
      </p>
    </section>
  );
}
