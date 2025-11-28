# Gunakan image Python 3.10 (sesuai environment kita)
FROM python:3.10-slim

# Buat user non-root (praktik terbaik keamanan HF)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
WORKDIR /app

# Salin file requirements DULU dan instal
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Salin sisa kode aplikasi Anda
COPY --chown=user . /app

# Perintah untuk MENJALANKAN aplikasi Anda
# Ini adalah pengganti Procfile.
# Kita bind ke 0.0.0.0 dan port 7860 (wajib dari HF)
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:7860", "--workers=1"]