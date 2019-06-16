"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function guessType(parameter) {
    parameter = parameter.trim();
    if (hasTypeHint(parameter)) {
        return getTypeFromTyping(parameter);
    }
    if (isKwarg(parameter)) {
        return guessTypeFromDefaultValue(parameter);
    }
    return guessTypeFromName(parameter);
}
exports.guessType = guessType;
function getTypeFromTyping(parameter) {
    const pattern = /\w+\s*:\s*(\w[\w\[\], \.]*)/;
    const typeHint = pattern.exec(parameter);
    if (typeHint == undefined || typeHint.length !== 2) {
        return undefined;
    }
    return typeHint[1].trim();
}
function guessTypeFromDefaultValue(parameter) {
    const pattern = /\w+\s*(?::[\w\[\], \.]+)?=\s*(.+)/;
    const defaultValueMatch = pattern.exec(parameter);
    if (defaultValueMatch == undefined || defaultValueMatch.length !== 2) {
        return undefined;
    }
    const defaultValue = defaultValueMatch[1];
    if (isInteger(defaultValue)) {
        return "int";
    }
    if (isFloat(defaultValue)) {
        return "float";
    }
    if (isHexadecimal(defaultValue)) {
        return "hexadecimal";
    }
    if (isString(defaultValue)) {
        return "str";
    }
    if (isBool(defaultValue)) {
        return "bool";
    }
    if (isList(defaultValue)) {
        return "list";
    }
    if (isTuple(defaultValue)) {
        return "tuple";
    }
    if (isDict(defaultValue)) {
        return "dict";
    }
    if (isRegexp(defaultValue)) {
        return "regexp";
    }
    if (isUnicode(defaultValue)) {
        return "unicode";
    }
    if (isBytes(defaultValue)) {
        return "bytes";
    }
    if (isFunction(defaultValue)) {
        return "function";
    }
    return undefined;
}
function guessTypeFromName(parameter) {
    if (parameter.startsWith("is") || parameter.startsWith("has")) {
        return "bool";
    }
    if (inArray(parameter, ["cb", "callback", "done", "next", "fn"])) {
        return "function";
    }
    return undefined;
}
function hasTypeHint(parameter) {
    return (parameter.match(/^\w+\s*:/) != undefined);
}
function isKwarg(parameter) {
    return parameter.includes("=");
}
function isInteger(value) {
    return (value.match(/^[-+]?[0-9]+$/) != undefined);
}
function isFloat(value) {
    return (value.match(/^[-+]?[0-9]*\.[0-9]+$/) != undefined);
}
function isHexadecimal(value) {
    return (value.match(/^[-+]?0x[0-9abcdef]+/) != undefined);
}
function isString(value) {
    return (value.match(/^\".*\"$|^\'.*\'$/) != undefined);
}
function isBool(value) {
    return (value.match(/^True$|^False$/) != undefined);
}
function isList(value) {
    return (value.match(/^\[.*\]$/) != undefined);
}
function isTuple(value) {
    return (value.match(/^\(.*\)$/) != undefined);
}
function isDict(value) {
    return (value.match(/^\{.*\}$/) != undefined);
}
function isRegexp(value) {
    return (value.match(/^[rR]/) != undefined && isString(value.substr(1)));
}
function isUnicode(value) {
    return (value.match(/^[uU]/) != undefined && isString(value.substr(1)));
}
function isBytes(value) {
    return (value.match(/^[bB]/) != undefined && isString(value.substr(1)));
}
function isFunction(value) {
    return (value.match(/^lambda /) != undefined);
}
function inArray(item, array) {
    return array.some((x) => item === x);
}
exports.inArray = inArray;
//# sourceMappingURL=guess_types.js.map