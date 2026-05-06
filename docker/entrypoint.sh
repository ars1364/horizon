#!/bin/bash
set -e

# Generate local_settings.py from the Docker template on every start.
# This is gitignored so writing it here is intentional.
cp /app/openstack_dashboard/local/local_settings.docker.py \
   /app/openstack_dashboard/local/local_settings.py

# Register enabled files from installed plugins into local/enabled/
for plugin_enabled_dir in \
    /usr/local/lib/python3.12/site-packages/heat_dashboard/enabled; do
  if [ -d "$plugin_enabled_dir" ]; then
    cp "$plugin_enabled_dir"/_*.py /app/openstack_dashboard/local/enabled/
  fi
done

echo "[horizon] Running migrations..."
python manage.py migrate --noinput

echo "[horizon] Collecting static files..."
python manage.py collectstatic --noinput --clear -v0

echo "[horizon] Starting development server on 0.0.0.0:8000"
exec python manage.py runserver 0.0.0.0:8000
