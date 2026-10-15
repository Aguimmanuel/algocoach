# AlgoCoach — one image, one service, one URL.
#
# Stage 1 builds the frontend into a optimized HTML, CSS, and JavaScript assets.
# Stage 2 runs the API and serves those assets, so the browser only ever talks to
# one origin. That is what keeps /api working with no CORS and no proxy.
#
# Python is the *last* stage so the image that ships contains no Node.

# --------------------------------------------------------------- build stage
FROM node:22-slim AS frontend

WORKDIR /app
# Copy the manifests first: Docker caches this layer, so a source-only change
# does not re-run npm ci on every deploy.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ------------------------------------------------------------- runtime stage
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app/backend

# Only the requirements, so this layer is cached across app-code changes.
COPY backend/requirements.lock.txt .
RUN pip install --no-cache-dir -r requirements.lock.txt

COPY backend/ .

# The built frontend, which main.py serves when dist/ exists.
COPY --from=frontend /app/dist /app/dist

# Run as a non-root user. Worth doing on any host that exposes a port.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Render sets $PORT; fall back to 8000 for local docker run.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
