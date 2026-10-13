# AlgoCoach

**Learn to choose the right algorithm — not to copy the answer.**

Most people who can write code still freeze at the start of a new problem. They can't tell whether it's a sliding window or a DP problem, so they never reach the part they're actually good at.

AlgoCoach attacks that gap directly:

1. **Read the problem** the way an experienced engineer does.
2. **Match it to a pattern** — and show you *why*, quoting the words that gave it away.
3. **Explain how to think about it** — guided questions and reasoning steps, never a solution dump.

---

## What's in it

| | |
| --- | --- |
| **Start Here** | For complete beginners: what an algorithm is, what `O(n)` means, every jargon word in plain English, and the order to learn the 16 patterns in |
| **Coach** | Paste any problem. Get a constraint analysis, a question-type breakdown, ranked pattern candidates, and an AI thinking plan |
| **Patterns** | 16 curated patterns from brute force to Dijkstra — signals, recipes, Socratic hints, pitfalls, drills |
| **Visualize** | Animated binary search, two pointers, sliding window and BFS |
| **Cheat Sheet** | Constraint → complexity decoder, clue → pattern table, complexity growth chart |

### Two layers that back each other up

| Layer | What it does | Needs internet? |
| --- | --- | --- |
| **Deterministic analyzer** (TypeScript) | Parses `n` from the constraints, decodes the allowed complexity, scores the problem against 16 patterns | No |
| **AI coach** (Python + Gemini) | Reads the problem and writes a tailored thinking plan | Yes — falls back gracefully |

Everything except the AI plan is hand-written content in the React app. The Python service adds the one thing rules can't: **judgement on a problem it has never seen before.**

### The rules the AI coach plays by

- **No code on the first pass.** You get reasoning, questions and warnings.
- **The solution is earned.** Write ~40 characters of your own attempt and an unlock button appears.
- **It's grounded.** The frontend sends its own pattern matches along with the problem, so the model only discusses patterns that exist in AlgoCoach. It can't invent a technique.
- **It always degrades gracefully.** No key, backend down, rate limited — you still get a real plan composed from the local pattern library, and the rest of the app never notices.

---

## Run it locally

You need **Node 18+** and **Python 3.10+**. No account, no key, no cost to start.

### 1. Clone

```bash
git clone https://github.com/Aguimmanuel/algocoach.git
cd algocoach
```

### 2. Frontend

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

This already works on its own — analyzer, patterns, wizard, visualizers and cheat sheet are all client-side. The AI panel stays hidden until the backend is running.

### 3. Backend — adds the AI coach

In a **second terminal**:

```bash
cd backend
python3 -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Refresh the browser. The **🧠 Your thinking plan** panel now appears in the Coach tab.

> **No API key yet?** That's fine — skip straight to this step. The backend runs in **offline mode** and the panel shows a real coaching plan built from the pattern library. Add a key whenever you like and it switches over with no other changes.

### 4. Optional — switch on the full AI coach

1. Get a free key: **https://aistudio.google.com/apikey**
2. Copy the example env file:

   ```bash
   cd backend
   cp .env.example .env      # Windows: copy .env.example .env
   ```

3. Paste your key into `backend/.env`:

   ```
   GEMINI_API_KEY=your_key_here
   ```

4. Restart uvicorn. The badge in the panel changes from **OFFLINE** to **AI**.

`.env` is gitignored — your key never leaves your machine.

---

## Using it in VS Code

1. Open the folder: **File → Open Folder → algocoach**.
2. Install the **Python** extension (Microsoft). VS Code will offer to select the interpreter — pick `backend/.venv`.
3. Open a terminal (**Ctrl + `**) and run the two commands above in two terminals, or use **Terminal → Split Terminal**.
4. Vite hot-reloads the frontend; uvicorn `--reload` restarts on Python changes. Edit and refresh.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| The AI panel doesn't appear | The backend isn't running. Start uvicorn and refresh. This is by design — the app never breaks when the API is down. |
| `externally-managed-environment` when pip installing | You skipped the venv. Create and activate it first (step 3). |
| Port 8000 already in use | `uvicorn main:app --reload --port 8001`, then run the frontend with `ALGOCOACH_API=http://127.0.0.1:8001 npm run dev`. |
| Panel says **OFFLINE** after adding a key | `backend/.env` must sit in the same folder as `main.py`, and uvicorn must be restarted after editing it. |
| `ModuleNotFoundError: No module named 'main'` | You're in the wrong directory. `cd backend` first. |
| The pattern analysis itself looks wrong | That half is client-side (`src/lib/analyze.ts`). Check the browser console, not the backend. |

