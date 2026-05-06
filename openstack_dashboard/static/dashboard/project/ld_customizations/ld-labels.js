/**
 * Remaps heat-dashboard Template Generator nav categories from raw
 * OS:: namespace strings to user-defined "LD" display labels.
 * Also splits OS::Nova and OS::Neutron into finer-grained groups.
 */
(function() {
    'use strict';

    var CTRL = 'horizon.dashboard.project.heat_dashboard.template_generator.IconController';

    // Per-resource-key group assignment (takes priority over namespace fallback)
    var RESOURCE_GROUP = {
        'OS__Nova__Server':                   'LD Instances',
        'OS__Nova__Keypair':                  'LD Keys',
        'OS__Cinder__Volume':                 'LD Storage',
        'OS__Cinder__VolumeAttachment':       'LD Storage',
        'OS__Glance__Image':                  'LD Image',
        'OS__Neutron__Net':                   'LD Network',
        'OS__Neutron__Subnet':                'LD Network',
        'OS__Neutron__Router':                'LD Network',
        'OS__Neutron__FloatingIp':            'LD Network',
        'OS__Neutron__FloatingIpAssociation': 'LD Network',
        'OS__Neutron__SecurityGroup':         'LD Network',
        'OS__Neutron__Port':                  'LD interface',
        'OS__Neutron__RouterInterface':       'LD interface',
        'OS__Heat__AutoScalingGroup':         'LD Heat',
        'OS__Heat__ResourceGroup':            'LD Placement Groups',
        'OS__Heat__ScalingPolicy':            'LD Sizes',
        'OS__Swift__Container':               'LD Object Storage',
        'OS__Designate__Zone':                'LD DNS',
        'OS__Designate__RecordSet':           'LD DNS'
    };

    // Namespace fallback (for resource types not listed above)
    var NS_GROUP = {
        'OS::Nova':     'LD Compute',
        'OS::Cinder':   'LD Storage',
        'OS::Glance':   'LD Image',
        'OS::Neutron':  'LD Network',
        'OS::Heat':     'LD Heat',
        'OS::Swift':    'LD Object Storage',
        'OS::Designate':'LD DNS'
    };

    function remapProjectTypes($scope) {
        if (!$scope || !$scope.project_types) { return; }
        var newTypes = {};
        for (var ns in $scope.project_types) {
            var groupItems = $scope.project_types[ns];
            for (var itemKey in groupItems) {
                var groupName = RESOURCE_GROUP[itemKey] || NS_GROUP[ns] || ns;
                if (!newTypes[groupName]) { newTypes[groupName] = {}; }
                newTypes[groupName][itemKey] = groupItems[itemKey];
            }
        }
        $scope.project_types = newTypes;
        $scope.currentNavItem = Object.keys(newTypes)[0];
    }

    // Icon tooltip names (resobj.name shown on hover over each resource icon)
    var ICON_NAME = {
        'OS__Nova__Server':                   'LD Instance',
        'OS__Nova__Keypair':                  'LD Key Pair',
        'OS__Cinder__Volume':                 'LD Volume',
        'OS__Cinder__VolumeAttachment':       'LD Volume Attachment',
        'OS__Glance__Image':                  'LD Image',
        'OS__Neutron__Net':                   'LD Network',
        'OS__Neutron__Subnet':                'LD Subnet',
        'OS__Neutron__Router':                'LD Router',
        'OS__Neutron__FloatingIp':            'LD Floating IP',
        'OS__Neutron__FloatingIpAssociation': 'LD Floating IP Assoc.',
        'OS__Neutron__SecurityGroup':         'LD Security Group',
        'OS__Neutron__Port':                  'LD Port',
        'OS__Neutron__RouterInterface':       'LD Router Interface',
        'OS__Heat__AutoScalingGroup':         'LD Auto Scaling Group',
        'OS__Heat__ResourceGroup':            'LD Placement Group',
        'OS__Heat__ScalingPolicy':            'LD Scaling Policy',
        'OS__Swift__Container':               'LD Object Container',
        'OS__Designate__Zone':                'LD DNS Zone',
        'OS__Designate__RecordSet':           'LD DNS Record Set'
    };

    angular.module('horizon.dashboard.project.heat_dashboard.template_generator')
    // Patch icon.name after all resource .run() blocks have registered icons.
    // This fixes the tooltip text (resobj.name) shown on hover in the icon sidebar.
    .run(['hotgenGlobals', function(hotgenGlobals) {
        var icons = hotgenGlobals.get_resource_icons();
        for (var key in ICON_NAME) {
            if (icons[key]) { icons[key].name = ICON_NAME[key]; }
        }
    }]);

    angular.module('horizon.dashboard.project.heat_dashboard.template_generator')
    .config(['$provide', function($provide) {
        $provide.decorator('$controller', ['$delegate', function($delegate) {
            return function() {
                var constructor = arguments[0];
                var locals      = arguments[1];
                var later       = arguments[2];
                var result      = $delegate.apply(this, arguments);

                if (constructor !== CTRL) { return result; }

                var $scope = locals && locals.$scope;
                if (later && typeof result === 'function') {
                    // Angular calls the returned fn to actually run the ctor;
                    // wrap it so we can post-process after construction.
                    var origFn  = result;
                    var wrapped = function() {
                        var r = origFn.apply(this, arguments);
                        remapProjectTypes($scope);
                        return r;
                    };
                    wrapped.instance   = origFn.instance;
                    wrapped.identifier = origFn.identifier;
                    if (origFn.onDestroy) { wrapped.onDestroy = origFn.onDestroy; }
                    return wrapped;
                }
                // later === false: constructor already ran
                remapProjectTypes($scope);
                return result;
            };
        }]);
    }]);
})();
