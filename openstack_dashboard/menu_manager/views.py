from django.contrib import messages
from django.core.cache import cache
from django.shortcuts import redirect, render
from django.utils.translation import gettext_lazy as _

from horizon.base import Horizon

from .models import MenuLabel

_CACHE_KEY = 'menu_label_overrides'


def _require_admin(request):
    """Returns True if request is from an authenticated admin, False otherwise."""
    return request.user.is_authenticated and request.user.is_superuser


def _collect_items():
    """Walk Horizon's registry and return all groups + panels as a flat list.

    Slugs are deduplicated — the same slug (e.g. 'compute') can exist in both
    the project and admin dashboards; we only need one entry per slug since
    the DB and sidebar both key on slug alone.
    """
    items = []
    seen = set()
    for dashboard in Horizon.get_dashboards():
        for group in dashboard.get_panel_groups().values():
            if str(group.name) and group.slug not in seen:
                seen.add(group.slug)
                items.append({
                    'type': 'group',
                    'slug': group.slug,
                    'current_name': str(group.name),
                })
            for panel in group:
                if panel.slug not in seen:
                    seen.add(panel.slug)
                    items.append({
                        'type': 'panel',
                        'slug': panel.slug,
                        'current_name': str(panel.name),
                    })
    return items


def index(request):
    if not _require_admin(request):
        messages.error(request, _("Admin access required."))
        return redirect('horizon:user_home')

    items = _collect_items()
    overrides = {m.slug: m.custom_label for m in MenuLabel.objects.all()}
    for item in items:
        item['custom'] = overrides.get(item['slug'], '')

    return render(request, 'menu_manager/index.html', {'items': items})


def update(request):
    if not _require_admin(request):
        messages.error(request, _("Admin access required."))
        return redirect('horizon:user_home')

    if request.method != 'POST':
        return redirect('horizon:project:menu_manager:index')

    slugs = request.POST.getlist('slug')
    labels = request.POST.getlist('label')

    saved = 0
    cleared = 0
    for slug, label in zip(slugs, labels):
        label = label.strip()
        if label:
            MenuLabel.objects.update_or_create(
                slug=slug,
                defaults={'custom_label': label},
            )
            saved += 1
        else:
            deleted, _ = MenuLabel.objects.filter(slug=slug).delete()
            cleared += deleted

    cache.delete(_CACHE_KEY)

    messages.success(
        request,
        _(f"Saved {saved} label(s). Cleared {cleared} override(s). "
          "Changes visible within 30 seconds on all pages.")
    )
    return redirect('horizon:project:menu_manager:index')
