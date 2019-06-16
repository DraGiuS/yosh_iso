/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: vscode_languageclient_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for bitbake documents
        // TODO: check new documentSelector
        documentSelector: [{ scheme: 'file', language: 'bitbake' }],
        synchronize: {
            configurationSection: 'bitbake',
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/*.bbclass', false, true, false),
                vscode_1.workspace.createFileSystemWatcher('**/*.inc', false, true, false),
                vscode_1.workspace.createFileSystemWatcher('**/*.bb', false, true, false),
                vscode_1.workspace.createFileSystemWatcher('**/*.conf', false, true, false)
            ]
        }
    };
    // Create the language client and start the client.
    client = new vscode_languageclient_1.LanguageClient('bitbake', 'Language Server Bitbake', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map