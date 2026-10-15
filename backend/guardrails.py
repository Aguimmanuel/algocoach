"""Small, dependency-free guardrails for a single-process deployment.

For multiple workers/instances, use a shared Redis limiter or ingress limits.
Never trust arbitrary X-Forwarded-For here; configure the ASGI proxy trust list.
"""
from collections import defaultdict, deque
import os
import time

from fastapi import Request
from starlette.responses import JSONResponse

MAX_BODY_BYTES = 128 * 1024
_buckets: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_last_sweep = 0.0


async def protect(request: Request, call_next):
    global _last_sweep
    if request.url.path.startswith('/api/'):
        if request.method in {'POST', 'PUT', 'PATCH'}:
            size = request.headers.get('content-length')
            if size and (not size.isdigit() or int(size) > MAX_BODY_BYTES):
                return JSONResponse({'detail': 'Request body is too large.'}, status_code=413)
            data = bytearray()
            async for chunk in request.stream():
                data.extend(chunk)
                if len(data) > MAX_BODY_BYTES:
                    return JSONResponse({'detail': 'Request body is too large.'}, status_code=413)
            request._body = bytes(data)

        # Same-origin JS supplies a non-simple header. Cross-site forms cannot;
        # hostile fetches require a CORS preflight which we do not allow.
        if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'} and request.headers.get('x-algocoach-request') != '1':
            return JSONResponse({'detail': 'Invalid request origin. Reload the app and try again.'}, status_code=403)

        category = ('auth' if request.url.path.startswith('/api/auth/') else
                    'coach' if request.url.path in {'/api/coach', '/api/solve'} else None)
        if category and (request.method == 'POST' or request.url.path == '/api/auth/google/start') and os.getenv('RATE_LIMIT_ENABLED', 'true').lower() != 'false':
            now = time.monotonic()
            if now - _last_sweep > 60:
                for key in list(_buckets):
                    if not _buckets[key] or _buckets[key][-1] < now - 60:
                        del _buckets[key]
                _last_sweep = now
            host = request.client.host if request.client else 'unknown'
            bucket = _buckets[(host, category)]
            while bucket and bucket[0] < now - 60:
                bucket.popleft()
            limit = 20 if category == 'auth' else 12
            if len(bucket) >= limit:
                return JSONResponse({'detail': 'Too many requests. Please wait a minute and try again.'},
                                    status_code=429, headers={'Retry-After': '60'})
            bucket.append(now)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    if 'Referrer-Policy' not in response.headers:
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response
