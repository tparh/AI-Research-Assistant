from app.services.rag_service import answer_question

if __name__ == '__main__':
    print('Calling answer_question...')
    result = answer_question('What is AI?', doc_ids=None)
    print('Result:', result)
