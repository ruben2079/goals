twoWayGoalsApp.filter('formatUtcDate', [
    'dateUtils', function(dateUtils) {
        return function(input, format) {
            return dateUtils.toCstDateString(input, format);
        };
    }
]);
