/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const BasicKeywordMap_1 = require("./BasicKeywordMap");
const DefinitionProvider_1 = require("./DefinitionProvider");
const CompletionProvider_1 = require("./CompletionProvider");
var logger = require('winston');
/**
 * ContextHandler
 */
class ContextHandler {
    constructor(projectScanner) {
        this._projectScanner = null;
        this._definitionProvider = null;
        this._completionProvider = null;
        this._projectScanner = projectScanner;
        this._definitionProvider = new DefinitionProvider_1.DefinitionProvider(this._projectScanner);
        this._completionProvider = new CompletionProvider_1.CompletionProvider(this._projectScanner);
    }
    getDefinition(textDocumentPositionParams, documentAsText) {
        let definition = null;
        if (documentAsText.length > textDocumentPositionParams.position.line) {
            let keyWord = this.getKeyWord(textDocumentPositionParams, documentAsText);
            let currentLine = documentAsText[textDocumentPositionParams.position.line];
            let symbol = this.extractSymbolFromLine(textDocumentPositionParams, currentLine);
            if ((keyWord !== undefined) && (keyWord !== '')) {
                definition = this.getDefinitionForKeyWord(keyWord, currentLine, symbol);
            }
            else {
                definition = this._definitionProvider.createDefinitionForSymbol(symbol);
            }
        }
        return definition;
    }
    get definitionProvider() {
        return this._definitionProvider;
    }
    set symbolScanner(symbolScanner) {
        this._completionProvider.symbolScanner = symbolScanner;
        this._definitionProvider.symbolScanner = symbolScanner;
    }
    getDefinitionForKeyWord(keyWord, currentLine, selectedSympbol) {
        let definition = null;
        let words = currentLine.split(' ');
        if (words.length >= 2) {
            if (words[0] === keyWord) {
                logger.debug(`getDefinitionForKeyWord: ${JSON.stringify(words)}`);
                if (words.length === 2) {
                    definition = this._definitionProvider.createDefinitionForKeyword(keyWord, words[1]);
                }
                else {
                    definition = this._definitionProvider.createDefinitionForKeyword(keyWord, words[1], selectedSympbol);
                }
            }
        }
        return definition;
    }
    extractSymbolFromLine(textDocumentPositionParams, currentLine) {
        logger.debug(`getDefinitionForSymbol ${currentLine}`);
        let linePosition = textDocumentPositionParams.position.character;
        let symbolEndPosition = currentLine.length;
        let symbolStartPosition = 0;
        let rightBorderCharacter = [' ', '=', '/', '$', '+', '}', '"', "'", ']', '['];
        let leftBorderCharacter = [' ', '=', '/', '+', '{', '"', "'", '[', ']'];
        for (let character of rightBorderCharacter) {
            let temp = currentLine.indexOf(character, linePosition);
            if (temp === -1) {
                temp = currentLine.length;
            }
            symbolEndPosition = Math.min(symbolEndPosition, temp);
        }
        let symbolRightTrimed = currentLine.substring(0, symbolEndPosition);
        logger.debug(`symbolRightTrimed ${symbolRightTrimed}`);
        for (let character of leftBorderCharacter) {
            let temp = symbolRightTrimed.lastIndexOf(character, linePosition);
            if (temp === -1) {
                temp = 0;
            }
            symbolStartPosition = Math.max(symbolStartPosition, temp);
        }
        let symbol = symbolRightTrimed.substring(symbolStartPosition);
        for (let character of leftBorderCharacter.concat('-')) {
            if (symbol.startsWith(character)) {
                symbol = symbol.substring(1);
                break;
            }
        }
        logger.debug(`symbol ${symbol}`);
        return symbol;
    }
    getComletionItems(textDocumentPosition, documentAsText) {
        let completionItem;
        if (documentAsText.length > textDocumentPosition.position.line) {
            let keyWord = this.getKeyWord(textDocumentPosition, documentAsText);
            if ((keyWord === undefined) || (keyWord === '')) {
                completionItem = this._completionProvider.createCompletionItem('*');
            }
            else {
                completionItem = this._completionProvider.createCompletionItem(keyWord);
            }
        }
        return completionItem;
    }
    getInsertStringForTheElement(item) {
        return this._completionProvider.getInsertStringForTheElement(item);
    }
    getKeyWord(textDocumentPosition, documentAsText) {
        let currentLine = documentAsText[textDocumentPosition.position.line];
        let lineTillCurrentPosition = currentLine.substr(0, textDocumentPosition.position.character);
        let words = lineTillCurrentPosition.split(' ');
        let basicKeywordMap = BasicKeywordMap_1.BasicKeywordMap;
        let keyword;
        if (words.length > 1) {
            let basicKey = basicKeywordMap.find((obj) => {
                return obj.label === words[0];
            });
            if (basicKey !== undefined) {
                keyword = basicKey.label;
            }
        }
        return keyword;
    }
}
exports.ContextHandler = ContextHandler;
//# sourceMappingURL=ContextHandler.js.map