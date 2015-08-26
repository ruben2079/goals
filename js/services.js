twoWayGoalsApp.factory('visionSvc', ['$http', '$q', '_', 'visionModelFactory', 'globalConstants', function ($http, $q, _, visionModelFactory, globals) {
        var getLookupValues = function(configOptions) {
                if (configOptions) return $http.get('/api/vision/lookups', configOptions);
                return $http.get('/api/vision/lookups');
            },
            getVision = function(configOptions) {
                if (configOptions) return $http.get('/api/vision', configOptions);
                return $http.get('/api/vision');
            },
            updateExperiment = function(visionId, goalId, experiment) {
                return $http.put('/api/vision/' + visionId + '/goals/' + goalId + '/experiments', experiment);
            },
            createVisionModel = function(vision, metadata) {
                return visionModelFactory.create(vision, metadata);
            },
            createVision = function(vision) {
                var promise = $http.post('/api/vision', { visionText: vision.VisionText });
                promise.then(function(resp) {
                    var newVision = resp.data.Vision;
                    vision.isNew = false;
                    vision.VisionId = newVision.VisionId;
                    vision.CreatedUTC = newVision.Created;
                    vision.ModifiedUTC = newVision.Modified;
                    vision.MemberCreatedBy = newVision.MemberCreatedBy;
                    vision.LastModifiedBy = newVision.LastModifiedBy;
                    vision.Goals = [];
                    vision.Reflections = [];
                    vision.ProgressEffort = [];
                    visionModelFactory.updateAuditInfoForVision(vision);
                });

                return promise;
            },
            addGoalInternal = function(vision, goalText) {
                var promise = $http.post('/api/vision/' + vision.VisionId + '/goals', { goalText: goalText });
                promise.then(function(resp) {
                    var createdGoal = resp.data;
                    visionModelFactory.addAuditInfoForGoal(createdGoal);
                    vision.Goals.push(createdGoal);
                });

                return promise;
            },
            addReflectionInternal = function(vision, reflectionText) {
                var promise = $http.post('/api/vision/' + vision.VisionId + '/reflections', { reflectionText: reflectionText });
                promise.then(function(resp) {
                    var reflection = resp.data;
                    visionModelFactory.addAuditInfoForReflection(reflection);
                    vision.Reflections.push(reflection);
                });

                return promise;
            },
            addVisionEffortProgressInternal = function(vision, effortProgress) {
                var promise = $http.post('/api/vision/' + vision.VisionId + '/effortprogress', effortProgress);
                promise.then(function(resp) {
                    var newEffortProgress = resp.data;
                    visionModelFactory.addAuditInfoForEffortProgress(newEffortProgress);
                    vision.ProgressEffort.push(newEffortProgress);
                });

                return promise;
            },
            updateGoalInternal = function(visionId, theGoal) {
                var promise = $http.put('/api/vision/' + visionId + '/goals', { goalId: theGoal.GoalID, goalStatusId: theGoal.GoalStatusId });
                promise.then(function(resp) {
                    var updatedGoal = resp.data;
                    theGoal.ModifiedUTC = updatedGoal.ModifiedUTC;
                    theGoal.MemberModifiedBy = updatedGoal.MemberModifiedBy;
                    visionModelFactory.addAuditInfoForGoal(theGoal);
                });

                return promise;
            },
            createNewVision = function (visionText) {
                return { VisionId: -1, VisionText: visionText, isNew: true };
            };

    return {
        fetch: function (showSpinner) {
            var deferred = $q.defer(),
                configOptions = { noSpinner: !(showSpinner) },
                visionPrms = getVision(configOptions),
                lookupsPrms = getLookupValues(configOptions);

            $q.all([visionPrms, lookupsPrms]).then(function (responses) {
                deferred.resolve(createVisionModel(responses[0].data, responses[1].data));
            })
            .catch(function (err) {
                if (err.config.url !== '/api/vision' || err.status != 404) deferred.reject(err);

                lookupsPrms.then(function(resp) {
                    var vision = createNewVision(globals.DEFAULT_VISION_TEXT),
                        lookups = resp.data;
                    deferred.resolve(createVisionModel(vision, lookups));
                }).catch(function(err2) {
                    deferred.reject(err2);
                });
            });

            return deferred.promise;
        },
        getVisionHistory: function (vision) {
            var deferred = $q.defer();
            $http.get('/api/vision/' + vision.VisionId + '/history').then(function(res) {
                var visionHistory = [];

                var currentVision = {
                    VisionHistoryId: vision.VisionId,
                    VisionText: vision.VisionText,
                    Modified: vision.ModifiedUTC,
                    ModifiedBy: vision.CoachModifiedBy !== vision.LastModifiedBy ? vision.MemberModifiedBy : vision.CoachModifiedBy
                };

                visionHistory.push(currentVision);

                visionHistory = visionHistory.concat(res.data);

                _.each(visionHistory, function (vs) {
                    visionModelFactory.addAuditInfoForVisionHistory(vs);
                });

                deferred.resolve(visionHistory);
            });

            return deferred.promise;
        },
        createVision: createVision,
        updateVision: function(vision) {
            var promise = $http.put('/api/vision', { visionId: vision.VisionId, visionText: vision.VisionText });
            promise.then(function (resp) {
                var visionResp = resp.data.Vision;
                vision.ModifiedUTC = visionResp.Modified;
                vision.MemberModifiedBy = visionResp.MemberModifiedBy;
                vision.LastModifiedBy = visionResp.LastModifiedBy;
                visionModelFactory.updateAuditInfoForVision(vision);
            });

            return promise;
        },
        addGoal: function (vision, goalText) {
            if (vision.isNew) {
                return createVision(vision).then(function() {
                    return addGoalInternal(vision, goalText);
                });
            } else {
                return addGoalInternal(vision, goalText);
            }
        },
        markGoalInactive: function (visionId, theGoal) {
            var originalStatus = theGoal.GoalStatusId;

            theGoal.GoalStatusId = 2;

            return updateGoalInternal(visionId, theGoal)
                .then(null, function () {
                    //rollback if error
                    theGoal.GoalStatusId = originalStatus;
                    return $q.reject('error during api call');
                });
        },
        markGoalAchieved: function(visionId, theGoal) {
            var originalStatus = theGoal.GoalStatusId;

            theGoal.GoalStatusId = 3;

            return updateGoalInternal(visionId, theGoal)
                .then(null, function() {
                    //rollback if error
                    theGoal.GoalStatusId = originalStatus;
                    return $q.reject('error during api call');
                });
        },
        addReflection: function (vision, reflectionText) {
            if (vision.isNew) {
                return createVision(vision).then(function() {
                    return addReflectionInternal(vision, reflectionText);
                });
            } else {
                return addReflectionInternal(vision, reflectionText);
            }
        },
        addVisionEffortProgress: function (vision, effortProgress) {
            if (vision.isNew) {
                return createVision(vision).then(function() {
                    return addVisionEffortProgressInternal(vision, effortProgress);
                });
            } else {
                return addVisionEffortProgressInternal(vision, effortProgress);
            }
        },
        addExperiment: function(visionId, goal, experiment) {
            var promise = $http.post('/api/vision/' + visionId + '/goals/' + goal.GoalID + '/experiments', experiment);
            promise.then(function(resp) {
                var newExperiment = resp.data;
                visionModelFactory.addAuditInfoForExperiment(newExperiment);
                if (!goal.Experiments) goal.Experiments = [];
                goal.Experiments.push(newExperiment);
            });

            return promise;
        },
        rankExperimentAchieved: function (visionId, goalId, experiment) {
            var currentAchievedStatus = experiment.AchievedStatusID;
            experiment.AchievedStatusID = 1;
            return updateExperiment(visionId, goalId, experiment)
                .then(null, function(err) {
                    //rollback in case of error
                    experiment.AchievedStatusID = currentAchievedStatus;
                    return $q.reject('api call failed');
                });
        },
        rankExperimentNotAchieved: function(visionId, goalId, experiment) {
            var currentAchievedStatus = experiment.AchievedStatusID;
            experiment.AchievedStatusID = 2;
            return updateExperiment(visionId, goalId, experiment)
                .then(null, function (err) {
                    //rollback in case of error
                    experiment.AchievedStatusID = currentAchievedStatus;
                    return $q.reject('api call failed');
                });
        },
        getLastReflection: function (vision) {
            if (!vision) return {};

            return _.max(vision.reflections, function (reflection) {
                return reflection.reflectionId;
            });
        },
        getActiveExperimentsFor: function (goal) {
            if (!goal) return [];

            return _.filter(goal.Experiments, function (experiment) {
                return experiment.AchievedStatusID === -1;
            });
        }
    };
}
]);

