/* --------------------------------------------------------------------------------------------
* Copyright (c) Eugen Wiens. All rights reserved.
* Licensed under the MIT License. See License.txt in the project root for license information.
* ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class ParsingError extends Error {
    constructor(errorMessage) {
        super(errorMessage);
    }
    static determineParsingError(error) {
        return true;
    }
}
exports.ParsingError = ParsingError;
//# sourceMappingURL=ParsingError.js.map