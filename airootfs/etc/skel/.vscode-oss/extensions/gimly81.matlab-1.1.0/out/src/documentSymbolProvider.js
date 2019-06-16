'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class MatlabDocumentSymbolProvider {
    provideDocumentSymbols(document, token) {
        const _functionPattern = /function *(?:(?:(?:\[[ \w,]+\])|(?:\w+)) *= *)?(?:\w.?)+ *\(.*?\)/;
        const result = [];
        for (let line = 0; line < document.lineCount; line++) {
            const { text } = document.lineAt(line);
            if (!text.startsWith("%") && _functionPattern.test(text)) {
                result.push(new vscode.SymbolInformation(text, vscode.SymbolKind.Function, '', new vscode.Location(document.uri, new vscode.Position(line, 0))));
            }
        }
        return result;
    }
}
exports.MatlabDocumentSymbolProvider = MatlabDocumentSymbolProvider;
//# sourceMappingURL=documentSymbolProvider.js.map