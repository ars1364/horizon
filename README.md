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

---

## Deploying with Kolla-Ansible

This repo does **not** ship a Dockerfile — containerization is handled by the separate [Kolla](https://opendev.org/openstack/kolla) project via `Dockerfile.j2`. The workflow below builds a custom Horizon image from this fork and points Kolla-Ansible at it.

### Step 1 — Install Kolla (image builder)

```bash
pip install kolla
# pin to your OpenStack release:
pip install 'kolla==2025.1'
```

### Step 2 — Configure kolla-build to use this fork

Create `/etc/kolla/kolla-build.conf`:

```ini
[DEFAULT]
base = ubuntu
install_type = source
namespace = mycompany
tag = 2025.1-custom

[horizon]
type = git
location = https://github.com/ars1364/horizon
reference = master
```

If you need token auth (private fork):

```ini
[horizon]
type = git
location = https://<your-token>@github.com/ars1364/horizon
reference = master
```

### Step 3 — Run a local Docker registry

```bash
docker run -d -p 4000:5000 --restart=always --name registry \
  -v /data/registry:/var/lib/registry registry:2
```

### Step 4 — Build and push the Horizon image only

```bash
kolla-build \
  --config-file /etc/kolla/kolla-build.conf \
  --registry <control-node-ip>:4000 \
  --namespace mycompany \
  --tag 2025.1-custom \
  --push \
  ^horizon$
```

This produces: `<control-node-ip>:4000/mycompany/horizon:2025.1-custom`

### Step 5 — Tell Kolla-Ansible to use your custom image

In `/etc/kolla/globals.yml`, override **only** Horizon (leaves all other services untouched):

```yaml
horizon_image_full: "<control-node-ip>:4000/mycompany/horizon:2025.1-custom"
docker_registry_insecure: true
```

On **all nodes**, trust the insecure registry in `/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["<control-node-ip>:4000"]
}
```

Then restart Docker on all nodes:

```bash
systemctl restart docker
```

### Step 6 — Deploy / reconfigure

**Existing cluster (Horizon already deployed):**

```bash
kolla-ansible reconfigure -t horizon
```

**Fresh deploy:**

```bash
kolla-ansible deploy -t horizon
```

---

## How It Works

```
1. Fork openstack/horizon → this repo
2. kolla-build.conf → [horizon] type=git, location=this repo
3. kolla-build --registry <local-reg> --push ^horizon$
4. globals.yml → horizon_image_full: "<registry>/horizon:<tag>"
5. kolla-ansible deploy / reconfigure -t horizon
```

**Key point:** Kolla (image builder) and Kolla-Ansible (deployer) are separate projects. This repo has no Docker support — all containerization goes through Kolla's `Dockerfile.j2` + `kolla-build`. Kolla-Ansible is only told which registry/tag to pull from.

---

## References

- [Kolla image building docs](https://docs.openstack.org/kolla/2025.1/admin/image-building.html)
- [Kolla-Ansible advanced configuration](https://docs.openstack.org/kolla-ansible/2025.2/admin/advanced-configuration.html)
- [Kolla-Ansible Horizon guide](https://docs.openstack.org/kolla-ansible/latest/reference/shared-services/horizon-guide.html)
- [Kolla Horizon Dockerfile.j2](https://github.com/openstack/kolla/blob/master/docker/horizon/Dockerfile.j2)

---

## Contributors

Special thanks to the people who built and maintain this customized Horizon:

| Contributor | Role |
|---|---|
| [@cloudinativesw](https://github.com/cloudinativesw) | Core developer — dark theme, label management, Heat fixes |
| [@AliHub-Solution](https://github.com/AliHub-Solution) | Collaborator |
| [@ars1364](https://github.com/ars1364) | Maintainer |
