# AlgoCoach

**Learn to choose the right algorithm — not to copy the answer.**

Most people who can write code still freeze at the start of a new problem. They can't tell whether it's a sliding window or a DP problem, so they never reach the part they're actually good at.

AlgoCoach attacks that gap directly:

1. **Read the problem** the way an experienced engineer does.
2. **Match it to a pattern** — and show you *why*, quoting the words that gave it away.
3. **Explain how to think about it** — guided questions and reasoning steps, never a solution dump.

---

## What's in it

Six tabs, in the order you use them.

| Tab | What it does |
| --- | --- |
| **Today** | Where you are, the single next thing to do, today's goal, quests, this week at a glance |
| **Path** | The 21-stop trail from "what *is* an algorithm" to Dijkstra — one stop per row, one open at a time |
| **Patterns** | 19 patterns in three levels, each with signals, a recipe, a lab, Socratic hints, pitfalls and its own practice list |
| **Coach** | Paste any problem. Get a constraint analysis, ranked pattern candidates, and a thinking plan |
| **Visualize** | Every one of the 19 algorithms, stepped frame by frame, **with the code beside the picture** and the running line highlighted |
| **Cheat Sheet** | Constraint → complexity decoder, clue → pattern table, complexity growth chart |

### Everything opens one thing at a time

The failure mode of a learning site is showing you all of it at once. AlgoCoach hides by default:

- **Path** shows a row per stop — tap one and it opens, closing the previous one.
- **Patterns** shows one level at a time, then one pattern at a time. Search is there when you already know the name.
- **A lesson is a lab, not an article.** Four exercises per pattern, revealed one after another: order the recipe, spot the traps, rebuild a code line, then name the cost. You can't scroll past them.
- **Visualize** is level → algorithm → frames. Step, play, or drag through at your own pace.
- **A daily review** is five questions, one screen.

### Progress you can feel

- **XP and levels.** Ten levels, from *Curious* to *Interview Ready*. Lessons, problems, correct answers and review sessions all pay out.
- **Streaks and a heatmap.** The last twelve weeks, one square per day.
- **Daily quests.** Three small goals that reset each day.
- **A spaced-repetition deck.** Right answers come back in 1 day, then 3, then wider. Wrong answers come back tomorrow. Five due cards a day is the whole ask.
- **Accounts are optional.** Signed out, everything above still works in `localStorage`. Sign in and it follows you to another device.

### Two layers that back each other up

| Layer | What it does | Needs internet? |
| --- | --- | --- |
| **Deterministic analyzer** (TypeScript) | Reads `n` from the constraints, decodes the allowed complexity, scores the problem against all 19 patterns | No |
| **AI coach** (Python + Gemini) | Reads the problem and writes a tailored thinking plan | Yes — falls back gracefully |

Everything except the AI plan is hand-written content in the React app. The Python service adds the one thing rules can't: **judgement on a problem it has never seen before.**

### The rules the AI coach plays by

- **No code on the first pass.** You get reasoning, questions and warnings.
- **The solution is earned.** Write ~40 characters of your own attempt and an unlock button appears.
- **It's grounded.** The frontend sends its own pattern matches along with the problem, so the model only discusses patterns that exist in AlgoCoach. It can't invent a technique.
- **It always degrades gracefully.** No key, backend down, rate limited — you still get a real plan composed from the local pattern library, and the rest of the app never notices.

---

## Run it locally

You need **Node 20.19+** (22 LTS recommended — Vite 7 needs it) and **Python 3.10+**. No account, no key, no cost to start.

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

This already works on its own — the analyzer, the path, the lessons, the visualizers and the cheat sheet are all client-side. The AI panel stays hidden until the backend is running.

### 3. Backend — adds the AI coach and accounts

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

Refresh the browser. The **🧠 Your thinking plan** panel now appears in the Coach tab, and the account tab can sign up and sign in.

> **No API key yet?** That's fine — skip straight to this step. The backend runs in **offline mode** and the panel shows a real coaching plan built from the pattern library. Add a key whenever you like and it switches over with no other changes.

