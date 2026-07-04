import importlib
mods = [
    'app.routers.upload',
    'app.routers.chat',
    'app.routers.documents',
    'app.routers.history',
    'app.routers.summarize',
    'app.services.pdf_service',
    'app.services.embedding_service',
    'app.services.vector_store',
    'app.services.summarization_service',
    'app.services.rag_service',
]
for m in mods:
    try:
        importlib.import_module(m)
        print('OK', m)
    except Exception as e:
        print('ERR', m, type(e).__name__, e)
