#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing backend Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Backend build completed successfully."
