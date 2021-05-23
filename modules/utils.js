function deepFreeze(obj,frozenIn) {
    var frozen = frozenIn || [];
    Object.freeze(obj);
    for (var k in obj)
        if (typeof(obj[k])=="object" && !frozen.includes(obj[k]))
            deepFreeze(obj[k],frozen);
    return obj;
}

function isStringInArray(array,str) {
    return str && typeof(str)==="string"&&array.includes(str);
}
function isStringArrayInArray(array,arrayToCheck) {
    return arrayToCheck && (arrayToCheck instanceof Array) && arrayToCheck.every(v=>isStringInArray(array,v));
}

export {deepFreeze,isStringInArray,isStringArrayInArray};