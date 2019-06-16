'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class Rules {
}
Rules.multilineEnterRules = [
    {
        // e.g. /** | */
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        afterText: /^\s*\*\/$/,
        action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
    }, {
        // e.g. /** ...|
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
    }, {
        // e.g. /*! | */
        beforeText: /^\s*\/\*\!(?!\/)([^\*]|\*(?!\/))*$/,
        afterText: /^\s*\*\/$/,
        action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
    }, {
        // e.g. /*! ...|
        beforeText: /^\s*\/\*\!(?!\/)([^\*]|\*(?!\/))*$/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
    }, {
        // e.g.  * ...|
        beforeText: /^(\t|(\ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
    }, {
        // e.g.  */|
        beforeText: /^(\t|(\ ))*\ \*\/\s*$/,
        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
    },
    {
        // e.g.  *-----*/|
        beforeText: /^(\t|(\ ))*\ \*[^/]*\*\/\s*$/,
        action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
    }
];
Rules.slashEnterRules = [
    {
        // e.g. // ...|
        beforeText: /^\s*\/\/(?!\/)/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '// ' }
    },
    {
        // e.g. /// ...|
        beforeText: /^\s*\/\/\//,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '/// ' }
    }
];
Rules.hashEnterRules = [
    {
        // e.g. # ...|
        beforeText: /^\s*#/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '# ' }
    }
];
Rules.semicolonEnterRules = [
    {
        // e.g. ; ...|
        beforeText: /^\s*;/,
        action: { indentAction: vscode_1.IndentAction.None, appendText: '; ' }
    }
];
exports.Rules = Rules;
//# sourceMappingURL=rules.js.map