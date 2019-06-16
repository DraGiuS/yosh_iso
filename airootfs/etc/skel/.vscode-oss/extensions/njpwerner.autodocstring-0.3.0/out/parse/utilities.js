"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function indentationOf(line) {
    const whiteSpaceMatches = line.match(/^\s+/);
    if (whiteSpaceMatches == undefined) {
        return 0;
    }
    return whiteSpaceMatches[0].length;
}
exports.indentationOf = indentationOf;
function blankLine(line) {
    return (line.match(/[^\s]/) == undefined);
}
exports.blankLine = blankLine;
//# sourceMappingURL=utilities.js.map