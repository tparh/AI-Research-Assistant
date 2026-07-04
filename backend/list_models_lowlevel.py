from google import genai
from app.core.config import settings

c = genai.Client(api_key=settings.GEMINI_API_KEY)
try:
    resp = c._api_client.request('get', '/v1/models', {})
    print('status:', resp.status_code)
    print(resp.text[:2000])
except Exception as e:
    print('v1/models failed', type(e).__name__, e)
    import traceback
    traceback.print_exc()

try:
    resp = c._api_client.request('get', '/v1beta/models', {})
    print('status v1beta:', resp.status_code)
    print(resp.text[:2000])
except Exception as e:
    print('v1beta/models failed', type(e).__name__, e)
    import traceback
    traceback.print_exc()
