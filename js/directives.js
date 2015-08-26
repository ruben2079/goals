twoWayGoalsApp.directive('mhlAuditInfo', [function () {
        return {
            restrict: 'E',
            templateUrl: '/templates/LastChanged.tmpl.html',
            replace: true,
            scope: {
                auditInfo: '='
            }
        };
    }
]);

twoWayGoalsApp.directive('mhlToggleModalOn', function() {
    return {
        restrict: 'A',
        scope: {
            mhlToggleModalOn: '=',
            onModalHidden: '&'
        },
        link: function(scope, element) {
            scope.$watch('mhlToggleModalOn', function (value) {
                if (value) {
                    element.modal('show');
                    element.css({'top':window.scrollY + 80 +'px'});
                }
                else element.modal('hide');
            });

            element.on('hidden', function () {
                if (scope.onModalHidden && angular.isFunction(scope.onModalHidden)) scope.onModalHidden();

                scope.$apply(function() {
                    scope.mhlToggleModalOn = false;
                });
            });
        }
    };
});

twoWayGoalsApp.directive('mhlUiSlider', function () {
    
    return {
        restrict: 'A',
        scope: {
            mhlSliderStartValue: '@',
            mhlSliderRange: '@',
            mhlSliderStep: '@',
            mhlSliderValue: '='
        },
        link: function (scope, element) {
            var closestInput = element.siblings('.sliderValContainer').find('.sliderValue');
            var uiSliderInit = {
                start: scope.mhlSliderStartValue,
                range: JSON.parse(scope.mhlSliderRange),
                step: scope.mhlSliderStep,
                handles: 1,
                connect: 'upper',
                serialization: {
                    to: [(closestInput)],
                    resolution: 1
                },
                slide: function () { 
                    if (element != null) {
                        var xposition = element.find('.noUi-base').width() - element.find('.noUi-origin').width();
                        element.siblings('.sliderValContainer').animate({
                            "left": parseInt(element.siblings('.sliderValContainer').position().left = xposition) - 25
                        }, 200);
                    }
                },
            };

            element
                .noUiSlider(uiSliderInit)
                    .change(function () {
                        scope.$apply(function() {
                            scope.mhlSliderValue = parseInt(element.val());
                            element.siblings('.sliderValContainer').find('.sliderValue').val(scope.mhlSliderValue);
                        });
                    });
        }
    };
});

twoWayGoalsApp.directive('mhlValidDate', ['dateUtils', function (dateUtils) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function(scope, el, attrs, ctrl) {
                ctrl.$parsers.unshift(function(viewValue) {
                    var isValid = viewValue ? dateUtils.dateRegex.test(viewValue) : true;
                    ctrl.$setValidity('mhlValidDate', isValid);

                    return viewValue;
                });
            }
        };
    }
]);

twoWayGoalsApp.directive('mhlFutureDate', ['dateUtils', function (dateUtils) {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, el, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
                var isValid = viewValue && dateUtils.dateRegex.test(viewValue) ? dateUtils.isFuture(viewValue) : true;
                ctrl.$setValidity('mhlFutureDate', isValid);

                return viewValue;
            });
        }
    };
}
]);

twoWayGoalsApp.directive('mhlDateBefore', [
    '$parse','dateUtils', function($parse, dateUtils) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, el, attrs, ctrl) {
                var startDateModel = $parse(attrs.mhlDateBefore),
                    validatorFunc = function(value) {
                        var startDate = startDateModel(scope),
                            isValid = value && dateUtils.dateRegex.test(value) ? dateUtils.isAfter(value, startDate) : true;
                        ctrl.$setValidity('mhlDateBefore', isValid);
                        return value;
                    };

                ctrl.$parsers.unshift(validatorFunc);

                scope.$watch(attrs.mhlDateBefore, function () {
                    validatorFunc(ctrl.$viewValue);
                });
            }
        };
    }
]);

twoWayGoalsApp.directive('mhlSpinner', [
    '$window', function($window) {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            template: "<span style='position: fixed;top: 50%;left: 50%;margin-top:-50px;margin-left:-100px;'></span>",
            controller: ['$scope', '$element', function($scope, $element) {
                $scope.spin = function () {
                    if ($scope.spinner) {
                        $scope.spinner.spin($element[0]);
                    }
                };

                $scope.stop = function () {
                    if ($scope.spinner) {
                        $scope.spinner.stop();
                    }
                };
            }],
            link: function(scope, element, attr) {
                scope.$watch(attr.spinnerOptions, function(options) {
                    scope.stop();
                    scope.spinner = new $window.Spinner(options);
                }, true);

                scope.$on('mhl-spinner:spin', function(event) {
                    scope.spin();
                });

                scope.$on('mhl-spinner:stop', function(event) {
                    scope.stop();
                });

                scope.$on('$destroy', function () {
                    scope.stop();
                    scope.spinner = null;
                });
            }
        };
    }
]);

twoWayGoalsApp.directive('datepicker', [
    function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function (scope, element, attrs, ngModel) {
                if (!ngModel) return;

                var options = {};

                options.dateFormat = 'mm/dd/yy';
                var updateModel = function (dateText) {
                    scope.$apply(function () {
                        ngModel.$setViewValue(dateText);
                    });
                };

                options.onSelect = function (dateTxt, picker) {
                    updateModel(dateTxt);
                };

                ngModel.$render = function () {
                    element.datepicker('setDate', ngModel.$viewValue || '');
                };

                element.datepicker(options);

                if (attrs.datepickerShowButtonId) {
                    $('#' + attrs.datepickerShowButtonId).on('click', function () {
                        element.datepicker('show');
                    });
                }
            }
        };
    }
]);

twoWayGoalsApp.directive('mhlEnter', function() {
    return function(scope, element, attrs) {
        element.on('keydown keypress', function(e) {
            if (e.which === 13) {
                //enter key press
                scope.$apply(function() {
                    scope.$eval(attrs.mhlEnter);
                });

                e.preventDefault();
            }
        });
    };
});

twoWayGoalsApp.directive('mhlTooltip', function () {
    return {
        restrict: 'A',
        link: function(scope,element, attributes){
            element.attr('data-toggle', 'tooltip');
            element.attr('title', attributes.mhlTooltip);
            element.tooltip();
            element.on('hidden', function(evt) {
                evt.stopPropagation();
            }).on('show', function(evt) {
                evt.stopPropagation();
            }).on('touchstart', function (evt) {
                evt.stopPropagation();
                element.tooltip('toggle');
            });
        }
    };
    
});
