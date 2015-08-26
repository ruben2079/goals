var VisionModel = function (vision, metadata) {
    _.extend(this, vision);
    
    this.metadata = metadata;
};

VisionModel.prototype.getLastReflection = function() {
    return _.max(this.Reflections, function(reflection) {
        return reflection.ReflectionID;
    });
};

VisionModel.prototype.getActiveGoals = function() {
    return _.filter(this.Goals, function(goal) {
        return goal.GoalStatusId === 1;
    });
};

