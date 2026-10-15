"""Isolated Google OAuth/API regressions; Google transport is mocked, not live."""
import asyncio
import os
import secrets
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlsplit

_tmp = tempfile.TemporaryDirectory()
os.environ['DATABASE_URL'] = f"sqlite:///{Path(_tmp.name) / 'test.db'}"
os.environ['SECRET_KEY'] = 'test-only-session-secret-not-for-deployment'
os.environ['GOOGLE_CLIENT_ID'] = 'test-client.apps.googleusercontent.com'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test-only-oauth-secret-not-for-deployment'
os.environ['GOOGLE_REDIRECT_URI'] = 'http://localhost:5173/api/auth/google/callback'
os.environ['GEMINI_API_KEY'] = ''
os.environ['GOOGLE_API_KEY'] = ''
os.environ['RATE_LIMIT_ENABLED'] = 'false'

import httpx
import jwt
from fastapi.testclient import TestClient
from main import app
from guardrails import _buckets
import google_login
import security
from db import SessionLocal
from models import GoogleIdentity, User


class APITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ctx = TestClient(app)
        cls.client = cls.ctx.__enter__()
        cls.client.headers['X-AlgoCoach-Request'] = '1'

    @classmethod
    def tearDownClass(cls):
        cls.ctx.__exit__(None, None, None)
        _tmp.cleanup()

    def setUp(self):
        self.client.cookies.clear()
        self.client.headers.pop("X-AlgoCoach-Account",None)

    def begin(self):
        response = self.client.get('/api/auth/google/start', follow_redirects=False)
        self.assertEqual(response.status_code, 303)
        return parse_qs(urlsplit(response.headers['location']).query)

    def signin(self, subject=None, email=None, name='Learner'):
        subject = subject or 'subject-' + secrets.token_hex(8)
        email = email or subject + '@example.com'
        self.client.headers.pop('X-AlgoCoach-Account',None)
        query = self.begin()
        profile = {'sub':subject,'email':email,'email_verified':True,'name':name}
        with patch('google_login.exchange_code', new=AsyncMock(return_value=profile)):
            response = self.client.get('/api/auth/google/callback',params={'state':query['state'][0],'code':'test-code'},follow_redirects=False)
        self.assertEqual(response.headers['location'], '/#today')
        user=self.client.get('/api/me').json()['user']
        self.client.headers['X-AlgoCoach-Account']=str(user['id'])
        return user

    def test_health_and_config(self):
        response=self.client.get('/api/health')
        self.assertEqual(response.json()['mode'],'demo')
        self.assertEqual(response.json()['auth_provider'],'google')
        self.assertEqual(response.headers['cache-control'],'no-store')
        config=self.client.get('/api/auth/config').json()
        self.assertTrue(config['configured'])
        self.assertNotIn('client_secret',config)

    def test_missing_configuration_fails_closed(self):
        with patch.dict(os.environ,{'GOOGLE_CLIENT_SECRET':''}):
            self.assertFalse(self.client.get('/api/auth/config').json()['configured'])
            response=self.client.get('/api/auth/google/start',follow_redirects=False)
            self.assertIn('not_configured',response.headers['location'])
        self.assertEqual(self.client.get('/api/me').status_code,401)

    def test_start_uses_state_pkce_and_only_identity_scopes(self):
        query=self.begin()
        self.assertEqual(query['scope'],['openid email profile'])
        self.assertEqual(query['response_type'],['code'])
        self.assertEqual(query['code_challenge_method'],['S256'])
        self.assertGreater(len(query['state'][0]),30)
        self.assertGreater(len(query['code_challenge'][0]),30)
        self.assertNotIn('client_secret',query)
        state_cookie=self.client.cookies.get(google_login.STATE_COOKIE)
        self.assertTrue(state_cookie)
        response=self.client.get('/api/auth/google/start',follow_redirects=False)
        self.assertIn('HttpOnly',response.headers['set-cookie'])
        self.assertIn('SameSite=lax',response.headers['set-cookie'])

    def test_state_mismatch_never_calls_google(self):
        self.begin()
        with patch('google_login.exchange_code',new_callable=AsyncMock) as exchange:
            response=self.client.get('/api/auth/google/callback?state=wrong&code=anything',follow_redirects=False)
            exchange.assert_not_called()
        self.assertIn('invalid_session',response.headers['location'])
        self.assertEqual(self.client.get('/api/me').status_code,401)

    def test_expired_state_and_cancelled_consent(self):
        query=self.begin()
        response=self.client.get('/api/auth/google/callback',params={'state':query['state'][0],'error':'access_denied'},follow_redirects=False)
        self.assertIn('cancelled',response.headers['location'])
        expired=jwt.encode({'kind':'google-state','state':'x','iat':1,'exp':2},security.SECRET_KEY,algorithm='HS256')
        self.client.cookies.set(google_login.STATE_COOKIE,expired)
        with patch('google_login.exchange_code',new_callable=AsyncMock) as exchange:
            self.client.get('/api/auth/google/callback?state=x&code=code',follow_redirects=False)
            exchange.assert_not_called()
        self.assertEqual(self.client.get('/api/me').status_code,401)

    def test_verified_google_account_cookie_restore_and_logout(self):
        user=self.signin()
        self.assertTrue(user['id'])
        cookie=self.client.cookies.get(security.SESSION_COOKIE)
        self.assertEqual(security.user_id_from_token(cookie),user['id'])
        self.assertEqual(self.client.get('/api/me').status_code,200)
        with SessionLocal() as db:
            self.assertIsNotNone(db.get(GoogleIdentity,user['id']))
            self.assertEqual(db.get(User,user['id']).password_hash,'GOOGLE_ONLY_NO_PASSWORD')
        self.assertEqual(self.client.post('/api/auth/logout').status_code,200)
        self.assertEqual(self.client.get('/api/me').status_code,401)

    def test_https_session_cookie_is_secure_and_httponly(self):
        with patch.dict(os.environ,{'GOOGLE_REDIRECT_URI':'https://testserver/api/auth/google/callback'}):
            with TestClient(app,base_url='https://testserver') as client:
                start=client.get('/api/auth/google/start',follow_redirects=False)
                self.assertIn('Secure',start.headers['set-cookie'])
                state=parse_qs(urlsplit(start.headers['location']).query)['state'][0]
                with patch('google_login.exchange_code',new=AsyncMock(return_value={'sub':'secure-sub','email':'secure@example.com','email_verified':True})):
                    result=client.get('/api/auth/google/callback',params={'state':state,'code':'secure'},follow_redirects=False)
                cookies=result.headers.get_list('set-cookie')
                session=next(c for c in cookies if c.startswith(security.SESSION_COOKIE+'='))
                self.assertIn('Secure',session)
                self.assertIn('HttpOnly',session)
                self.assertIn('SameSite=lax',session)
                self.assertNotIn('token',result.headers['location'])

    def test_unverified_email_and_provider_error_create_no_session(self):
        for profile in [{'sub':'unverified','email':'not-verified@example.com','email_verified':False},[],{}]:
            query=self.begin()
            with patch('google_login.exchange_code',new=AsyncMock(return_value=profile)):
                response=self.client.get('/api/auth/google/callback',params={'state':query['state'][0],'code':'bad'},follow_redirects=False)
            self.assertIn('auth_error=',response.headers['location'])
            self.assertEqual(self.client.get('/api/me').status_code,401)
        query=self.begin()
        with patch('google_login.exchange_code',new=AsyncMock(side_effect=httpx.ConnectError('test-only'))):
            result=self.client.get('/api/auth/google/callback',params={'state':query['state'][0],'code':'bad'},follow_redirects=False)
        self.assertIn('provider_error',result.headers['location'])

    def test_same_google_subject_reuses_account_and_progress(self):
        subject='repeat-'+secrets.token_hex(5)
        first=self.signin(subject=subject)
        self.client.put('/api/progress',json={'learned':['brute']})
        second=self.signin(subject=subject)
        self.assertEqual(first['id'],second['id'])
        self.assertEqual(self.client.get('/api/me').json()['progress']['learned'],['brute'])

    def test_existing_email_is_not_automatically_linked(self):
        email='legacy-'+secrets.token_hex(5)+'@example.com'
        with SessionLocal() as db:
            user=User(email=email,password_hash='legacy-password-hash',display_name='Existing')
            db.add(user);db.commit();old_id=user.id
        query=self.begin()
        with patch('google_login.exchange_code',new=AsyncMock(return_value={'sub':'different-'+email,'email':email,'email_verified':True})):
            result=self.client.get('/api/auth/google/callback',params={'state':query['state'][0],'code':'conflict'},follow_redirects=False)
        self.assertIn('account_conflict',result.headers['location'])
        with SessionLocal() as db:self.assertIsNone(db.get(GoogleIdentity,old_id))

    def test_google_subject_not_email_is_identity(self):
        subject='stable-'+secrets.token_hex(5)
        first=self.signin(subject,email=subject+'@example.com')
        second=self.signin(subject,email=subject+'-changed@example.com')
        self.assertEqual(first['id'],second['id'])
        self.assertTrue(second['email'].endswith('-changed@example.com'))

    def test_password_routes_and_legacy_tokens_are_rejected(self):
        self.assertNotIn('/api/auth/signup',app.openapi()['paths'])
        self.assertNotIn('/api/auth/login',app.openapi()['paths'])
        for path in ['/api/auth/signup','/api/auth/login']:
            self.assertIn(self.client.post(path,json={'email':'x@example.com','password':'anything'}).status_code,[404,405])
        legacy=jwt.encode({'sub':'1','iat':1,'exp':9999999999},security.SECRET_KEY,algorithm='HS256')
        self.client.cookies.set(security.SESSION_COOKIE,legacy)
        self.assertEqual(self.client.get('/api/me').status_code,401)
        self.assertEqual(self.client.get('/api/me',headers={'Authorization':'Bearer '+legacy}).status_code,401)

    def test_csrf_custom_header_is_required(self):
        self.signin()
        headers={'X-AlgoCoach-Request':''}
        self.assertEqual(self.client.put('/api/progress',headers=headers,json={}).status_code,403)
        self.assertEqual(self.client.post('/api/auth/logout',headers=headers).status_code,403)
        self.assertEqual(self.client.get('/api/me').status_code,200)

    def test_learning_requires_auth_and_preserves_completion(self):
        self.assertEqual(self.client.get('/api/learning').status_code,401)
        self.signin()
        first={'lessons':{'foundations:what-is-algorithm':{'page':5,'visited':['intro','quiz','wrap'],'passed':['quiz'],'completed':True,'updatedAt':100}}}
        self.assertEqual(self.client.put('/api/learning',json=first).status_code,200)
        second={'lessons':{'foundations:what-is-algorithm':{'page':1,'visited':['code'],'passed':[],'completed':False,'updatedAt':200}}}
        self.client.put('/api/learning',json=second)
        state=self.client.get('/api/learning').json()['foundations:what-is-algorithm']
        self.assertTrue(state['completed']);self.assertIn('quiz',state['passed']);self.assertEqual(state['page'],1)
        self.assertEqual(set(state['visited']),{'intro','quiz','wrap','code'})
        self.assertEqual(self.client.get('/api/me/activity').json()['by_kind']['lesson_completed'],1)
        self.assertEqual(self.client.put('/api/learning',json={'lessons':{'invalid/key':{'page':0}}}).status_code,422)
        self.client.cookies.clear();self.signin()
        self.assertEqual(self.client.get('/api/learning').json(),{})

    def test_offline_coach_ignores_any_old_gemini_keys(self):
        self.assertEqual(self.client.post('/api/coach',json={'problem':'Two sum'}).status_code,401)
        self.signin()
        with patch.dict(os.environ,{'GEMINI_API_KEY':'test-only-ignored-key'}),patch('httpx.AsyncClient') as network:
            result=self.client.post('/api/coach',json={'problem':'Find a pair with a target sum.'})
            self.assertEqual(result.status_code,200)
            self.assertEqual(result.json()['mode'],'demo')
            self.assertTrue(result.json()['plan']['thinking_steps'])
            self.assertEqual(self.client.get('/api/health').json()['mode'],'demo')
            solution=self.client.post('/api/solve',json={'problem':'Two sum','attempt':'A sufficiently long explanation of my attempt to solve this.'})
            self.assertFalse(solution.json()['available'])
            network.assert_not_called()

    def test_validation_payload_limit_and_rate_limit(self):
        self.signin()
        self.assertEqual(self.client.post('/api/coach',json={'problem':''}).status_code,422)
        self.assertEqual(self.client.post('/api/solve',json={'problem':'Two sum','attempt':'guess'}).status_code,422)
        self.assertEqual(self.client.post('/api/coach',content=b'x'*140000,headers={'Content-Type':'application/json'}).status_code,413)
        with patch.dict(os.environ,{'RATE_LIMIT_ENABLED':'true'}):
            _buckets.clear()
            try:
                for _ in range(12):self.assertEqual(self.client.post('/api/coach',json={'problem':'test'}).status_code,200)
                result=self.client.post('/api/coach',json={'problem':'test'})
                self.assertEqual(result.status_code,429);self.assertEqual(result.headers['retry-after'],'60')
            finally:_buckets.clear()

    def test_return_path_cannot_be_an_external_redirect(self):
        response=self.client.get('/api/auth/google/start',params={'next':'https://evil.example/'},follow_redirects=False)
        state=parse_qs(urlsplit(response.headers['location']).query)['state'][0]
        with patch('google_login.exchange_code',new=AsyncMock(return_value={'sub':'safe-'+secrets.token_hex(5),'email':secrets.token_hex(5)+'@example.com','email_verified':True})):
            result=self.client.get('/api/auth/google/callback',params={'state':state,'code':'ok'},follow_redirects=False)
        self.assertEqual(result.headers['location'],'/#today')
        self.assertEqual(google_login.safe_next('#learn/arrays/prefix-sum-lesson'),'#learn/arrays/prefix-sum-lesson')

    def test_stale_tab_cannot_save_or_logout_another_account(self):
        user=self.signin()
        wrong={'X-AlgoCoach-Account':str(user['id']+10000)}
        self.assertEqual(self.client.put('/api/progress',headers=wrong,json={'learned':['wrong-account']}).status_code,401)
        self.assertEqual(self.client.post('/api/auth/logout',headers=wrong).status_code,401)
        self.assertEqual(self.client.get('/api/me').status_code,200)
        self.assertEqual(self.client.get('/api/me').json()['progress']['learned'],[])
        self.assertEqual(self.client.put('/api/progress',headers={'X-AlgoCoach-Account':''},json={}).status_code,403)

    def test_exchange_uses_server_secret_pkce_and_bearer_userinfo(self):
        seen=[]
        def transport(request):
            seen.append(request)
            if request.url == google_login.TOKEN_ENDPOINT:return httpx.Response(200,json={'access_token':'provider-test-token'})
            return httpx.Response(200,json={'sub':'transport-sub','email':'transport@example.com','email_verified':True})
        client=httpx.AsyncClient(transport=httpx.MockTransport(transport))
        with patch('google_login.httpx.AsyncClient',return_value=client):
            profile=asyncio.run(google_login.exchange_code('one-time-code','pkce-verifier'))
        self.assertEqual(profile['sub'],'transport-sub')
        fields=parse_qs(seen[0].content.decode())
        self.assertEqual(fields['code_verifier'],['pkce-verifier'])
        self.assertEqual(fields['client_secret'],['test-only-oauth-secret-not-for-deployment'])
        self.assertEqual(seen[1].headers['authorization'],'Bearer provider-test-token')

if __name__=='__main__':unittest.main()
