
twoWayGoalsApp.constant('globalConstants', {
    memberId: MHL.Globals.MEMBER_ID,
    errorPageUri: '/error/error500',
    guidRegex: /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i,
    DEFAULT_VISION_TEXT: MHL.Globals.DEFAULT_VISION_TEXT,
    VISION_MAX_CHARS: 250,
    REFLECTION_MAX_CHARS: 140,
    EXPERIMENT_MAX_CHARS: 140,
    GOAL_MAX_CHARS: 140,
    FocusAreaTooltips: {
        1: 'Weight',
        2: 'Tobacco',
        3: 'Stress & Resiliency',
        4: 'Exercise',
        5: 'Nutrition',
        6: 'Physical Activity'
    }
});

twoWayGoalsApp.value('_', window._);
twoWayGoalsApp.value('moment', window.moment);
twoWayGoalsApp.value('toastr', window.toastr);

twoWayGoalsApp.value('booleanUtils', function() {
    return {
        existy: function(obj) {
            return obj != null;
            },
        truthy: function(obj) {
            return (obj !== false) && this.existy(obj);
    }
    };
}());



