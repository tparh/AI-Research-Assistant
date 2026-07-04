from app.core.config import settings
from langchain.chat_models import init_chat_model

for model in ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"]:
    try:
        llm = init_chat_model(model=model, model_provider='google_genai', api_key=settings.GEMINI_API_KEY)
        print('initialized', model, type(llm))
    except Exception as exc:
        print('failed', model, exc)
