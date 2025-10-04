FROM python:3.12-slim

WORKDIR /app

# Install minimal system dependencies for OpenCV and PDF processing
RUN apt-get update && apt-get install -y \
    libgl1-mesa-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8003

ENV PYTHONPATH=/app
CMD ["python", "-m", "app.main"]