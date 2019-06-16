"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guess_types_1 = require("./guess_types");
function parseParameters(parameterTokens, body, functionName) {
    return {
        name: functionName,
        decorators: parseDecorators(parameterTokens),
        args: parseArguments(parameterTokens),
        kwargs: parseKeywordArguments(parameterTokens),
        returns: parseReturn(parameterTokens, body),
        exceptions: parseExceptions(body),
    };
}
exports.parseParameters = parseParameters;
function parseDecorators(parameters) {
    const decorators = [];
    const pattern = /^@(\w+)/;
    for (const param of parameters) {
        const match = param.trim().match(pattern);
        if (match == undefined) {
            continue;
        }
        decorators.push({
            name: match[1],
        });
    }
    return decorators;
}
function parseArguments(parameters) {
    const args = [];
    const excludedArgs = ["self", "cls"];
    const pattern = /^(\w+)/;
    for (const param of parameters) {
        const match = param.trim().match(pattern);
        if (match == undefined || param.includes("=") || inArray(param, excludedArgs)) {
            continue;
        }
        args.push({
            var: match[1],
            type: guess_types_1.guessType(param),
        });
    }
    return args;
}
function parseKeywordArguments(parameters) {
    const kwargs = [];
    const pattern = /^(\w+)(?:\s*:[^=]+)?\s*=\s*(.+)/;
    for (const param of parameters) {
        const match = param.trim().match(pattern);
        if (match == undefined) {
            continue;
        }
        kwargs.push({
            var: match[1],
            default: match[2],
            type: guess_types_1.guessType(param),
        });
    }
    return kwargs;
}
function parseReturn(parameters, body) {
    const returnType = parseReturnFromDefinition(parameters);
    if (returnType == undefined) {
        return parseReturnFromBody(body);
    }
    return returnType;
}
function parseReturnFromDefinition(parameters) {
    const pattern = /^->\s*([\w\[\], \.]*)/;
    for (const param of parameters) {
        const match = param.trim().match(pattern);
        if (match == undefined) {
            continue;
        }
        return { type: match[1] };
    }
    return undefined;
}
function parseReturnFromBody(body) {
    const pattern = /return /;
    for (const line of body) {
        const match = line.match(pattern);
        if (match == undefined) {
            continue;
        }
        return { type: undefined };
    }
    return undefined;
}
function parseExceptions(body) {
    const exceptions = [];
    const pattern = /raise\s+([\w.]+)/;
    for (const line of body) {
        const match = line.match(pattern);
        if (match == undefined) {
            continue;
        }
        exceptions.push({ type: match[1] });
    }
    return exceptions;
}
function inArray(item, array) {
    return array.some((x) => item === x);
}
exports.inArray = inArray;
//# sourceMappingURL=parse_parameters.js.map