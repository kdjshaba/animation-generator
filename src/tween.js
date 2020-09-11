// convertTime functions
var TimeConvert = {
    once: function(time, duration) {
        if (time > duration || time < 0) {
            return null
        } else {
            return time;
        }
    },
    loop: function(time, duration) {
        if (time < 0) {
            return null;
        } else {
            return time % duration;
        }
    },
};

// subject operator
var SpriteControl = {
    applyToSprite: function(sprite, change) {
        var keys = Object.keys(change);
        for (var i = 0; i < keys.length; i++) {
            var target = keys[i];
            var targetChange = change[target];

            if (target === "x" || target === "y") {
                sprite[target] = targetChange;
            }
        }
    },
    fromSprite: function(sprite, keys) {
        var obj = {};

        for (let i = 0; i < keys.length; i++) {
            var key = keys[i];

            if (key === "x" || key === "y") {
                obj[key] = sprite[key];
            }
        }

        return obj;
    },
};

// transform functions
var Transform = {
    position: function(start, end, percentage) {
        var keys = Object.keys(end);
        var result = {};

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var startPosition = start[key];
            var diff = (end[key] - startPosition) * percentage;

            result[key] = startPosition + diff;
        }

        return result;
    },
};

// timingFunctions
var TimingFunction = {
    linear: function(timePercentage) {
        return timePercentage;
    },
};

// tween
function Tween(duration, subject, end, timingFunction, transform) {
    this.status = "pause";
    this.mode = "once";
    this.duration = duration || 0;
    this.subject = subject;
    this.start = {};
    this.end = end || {};
    this.timingFunction = timingFunction || TimingFunction.linear;
    this.transform = transform || Transform.position;
    this.convertTime = TimeConvert.once;
    this.fromSubject = SpriteControl.fromSprite;
    this.applyToSubject = SpriteControl.applyToSprite;
    this.beforeStart = function() {};
}

Tween.prototype.setMode = setMode;

Tween.prototype.updateStart = function(start) {
    this.start = start || this.fromSubject(this.subject, Object.keys(this.end));

    return this;
};

Tween.prototype.timeCgange = function(time) {
    return time / this.duration;
};

Tween.prototype.valueChange = function(timePercentage) {
    var valuePercentage = this.timingFunction(timePercentage);

    return valuePercentage;
};

Tween.prototype.play = function(time) {
    var time = this.convertTime(time, this.duration);

    if (time === null) return;

    if (this.status === "pause") {
        this.updateStart();
        this.beforeStart();
        this.status = "running";
    }

    var timePercentage = this.timeCgange(time);
    var valuePercentage = this.valueChange(timePercentage);
    var result = this.transform(this.start, this.end, valuePercentage);

    if (this.subject) {
        this.applyToSubject(this.subject, result);
    }

};

// tween factory
var TweenFactory = {
    moveStright: function(duration, sprite, end, timingName, transformName) {
        timingFunction = TimingFunction[timingName] || TimingFunction.linear;
        transform = Transform[transformName] || Transform.position;
        duration = duration * 60;

        var tween = new Tween(duration, sprite, end, timingFunction, transform);

        return tween;
    },
    delay: function(duration) {
        duration = duration * 60;

        return new Tween(duration);
    }
}

// TimeLine
function TimeLine(mode, order) {
    this.mode = mode || "once";
    this.order = order || "series";
    this.time = 0;
    this.children = [];
    this.duration = 0;
    this.convertTime = TimeConvert.once;
    this.runChilds = TimeLine.runBySeries;
    this.updateDuration = TimeLine.durationAmount;
    this.observer = {
        when: {}
    }

    this.init();
}

TimeLine.prototype.init = function() {
    this.setMode(this.mode);
    this.setOrder(this.order);
};

TimeLine.prototype.setOrder = function(order) {
    switch (order) {
        case "series":
            this.runChilds = TimeLine.runBySeries;
            this.updateDuration = TimeLine.durationAmount;
            break;

        case "parallel":
            this.runChilds = TimeLine.runByParallel;
            this.updateDuration = TimeLine.durationMax;
            break;

        default:
            throw new Error("this order not exist");
    }

    this.order = order;
};

TimeLine.prototype.setMode = setMode;

TimeLine.prototype.add = function(timeLine) {
    this.children.push(timeLine);
    this.updateDuration();

    return this;
};

TimeLine.prototype.play = function(time) {
    time = time || this.time;
    this.time = this.convertTime(time, this.duration);

    if (this.time === null) return;

    var todo = this.observer.when[this.time];

    todo && todo.call(this);
    this.runChilds(this.time, this.children);
    this.time += 1;
};

// create tween on timeline
TimeLine.prototype.to = function(duration, sprite, end, timingName, transformName) {
    var newTween = TweenFactory.moveStright(duration, sprite, end, timingName, transformName);

    this.add(newTween);

    return this;
}

TimeLine.prototype.delay = function(duration) {
    this.add(TweenFactory.delay(duration));

    return this;
}

// observer
TimeLine.prototype.when = function(time, callback) {
    if (time === 'end') {
        time = this.duration;
    } else if (time === 'start') {
        time = 0;
    } else {
        time = time * 60
    }

    this.observer.when[time] = callback

    return this;
}

// execute order
TimeLine.runBySeries = function(time, animations) {
    var remainingTime = time;

    for (var i = 0; i < animations.length; i++) {
        if (remainingTime < 0) return;

        var animation = animations[i];
        var duration = animation.duration;

        animation.play(remainingTime);
        remainingTime -= duration;
    }
};

TimeLine.runByParallel = function(time, animations) {
    for (var i = 0; i < animations.length; i++) {
        var animation = animations[i];

        animation.play(time);
    }
};

// update duration
TimeLine.durationAmount = function() {
    var amount = 0;

    for (var i = 0; i < this.children.length; i++) {
        amount += this.children[i].duration;
    }

    this.duration = amount;
};

TimeLine.durationMax = function() {
    var max = 0;

    for (var i = 0; i < this.children.length; i++) {
        var duration = this.children[i].duration;

        if (duration > max) {
            max = duration;
        }
    }

    this.duration = max;
};

// setmode
function setMode(mode) {
    switch (mode) {
        case "once":
            this.convertTime = TimeConvert.once;
            break;
        case "loop":
            this.convertTime = TimeConvert.loop;
            break;
        default:
            throw new Error("this mode not exist");
    }

    this.mode = mode;
}