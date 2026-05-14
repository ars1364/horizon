# Horizon — Customized OpenStack Dashboard

> Forked from [openstack/horizon](https://opendev.org/openstack/horizon) · Kolla-Ansible ready  
> Includes **CAT Industrial Dark theme**, **Menu Label Management**, and **Heat label fixes**

---

## What's Different

| Feature | Status |
|---|---|
| CAT Industrial Dark theme | ✅ Included |
| Menu / label management panel | ✅ Included |
| Heat orchestration label fixes | ✅ Fixed |
| LD_ panel renames | ✅ Included |

---

## How It Works

This repo builds a custom Horizon Docker image **on top of the official Kolla image** using a simple `FROM` layer — no kolla-build pipeline required.

```
quay.io/openstack.kolla/ubuntu-source-horizon:2025.1-ubuntu-noble
  └─ COPY custom theme, panels, sidebar, heat pre-enable
     └─ ghcr.io/ars1364/horizon:2025.1
        └─ globals.yml → horizon_image_full
           └─ kolla-ansible deploy / reconfigure -t horizon
```

---

## Building the Image

### Automatic (GitHub Actions)

Every push to `master` triggers `.github/workflows/build-horizon.yml`, which builds `Dockerfile.kolla` and pushes to:

```
ghcr.io/ars1364/horizon:2025.1
ghcr.io/ars1364/horizon:latest
```

To trigger a manual build with a custom base image, use **Actions → Build & Push Horizon Image → Run workflow**.

### Manual local build

```bash
docker build -f Dockerfile.kolla \
  -t ghcr.io/ars1364/horizon:2025.1 \
  .
docker push ghcr.io/ars1364/horizon:2025.1
```

To use a different Kolla base (e.g. a pinned or locally-built image):

```bash
docker build -f Dockerfile.kolla \
  --build-arg KOLLA_BASE=<your-registry>/horizon:2025.1 \
  -t <your-registry>/horizon:2025.1-custom \
  .
```

---

## Deploying with Kolla-Ansible

### Step 1 — Tag and push to your local registry

After the GitHub Actions build completes (or after a manual build), pull and push to your cluster registry:

```bash
docker pull ghcr.io/ars1364/horizon:2025.1
docker tag  ghcr.io/ars1364/horizon:2025.1 <registry-ip>:4000/ars1364/horizon:2025.1
docker push <registry-ip>:4000/ars1364/horizon:2025.1
```

### Step 2 — Apply globals.yml overrides

Add or update these entries in `/etc/kolla/globals.yml` on the deploy host:

```yaml
# Point kolla-ansible at the custom image
horizon_image_full: "<registry-ip>:4000/ars1364/horizon:2025.1"

# Enable Heat dashboard UI (does NOT require Heat to be deployed)
enable_horizon_heat: "yes"

# CAT Industrial Dark theme
horizon_custom_themes:
  - name: "cat-dark"
    label: "CAT Industrial Dark"
    path: "themes/cat-dark"
horizon_default_theme: "cat-dark"
```

### Step 3 — Install the local_settings override

Copy the deploy-host settings file so kolla-ansible appends it to the generated `local_settings.py`:

```bash
mkdir -p /etc/kolla/config/horizon
cp docker/kolla-local-settings /etc/kolla/config/horizon/local_settings
```

This file adds:
- `openstack_dashboard.menu_manager` to `INSTALLED_APPS`
- `cat-dark` theme to `AVAILABLE_THEMES`

### Step 4 — Deploy

```bash
kolla-ansible reconfigure -t horizon
```

### Step 5 — Run Menu Manager migrations (first deploy only)

The `menu_manager` panel uses a small DB table for label overrides. Run migrations once after the first deploy:

```bash
docker exec horizon bash -c \
  "source /var/lib/kolla/venv/bin/activate && \
   python /var/lib/kolla/venv/bin/manage.py migrate --noinput"
```

---

## Customizations Reference

### CAT Industrial Dark Theme

`openstack_dashboard/themes/cat-dark/`

- `_variables.scss` — Bootstrap + Horizon variable overrides
- `_styles.scss` — Component overrides (navbar, tables, modals, Angular Material for Heat)

### Menu Label Management

`openstack_dashboard/menu_manager/`

Superusers can rename any sidebar group or panel label at runtime via **Project → Configuration → Menu Labels**. Labels are stored in the Horizon database and cached for 30 seconds.

### LD_ Panel Renames

17 `panel.py` files and 4 `_*_panel_group.py` enabled files replace stock category/panel names with `LD_`-prefixed equivalents (LD_Instances, LD_Storage, LD_Network, etc.).

### Heat Label Fixes

`openstack_dashboard/enabled/_1651_heat_ld_labels.py` +  
`openstack_dashboard/static/dashboard/project/ld_customizations/ld-labels.js`

Angular decorator that remaps Heat Template Generator resource categories to custom LD group names.

---

## Troubleshooting

**Heat panels not showing after reconfigure**  
Ensure `enable_horizon_heat: "yes"` is in `globals.yml`, then rerun `kolla-ansible reconfigure -t horizon`. The `extend_start.sh` inside the container activates the heat panels on startup only when this variable is set.

**Cat-dark theme not applying**  
Confirm `/etc/kolla/config/horizon/local_settings` is in place and contains the `AVAILABLE_THEMES` / `DEFAULT_THEME` entries. Rerun reconfigure.

**Menu Labels panel shows 404 / DB error**  
Run the migration step above (Step 5). The `menu_label` table does not exist until `manage.py migrate` runs.

**Build fails on quay.io image pull**  
The quay.io images are public but rate-limited. Add `--build-arg KOLLA_BASE=<local-mirror>` or authenticate: `docker login quay.io`.

---

## Maintainer

[@ars1364](https://github.com/ars1364)
