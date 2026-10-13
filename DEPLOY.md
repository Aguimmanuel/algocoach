# Shipping AlgoCoach

Two services, about 20 minutes:

- **Aiven** — managed PostgreSQL, holds accounts, progress and activity
- **Render** — runs the Docker image, serves the API and the frontend

Render builds the frontend and runs the backend as **one service, one URL**. That is deliberate: same origin means `/api` works with no CORS configuration and no proxy to maintain.

> The order matters. Do Aiven first — Render needs the database URL at deploy time.

---

## Step 1 — Aiven (the database)

1. Sign up at **https://aiven.io** and create a **PostgreSQL** service.
   - **Free plan** is fine to start (1 GB storage, shared CPU).
   - **Pick the region closest to your users.** For Nigeria that is usually
     `europe-west` (Frankfurt) or `africa-south1` if offered.
   - Wait for the service state to read **Running** — a couple of minutes.

2. Open the service → **Overview** → **Connection information**.

3. Copy the **Service URI**. It looks like:

   ```
   postgres://avnadmin:PASSWORD@pg-abc123-project.aivencloud.com:12345/defaultdb?sslmode=require
   ```

   **Paste it exactly as-is.** `backend/db.py` rewrites the `postgres://` prefix
   to the driver form SQLAlchemy 2 wants, and keeps `sslmode=require` so the
   connection stays encrypted. You do not need to edit it.

4. **Do not create tables by hand.** The app creates them on first boot.

---

## Step 2 — Render (the app)

1. Sign up at **https://render.com** and connect your GitHub account.

2. **New → Blueprint**, pick the `Aguimmanuel/algocoach` repo, and click **Apply**.
   Render reads `render.yaml` and configures the service for you.

3. It will prompt for the environment variables marked `sync: false`:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The Aiven Service URI from step 1 |
   | `SECRET_KEY` | Generate it — see below |
   | `GEMINI_API_KEY` | Optional. Leave blank to run the offline coach |

   Generate a secret key:

   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

   **Set this.** Without it the app still works, but every deploy mints a new
   key and signs everybody out. The app prints a warning in the logs if it is
   missing.

4. Click **Deploy**. First build takes roughly 3–5 minutes.

5. When the log shows `Application startup complete`, open the URL. You should
   see AlgoCoach, and `https://<your-app>.onrender.com/api/health` should return:

   ```json
   { "ok": true, "database": "postgres", "accounts": true, "mode": "gemini" }
   ```

   Confirm `"database": "postgres"` — if it says `sqlite`, `DATABASE_URL` did not
   reach the service and your data is not persisting.

### Verify accounts actually persist

Create an account in the UI, then in the **Aiven console → Query editor** run:

```sql
SELECT id, email, display_name, created_at FROM users;
SELECT kind, count(*) FROM activity_events GROUP BY kind ORDER BY 2 DESC;
```

If rows appear, tracking is live end to end.

---

## Deployment notes

**Free tier sleeps.** Render's free plan spins down after 15 minutes idle, so the
first request afterwards takes ~30 seconds. `render.yaml` sets `plan: starter`
for that reason — change it to `free` if you would rather trade the cold start
for the cost.

**Migrations.** There are none. `init_db()` runs `CREATE TABLE IF NOT EXISTS` at
startup, which is the right amount of ceremony for one schema and one deploy.
The moment the schema needs to change under live data, add Alembic.

**Session tokens live in localStorage.** Simple, and it survives refreshes. The
trade-off is that a successful XSS could read them. The app never renders
untrusted text as HTML, which keeps that risk low — but if you later let users
post content, move to httpOnly cookies at the same time.

**Activity logging never blocks.** `/api/events` returns `202` even when nobody
is signed in, and every call from the client is fire-and-forget. Tracking must
never be the reason a learner sees an error.

---

## What is stored, and why

| Table | Holds | Purpose |
| --- | --- | --- |
| `users` | email, Argon2id password hash, display name, last seen | Accounts. Optional — the app is fully usable signed out |
| `progress` | learned patterns, solved problems, shaky attempts | Syncs progress across devices |
| `activity_events` | one row per real action | Streaks, "what to do next", and seeing where people get stuck |
| `feedback` | free text, with context | Lets a learner tell you when the app got something wrong |

Nobody's raw activity is readable by another user, and there is no endpoint that
returns one learner's data to anyone else.

**Signing in adopts local progress.** A learner who already used the app on that
device keeps everything — the client sends its local state at signup and the
server merges it in. Nobody loses their streak by creating an account.

---

## Local development

Nothing above is needed locally. Without `DATABASE_URL` the app falls back to a
SQLite file, so:

```bash
cd backend && uvicorn main:app --reload --port 8000
```

…gives you accounts, streaks and tracking on your laptop with no database to
install. Delete `backend/algocoach.db` to start fresh.

To exercise the production build the way Render runs it:

```bash
docker build -t algocoach .
docker run -p 8000:8000 -e SECRET_KEY=dev algocoach
# → http://localhost:8000  (API and frontend, same origin)
```
