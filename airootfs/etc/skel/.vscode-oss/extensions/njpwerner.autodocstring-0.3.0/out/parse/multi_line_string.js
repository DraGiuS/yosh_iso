"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("./utilities");
function isMultiLineString(document, linePosition, charPosition, quoteStyle) {
    const lines = document.split("\n");
    const linePrecedingPosition = lines[linePosition].slice(0, charPosition - 3);
    linePrecedingPosition.replace(quoteStyle, "");
    if (utilities_1.blankLine(linePrecedingPosition)) {
        return false;
    }
    return true;
}
exports.isMultiLineString = isMultiLineString;
//# sourceMappingURL=multi_line_string.js.map