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
const vscode = require("vscode");
const child_process = require("child_process");
const semver = require("semver");
const wsl = require("./utils/wslSupport");
function getToolVersion(useWSL, executable) {
    return new Promise((resolve, reject) => {
        const launchArgs = wsl.createLaunchArg(useWSL, false, undefined, executable, ['-V']);
        child_process.execFile(launchArgs.executable, launchArgs.args, (err, stdout, stderr) => {
            const matches = /version: ((?:\d+).(?:\d+)+)/.exec(stdout);
            if (matches) {
                resolve(semver.parse(matches[1]));
            }
            else {
                resolve(null);
            }
        });
    });
}
exports.getToolVersion = getToolVersion;
function promptForUpdatingTool() {
    return __awaiter(this, void 0, void 0, function* () {
        const selected = yield vscode.window.showInformationMessage(`The vscode-shellcheck extension is better with the latest version of "shellcheck"`, 'Update');
        if (selected === 'Update') {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/koalaman/shellcheck#installing'));
        }
    });
}
exports.promptForUpdatingTool = promptForUpdatingTool;
//# sourceMappingURL=utils.js.map