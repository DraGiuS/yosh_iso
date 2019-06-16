/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const BasicKeywordMap_1 = require("./BasicKeywordMap");
class CompletionProvider {
    constructor(projectScanner) {
        this._classCompletionItemKind = vscode_languageserver_1.CompletionItemKind.Class;
        this._includeCompletionItemKind = vscode_languageserver_1.CompletionItemKind.Interface;
        this._recipesCompletionItemKind = vscode_languageserver_1.CompletionItemKind.Method;
        this._symbolComletionItemKind = vscode_languageserver_1.CompletionItemKind.Variable;
        this._projectScanner = projectScanner;
    }
    set symbolScanner(symbolScanner) {
        this._symbolScanner = symbolScanner;
    }
    getInsertStringForTheElement(item) {
        let insertString = item.label;
        if (item.kind === this._includeCompletionItemKind) {
            let path = item.data.path;
            let pathAsString = path.dir.replace(item.data.layerInfo.path, '');
            if (pathAsString.startsWith('/') === true) {
                pathAsString = pathAsString.substr(1);
            }
            insertString = pathAsString + '/' + item.data.path.base;
        }
        return insertString;
    }
    createCompletionItem(keyword) {
        let completionItem = new Array();
        switch (keyword) {
            case 'inherit':
                completionItem = this.convertElementInfoListToCompletionItemList(this._projectScanner.classes, this._classCompletionItemKind);
                break;
            case 'require':
            case 'include':
                completionItem = completionItem.concat(this.convertElementInfoListToCompletionItemList(this._projectScanner.includes, this._includeCompletionItemKind));
                break;
            default:
                completionItem = completionItem.concat(this.convertElementInfoListToCompletionItemList(this._projectScanner.classes, this._classCompletionItemKind), this.convertElementInfoListToCompletionItemList(this._projectScanner.includes, this._includeCompletionItemKind), this.convertElementInfoListToCompletionItemList(this._projectScanner.recipes, this._recipesCompletionItemKind), this.convertSymbolContentListToCompletionItemList(this._symbolScanner.symbols, this._symbolComletionItemKind), BasicKeywordMap_1.BasicKeywordMap);
                break;
        }
        return completionItem;
    }
    convertElementInfoListToCompletionItemList(elementInfoList, completionType) {
        let completionItems = new Array();
        for (let element of elementInfoList) {
            let completionItem = {
                label: element.name,
                detail: this.getTypeAsString(completionType),
                documentation: element.extraInfo,
                data: element,
                kind: completionType
            };
            completionItems.push(completionItem);
        }
        return completionItems;
    }
    convertSymbolContentListToCompletionItemList(symbolContentList, completionType) {
        let completionItems = new Array();
        for (let element of symbolContentList) {
            let completionItem = {
                label: element.symbolName,
                detail: this.getTypeAsString(completionType),
                documentation: '',
                data: element,
                kind: completionType
            };
            completionItems.push(completionItem);
        }
        return completionItems;
    }
    getTypeAsString(completionType) {
        let typeAsString = '';
        switch (completionType) {
            case this._classCompletionItemKind:
                typeAsString = 'class';
                break;
            case this._includeCompletionItemKind:
                typeAsString = 'inc';
                break;
            case this._recipesCompletionItemKind:
                typeAsString = 'recipe';
                break;
            case this._symbolComletionItemKind:
                typeAsString = 'symbol';
                break;
        }
        return typeAsString;
    }
}
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=CompletionProvider.js.map