With no `DATABASE_URL`, accounts live in a local SQLite file (`backend/algocoach.db`). Nothing to install, nothing to configure.

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
| `Vite requires Node.js version 20.19+` | Upgrade Node (`nvm install 22 && nvm use 22`) and reinstall. Vite 7 will not run on Node 18. |
| The AI panel doesn't appear | The backend isn't running. Start uvicorn and refresh. By design — the app never breaks when the API is down. |
| `externally-managed-environment` when pip installing | You skipped the venv. Create and activate it first (step 3). |
| Port 8000 already in use | `uvicorn main:app --reload --port 8001`, then run the frontend with `ALGOCOACH_API=http://127.0.0.1:8001 npm run dev`. |
| Panel says **OFFLINE** after adding a key | `backend/.env` must sit in the same folder as `main.py`, and uvicorn must be restarted after editing it. |
| `ModuleNotFoundError: No module named 'main'` | You're in the wrong directory. `cd backend` first. |
| Signed up, then signed out, and progress "reset" | Signing out returns the app to device progress. Sign back in and the server copy returns. |
| The pattern analysis itself looks wrong | That half is client-side (`src/lib/analyze.ts`). Check the browser console, not the backend. |

---

## Configuration

Everything lives in `backend/.env`:

| Variable | Default | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | *(empty)* | Empty → offline mode. **Never commit this file.** |
| `GEMINI_MODEL` | `gemini-2.5-flash` | `gemini-2.5-pro` reasons deeper but is slower |
| `DATABASE_URL` | *(empty)* | Empty → local SQLite file. Set to a Postgres URL in production |
| `SECRET_KEY` | *(random)* | Signs session tokens. **Set this in production** or every deploy signs everyone out |

**Shipping? See [DEPLOY.md](DEPLOY.md)** for the Aiven + Render walkthrough.

Point the frontend at a non-default backend:

```bash
ALGOCOACH_API=http://192.168.1.50:8000 npm run dev
```

---

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Is the coach live, which mode (`gemini` / `demo`), and which database? |
| `POST /api/coach` | Problem in → thinking plan out. Never returns code. |
| `POST /api/solve` | Staged reveal. Requires an `attempt` of 40+ chars, else `422`. |
| `POST /api/auth/signup` · `POST /api/auth/login` | Accounts. `201` on signup, `409` on a duplicate email, `401` on bad credentials. |
| `GET /api/me` | Progress, streak and today's count for the signed-in user. |
| `PUT /api/progress` | Bulk replace of learned / solved / shaky. |
| `POST /api/events` | Records answers, sessions and learned patterns. Returns `202` when signed out. |
| `GET /api/me/activity` | Recent daily counts, for the heatmap when signed in. |

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
    ProgressHome.tsx   # Today: status line, next action, quests, week strip, progress tabs
    LearningPath.tsx   # the trail: one row per stop, one open at a time
    Library.tsx        # Patterns: level → pattern → lesson
    PatternDetail.tsx  # one lesson: signals, recipe, lab, hints, pitfalls, practice
    LessonLab.tsx      # the four exercises that make a lesson interactive
    Visualizer.tsx     # Visualize: level → algorithm → frame player
    ReviewSession.tsx  # the five-question daily review
    StreakHeatmap.tsx  # twelve weeks, one square per day
    Coach.tsx          # paste a problem → analyse → AI plan → lesson
    AICoach.tsx        # AI panel + staged solution reveal
    Wizard.tsx         # decision tree for when keyword matching fails
    CheatSheet.tsx     # constraint → complexity decoder
    StartHere.tsx      # the basics, folded into one row
    Confetti.tsx       # the level-up / perfect-round burst
    ui/                # 38 vendored shadcn/ui components
  data/
    patterns.ts        # the 19 patterns: signals, recipe, hints, pitfalls, drills
    visuals.ts         # frame-by-frame animations, generated by running each algorithm
    practice.ts        # 100 real problems, graded easy / medium / hard
    gamification.ts    # XP values, 10 levels, 12 milestones
    review.ts          # quiz questions built from the pattern data
    constraints.ts     # size buckets + the 5-step solving routine
    basics.ts          # Big-O in plain English + the recommended learning order
    glossary.ts        # every term the app uses, defined without jargon
  lib/
    analyze.ts         # deterministic analyzer (n detection, keyword scoring)
    srs.ts             # the spaced-repetition scheduler
    activity.ts        # days, streaks, today's log
    api.ts             # client for the Python backend
    colors.ts          # per-pattern accents
  hooks/
    useAccount.ts      # sign up / sign in / progress sync
    useReveal.ts       # the scroll-reveal + stagger used across the app
