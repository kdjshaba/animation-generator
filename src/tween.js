// convertTime functions by mode
var TimeConvert = {
    once: function(time, duration) {
        if (time > duration || time < 0) {
            return null;
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
    infinite: function(time) {
        return time;
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
            } else if (target === 'rotate') {
                if (targetChange.center) {
                    sprite.pivot.set(targetChange.center.x, targetChange.center.y);
                }
                if (typeof targetChange.angle === "number") {
                    sprite.angle = targetChange.angle;
                }
            } else if (target === 'scale') {
                sprite.scale.x = typeof targetChange.x === "number" ? targetChange.x : sprite.scale.x
                sprite.scale.y = typeof targetChange.y === "number" ? targetChange.y : sprite.scale.y
            }
        }
    },
    fromSprite: function(sprite, keys) {
        var obj = {
            x: sprite.x,
            y: sprite.y,
            rotate: {
                angle: sprite.angle
            },
            scale: {
                x: sprite.scale.x,
                y: sprite.scale.y,
            }
        };

        return obj;
    },
};

// timingFunctions
var TimingFunction = {
    linear: function(timePercentage) {
        return timePercentage;
    },
    easeIn: function(t) {
        return t * t;
    },
    easeOut: function(t) {
        return t * (2 - t);
    },
    easeInOut: function(t) {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
};

var PropertyCanTransform = {
    // position
    x: 0,
    y: 0,
    // rotate
    rotate: {
        // negative to counterwise
        angle: 30,
        // if endAngle & angle all be set, endAngle is priority
        // 0 ~ 360
        endAngle: 120,
        // if endAngle not set, clockwise won't be used
        clockwise: true || false,
        // any can be apply to subject
        center: {}
    },
    scale: {
        x: 1,
        y: 1
    }
}

// transform
var Transforms = {
    position: function(start, end, percentage) {
        var positionKeys = ['x', 'y']
        var result = {};

        for (var i = 0; i < positionKeys.length; i++) {
            var key = positionKeys[i];
            var startPosition = start[key];
            var endPosition = end[key];

            if (!endPosition) continue;

            var diff = (endPosition - startPosition) * percentage;
            result[key] = startPosition + diff;
        }

        return result;
    },
    rotate: function(start, end, percentage) {
        var startAngle = start.rotate && start.rotate.angle;
        var endAngle = end.rotate && end.rotate.endAngle;
        var angle = end.rotate && end.rotate.angle;
        var result = {
            rotate: {}
        };
        var diff = 0;

        if (!endAngle && !angle) return result;

        if (endAngle) {
            var rotateAngle = end.rotate.clockwise ? endAngle - startAngle : -(startAngle + 360 - endAngle);
            diff = rotateAngle * percentage;
        } else {
            diff = angle * percentage;
        }

        result.rotate.angle = startAngle + diff;
        result.rotate.center = end.rotate.center;

        return result;
    },
    scale: function(start, end, percentage) {
        var startX = start.scale && +start.scale.x;
        var startY = start.scale && +start.scale.y;
        var endX = end.scale && +end.scale.x;
        var endY = end.scale && +end.scale.y;
        var result = {
            scale: {}
        };

        if (typeof endX === "number") {
            result.scale.x = startX + (endX - startX) * percentage
        }
        if (typeof endY === "number") {
            result.scale.y = startY + (endY - startY) * percentage
        }

        return result;
    }
}

// timeline run order
var RunOrder = {
    sequence: function(time, animations) {
        var remainingTime = time;

        for (var i = 0; i < animations.length; i++) {
            if (remainingTime < 0) return;

            var animation = animations[i];
            var duration = animation.duration;

            animation.play(remainingTime);
            remainingTime -= duration;
        }
    },
    parallel: function(time, animations) {
        for (var i = 0; i < animations.length; i++) {
            var animation = animations[i];

            animation.play(time);
        }
    }
}

// timeLine duration calculator by order
var DurationCalculator = {
    sequence: function() {
        var amount = 0;

        for (var i = 0; i < this.children.length; i++) {
            amount += this.children[i].duration;
        }

        this.duration = amount;
    },
    parallel: function() {
        var max = 0;

        for (var i = 0; i < this.children.length; i++) {
            var duration = this.children[i].duration;

            if (duration > max) {
                max = duration;
            }
        }

        this.duration = max;
    }
}

// tween factory
var TweenFactory = {
    moveStright: function(duration, sprite, end, config) {
        duration = duration * 60;

        var tween = new Tween(duration, sprite, end, config);

        return tween;
    },
    delay: function(duration) {
        duration = duration * 60;

        return new Tween(duration);
    },
};

// tween
function Tween(duration, subject, end, config) {
    config = config || {};

    this.status = "pause";
    this.duration = duration || 0;
    this.subject = subject;
    this.end = end || {};
    this.start = {};
    this.timingFunction = TimingFunction[config.timingFunction] || TimingFunction.linear;
    this.convertTime = TimeConvert.once;
    this.fromSubject = config.fromSubject || SpriteControl.fromSprite;
    this.applyToSubject = config.applyToSubject || SpriteControl.applyToSprite;
}

Tween.prototype.transform = function(start, end, percentage) {
    var transformKeys = Object.keys(Transforms);
    var result = {};

    for (let i = 0; i < transformKeys.length; i++) {
        var key = transformKeys[i];
        var transform = Transforms[key];
        var partialResult = transform(start, end, percentage);
        var partialKeys = Object.keys(partialResult);

        for (let j = 0; j < partialKeys.length; j++) {
            var key = partialKeys[j];

            result[key] = partialResult[key];
        }
    }

    return result;
}

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
    time = this.convertTime(time, this.duration);

    if (time === null) return;

    if (this.status === "pause") {
        this.updateStart();
        this.status = "running";
    }

    var timePercentage = this.timeCgange(time);
    var valuePercentage = this.valueChange(timePercentage);
    var result = this.transform(this.start, this.end, valuePercentage);

    if (this.subject) {
        this.applyToSubject(this.subject, result);
    }
};

