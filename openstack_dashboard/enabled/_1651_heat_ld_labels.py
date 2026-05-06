# Custom label remapping for heat-dashboard Template Generator.
# Renames OS:: nav categories to user-preferred "LD" names and splits
# OS::Nova / OS::Neutron into finer-grained groups.
# FEATURE flag is required so Horizon's update_dashboards() processes this file.

FEATURE = 'ld_labels'

ADD_JS_FILES = [
    'dashboard/project/ld_customizations/ld-labels.js',
]
