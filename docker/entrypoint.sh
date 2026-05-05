#!/bin/bash
set -e

# Generate local_settings.py from the Docker template on every start.
# This is gitignored so writing it here is intentional.
cp /app/openstack_dashboard/local/local_settings.docker.py \
   /app/openstack_dashboard/local/local_settings.py

echo "[horizon] Running migrations..."
python manage.py migrate --noinput

echo "[horizon] Starting development server on 0.0.0.0:8000"
exec python manage.py runserver 0.0.0.0:8000
