# Use an official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies needed for compiling and running Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run database migrations, seed demo accounts, and launch gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python seed_all_demo_users.py && gunicorn --bind 0.0.0.0:${PORT:-8000} config.wsgi:application"]
