class Animate {
    sprite;
    lastPercentage;

    startState = {
        x,
        y,
        color
    };
    
    endState;

    constructor(sprite, startState, endState, timeingFunc) {
        this.startState = startState
        this.endState = endState
        this.timeingFunc = timeingFunc
    }

    timingFunction(timePercentage) {
        return changePercentage
    }

    getChange(timePercentage) {
        const currentPercentage = this.timingFunction(timePercentage)
        const changePercentage = currentPercentage - this.lastPercentage

        this.lastPercentage = currentPercentage

        return {
            x: this.startState.x && (this.startState.x - this.endState.x) * changePercentage,
            y: this.startState.y && (this.startState.y - this.endState.y) * changePercentage
        }
    }

    run(timePercentage) {
        this.doing(this.sprite, this.getChange(timePercentage))
    }

    doing(sprite, change) {}
}

interface Controller {
    mode;
    currentTime;
    
    convertTimeRange(time) { }

    play(time) { }
}

class Node implements Controller {
    mode;
    during;
    currentTime;
    
    animate = new Animate()

    constructor(mode, animate, during, currentTime) {
        this.sprite = sprite
        this.mode = mode
        this.animate = animate
        this.during = during
        this.currentTime = currentTime
    }

    convertTimeRange(time) {
        return time <= this.during ? time : null;
    }

    play(time) {
        const timePercentage = currentTime / this.during
        this.currentTime = convertTimeRange(time)
        
        if (currentTime === null) return
        
        this.animate.run(timePercentage)
    }
}

class TimeLine implements Controller {
    mode;
    currentTime;
    
    children = [ new TimeLine() || new Node() ]
    
    convertTimeRange(time) {
        return localTime
    }

    play(time) {
        this.currentTime = convertTimeRange(time)
        if (this.currentTime === null) return
        this.children.forEach(node => node.play(localTime))
    }
}