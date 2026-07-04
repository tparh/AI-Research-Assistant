from google import genai
from app.core.config import settings

c = genai.Client(api_key=settings.GEMINI_API_KEY)
print('client dir:')
print([a for a in dir(c) if not a.startswith('_')])
print('\ngenai module dir:')
print([a for a in dir(genai) if not a.startswith('_')])
try:
    print('\nTry models attr:')
    print(getattr(c, 'models', None))
except Exception as e:
    import traceback
    print('models attr error', e)
    traceback.print_exc()
