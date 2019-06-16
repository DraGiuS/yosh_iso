/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const BitBakeProjectScanner_1 = require("./BitBakeProjectScanner");
const ContextHandler_1 = require("./ContextHandler");
const SymbolScanner_1 = require("./SymbolScanner");
var logger = require('winston');
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let documents = new vscode_languageserver_1.TextDocuments();
let documentMap = new Map();
let bitBakeProjectScanner = new BitBakeProjectScanner_1.BitBakeProjectScanner(connection);
let contextHandler = new ContextHandler_1.ContextHandler(bitBakeProjectScanner);
let workspaceRoot;
let symbolScanner = null;
documents.listen(connection);
connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    bitBakeProjectScanner.setProjectPath(workspaceRoot);
    setTimeout(() => {
        bitBakeProjectScanner.rescanProject();
    }, 500);
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true
            },
            definitionProvider: true,
            executeCommandProvider: {
                commands: [
                    'bitbake.rescan-project'
                ]
            }
        }
    };
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    //TODO: add symbol parsing here
    logger.debug(`onDidChangeContent: ${JSON.stringify(change)}`);
});
function setSymbolScanner(newSymbolScanner) {
    logger.debug('set new symbol scanner');
    symbolScanner = newSymbolScanner;
    contextHandler.symbolScanner = symbolScanner;
}
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    bitBakeProjectScanner.deepExamine = settings.bitbake.deepExamine;
    logger.level = settings.bitbake.loggingLevel;
    bitBakeProjectScanner.workingPath = settings.bitbake.workingFolder;
    bitBakeProjectScanner.generateWorkingPath = settings.bitbake.generateWorkingFolder;
    bitBakeProjectScanner.scriptInterpreter = settings.bitbake.pathToBashScriptInterpreter;
    bitBakeProjectScanner.machineName = settings.bitbake.machine;
});
connection.onDidChangeWatchedFiles((change) => {
    logger.debug(`onDidChangeWatchedFiles: ${JSON.stringify(change)}`);
    bitBakeProjectScanner.rescanProject();
});
connection.onCompletion((textDocumentPosition) => {
    logger.debug('onCompletion');
    let documentAsStringArray = documentMap.get(textDocumentPosition.textDocument.uri);
    return contextHandler.getComletionItems(textDocumentPosition, documentAsStringArray);
});
connection.onCompletionResolve((item) => {
    logger.debug(`onCompletionResolve ${JSON.stringify(item)}`);
    item.insertText = contextHandler.getInsertStringForTheElement(item);
    return item;
});
connection.onDidOpenTextDocument((params) => {
    if (params.textDocument.text.length > 0) {
        documentMap.set(params.textDocument.uri, params.textDocument.text.split(/\r?\n/g));
    }
    setSymbolScanner(new SymbolScanner_1.SymbolScanner(params.textDocument.uri, contextHandler.definitionProvider));
});
connection.onDidChangeTextDocument((params) => {
    if (params.contentChanges.length > 0) {
        documentMap.set(params.textDocument.uri, params.contentChanges[0].text.split(/\r?\n/g));
    }
    setSymbolScanner(new SymbolScanner_1.SymbolScanner(params.textDocument.uri, contextHandler.definitionProvider));
});
connection.onDidCloseTextDocument((params) => {
    documentMap.delete(params.textDocument.uri);
    setSymbolScanner(null);
});
connection.onDidSaveTextDocument((params) => {
    logger.debug(`onDidSaveTextDocument ${JSON.stringify(params)}`);
    bitBakeProjectScanner.parseAllRecipes();
});
connection.onExecuteCommand((params) => {
    logger.info(`executeCommand ${JSON.stringify(params)}`);
    if (params.command === 'bitbake.rescan-project') {
        bitBakeProjectScanner.rescanProject();
    }
});
connection.onDefinition((textDocumentPositionParams) => {
    logger.debug(`onDefinition ${JSON.stringify(textDocumentPositionParams)}`);
    let documentAsText = documentMap.get(textDocumentPositionParams.textDocument.uri);
    let definition = contextHandler.getDefinition(textDocumentPositionParams, documentAsText);
    ;
    return definition;
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map