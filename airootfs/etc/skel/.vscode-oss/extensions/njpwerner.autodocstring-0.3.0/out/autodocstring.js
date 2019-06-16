"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vs = require("vscode");
const docstring_factory_1 = require("./docstring/docstring_factory");
const get_template_1 = require("./docstring/get_template");
const closed_docstring_1 = require("./parse/closed_docstring");
const multi_line_string_1 = require("./parse/multi_line_string");
const parse_1 = require("./parse/parse");
class AutoDocstring {
    constructor(editor) {
        this.editor = editor;
        const config = vs.workspace.getConfiguration("autoDocstring");
        this.quoteStyle = config.get("quoteStyle").toString();
        this.docstringFactory = new docstring_factory_1.DocstringFactory(this.getTemplate(), config.get("quoteStyle").toString(), config.get("startOnNewLine") === true, config.get("includeExtendedSummary") === true, config.get("includeName") === true, config.get("guessTypes") === true);
    }
    generateDocstring() {
        const document = this.editor.document.getText();
        const position = this.editor.selection.active;
        const linePosition = position.line;
        const docstringParts = parse_1.parse(document, linePosition);
        const docstringSnippet = this.docstringFactory.generateDocstring(docstringParts);
        this.editor.insertSnippet(new vs.SnippetString(docstringSnippet), position);
    }
    generateDocstringFromEnter() {
        const document = this.editor.document.getText();
        const position = this.editor.selection.active;
        const linePosition = position.line;
        const charPosition = position.character;
        if (this.validEnterActivation(document, linePosition, charPosition)) {
            const docstringParts = parse_1.parse(document, linePosition);
            const docstringSnippet = this.docstringFactory.generateDocstring(docstringParts, true);
            const range = new vs.Range(position, position.with(position.line + 1));
            this.editor.insertSnippet(new vs.SnippetString(docstringSnippet), range);
        }
    }
    // Checks whether the docstring is already closed or whether the triple quotes are part of a multiline string
    validEnterActivation(document, linePosition, charPosition) {
        return (!multi_line_string_1.isMultiLineString(document, linePosition, charPosition, this.quoteStyle) &&
            !closed_docstring_1.docstringIsClosed(document, linePosition, charPosition, this.quoteStyle));
    }
    getTemplate() {
        const config = vs.workspace.getConfiguration("autoDocstring");
        const customTemplatePath = config.get("customTemplatePath").toString();
        if (customTemplatePath !== "") {
            try {
                return get_template_1.getCustomTemplate(customTemplatePath);
            }
            catch (err) {
                const errorMessage = "AutoDocstring Error: Template could not be found: " + customTemplatePath;
                vs.window.showErrorMessage(errorMessage);
            }
        }
        else {
            const docstringFormat = config.get("docstringFormat").toString();
            return get_template_1.getTemplate(docstringFormat);
        }
    }
}
exports.AutoDocstring = AutoDocstring;
//# sourceMappingURL=autodocstring.js.map