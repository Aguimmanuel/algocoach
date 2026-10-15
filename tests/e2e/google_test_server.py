"""TEST-ONLY app: replaces Google's network transport, not OAuth/session logic.

Never run this module as a production app. Docker's runtime copies backend/ only,
not this file. Production main.py has no fake-login endpoint or testing flag.

Run from the repo root:
  backend/.venv/bin/uvicorn google_test_server:app --app-dir tests/e2e --host 0.0.0.0 --port 8001
"""
import os
import re
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'backend'))
_tmp=tempfile.TemporaryDirectory(prefix='algocoach-oauth-browser-test-')
os.environ['DATABASE_URL']=f"sqlite:///{Path(_tmp.name)/'test.db'}"
os.environ['SECRET_KEY']='browser-test-only-secret-not-for-production'
os.environ['GOOGLE_CLIENT_ID']='browser-test.apps.googleusercontent.com'
os.environ['GOOGLE_CLIENT_SECRET']='browser-test-only-not-a-real-google-secret'
os.environ['GOOGLE_REDIRECT_URI']='http://127.0.0.1:8001/api/auth/google/callback'
os.environ['RATE_LIMIT_ENABLED']='false'
import google_login
from main import app

async def fake_google_transport(code,verifier):
    if not verifier or not re.fullmatch(r'(?:e2e|curious|browser)-[a-z0-9-]{1,100}',code):
        raise google_login.LoginFailure('provider_error')
    return {'sub':'fake-google-'+code,'email':code+'@example.com','email_verified':True,
            'name':'Curious Learner' if code.startswith('curious-') else ''}

google_login.exchange_code=fake_google_transport
