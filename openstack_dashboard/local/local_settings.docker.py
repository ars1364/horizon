import os
from horizon.utils import secret_key

# ── Debug ────────────────────────────────────────────────────
DEBUG = os.environ.get('DEBUG', 'true').lower() == 'true'

# ── Allowed hosts ────────────────────────────────────────────
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# ── Secret key ───────────────────────────────────────────────
# Falls back to auto-generated file in /app/data so it survives container restarts
_secret_key_env = os.environ.get('DJANGO_SECRET_KEY', '')
if _secret_key_env:
    SECRET_KEY = _secret_key_env
else:
    SECRET_KEY = secret_key.generate_or_read_from_file('/app/data/.secret_key_store')

# ── Cache ─────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    },
}

# ── Database (SQLite, persisted via Docker volume) ───────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/app/data/horizon.db',
    },
}

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# ── OpenStack cluster ────────────────────────────────────────
OPENSTACK_HOST = os.environ.get('OPENSTACK_HOST', '127.0.0.1')

OPENSTACK_KEYSTONE_URL = os.environ.get(
    'OPENSTACK_KEYSTONE_URL',
    'http://{}:5000/v3'.format(OPENSTACK_HOST),
)

OPENSTACK_ENDPOINT_TYPE = os.environ.get('OPENSTACK_ENDPOINT_TYPE', 'internalURL')
SECONDARY_ENDPOINT_TYPE = os.environ.get('OPENSTACK_ENDPOINT_TYPE', 'internalURL')

OPENSTACK_KEYSTONE_DEFAULT_DOMAIN = os.environ.get('OPENSTACK_DEFAULT_DOMAIN', 'Default')
OPENSTACK_KEYSTONE_DEFAULT_ROLE = os.environ.get('OPENSTACK_DEFAULT_ROLE', 'member')
OPENSTACK_KEYSTONE_MULTIDOMAIN_SUPPORT = False

OPENSTACK_API_VERSIONS = {
    'identity': 3,
    'image': 2,
    'volume': 3,
}

OPENSTACK_NEUTRON_NETWORK = {
    'enable_router': True,
    'enable_quotas': True,
    'enable_ipv6': False,
    'enable_distributed_router': False,
    'enable_ha_router': False,
    'enable_fip_topology_check': True,
}

# ── Themes ───────────────────────────────────────────────────
AVAILABLE_THEMES = [
    ('cat-dark', 'CAT Industrial Dark', 'themes/cat-dark'),
    ('default', 'Default', 'themes/default'),
    ('material', 'Material', 'themes/material'),
]

DEFAULT_THEME = os.environ.get('HORIZON_DEFAULT_THEME', 'cat-dark')

# ── Misc ─────────────────────────────────────────────────────
TIME_ZONE = os.environ.get('TIME_ZONE', 'UTC')
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
