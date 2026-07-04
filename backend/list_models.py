from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
print('Client created')
try:
    models = client.list_models()
    print('Models:', [m.name for m in models])
except Exception as e:
    print('List models failed', type(e).__name__, e)
    import traceback
    traceback.print_exc()
