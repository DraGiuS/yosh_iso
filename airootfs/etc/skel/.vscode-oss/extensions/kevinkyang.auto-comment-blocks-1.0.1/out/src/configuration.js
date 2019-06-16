'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const rules_1 = require("./rules");
let fs = require('fs');
class Configuration {
    constructor() {
        this.extensionName = "auto-comment-blocks";
        this.singleLineBlockCommand = "auto-comment-blocks.singleLineBlock";
        this.singleLineConfigFile = __dirname +
            "/../../language-configuration/single-line-configuration.json";
        this.multiLineConfigFile = __dirname +
            "/../../language-configuration/multi-line-configuration.json";
        this.singleLineBlockOnEnter = "singleLineBlockOnEnter";
        this.slashStyleBlocks = "slashStyleBlocks";
        this.hashStyleBlocks = "hashStyleBlocks";
        this.semicolonStyleBlocks = "semicolonStyleBlocks";
        this.disabledLanguages = "disabledLanguages";
        this.disabledLanguageList = this.getConfiguration().get(this.disabledLanguages);
        this.singleLineBlocksMap = new Map();
    }
    getConfiguration() {
        return vscode_1.workspace.getConfiguration(this.extensionName);
    }
    isLangIdDisabled(langId) {
        return this.disabledLanguageList.indexOf(langId) !== -1;
    }
    getMultiLineLanguages() {
        let multiLineConfig = JSON.parse(fs.readFileSync(this.multiLineConfigFile, 'utf-8'));
        return multiLineConfig["languages"];
    }
    setLanguageConfiguration(langId, multiLine, singleLineStyle) {
        var langConfig = {
            onEnterRules: []
        };
        if (multiLine) {
            langConfig.onEnterRules =
                langConfig.onEnterRules.concat(rules_1.Rules.multilineEnterRules);
        }
        let isOnEnter = this.getConfiguration().get(this.singleLineBlockOnEnter);
        if (isOnEnter && singleLineStyle) {
            if (singleLineStyle === '//') {
                langConfig.onEnterRules =
                    langConfig.onEnterRules.concat(rules_1.Rules.slashEnterRules);
            }
            else if (singleLineStyle === '#') {
                langConfig.onEnterRules =
                    langConfig.onEnterRules.concat(rules_1.Rules.hashEnterRules);
            }
            else if (singleLineStyle === ';') {
                langConfig.onEnterRules =
                    langConfig.onEnterRules.concat(rules_1.Rules.semicolonEnterRules);
            }
        }
        return vscode_1.languages.setLanguageConfiguration(langId, langConfig);
    }
    getSingleLineLanguages() {
        let singleLineConfig = JSON.parse(fs.readFileSync(this.singleLineConfigFile, 'utf-8'));
        let commentStyles = Object.keys(singleLineConfig);
        for (let key of commentStyles) {
            for (let langId of singleLineConfig[key]) {
                if (!this.isLangIdDisabled(langId)) {
                    this.singleLineBlocksMap.set(langId, key);
                }
            }
        }
        // get user-customized langIds for this key and add to the map
        let customSlashLangs = this.getConfiguration().get(this.slashStyleBlocks);
        for (let langId of customSlashLangs) {
            if (langId && langId.length > 0) {
                this.singleLineBlocksMap.set(langId, '//');
            }
        }
        let customHashLangs = this.getConfiguration().get(this.hashStyleBlocks);
        for (let langId of customHashLangs) {
            if (langId && langId.length > 0) {
                this.singleLineBlocksMap.set(langId, '#');
            }
        }
        let customSemicolonLangs = this.getConfiguration().get(this.semicolonStyleBlocks);
        for (let langId of customSemicolonLangs) {
            if (langId && langId.length > 0) {
                this.singleLineBlocksMap.set(langId, ';');
            }
        }
    }
    configureCommentBlocks(context) {
        this.getSingleLineLanguages();
        // set language configurations
        let multiLineLangs = this.getMultiLineLanguages();
        for (let [langId, style] of this.singleLineBlocksMap) {
            let multiLine = multiLineLangs.indexOf(langId) !== -1;
            let disposable = this.setLanguageConfiguration(langId, multiLine, style);
            context.subscriptions.push(disposable);
        }
        for (let langId of multiLineLangs) {
            if (!this.singleLineBlocksMap.has(langId) &&
                !this.isLangIdDisabled(langId)) {
                let disposable = this.setLanguageConfiguration(langId, true);
                context.subscriptions.push(disposable);
            }
        }
    }
    handleSingleLineBlock(textEditor, edit) {
        let langId = textEditor.document.languageId;
        var style = this.singleLineBlocksMap.get(langId);
        if (style && textEditor.selection.isEmpty) {
            let line = textEditor.document.lineAt(textEditor.selection.active);
            let isCommentLine = true;
            var indentRegex;
            if (style === '//' && line.text.search(/^\s*\/\/\s*/) !== -1) {
                indentRegex = /\//;
                if (line.text.search(/^\s*\/\/\/\s*/) !== -1) {
                    style = '///';
                }
            }
            else if (style === '#' && line.text.search(/^\s*#\s*/) !== -1) {
                indentRegex = /#/;
            }
            else if (style === ';' && line.text.search(/^\s*;\s*/) !== -1) {
                indentRegex = /;/;
            }
            else {
                isCommentLine = false;
            }
            if (!isCommentLine) {
                return;
            }
            var indentedNewLine = '\n' +
                line.text.substring(0, line.text.search(indentRegex));
            let isOnEnter = this.getConfiguration().get(this.singleLineBlockOnEnter);
            if (!isOnEnter) {
                indentedNewLine += style + ' ';
            }
            edit.insert(textEditor.selection.active, indentedNewLine);
        }
    }
    registerCommands() {
        vscode_1.commands.registerTextEditorCommand(this.singleLineBlockCommand, (textEditor, edit, args) => {
            this.handleSingleLineBlock(textEditor, edit);
        });
    }
}
exports.Configuration = Configuration;
//# sourceMappingURL=configuration.js.map