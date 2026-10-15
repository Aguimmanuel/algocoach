# AlgoCoach

Install the Python backend with uv and the React frontend with npm.

The Python backend uses **uv** to create its environment and install dependencies from the existing pinned `requirements.lock.txt`. The React frontend still uses **npm**. No `pyproject.toml` or `uv.lock` migration is required.

## 1. Install uv

macOS/Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Open a new terminal if necessary, then check:

```bash
uv --version
```

You also need Node 20.19+ or Node 22 LTS for the frontend. uv can download Python 3.12 when creating the environment if it is not installed.

## 2. Install and build the frontend

From the project root:

```bash
npm ci
npm run build
```

This creates the frontend build in `dist/`.

## 3. Install the backend dependencies with uv

From the same application root:

```bash
cd backend
uv venv --python 3.12 .venv
```

Activate the environment.

macOS/Linux:

```bash
source .venv/bin/activate
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Then install the pinned dependencies:

```bash
uv pip install -r requirements.lock.txt
```

Use **`requirements.lock.txt`** for the pinned dependency versions. `requirements.txt` contains the broader dependency ranges; it is not the default installation file. Do not run `uv sync` here: this repository uses requirements files rather than a uv project manifest.

## 4. Configure the local environment

While in `backend/`, create your local environment file.

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate a session secret with the activated Python environment:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Edit `.env` to set:

- `SECRET_KEY`: the generated value; keep it stable.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: your Google OAuth Web application credentials.
- `GOOGLE_REDIRECT_URI`: `http://localhost:8000/api/auth/google/callback` for the built local app.
- `DATABASE_URL`: leave empty for local SQLite; use the Neon URL for deployment.

Register the exact callback URL with your Google OAuth Web application client. Never commit your real `.env` or credentials.

## 5. Run the app

From `backend/`, with `.venv` activated:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000**. Use the same hostname as your registered callback, not `127.0.0.1` when the callback uses `localhost`.

When opening a new terminal, activate `backend/.venv` again before running Python commands. There is no need to reinstall dependencies each time.

## Vite development

For frontend hot reload, use two terminals.

Terminal 1, application root:

```bash
npm run dev
```

Terminal 2, application root:

```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On Windows use the PowerShell activation command above. Set and register `http://localhost:5173/api/auth/google/callback`, then open **http://localhost:5173**. Vite proxies API requests to the backend.
