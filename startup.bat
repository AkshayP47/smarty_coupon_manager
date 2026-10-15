cd backend && npm run dev
cd ..
cd frontend && npm run dev
cd ..
cd ai_service && python.exe -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload
