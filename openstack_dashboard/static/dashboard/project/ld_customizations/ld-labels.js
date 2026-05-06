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
