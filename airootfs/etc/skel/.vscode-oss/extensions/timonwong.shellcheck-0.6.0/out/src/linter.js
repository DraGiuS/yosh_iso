"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const path = require("path");
const semver = require("semver");
const vscode = require("vscode");
const async_1 = require("./utils/async");
const filematcher_1 = require("./utils/filematcher");
const wsl = require("./utils/wslSupport");
const EXTENSION_NAME = 'shellcheck';
const BEST_TOOL_VERSION = '0.4.7';
var RunTrigger;
(function (RunTrigger) {
    RunTrigger[RunTrigger["onSave"] = 0] = "onSave";
    RunTrigger[RunTrigger["onType"] = 1] = "onType";
})(RunTrigger || (RunTrigger = {}));
(function (RunTrigger) {
    RunTrigger.strings = {
        onSave: 'onSave',
        onType: 'onType'
    };
    RunTrigger.from = function (value) {
        switch (value) {
            case RunTrigger.strings.onSave:
                return RunTrigger.onSave;
            case RunTrigger.strings.onType:
                return RunTrigger.onType;
        }
    };
})(RunTrigger || (RunTrigger = {}));
function fixPosition(textDocument, pos) {
    // Since json format treats tabs as **8** characters, we need to offset it.
    let charPos = pos.character;
    const s = textDocument.getText(new vscode.Range(pos.with({ character: 0 }), pos));
    for (const ch of s) {
        if (ch === '\t') {
            charPos -= 7;
        }
    }
    return pos.with({ character: charPos });
}
function levelToDiagnosticSeverity(level) {
    switch (level) {
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'style':
        /* falls through */
        case 'info':
            return vscode.DiagnosticSeverity.Information;
        case 'warning':
        /* falls through */
        default:
            return vscode.DiagnosticSeverity.Warning;
    }
}
function scCodeToDiagnosticTags(code) {
    // SC2034 - https://github.com/koalaman/shellcheck/wiki/SC2034
    if (code === 2034) {
        return [vscode.DiagnosticTag.Unnecessary];
    }
    return undefined;
}
function makeDiagnostic(textDocument, item) {
    let startPos = new vscode.Position(item.line - 1, item.column - 1);
    const endLine = item.endLine ? item.endLine - 1 : startPos.line;
    const endCharacter = item.endColumn ? item.endColumn - 1 : startPos.character;
    let endPos = new vscode.Position(endLine, endCharacter);
    if (startPos.isEqual(endPos)) {
        startPos = fixPosition(textDocument, startPos);
        endPos = startPos;
    }
    else {
        startPos = fixPosition(textDocument, startPos);
        endPos = fixPosition(textDocument, endPos);
    }
    const range = new vscode.Range(startPos, endPos);
    const severity = levelToDiagnosticSeverity(item.level);
    const message = `${item.message} [SC${item.code}]`;
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = EXTENSION_NAME;
    diagnostic.code = item.code;
    diagnostic.tags = scCodeToDiagnosticTags(item.code);
    return diagnostic;
}
class ShellCheckProvider {
    constructor(context) {
        this.context = context;
        this.settings = {
            enabled: true,
            trigger: null,
            executable: null,
            exclude: [],
            customArgs: [],
            ignorePatterns: null,
            useWorkspaceRootAsCwd: false,
            useWSL: false,
        };
        this.executableNotFound = false;
        this.fileMatcher = new filematcher_1.FileMatcher();
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidChangeConfiguration(this.loadConfiguration, this, context.subscriptions);
        this.loadConfiguration();
        const disableVersionCheckUpdateSetting = new DisableVersionCheckUpdateSetting();
        if (!disableVersionCheckUpdateSetting.isDisabled) {
            // Check tool version
            getToolVersion(this.settings.useWSL, this.settings.executable).then((toolVersion) => {
                if (!toolVersion) {
                    return;
                }
                if (semver.lt(toolVersion, BEST_TOOL_VERSION)) {
                    promptForUpdatingTool(toolVersion, disableVersionCheckUpdateSetting);
                }
            });
        }
        vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, context.subscriptions);
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            this.diagnosticCollection.delete(textDocument.uri);
            delete this.delayers[textDocument.uri.toString()];
        }, null, context.subscriptions);
        // Shellcheck all open shell documents
        vscode.workspace.textDocuments.forEach(this.triggerLint, this);
    }
    dispose() {
        this.disposeDocumentListener();
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
    }
    disposeDocumentListener() {
        if (this.documentListener) {
            this.documentListener.dispose();
        }
    }
    loadConfiguration() {
        const section = vscode.workspace.getConfiguration('shellcheck');
        const settings = {
            enabled: section.get('enable', true),
            trigger: RunTrigger.from(section.get('run', RunTrigger.strings.onType)),
            executable: section.get('executablePath', 'shellcheck'),
            exclude: section.get('exclude', []),
            customArgs: section.get('customArgs', []),
            ignorePatterns: section.get('ignorePatterns', {}),
            useWorkspaceRootAsCwd: section.get('useWorkspaceRootAsCwd', false),
            useWSL: section.get('useWSL', false),
        };
        this.settings = settings;
        this.fileMatcher.configure(settings.ignorePatterns);
        this.delayers = Object.create(null);
        this.disposeDocumentListener();
        this.diagnosticCollection.clear();
        if (settings.enabled) {
            if (settings.trigger === RunTrigger.onType) {
                this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
                    this.triggerLint(e.document);
                }, this, this.context.subscriptions);
            }
            else if (settings.trigger === RunTrigger.onSave) {
                this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this, this.context.subscriptions);
            }
        }
        // Configuration has changed. Re-evaluate all documents
        this.executableNotFound = false;
        vscode.workspace.textDocuments.forEach(this.triggerLint, this);
    }
    isAllowedTextDocument(textDocument) {
        if (textDocument.languageId !== ShellCheckProvider.LANGUAGE_ID) {
            return false;
        }
        const scheme = textDocument.uri.scheme;
        return (scheme === 'file' || scheme === 'untitled');
    }
    triggerLint(textDocument) {
        if (this.executableNotFound || !this.isAllowedTextDocument(textDocument)) {
            return;
        }
        if (!this.settings.enabled) {
            this.diagnosticCollection.delete(textDocument.uri);
            return;
        }
        if (this.fileMatcher.excludes(textDocument.fileName, vscode.workspace.rootPath)) {
            return;
        }
        const key = textDocument.uri.toString();
        let delayer = this.delayers[key];
        if (!delayer) {
            delayer = new async_1.ThrottledDelayer(this.settings.trigger === RunTrigger.onType ? 250 : 0);
            this.delayers[key] = delayer;
        }
        delayer.trigger(() => this.runLint(textDocument));
    }
    runLint(textDocument) {
        return new Promise((resolve, reject) => {
            const settings = this.settings;
            if (settings.useWSL && !wsl.subsystemForLinuxPresent()) {
                if (!this.executableNotFound) {
                    vscode.window.showErrorMessage('Got told to use WSL, but cannot find installation. Bailing out.');
                }
                this.executableNotFound = true;
                resolve();
                return;
            }
            const executable = settings.executable || 'shellcheck';
            const diagnostics = [];
            let processShellCheckItem = (item) => {
                if (item) {
                    diagnostics.push(makeDiagnostic(textDocument, item));
                }
            };
            let args = ['-f', 'json'];
            if (settings.exclude.length) {
                args = args.concat(['-e', settings.exclude.join(',')]);
            }
            if (settings.customArgs.length) {
                args = args.concat(settings.customArgs);
            }
            args.push('-'); // Use stdin for shellcheck
            let cwd = null;
            if (settings.useWorkspaceRootAsCwd) {
                cwd = vscode.workspace.rootPath;
            }
            else {
                cwd = textDocument.isUntitled ? vscode.workspace.rootPath : path.dirname(textDocument.fileName);
            }
            const options = cwd ? { cwd: cwd } : undefined;
            const childProcess = wsl.spawn(settings.useWSL, executable, args, options);
            childProcess.on('error', (error) => {
                if (!this.executableNotFound) {
                    this.showShellCheckError(error, executable);
                }
                this.executableNotFound = true;
                resolve();
                return;
            });
            if (childProcess.pid) {
                childProcess.stdout.setEncoding('utf-8');
                let script = textDocument.getText();
                if (settings.useWSL) {
                    script = script.replace(/\r\n/g, '\n'); // shellcheck doesn't likes CRLF, although this is caused by a git checkout on Windows.
                }
                childProcess.stdin.write(script);
                childProcess.stdin.end();
                const output = [];
                childProcess.stdout
                    .on('data', (data) => {
                    output.push(data.toString());
                })
                    .on('end', () => {
                    if (output.length) {
                        JSON.parse(output.join('')).forEach(processShellCheckItem);
                    }
                    this.diagnosticCollection.set(textDocument.uri, diagnostics);
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    showShellCheckError(error, executable) {
        let message = null;
        if (error.code === 'ENOENT') {
            message = `Cannot shellcheck the shell script. The shellcheck program was not found. Use the 'shellcheck.executablePath' setting to configure the location of 'shellcheck' or enable WSL integration with 'shellcheck.useWSL'`;
        }
        else {
            message = error.message ? error.message : `Failed to run shellcheck using path: ${executable}. Reason is unknown.`;
        }
        vscode.window.showInformationMessage(message);
    }
}
ShellCheckProvider.LANGUAGE_ID = 'shellscript';
exports.default = ShellCheckProvider;
function getToolVersion(useWSL, executable) {
    return new Promise((resolve, reject) => {
        const launchArgs = wsl.createLaunchArg(useWSL, false, undefined, executable, ['-V']);
        child_process.execFile(launchArgs.executable, launchArgs.args, { timeout: 2000 }, (err, stdout, stderr) => {
            const matches = /version: ((?:\d+)\.(?:\d+)(?:\.\d+)*)/.exec(stdout);
            if (matches) {
                const ver = semver.parse(matches[1]);
                resolve(ver);
            }
            else {
                resolve(null);
            }
        });
    });
}
function promptForUpdatingTool(currentVersion, disableVersionCheckUpdateSetting) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentVersionString;
        if (currentVersion instanceof semver.SemVer) {
            currentVersionString = currentVersion.format();
        }
        else {
            currentVersionString = currentVersion;
        }
        const selected = yield vscode.window.showInformationMessage(`The vscode-shellcheck extension is better with newer version of "shellcheck" (You got v${currentVersionString}, v${BEST_TOOL_VERSION} or better is recommended)`, 'Don\'t Show Again', 'Update');
        switch (selected) {
            case 'Don\'t Show Again':
                disableVersionCheckUpdateSetting.persist();
                break;
            case 'Update':
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/koalaman/shellcheck#installing'));
                break;
        }
    });
}
class DisableVersionCheckUpdateSetting {
    constructor() {
        this.config = vscode.workspace.getConfiguration('shellcheck');
        this.isDisabled = this.config.get(DisableVersionCheckUpdateSetting.KEY) || false;
    }
    persist() {
        this.config.update(DisableVersionCheckUpdateSetting.KEY, true, true);
    }
}
DisableVersionCheckUpdateSetting.KEY = 'disableVersionCheck';
//# sourceMappingURL=linter.js.map