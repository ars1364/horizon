from django import template
from django.core.cache import cache

register = template.Library()

_CACHE_KEY = 'menu_label_overrides'
_CACHE_TTL = 30  # seconds — short enough to feel instant after saving


@register.simple_tag
def menu_label(slug, default):
    """Return the custom label for a panel/group slug, or `default` if none set."""
    overrides = cache.get(_CACHE_KEY)
    if overrides is None:
        try:
            from openstack_dashboard.menu_manager.models import MenuLabel
            overrides = {m.slug: m.custom_label for m in MenuLabel.objects.all()}
        except Exception:
            overrides = {}
        cache.set(_CACHE_KEY, overrides, _CACHE_TTL)
    return overrides.get(slug, default)
