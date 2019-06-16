/* --------------------------------------------------------------------------------------------
* Copyright (c) Eugen Wiens. All rights reserved.
* Licensed under the MIT License. See License.txt in the project root for license information.
* ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var ParsingSubjectType;
(function (ParsingSubjectType) {
    ParsingSubjectType[ParsingSubjectType["warning"] = 0] = "warning";
    ParsingSubjectType[ParsingSubjectType["error"] = 1] = "error";
})(ParsingSubjectType = exports.ParsingSubjectType || (exports.ParsingSubjectType = {}));
class ParsingOutputHandler {
    constructor() {
    }
    scanOutput(message) {
        return true;
    }
    _parsMessage(message) {
    }
}
exports.ParsingOutputHandler = ParsingOutputHandler;
//# sourceMappingURL=ParsingOutputHandler.js.map