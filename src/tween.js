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
var SubjectAdapter = {
  sprite: {
    apply: function(sprite, change) {
      var keys = Object.keys(change);

      for (var i = 0; i < keys.length; i++) {
        var prop = keys[i];
        var propVal = change[prop];

        if (prop === "x" || prop === "y") {
          sprite[prop] = propVal;
        } else if (prop === "rotate"　&& isNumber(propVal.angle)) {
          // sprite.pivot.set(propVal.center.x, propVal.center.y);
          sprite.angle = propVal.angle;
        } else if (prop === "scale") {
          if (isNumber(propVal.x)) {
            sprite.scale.x = propVal.x;
          }
          if (isNumber(propVal.y)) {
            sprite.scale.y = propVal.y;
          }
        }
      }
    },
    from: function(sprite) {
      var obj = {
        x: sprite.x,
        y: sprite.y,
        rotate: {
          angle: sprite.angle,
          center: {
            x: sprite.pivot.x,
            y: sprite.pivot.y,
          },
        },
        scale: {
          x: sprite.scale.x,
          y: sprite.scale.y,
        },
      };

      return obj;
    }
  }
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
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
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
    center: {},
  },
  scale: {
    x: 1,
    y: 1,
  },
};

// transform
var Transforms = {
  position: function(start, end, percentage) {
    var positionKeys = ["x", "y"];
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
    var rotate = {};

    if (!end.rotate) return rotate;

    var startAngle = start.rotate.angle;
    var endAngle = end.rotate.endAngle;
    var angle = end.rotate.angle;
    var diff = 0;

    if (endAngle || endAngle === 0) {
      var rotateAngle = end.rotate.clockwise ?
        endAngle - startAngle :
        -(startAngle + 360 - endAngle);
      diff = rotateAngle * percentage;
    } else if (angle) {
      diff = angle * percentage;
    }

    rotate.angle = startAngle + diff;

    return { rotate };
  },
  scale: function(start, end, percentage) {
    var scale = {};

    if (!end.scale) return scale;

    var startX = start.scale.x;
    var startY = start.scale.y;
    var endX = end.scale.x;
    var endY = end.scale.y;

    if (isNumber(endX)) {
      scale.x = startX + (endX - startX) * percentage;
    }
    if (isNumber(endY)) {
      scale.y = startY + (endY - startY) * percentage;
    }

    return { scale };
  },
};

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
  },
};

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
  },
};

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

  var subjectType = config.subjectType || 'sprite';
  var subjectAdapter = SubjectAdapter[subjectType];
  this.fromSubject = subjectAdapter.from;
  this.applyToSubject = subjectAdapter.apply;
}

Tween.prototype.transformFunc = Transforms;

Tween.prototype.transform = function(start, end, percentage) {
  var transformKeys = Object.keys(this.transformFunc);
  var result = {};

  for (let i = 0; i < transformKeys.length; i++) {
    var key = transformKeys[i];
    var transform = this.transformFunc[key];
    var partialResult = transform(start, end, percentage);
    
    objectAssign(result, partialResult);
  }

  return result;
};

Tween.prototype.updateStart = function(start) {
  this.start = start || this.fromSubject(this.subject);

  return this;
};

Tween.prototype.getTimePercentage = function(time) {
  return time / this.duration;
};

Tween.prototype.getTransformPercentage = function(timePercentage) {
  var valuePercentage = this.timingFunction(timePercentage);

  return valuePercentage;
};

Tween.prototype.play = function(time) {
  time = this.convertTime(time, this.duration);

  if (time === null || !this.subject) return;

  if (this.status === "pause") {
    this.updateStart();
    this.status = "running";
  }

  var timePercentage = this.getTimePercentage(time);
  var transformPercentage = this.getTransformPercentage(timePercentage);
  var result = this.transform(this.start, this.end, transformPercentage);

  this.applyToSubject(this.subject, result);
};

// TimeLine
function TimeLine(config) {
  config = config || {};
  order = config.order || "sequence";
  mode = config.mode || "infinite";

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
  time += 1;
  this.time = this.convertTime(time, this.duration);

  if (this.time === null) return;

  this.runChilds(this.time, this.children);
  
  this.observer.timeUp(this.time, this.duration);
  if (this.time === this.duration) {
    this.observer.end();
  }
};

// create child timeline
TimeLine.prototype.create = function (config) {
  const newTl = new TimeLine(config);
  
  this.add(newTl);
  return newTl;
}

// create tween on timeline
TimeLine.prototype.to = function(duration, sprite, end, config) {
  var newTween = TweenFactory.moveStright(duration, sprite, end, config);

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
  this.observers = {};
}

Observer.prototype.timeUp = function(time) {
  typeof this.observers[time] === "function" && this.observers[time]();
};

Observer.prototype.end = function() {
  typeof this.observers['end'] === "function" && this.observers['end']();
};

Observer.prototype.when = function(time, callback) {
  time = isNaN(+time) ? time : time * 60;
  this.observers[time] = callback;
};