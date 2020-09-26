function objectAssign(newObj, target) {
    var keys = Object.keys(target);

    for (let i = 0; i < keys.length; i++) {
        var key = keys[i];
        newObj[key] = target[key];
    }

    return newObj;
}