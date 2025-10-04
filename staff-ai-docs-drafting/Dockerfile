FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8015

ENV PYTHONPATH=/app
CMD ["python", "-m", "app.main"]