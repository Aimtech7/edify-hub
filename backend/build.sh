#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing backend Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Seeding demo user accounts..."
python seed_all_demo_users.py

echo "Backend build completed successfully."
