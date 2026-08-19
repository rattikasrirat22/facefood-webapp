FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

# --preload: โหลดโมเดล/Firebase ครั้งเดียวใน master ก่อน fork worker (กันโหลดซ้ำ 2 รอบจาก -w 2)
# --timeout 120: cold start จริงพบว่า GCS model download + init ใช้เวลาได้ถึง ~25s บน route
# เปล่าๆ (ยังไม่รวม inference) — ค่า default ของ gunicorn (30s) เสี่ยง kill worker ระหว่างโหลด
CMD exec gunicorn -w 2 --preload --timeout 120 -b 0.0.0.0:$PORT app:app
