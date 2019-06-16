/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var logger = require('winston');
const ProblemsContainer_1 = require("./ProblemsContainer");
class OutputParser {
    constructor(connection) {
        this._problems = [];
        this._connection = connection;
    }
    parse(message) {
        const regex = /\s(WARNING:|ERROR:)\s(.*)/g;
        let m;
        this.clearAllProblemsAndReport();
        while ((m = regex.exec(message)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            let tempProblemContainer = ProblemsContainer_1.ProblemsContainer.createProblemContainer(m[1], m[2]);
            tempProblemContainer.forEach((container) => {
                let element = this._problems.find((other) => {
                    if (other.url === container.url) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });
                if (element) {
                    element.problems = element.problems.concat(container.problems);
                }
                else {
                    this._problems.push(container);
                }
            });
        }
    }
    errorsFound() {
        let errorFound = false;
        var BreakException = {};
        try {
            this._problems.forEach((container) => {
                if (container.containsErrors() === true) {
                    errorFound = true;
                    throw BreakException;
                }
            });
        }
        catch (error) {
            if (error !== BreakException) {
                throw error;
            }
        }
        return errorFound;
    }
    reportProblems() {
        logger.debug(`reportProblems: ${this._problems.length}`);
        this._problems.forEach((container) => {
            logger.debug(`send Diagnostic ${container.toString()}`);
            this._connection.sendDiagnostics(container.getDignosticData());
        });
    }
    clearAllProblemsAndReport() {
        logger.debug(`clearAllProblems: ${this._problems.length}`);
        this._problems.forEach((container) => {
            logger.debug(`send Diagnostic ${container.toString()}`);
            this._connection.sendDiagnostics(container.getClearedDiagnosticData());
        });
        this._problems = [];
    }
}
exports.OutputParser = OutputParser;
//# sourceMappingURL=OutputParser.js.map