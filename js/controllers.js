twoWayGoalsApp.controller('visionController', ['$scope', 'globalConstants', 'visionSvc', 'toastr', 'spinner', 'dateUtils', function ($scope, globalConstants, visionSvc, toastr, spinner, dateUtils) {
    var initNewExperiment = function() {
            return {
                charsLeft: globalConstants.EXPERIMENT_MAX_CHARS,
                experimentText: '',
                startDate: dateUtils.todayCstString(),
                endDate: dateUtils.futureDateCstString(7)
            };
        },
        initPageModel = function(showSpinner) {
            return visionSvc.fetch(showSpinner).then(function (res) {
                $scope.vision = res;
                $scope.visionCharsLeft = globalConstants.VISION_MAX_CHARS - res.VisionText.length;
                res.VisionText = MayoEDH.stripHTMLTags($('#txtMyVision').html(res.VisionText).text());                
            }, function (err) {
                throw new Error(
                    'Error status during api call: '
                    + err.config.method
                    + ' '
                    + err.config.url
                    + ' code: '
                    + err.status
                );
            });
        },
        addVision = function() {
            visionSvc.createVision($scope.vision).then(function() {
                $scope.isVisionEditable = false;
                toastr.info('Vision successfully updated.');
            }).catch(function(err) {
                toastr.error('Error while saving vision.');
            });
        },
        updateVision = function() {
            $scope.vision.VisionText = MayoEDH.stripHTMLTags($scope.vision.VisionText);
            visionSvc.updateVision($scope.vision).then(function() {
                $scope.isVisionEditable = false;
                toastr.info('Vision successfully updated.');
            }, function(err) {
                toastr.error('Error while saving vision.');
            });           
        },
        isNewVision = function () {
           return $scope.vision.VisionId == -1;           
        },
        formatSelectList = function(optionList) {
            if (!optionList.id) return optionList.text; // optgroup
            return "<span class=\'icon focusAreaID-drop-" + optionList.id + "'></span>" + optionList.text;
        };

    $scope.saveVision = function() {
        if ($scope.vision.isNew) addVision();
        else updateVision();
    };

    $scope.addGoal = function (newGoalText) {
        if (!(newGoalText) || !$scope.isValidGoal(newGoalText)) return;
        visionSvc.addGoal($scope.vision, newGoalText)
            .then(function() {
                $scope.isAddGoalVisible = false;
                $scope.newGoalText = '';
                $scope.goalCharsLeft = globalConstants.GOAL_MAX_CHARS;

                toastr.info('Successfully added goal.');
            })
            .catch(function() {
                toastr.error('Error occured while saving goal.');
            });
    };

    $scope.isValidGoal = function(newGoalText) {
        if (!newGoalText) return false;

        var charCount = $scope.newGoalText.length;
        return charCount > 0 && charCount <= globalConstants.GOAL_MAX_CHARS;
    };

    $scope.cancelAddGoal = function() {
        $scope.newGoalText = '';
        $scope.goalCharsLeft = globalConstants.GOAL_MAX_CHARS;
        $scope.isAddGoalVisible = false;
    };

    $scope.addReflection = function () {
        visionSvc.addReflection($scope.vision, $scope.newReflectionText)
            .then(function() {
                $scope.newReflectionText = '';
                $scope.updateReflectionCharCount();

                toastr.info('Successfully added reflection.');
            })
            .catch(function() {
                toastr.error('Error occured while saving reflection.');
            });
    };

    $scope.rateVisionEffortProgress = function () {
        $scope.isRateEffortProgressVisible = false;
        visionSvc.addVisionEffortProgress($scope.vision, { effort: $scope.visionEffort, progress: $scope.visionProgress })
            .then(function() {
                toastr.info('Rating successfully saved.');
            })
            .catch(function() {
                toastr.error('Error occurred while saving effort/progress.');
            });
    };

    $scope.refreshVision = function () {
        initPageModel(true).then(function() {
            toastr.info('Wellness Vision & Goals successfully refreshed.');
        });
    };

    $scope.toggleVisionEditor = function () {
        if (!$scope.isVisionEditable) {
            //entering edit mode save previous version for undo
            $scope.visionTextPreviousVersion = MayoEDH.stripHTMLTags($scope.vision.VisionText);
        }
        if (isNewVision()) {
            $scope.vision.VisionText = '';
            $scope.updateVisionCharCount();
        }

        $scope.isVisionEditable = !$scope.isVisionEditable;
    };

    $scope.cancelEditVision = function () {
        //undo changes
        $scope.vision.VisionText = $scope.visionTextPreviousVersion;
        $scope.isVisionEditable = false;
    };

    $scope.getActiveExperimentsFor = function (goal) {
        return visionSvc.getActiveExperimentsFor(goal);
    };

    $scope.updateReflectionCharCount = function () {
        var charCount = $scope.newReflectionText.length;
        $scope.enableAddReflection = charCount > 0 && charCount <= globalConstants.REFLECTION_MAX_CHARS;
        if (charCount <= globalConstants.REFLECTION_MAX_CHARS)
            $scope.newReflectionRemainingCharCount = globalConstants.REFLECTION_MAX_CHARS - charCount;
        else $scope.newReflectionRemainingCharCount = 0;
    };

    $scope.updateExperimentCharCount = function() {
        var charCount = $scope.newExperiment.experimentText ? $scope.newExperiment.experimentText.length : 0;

        if (charCount <= globalConstants.EXPERIMENT_MAX_CHARS)
            $scope.newExperiment.charsLeft = globalConstants.REFLECTION_MAX_CHARS - charCount;
        else $scope.newExperiment.charsLeft = 0;
    };

    $scope.updateVisionCharCount = function() {
        var charCount = $scope.vision.VisionText.length;
        $scope.enableUpdateVision = charCount > 0 && charCount <= globalConstants.VISION_MAX_CHARS;
        if (charCount <= globalConstants.VISION_MAX_CHARS)
            $scope.visionCharsLeft = globalConstants.VISION_MAX_CHARS - charCount;
        else $scope.visionCharsLeft = 0;
    };

    $scope.updateGoalCharCount = function() {
        var charCount = $scope.newGoalText.length;
        //$scope.enableUpdateGoal = charCount > 0 && charCount <= globalConstants.GOAL_MAX_CHARS;

        if (charCount <= globalConstants.GOAL_MAX_CHARS)
            $scope.goalCharsLeft = globalConstants.GOAL_MAX_CHARS - charCount;
        else $scope.goalCharsLeft = 0;
    };

    $scope.showVisionHistory = function () {
        visionSvc.getVisionHistory($scope.vision).then(function(res) {
            $scope.visionHistory = res;
            $scope.isVisionHistoryVisible = true;
        });
    };

    $scope.showReflections = function() {
        $scope.isReflectionHistoryVisible = true;
    };

    $scope.showEffortProgressHistory = function() {
        $scope.isEffortProgressHistoryVisible = true;
    };

    $scope.showEditGoal = function(goal, goalIndex) {
        $scope.goalToEdit = {
            goal: goal,
            sequence: goalIndex + 1
        };

        $scope.isEditGoalStatusVisible = true;
    };

    $scope.showRateExperiment = function(goalId, experiment) {
        $scope.experimentToRate = {goalId: goalId, experiment: experiment};
        $scope.isRateExperimentVisible = true;
    };

    $scope.showCreateExperiment = function (goal) {
        $scope.newExperiment.goal = goal;
        $scope.isCreateExperimentVisible = true;
        $scope.addExperimentShowErrors = false;
        $scope.addExperimentForm.$setPristine();
    };

    $scope.markExperimentAchieved = function (experimentToRate) {
        $scope.isRateExperimentVisible = false;
        visionSvc.rankExperimentAchieved($scope.vision.VisionId, experimentToRate.goalId, experimentToRate.experiment).then(function () {
            toastr.info('Experiment marked as achieved.');
        }, function (err) {
            toastr.error('Error occurred while saving experiment.');
        });
    };

    $scope.markExperimentNotAchieved = function (experimentToRate) {
        $scope.isRateExperimentVisible = false;
        visionSvc.rankExperimentNotAchieved($scope.vision.VisionId, experimentToRate.goalId, experimentToRate.experiment).then(function () {
            toastr.info('Experiment marked as not achieved.');
        }, function (err) {
            toastr.error('Error occurred while saving experiment.');
        });
    };

    $scope.markGoalAchieved = function (goal) {
        $scope.isEditGoalStatusVisible = false;
        visionSvc.markGoalAchieved($scope.vision.VisionId, goal)
            .then(function() {
                toastr.info('Goal marked as achieved.');
            })
            .catch(function() {
                toastr.error('Error occurred while updating goal.');
            });
    };

    $scope.markGoalInactive = function (goal) {
        $scope.isEditGoalStatusVisible = false;
        visionSvc.markGoalInactive($scope.vision.VisionId, goal)
            .then(function() {
                toastr.info('Goal marked as inactive');
            })
            .catch(function () {
                toastr.error('Error occurred while saving goal.');
            });
    };

    $scope.createExperiment = function (experiment, form) {
        if (form.$invalid) {
            $scope.addExperimentShowErrors = true;
            return;
        }

        var visionId = $scope.vision.VisionId,
            goalToAddTo = experiment.goal,
            experimentModel = {
                experimentText: experiment.experimentText,
                startDate: experiment.startDate,
                endDate: experiment.endDate,
                focusAreaID: experiment.focusAreaID
            };

        visionSvc.addExperiment(visionId, goalToAddTo, experimentModel).then(function () {
            toastr.info('New experiment added.');
            $scope.newExperiment = initNewExperiment();
            $scope.isCreateExperimentVisible = false;
            $scope.addExperimentForm.$setPristine();
        }, function(err) {
            toastr.error('Error while saving new experiment.');
        });
    };

    $scope.clearNewExperiment = function() {
        $scope.newExperiment = initNewExperiment();
    };

    $scope.startSpinner = function() {
        spinner.spin();
    };

    $scope.stopSpinner = function() {
        spinner.stop();
    };

    $scope.isDateInPast = function(dateStr) {
        return dateUtils.isPast(dateStr);
    };

    //initialization (param: showSpinner = false)
    initPageModel(false);

    $scope.isVisionEditable = false;

    $scope.newReflectionText = '';

    $scope.newGoalText = '';

    $scope.goalCharsLeft = globalConstants.GOAL_MAX_CHARS;

    $scope.newReflectionRemainingCharCount = globalConstants.REFLECTION_MAX_CHARS;

    $scope.newExperiment = initNewExperiment();

    $scope.enableAddReflection = false;

    $scope.enableUpdateVision = false;

    $scope.isReflectionHistoryVisible = false;

    $scope.isEffortProgressHistoryVisible = false;

    $scope.isRateEffortProgressVisible = false;

    $scope.isEditGoalStatusVisible = false;

    $scope.isRateExperimentVisible = false;

    $scope.isCreateExperimentVisible = false;

    $scope.VISION_MAX_CHARS = globalConstants.VISION_MAX_CHARS;

    $scope.REFLECTION_MAX_CHARS = globalConstants.REFLECTION_MAX_CHARS;

    $scope.EXPERIMENT_MAX_CHARS = globalConstants.EXPERIMENT_MAX_CHARS;

    $scope.GOAL_MAX_CHARS = globalConstants.GOAL_MAX_CHARS;

    $scope.focusAreaSelectOptions = {
        formatResult: formatSelectList,
        formatSelection: formatSelectList,
        escapeMarkup: function(option) { return option; }
    };

    $scope.focusAreaTooltips = globalConstants.FocusAreaTooltips;

}]);