twoWayGoalsApp.factory('visionModelFactory', ['globalConstants', 'dateUtils', function (globalConstants, dateUtils) {
    var getVisionLastModifiedBy = function (vision) {
            if (!vision.LastModifiedBy) return 'unknown';
        //if (globalConstants.guidRegex.test(vision.LastModifiedBy)) return 'me';
            if (vision.LastModifiedBy !== vision.CoachModifiedBy) return 'me';
            return vision.LastModifiedBy;
        },
        formatUtcDate = function(date) {
            //todo once we have date format
            return dateUtils.toCstDateString(date);
        },
        isNewlyCreated = function(obj) {
            if (obj.CreatedUTC != obj.ModifiedUTC) return false;
            return true;
        },
        getVisionLastModifiedDate = function(vision) {
            if (isNewlyCreated(vision)) return vision.CreatedUTC;
            return vision.ModifiedUTC;
        },
        addAuditInfoMutable = function(auditableObj) {
            var isNew = isNewlyCreated(auditableObj),
               auditInfo = {};

            auditInfo.verb = isNew ? 'Created' : 'Modified';

            if (isNew) {
                auditInfo.person = auditableObj.CoachCreatedBy ? auditableObj.CoachCreatedBy : 'me';
                auditInfo.formattedDate = formatUtcDate(auditableObj.CreatedUTC);
            } else {
                auditInfo.person = auditableObj.CoachModifiedBy ? auditableObj.CoachModifiedBy : 'me';
                auditInfo.formattedDate = formatUtcDate(auditableObj.ModifiedUTC);
            }

            auditableObj.auditInfo = auditInfo;
        },
        addAuditInfoImmutable = function (auditableObj, verb) {
            auditableObj.auditInfo = {};
            auditableObj.auditInfo.verb = verb ? verb : 'Created';
            auditableObj.auditInfo.person = auditableObj.CoachCreatedBy ? auditableObj.CoachCreatedBy : 'me';
            auditableObj.auditInfo.formattedDate = formatUtcDate(auditableObj.CreatedUTC);
        },
        addAuditInfoToGoal = function(goal) {
            addAuditInfoMutable(goal);

            angular.forEach(goal.Experiments, function(experiment) {
                addAuditInfoImmutable(experiment);
            });
        },
        addAuditInfoForVisionHistory = function (historyRec) {
            historyRec.auditInfo = {};
            historyRec.auditInfo.verb = "Updated";
            historyRec.auditInfo.person = globalConstants.guidRegex.test(historyRec.ModifiedBy) ? 'me' : historyRec.ModifiedBy;
            historyRec.auditInfo.formattedDate = formatUtcDate(historyRec.Modified);

            return historyRec;
        },
        updateAuditInfoForVision = function(visionModel) {
            visionModel.auditInfo = {
                verb: isNewlyCreated(visionModel) ? 'Created' : 'Updated',
                person: getVisionLastModifiedBy(visionModel),
                formattedDate: formatUtcDate(getVisionLastModifiedDate(visionModel))
            };
        },
        create = function(vision, metadata) {
            var visionModel = new VisionModel(vision, metadata);

            updateAuditInfoForVision(visionModel);

            angular.forEach(visionModel.Goals, function(goal) {
                addAuditInfoToGoal(goal);
            });

            angular.forEach(visionModel.Reflections, function(reflection) {
                addAuditInfoImmutable(reflection, 'Added');
            });

            angular.forEach(visionModel.ProgressEffort, function(effort) {
                addAuditInfoImmutable(effort);
            });

            return visionModel;
        };

    return {
        create: create,
        updateAuditInfoForVision: updateAuditInfoForVision,
        addAuditInfoForReflection: function(reflection) {
            addAuditInfoImmutable(reflection, 'Added');
        },
        addAuditInfoForVisionHistory: addAuditInfoForVisionHistory,
        addAuditInfoForEffortProgress: addAuditInfoImmutable,
        addAuditInfoForGoal: addAuditInfoMutable,
        addAuditInfoForExperiment: addAuditInfoImmutable
    };
}]);

