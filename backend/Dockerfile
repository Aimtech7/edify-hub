# Base image
FROM python:3.10-slim as base

# Set env vars
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

# Builder stage
FROM base as builder

RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev

COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Final runner stage
FROM base as runner

RUN apt-get update && apt-get install --no-install-recommends -y \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
COPY . /app

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

# Runs Django production gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
