var twoWayGoalsApp = angular.module('twoWayGoals', ['ui.select2']);

twoWayGoalsApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, spinner) {
        return {
            'request': function (config) {
                if (config.noSpinner && config.noSpinner === true) return config;
                spinner.spin();
                return config;
            },

            'response': function (response) {
                spinner.stop();
                return response;
            },

            'responseError': function (rejection) {
                spinner.stop();
                return $q.reject(rejection);
            }

        };
    });
});

twoWayGoalsApp.config(function ($provide) {
    $provide.decorator("$exceptionHandler", ['$delegate', '$window', '$injector', function ($delegate, $window, $injector) {
        var location = $window.location.href;
        return function (exception, cause) {
            var http = $injector.get("$http");
            $delegate(exception, cause);
            http.post('/api/errorlog', { resourceUri: location, errorMessage: exception.message, stackTrace: exception.stack });
            //$window.location = '/error/error500';
        };
    }]);
});
