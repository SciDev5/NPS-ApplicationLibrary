function deepFreeze(obj,frozenIn) {
    var frozen = frozenIn || [];
    Object.freeze(obj);
    for (var k in obj)
        if (typeof(obj[k])=="object" && !frozen.includes(obj[k]))
            deepFreeze(obj[k],frozen);
    return obj;
}

export {deepFreeze};