twoWayGoalsApp.factory('dateUtils', [
    'moment', function (moment) {
        var utcOffsetString = ' +00:00',
            cstOffsetString = ' -06:00',
            dateFormatString = 'M/D/YY',
            dateRegex = /(0?[1-9]|1[0-2])\/(0?[1-9]|[1-2][0-9]|3[0-1])\/(\d{2}|\d{4})/,
            parseDateWithTimeZone = function(date) {
                return moment.utc(date);
            },
            parseDate = function(date) {
                return moment(date);
            };
        return {
            toCstDateString: function (date, dateFormat) {
                var parsedDate = parseDateWithTimeZone(date);

                if (!parsedDate.isValid()) return 'some unknown date';

                if(dateFormat) return parsedDate.format(dateFormat);

                return parsedDate.format(dateFormatString);
            },
            todayCstString: function() {
                return moment().utc().zone(cstOffsetString).format('M/D/YYYY');
            },
            futureDateCstString: function(daysToAdd) {
                return moment().utc().zone(cstOffsetString).add('days', daysToAdd).format('M/D/YYYY');
            },
            isValidDate: function (dateStr, format) {
                var date = format ? parseDate(dateStr, format) : parseDate(dateStr);
                return date.isValid();
            },
            isFuture: function (dateStr) {
                var parsedDate = moment(dateStr);
                return parsedDate.diff(moment(), 'days') >= 0;
            },
            isPast: function (dateStr) {
                var parsedDate = moment(dateStr);
                return parsedDate.diff(moment(), 'days') < 0;
            },
            isAfter: function(firstDate, secondDate) {
                return moment(firstDate).isAfter(secondDate);
            },
            isSame: function(firstDate, secondDate) {
                return moment(firstDate).isSame(secondDate);
            },
            dateRegex: dateRegex
        };
    }
]);

twoWayGoalsApp.factory('spinner', [
    '$rootScope', function($rootScope) {
        var config = {};

        config.spin = function() {
            $rootScope.$broadcast('mhl-spinner:spin');
        };

        config.stop = function() {
            $rootScope.$broadcast('mhl-spinner:stop');
        };

        return config;
    }
]);


