import horizon


class MenuManager(horizon.Panel):
    name = "Menu Labels"
    slug = "menu_manager"
    urls = 'openstack_dashboard.menu_manager.urls'
    # Only visible to OpenStack admin-role users
    permissions = ('openstack.roles.admin',)
