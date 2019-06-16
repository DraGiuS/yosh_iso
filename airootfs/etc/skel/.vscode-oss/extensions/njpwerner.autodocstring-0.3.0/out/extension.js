"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vs = require("vscode");
const autodocstring_1 = require("./autodocstring");
function activate(context) {
    context.subscriptions.push(vs.commands.registerCommand("extension.generateDocstring", () => {
        activateFromCommand();
    }));
    const config = vs.workspace.getConfiguration("autoDocstring");
    if (config.get("generateDocstringOnEnter")) {
        context.subscriptions.push(vs.workspace.onDidChangeTextDocument((changeEvent) => { activateFromEnter(changeEvent); }));
    }
}
exports.activate = activate;
function activateFromCommand() {
    const editor = vs.window.activeTextEditor;
    const autoDocstring = new autodocstring_1.AutoDocstring(editor);
    autoDocstring.generateDocstring();
}
function activateFromEnter(changeEvent) {
    // If the edited document is not the same as the active document return
    if (vs.window.activeTextEditor.document !== changeEvent.document) {
        return;
    }
    else if (!changeWasNewLineCharacter(changeEvent)) {
        return;
    }
    else if (!changeFollowsRequiredChars(changeEvent)) {
        return;
    }
    const editor = vs.window.activeTextEditor;
    const autoDocstring = new autodocstring_1.AutoDocstring(editor);
    autoDocstring.generateDocstringFromEnter();
}
function changeWasNewLineCharacter(changeEvent) {
    if (changeEvent.contentChanges.length !== 1) {
        return false;
    }
    const contentChangeText = changeEvent.contentChanges[0].text;
    const strippedText = contentChangeText.replace(/ |\t|\r/g, "");
    return strippedText === "\n";
}
function changeFollowsRequiredChars(changeEvent) {
    const precedingText = getPrecedingText(3, changeEvent);
    const quoteStyle = vs.workspace.getConfiguration("autoDocstring").get("quoteStyle").toString();
    return precedingText === quoteStyle;
}
function getPrecedingText(numberOfChars, changeEvent) {
    const editor = vs.window.activeTextEditor;
    const position = changeEvent.contentChanges[0].range.end;
    const range = new vs.Range(position.translate(0, numberOfChars * -1), position);
    return editor.document.getText(range);
}
function deactivate() { return; }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map