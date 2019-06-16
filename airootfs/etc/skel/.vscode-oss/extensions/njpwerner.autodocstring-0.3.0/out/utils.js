"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vs = require("vscode");
function inArray(item, array) {
    return array.some((x) => item === x);
}
exports.inArray = inArray;
function includesFromArray(str, substrings) {
    substrings.some((x) => str.includes(x));
}
exports.includesFromArray = includesFromArray;
function deleteRange(range) {
    const wsEdit = new vs.WorkspaceEdit();
    const editor = vs.window.activeTextEditor;
    wsEdit.delete(editor.document.uri, range);
    vs.workspace.applyEdit(wsEdit);
}
exports.deleteRange = deleteRange;
function deleteLine(lineNum) {
    const editor = vs.window.activeTextEditor;
    const line = editor.document.lineAt(lineNum);
    const wsEdit = new vs.WorkspaceEdit();
    wsEdit.delete(editor.document.uri, line.rangeIncludingLineBreak);
    vs.workspace.applyEdit(wsEdit);
}
exports.deleteLine = deleteLine;
//# sourceMappingURL=utils.js.map