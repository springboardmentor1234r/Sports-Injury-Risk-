FROM python:3.11-slim

WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
