from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
models = client.models.list()
print('model count', len(models))
for model in models[:50]:
    print(model.name)
