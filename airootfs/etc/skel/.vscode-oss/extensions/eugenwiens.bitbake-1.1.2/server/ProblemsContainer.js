/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
class ProblemsContainer {
    constructor() {
        this._url = 'file://';
        this._problems = [];
    }
    get url() {
        return this._url;
    }
    get problems() {
        return this._problems;
    }
    set problems(problems) {
        this._problems = problems;
    }
    appendDiagnostic(diagnostic) {
        this._problems.push(diagnostic);
    }
    containsErrors() {
        let errorFound = false;
        var BreakException = {};
        try {
            this._problems.forEach((value) => {
                if (value.severity === vscode_languageserver_1.DiagnosticSeverity.Error) {
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
    getDignosticData() {
        return {
            uri: this._url,
            diagnostics: this._problems
        };
    }
    getClearedDiagnosticData() {
        return {
            uri: this._url,
            diagnostics: []
        };
    }
    toString() {
        let objectAsString = `{uri:${this._url} problems:[`;
        this._problems.forEach((problem) => {
            objectAsString += `${problem.message},`;
        });
        objectAsString += '}';
        return objectAsString;
    }
    static createProblemContainer(type, message) {
        const regex = /(ParseError)(?:\s|\w)*\s(\/.*\..*):(\d):\s(.*)/g;
        let m;
        let problemContainer = [];
        while ((m = regex.exec(message)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            let problem = new ProblemsContainer();
            problem._url = encodeURI('file://' + m[2]);
            problem.appendDiagnostic(this.createProblemElement(type, m[4], Number.parseInt(m[3]), m[1]));
            problemContainer.push(problem);
        }
        if (problemContainer.length === 0) {
            let problem = new ProblemsContainer();
            problem.appendDiagnostic(this.createProblemElement(type, message));
            problemContainer.push(problem);
        }
        return problemContainer;
    }
    static createProblemElement(type, message, lineNumber = 1, problemCode = 'general') {
        let problemSeverity;
        if (type === 'ERROR:') {
            problemSeverity = vscode_languageserver_1.DiagnosticSeverity.Error;
        }
        else if (type === 'WARNING:') {
            problemSeverity = vscode_languageserver_1.DiagnosticSeverity.Warning;
        }
        let problem = {
            range: {
                start: {
                    line: lineNumber,
                    character: lineNumber
                },
                end: {
                    line: lineNumber,
                    character: lineNumber
                }
            },
            severity: problemSeverity,
            message: message,
            code: problemCode
        };
        return problem;
    }
}
exports.ProblemsContainer = ProblemsContainer;
//# sourceMappingURL=ProblemsContainer.js.map