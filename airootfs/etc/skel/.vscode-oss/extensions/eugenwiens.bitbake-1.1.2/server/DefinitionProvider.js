/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
var logger = require('winston');
const path = require('path');
class DefinitionProvider {
    constructor(projectScanner) {
        this._projectScanner = null;
        this._symbolScanner = null;
        this._projectScanner = projectScanner;
    }
    set symbolScanner(symbolScanner) {
        this._symbolScanner = symbolScanner;
    }
    createDefinitionForKeyword(keyword, restOfLine, selectedSympbol) {
        let definition = null;
        restOfLine = restOfLine.trim();
        switch (keyword) {
            case 'inherit':
                {
                    let searchString;
                    if (selectedSympbol === undefined) {
                        searchString = restOfLine;
                    }
                    else {
                        searchString = selectedSympbol;
                    }
                    let elementInfos = this._projectScanner.classes.filter((obj) => {
                        return obj.name === searchString;
                    });
                    definition = this.createDefinitionForElementInfo(elementInfos);
                }
                break;
            case 'require':
            case 'include':
                {
                    let includeFile = path.parse(restOfLine);
                    let elementInfos = this._projectScanner.includes.filter((obj) => {
                        return obj.name === includeFile.name;
                    });
                    if (elementInfos.length == 0) {
                        elementInfos = this._projectScanner.recipes.filter((obj) => {
                            return obj.name === includeFile.name;
                        });
                    }
                    definition = this.createDefinitionForElementInfo(elementInfos);
                }
                break;
            default:
        }
        return definition;
    }
    createDefinitionForSymbol(symbol) {
        let definitions = this.createDefinitionForSymbolRecipes(symbol);
        if (definitions === null) {
            definitions = this.createDefinitionForSymbolVariables(symbol);
        }
        return definitions;
    }
    createDefinitionForSymbolRecipes(symbol) {
        let definitions = null;
        let recipe = this._projectScanner.recipes.find((obj) => {
            return obj.name === symbol;
        });
        if (recipe !== undefined) {
            let definitionsList = new Array(recipe.path);
            if ((recipe.appends !== undefined) && (recipe.appends.length > 0)) {
                definitionsList = definitionsList.concat(recipe.appends);
            }
            definitions = this.createDefinitionLocationForPathInfoList(definitionsList);
        }
        return definitions;
    }
    createDefinitionForSymbolVariables(symbol) {
        let definitions = null;
        if (this._symbolScanner !== null) {
            let symbols = this._symbolScanner.symbols.filter((obj) => {
                return obj.symbolName === symbol;
            });
            definitions = this.createDefinitionForSymbolContentList(symbols);
        }
        else {
            logger.debug(`Cannot create definitions for symbol ${symbol}: symbol scanner is null`);
        }
        return definitions;
    }
    createDefinitionForElementInfo(elementInfos) {
        let definition = null;
        if ((elementInfos !== undefined) && (elementInfos.length > 0)) {
            if (elementInfos.length > 1) {
                definition = new Array();
                for (let elementInfo of elementInfos) {
                    logger.debug(`definition ${JSON.stringify(elementInfo)}`);
                    let location = this.createDefinitionLocationForPathInfo(elementInfo.path);
                    definition.push(location);
                }
            }
            else {
                definition = this.createDefinitionLocationForPathInfo(elementInfos[0].path);
            }
        }
        return definition;
    }
    createDefinitionLocationForPathInfoList(pathInfoList) {
        let definition = null;
        if ((pathInfoList !== undefined) && (pathInfoList.length > 0)) {
            if (pathInfoList.length > 1) {
                definition = new Array();
                for (let pathInfo of pathInfoList) {
                    logger.debug(`definition ${JSON.stringify(pathInfo)}`);
                    let location = this.createDefinitionLocationForPathInfo(pathInfo);
                    definition.push(location);
                }
            }
            else {
                definition = this.createDefinitionLocationForPathInfo(pathInfoList[0]);
            }
        }
        return definition;
    }
    createDefinitionLocationForPathInfo(path) {
        let url = 'file://' + path.dir + '/' + path.base;
        let location = vscode_languageserver_1.Location.create(encodeURI(url), vscode_languageserver_1.Range.create(0, 0, 0, 0));
        return location;
    }
    createDefinitionForSymbolContentList(symbolContent) {
        let definition = null;
        if ((symbolContent !== undefined) && (symbolContent.length > 0)) {
            if (symbolContent.length > 1) {
                definition = new Array();
                for (let element of symbolContent) {
                    logger.debug(`definition ${JSON.stringify(element)}`);
                    let location = this.createDefinitionForSymbolContent(element);
                    definition.push(location);
                }
            }
            else {
                definition = this.createDefinitionForSymbolContent(symbolContent[0]);
            }
        }
        return definition;
    }
    createDefinitionForSymbolContent(symbolContent) {
        let url = 'file://' + symbolContent.filePath;
        let range = vscode_languageserver_1.Range.create(symbolContent.lineNumber, symbolContent.startPosition, symbolContent.lineNumber, symbolContent.endPostion);
        return vscode_languageserver_1.Location.create(encodeURI(url), range);
    }
}
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=DefinitionProvider.js.map