// TimeLine
function TimeLine(config) {
    config = config || {}
    order = config.order || "sequence"
    mode = config.mode || "infinite"

    this.mode = mode;
    this.order = order;
    this.time = 0;
    this.children = [];
    this.duration = 0;
    this.convertTime = TimeConvert[mode];
    this.runChilds = RunOrder[order];
    this.updateDuration = DurationCalculator[order];
    this.observer = new Observer();
}

TimeLine.prototype.add = function(timeLine) {
    this.children.push(timeLine);
    this.updateDuration();

    return this;
};

TimeLine.prototype.play = function(time) {
    time = time || this.time;
    this.time = this.convertTime(time, this.duration);

    if (this.time === null) return;

    this.observer.timeUp(this.time, this.duration)

    this.runChilds(this.time, this.children);

    if (this.time === this.duration) {
        this.observer.timeUp('end', this.duration)
    }

    this.time += 1;
};

// create tween on timeline
TimeLine.prototype.to = function(
    duration,
    sprite,
    end,
    config
) {
    var newTween = TweenFactory.moveStright(
        duration,
        sprite,
        end,
        config
    );

    this.add(newTween);

    return this;
};

TimeLine.prototype.delay = function(duration) {
    this.add(TweenFactory.delay(duration));

    return this;
};

TimeLine.prototype.when = function(time, callback) {
    this.observer.when(time, callback);

    return this;
};

function Observer() {
    this.when = {};
}

Observer.prototype.timeUp = function(time, duration) {
    var key = time;

    typeof this.when[key] === 'function' && this.when[key]();
}

Observer.prototype.when = function(time, callback) {
    if (time === "start") {
        time = 0;
    } else {
        time = time * 60;
    }

    this.when[time] = callback;
}