from google import genai
from app.core.config import settings
import inspect

client = genai.Client(api_key=settings.GEMINI_API_KEY)
print('models object:', type(client.models))
print('models dir:', [name for name in dir(client.models) if not name.startswith('_')])
print('\nmodel module dir:', [name for name in dir(genai.models) if not name.startswith('_')])
print('\ninspect methods from models:')
for name, member in inspect.getmembers(client.models):
    if not name.startswith('_'):
        if inspect.isfunction(member) or inspect.ismethod(member):
            print('func', name, inspect.signature(member))
        else:
            print('attr', name, type(member))