backend/
  main.py              # FastAPI routes
  coach.py             # prompts, JSON schemas, Gemini call, offline fallback
  accounts.py          # signup, signin, /api/me, progress events
  db.py / models.py    # SQLAlchemy async: SQLite locally, Postgres in production
  .env.example         # copy to .env and add your key
```

---

## What we learned from, and what we took

AlgoCoach borrows deliberately rather than inventing. Each borrow is visible in the UI:

| Source | What it does well | What we took |
| --- | --- | --- |
| **Algorithm Visualizer** | Pairs animation with the code that produced it | The code panel beside every animation, with the running line highlighted |
| **VisuAlgo** | Structured lessons, and a "training" component with questions graded easy → medium → hard | The learning path, difficulty tiers on practice problems, and one level at a time |
| **NeetCode Roadmap** | Groups problems by pattern in dependency order, with a solved counter | One practice list per pattern, plus overall progress in the header |
| **Execute Program** | "Learn it / code it / remember it", with spaced repetition | The lesson lab, and the five-card daily review |
| **Brilliant** | Never just gives the answer; guiding questions instead | The Socratic hints, and the 40-character gate on the solution |
| **Duolingo** | Bite-sized lessons, points, levels, streaks | XP, levels, daily quests, the streak and the heatmap |
| **Grokking Algorithms** | Explains ideas with pictures and everyday comparisons, no maths | The `plain` line on every pattern — the idea with no jargon at all |
| **LeetCode Explore** | Progressive tracks with checkpoints | The "Ready when:" check on every stop of the path |

One thing we deliberately did **not** copy: external links to problems. Names are stable and searchable on any judge, and keeping them as text means the whole app still works with no internet.

## Design notes

**One dark theme, not two.** The app ships a single dark navy palette (`#070f1e` background, white type) and no theme toggle. Two half-tuned palettes meant text that failed contrast in one of them; one palette that is actually measured beats two that are guessed at. Every text/background pair in the app is at least 4.5:1, and the worst pair in the set is 6.3:1.

**Components sit on a background, not in a grid of boxes.** The page has a designed backdrop — two soft radial glows, a vertical gradient, and a masked 64px grid — and everything above it is a translucent `.surface` (blurred, bordered, inset highlight) or a solid navy `.slab` for the one call to action. Nothing is a flat rectangle welded to a flat fill.

**Real shadcn/ui, vendored.** `src/components/ui/` holds 38 components copied from the shadcn registry, and `components.json` is checked in, so `npx shadcn@latest add <component>` drops straight into this project. Tokens are the canonical ones (`--background`, `--card`, `--primary`, `--ring`, `--chart-*`, sidebar tokens) defined once in `src/index.css`.

**Red means error, nothing else.** `--destructive` appears only where something is actually wrong — a failed request, a wrong answer, a highlighted trap. Every other accent is navy, slate or white.

**No blurry type.** The reveal animations never park a `will-change` or a compositing layer on text; they animate transform and opacity, then get out of the way.

**Why the frontend sends candidate patterns to the backend.** Cheap grounding — the model gets a shortlist of techniques that exist in the app, so it recommends within the curriculum instead of hallucinating a technique the learner can't look up.

**Why offline mode isn't a stub.** An expired key, a laptop with no wifi, a school computer — the app has to keep teaching. The offline plan is assembled from the same curated pattern data the lessons use, so it's genuinely useful, just less specific to the exact problem.

**Why the solution is gated.** An AI that answers instantly trains you to ask instantly. Requiring an attempt first costs one minute and turns the app from a solution generator into a coach.

**Why the animations are generated, not hand-drawn.** Each visualizer frame comes from actually running the algorithm on a tiny fixed input and recording what it did. That is why the numbers in the picture and the highlighted line always agree — and why a wrong frame is a failing test rather than a stale drawing.
