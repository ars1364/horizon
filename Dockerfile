FROM python:3.12-slim

WORKDIR /app

# Build deps for any packages without prebuilt wheels (libsass, cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# Deps layer — cached unless requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir "pip<26" && \
    pip install --no-cache-dir -r requirements.txt

# Copy full source (overridden by volume mount in docker-compose dev mode)
COPY . .

# Install horizon package — PBR_VERSION bypasses git-based version detection
RUN PBR_VERSION=2025.1.0 pip install --no-cache-dir -e .

# Persistent data dir for SQLite DB and secret key file
RUN mkdir -p /app/data

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
