# Horizon — OpenStack Dashboard (CAT Lab)

OpenStack Horizon 2025.1 packaged as a single Docker container for the CAT lab cluster.
Includes the **CAT Industrial Dark** theme and the **Orchestration (Heat)** panel.

---

## Quick Start

```bash
git clone https://github.com/chjkh8113/horizon.git
cd horizon
cp .env.example .env          # edit .env — see Configuration below
docker compose up -d
```

Open **http://\<host\>:8000** and log in with your OpenStack credentials.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker Engine | 24+ |
| Docker Compose plugin | v2 |
| Network access to OpenStack APIs | — |

The container uses `network_mode: host` (see [Network](#network)), so the host machine must have a route to the OpenStack internal network (`192.168.204.0/24` by default).

---

## Configuration

All settings are driven by the `.env` file.  Copy `.env.example` and edit:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `OPENSTACK_HOST` | `192.168.204.10` | Controller VIP / API endpoint IP |
| `OPENSTACK_KEYSTONE_URL` | `http://<HOST>:5000/v3` | Keystone v3 URL |
| `OPENSTACK_ENDPOINT_TYPE` | `internalURL` | Endpoint type for all API calls |
| `OPENSTACK_DEFAULT_DOMAIN` | `Default` | Keystone domain |
| `OPENSTACK_DEFAULT_ROLE` | `member` | Default project role |
| `DEBUG` | `false` | Django debug mode — **must be `false` in production** |
| `ALLOWED_HOSTS` | `*` | Comma-separated allowed hostnames/IPs |
| `DJANGO_SECRET_KEY` | *(auto)* | Django secret key — see [Production](#production) |
| `HORIZON_DEFAULT_THEME` | `cat-dark` | Default theme (`cat-dark`, `default`, `material`) |
| `TIME_ZONE` | `UTC` | Django time zone |

---

## Production

Before deploying outside a dev environment, make three changes in `.env`:

**1. Disable debug mode**
```
DEBUG=false
```

**2. Restrict allowed hosts**
```
ALLOWED_HOSTS=horizon.yourdomain.com,192.168.x.x
```

**3. Set a fixed secret key** (so sessions survive container rebuilds)
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Paste the output into `DJANGO_SECRET_KEY=` in `.env`.

> **Note:** The container runs Django's development server (`manage.py runserver`).
> For a high-traffic deployment, replace `exec python manage.py runserver 0.0.0.0:8000`
> in `docker/entrypoint.sh` with gunicorn:
> ```bash
> exec gunicorn openstack_dashboard.wsgi:application \
>     --bind 0.0.0.0:8000 --workers 4
> ```
> Install gunicorn by adding `gunicorn` to `requirements.txt` first.
> For this lab, `runserver` is sufficient.

---

## Building the Image

```bash
docker compose build
```

The image is rebuilt automatically when `requirements.txt` changes.  
Force a full rebuild (no cache):

```bash
docker compose build --no-cache
```

---

## Upgrading

```bash
git pull
docker compose build
docker compose up -d
```

`collectstatic` and `migrate` run automatically on every container start via the entrypoint.

---

## Architecture

### Container startup sequence (`docker/entrypoint.sh`)

1. Copy `local_settings.docker.py` → `local_settings.py`
2. Copy heat-dashboard `enabled/` files into `openstack_dashboard/local/enabled/`
3. `python manage.py migrate --noinput` — apply DB migrations (SQLite, sessions only)
4. `python manage.py collectstatic --noinput --clear` — compile SCSS, collect static assets
5. Start Django development server on `0.0.0.0:8000`

### Volumes

| Volume | Mount | Purpose |
|---|---|---|
| `horizon-data` | `/app/data` | SQLite DB (`horizon.db`) + auto-generated secret key |
| `.` (source) | `/app` | Source tree mounted for live reload in dev |

### Network

`network_mode: host` is required so the container can reach the OpenStack internal endpoints (`internalURL`) directly through the host's routing table without extra network configuration.

---

## Customizations

### CAT Industrial Dark Theme

Located at `openstack_dashboard/themes/cat-dark/`.  
Activated via `HORIZON_DEFAULT_THEME=cat-dark` in `.env`.

Files:
- `_variables.scss` — Bootstrap + Horizon variable overrides (colors, table backgrounds)
- `_styles.scss` — Component-level overrides (navbar, tables, forms, modals, Angular Material)

### Orchestration Panel (Heat)

`heat-dashboard==15.0.0` is installed via `requirements.txt`.  
The enabled files are copied into `openstack_dashboard/local/enabled/` on container startup.

The Template Generator uses custom "LD" category labels defined in  
`openstack_dashboard/static/dashboard/project/ld_customizations/ld-labels.js`,  
registered via `openstack_dashboard/enabled/_1651_heat_ld_labels.py`.

**Nav category mapping:**

| Original | Display |
|---|---|
| OS::Nova (Server) | LD Instances |
| OS::Nova (Keypair) | LD Keys |
| OS::Cinder | LD Storage |
| OS::Neutron (net/subnet/router/etc.) | LD Network |
| OS::Neutron (port/routerinterface) | LD interface |
| OS::Heat (AutoScalingGroup) | LD Heat |
| OS::Heat (ResourceGroup) | LD Placement Groups |
| OS::Heat (ScalingPolicy) | LD Sizes |

---

## Troubleshooting

**Page not found on `/project/orchestration/`**  
The heat-dashboard enabled files were not copied. Restart the container:
```bash
docker compose restart
```

**White table rows / theme not applying**  
Static files need recompilation. Restart triggers `collectstatic --clear`:
```bash
docker compose restart
```

**`SECRET_KEY` changed / sessions invalidated after rebuild**  
Set `DJANGO_SECRET_KEY` to a fixed value in `.env` — see [Production](#production).

**Container can't reach OpenStack APIs**  
Verify the host has a route to `$OPENSTACK_HOST`:
```bash
curl http://$OPENSTACK_HOST:5000/v3
```
If unreachable, check host routing or DNS.
