# Horizon — Customized OpenStack Dashboard

Customized OpenStack Horizon 2025.1 image for Kolla-Ansible deployments.  
Built as a thin layer on top of the official Kolla image — no kolla-build pipeline required.

**Included customizations:**

- **CAT Industrial Dark theme** — dark UI with CAT Yellow (`#FFC300`) branding
- **LD_ panel renames** — all project panels renamed with `LD_` prefix
- **Menu Label Manager** — superusers can rename sidebar items at runtime from the dashboard
- **Heat label fixes** — Template Generator resource categories remapped to LD_ group names
- **Heat pre-enabled** — Orchestration panels baked in at image build time

---

## 1. Build the image

On any machine with Docker and access to `quay.io`:

```bash
git clone https://github.com/ars1364/horizon.git
cd horizon

docker build -f Dockerfile.kolla \
  -t <registry>:4000/ars1364/horizon:2025.1 \
  .
```

Replace `<registry>` with your local registry IP (the controller node running the Docker registry).

The build pulls `quay.io/openstack.kolla/horizon:2025.1-ubuntu-noble` as the base and layers all customizations on top. Build time is 2–5 minutes depending on network speed to quay.io.

> **Tip — build from a specific Kolla base:**  
> If you want to pin to the exact image your cluster is currently running, pass it explicitly:
> ```bash
> docker build -f Dockerfile.kolla \
>   --build-arg KOLLA_BASE=quay.io/openstack.kolla/horizon:2025.1-ubuntu-noble \
>   -t <registry>:4000/ars1364/horizon:2025.1 \
>   .
> ```

---

## 2. Push to your registry

```bash
docker push <registry>:4000/ars1364/horizon:2025.1
```

---

## 3. Configure kolla-ansible (deploy host)

### 3a. globals.yml

Add or update these entries in `/etc/kolla/globals.yml`:

```yaml
# Use the custom image
horizon_image_full: "<registry>:4000/ars1364/horizon:2025.1"

# Enable Heat dashboard UI (does NOT require Heat service to be deployed)
enable_horizon_heat: "yes"

# CAT Industrial Dark theme
horizon_custom_themes:
  - name: "cat-dark"
    label: "CAT Industrial Dark"
    path: "themes/cat-dark"
horizon_default_theme: "cat-dark"
```

### 3b. local_settings override

This file adds `menu_manager` to `INSTALLED_APPS` and sets the default theme.  
kolla-ansible appends it to the generated `local_settings.py` on every deploy/reconfigure.

```bash
mkdir -p /etc/kolla/config/horizon
cp docker/kolla-local-settings /etc/kolla/config/horizon/local_settings
```

---

## 4. Deploy

```bash
kolla-ansible reconfigure -t horizon
```

Or for a fresh install:

```bash
kolla-ansible deploy -t horizon
```

---

## 5. First-deploy only — run database migrations

The Menu Label Manager needs a small DB table. Run this once after the first deploy:

```bash
docker exec horizon bash -c \
  "source /var/lib/kolla/venv/bin/activate && \
   python /var/lib/kolla/venv/bin/manage.py migrate --noinput"
```

This is idempotent — safe to run again if you're unsure.

---

## Updating the image

After any change to this repo:

```bash
# Rebuild
docker build -f Dockerfile.kolla -t <registry>:4000/ars1364/horizon:2025.1 .

# Push
docker push <registry>:4000/ars1364/horizon:2025.1

# Redeploy
kolla-ansible reconfigure -t horizon
```

---

## Customizations reference

### CAT Industrial Dark theme

Files: `openstack_dashboard/themes/cat-dark/_variables.scss`, `_styles.scss`

Bootstrap + Horizon variable overrides and component-level dark styles. Includes Angular Material overrides for the Heat Template Generator.

Activated via `horizon_default_theme: cat-dark` in `globals.yml`.

### Menu Label Manager

Directory: `openstack_dashboard/menu_manager/`

Superusers can rename any sidebar group or panel label at runtime via **Project → Configuration → Menu Labels**. Labels are stored in the Horizon database and applied via a template tag in the sidebar. Changes are cached for 30 seconds.

Requires `manage.py migrate` (see Step 5) and the `local_settings` override (see Step 3b).

### LD_ panel renames

17 `panel.py` files and 4 `_*_panel_group.py` enabled files replace all stock project-dashboard names:

| Stock name | Custom name |
|---|---|
| Compute | LD_Compute |
| Instances | LD_Instances |
| Images | LD_Image |
| Key Pairs | LD_Keys |
| Server Groups | LD_Placement Group |
| Volumes | LD_Storage |
| Network | LD_Network |
| … | … |

### Heat label fixes

`openstack_dashboard/enabled/_1651_heat_ld_labels.py` registers an Angular decorator (`ld-labels.js`) that remaps Heat Template Generator resource categories from OpenStack namespace strings (e.g. `OS__Nova__Server`) to human-friendly LD group names.

---

## Troubleshooting

**Heat panels not showing after reconfigure**  
Check that `enable_horizon_heat: "yes"` is in `globals.yml`. Run `kolla-ansible reconfigure -t horizon`. The container's startup script (`extend_start.sh`) activates heat panels only when this env var is passed.

**Theme not applying / still shows default**  
Confirm `/etc/kolla/config/horizon/local_settings` exists on the deploy host and contains the `AVAILABLE_THEMES` / `DEFAULT_THEME` lines. Rerun reconfigure.

**Menu Labels panel shows "table not found" error**  
Run the migration command in Step 5.

**Build fails — cannot pull quay.io base image**  
The quay.io images are public but may be rate-limited. Authenticate with `docker login quay.io` or mirror the base image to your local registry first.

**"metadata unknown" or manifest error during `docker build`**  
You are using the wrong base image. There are two Kolla Horizon images on quay.io and they are **not interchangeable**:

| Image | Use? |
|---|---|
| `quay.io/openstack.kolla/horizon:2025.1-ubuntu-noble` | **Correct** — binary/pre-built, same image kolla-ansible deploys |
| `quay.io/openstack.kolla/ubuntu-source-horizon:2025.1-ubuntu-noble` | **Wrong** — source-built variant, different internal paths, causes metadata/COPY errors |

Always use `quay.io/openstack.kolla/horizon:2025.1-ubuntu-noble`. The `ubuntu-source-horizon` variant has a different filesystem layout; the `COPY` commands in `Dockerfile.kolla` will fail or land in the wrong location.

**collectstatic errors in container logs on first start**  
This is normal on the very first start after a new image — kolla's startup script detects changed settings and reruns `collectstatic`. It should complete within 60–90 seconds. If it loops or fails repeatedly, check disk space on the controller.

---

## Maintainer

[@ars1364](https://github.com/ars1364)