---

## Configuration

Everything lives in `backend/.env`:

| Variable | Default | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | *(empty)* | Empty → offline mode. **Never commit this file.** |
| `GEMINI_MODEL` | `gemini-2.5-flash` | `gemini-2.5-pro` reasons deeper but is slower |

Point the frontend at a non-default backend:

```bash
ALGOCOACH_API=http://192.168.1.50:8000 npm run dev
```

---

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Is the coach live, and in which mode (`gemini` / `demo`)? |
| `POST /api/coach` | Problem in → thinking plan out. Never returns code. |
| `POST /api/solve` | Staged reveal. Requires an `attempt` of 40+ chars, else `422`. |

Responses are structured JSON (enforced with a Gemini response schema), not prose — that's what lets the UI render clean cards instead of a wall of chatbot text.

### Production build

`npm run build` produces a single self-contained `dist/index.html`. The backend serves it automatically when present, so one process runs the whole app:

```bash
npm run build
cd backend && uvicorn main:app --port 8000
# → http://localhost:8000
```

Serving both from one origin is also what keeps `/api` working with no proxy and no CORS.

---

## Project structure

```
src/
  components/
    StartHere.tsx      # beginner onboarding: basics, glossary, learning path
    Coach.tsx          # the main flow: paste → analyse → AI plan → lesson
    AICoach.tsx        # AI coaching panel + staged solution reveal
    Library.tsx        # browse all 16 patterns
    PatternDetail.tsx  # a single pattern lesson (hints revealed one at a time)
    Wizard.tsx         # decision tree for when keyword matching fails
    Visualizer.tsx     # animated binary search / two pointers / window / BFS
    CheatSheet.tsx     # constraint → complexity decoder
  data/
    patterns.ts        # the 16 patterns: signals, steps, hints, pitfalls, drills
    constraints.ts     # size buckets + the 5-step solving routine
    basics.ts          # Big-O in plain English + the recommended learning order
    glossary.ts        # every term the app uses, defined without jargon
  lib/
    analyze.ts         # deterministic analyzer (n detection, keyword scoring)
    api.ts             # client for the Python backend
    colors.ts          # the palette (see below)
backend/
  main.py              # FastAPI routes
  coach.py             # prompts, JSON schemas, Gemini call, offline fallback
  .env.example         # copy to .env and add your key
```

---

## Design notes

**Palette: white, black, and red for errors — nothing else.** The UI ships a single monochrome scale. Hierarchy comes from contrast, weight and spacing rather than hue. Red is reserved *exclusively* for errors, which appear in exactly one component (`AICoach.tsx`). Each pattern still carries a `color` field so per-pattern tones can return later if the design wants them; today every name resolves to the same neutral scale in `lib/colors.ts`.

**Why the frontend sends candidate patterns to the backend.** Cheap grounding — the model gets a shortlist of techniques that exist in the app, so it recommends within the curriculum instead of hallucinating a technique the learner can't look up.

**Why offline mode isn't a stub.** An expired key, a laptop with no wifi, a school computer — the app has to keep teaching. The offline plan is assembled from the same curated pattern data the lessons use, so it's genuinely useful, just less specific to the exact problem.

**Why the solution is gated.** An AI that answers instantly trains you to ask instantly. Requiring an attempt first costs one minute and turns the app from a solution generator into a coach.
