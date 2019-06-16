/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const url = require('url');
const fs = require('fs');
const BasicKeywordMap_1 = require("./BasicKeywordMap");
var logger = require('winston');
class SymbolScanner {
    constructor(fileUrlAsString, definitionProvider) {
        this._fileContent = new Array();
        this._definitionProvider = null;
        this._symbolsDefinition = new Array();
        logger.debug(`scan for symbols file: ${fileUrlAsString}`);
        this._definitionProvider = definitionProvider;
        this.extendsFile(this.convertUriStringToFilePath(fileUrlAsString));
        this.scanForSymbols();
    }
    get symbols() {
        return this._symbolsDefinition;
    }
    extendsFile(filePath) {
        logger.debug(`extendsFile file: ${filePath}`);
        try {
            let data = fs.readFileSync(filePath);
            let file = data.toString().split(/\r?\n/g);
            this._fileContent.push({
                filePath: filePath,
                fileContent: file
            });
            for (let line of file) {
                let keyword = this.lineContainsKeyword(line);
                if (keyword !== undefined) {
                    logger.debug(`keyword found: ${keyword}`);
                    this.handleKeyword(keyword, line);
                }
            }
        }
        catch (error) {
            logger.error(`can not open file error: ${error}`);
        }
    }
    lineContainsKeyword(line) {
        let foundKeyword = undefined;
        let keywords = BasicKeywordMap_1.BasicKeywordMap;
        let trimedLine = line.trim();
        for (let keyword of keywords) {
            if (trimedLine.startsWith(keyword.label) === true) {
                foundKeyword = keyword.label;
            }
        }
        return foundKeyword;
    }
    handleKeyword(keyword, line) {
        let restOfLine = line.split(keyword).filter(String);
        if (restOfLine.length === 1) {
            let listOfSymbols = restOfLine[0].split(' ').filter(String);
            let definition = new Array();
            if (listOfSymbols.length === 1) {
                definition = definition.concat(this._definitionProvider.createDefinitionForKeyword(keyword, restOfLine[0]));
            }
            else if (listOfSymbols.length > 1) {
                for (let symbol of listOfSymbols) {
                    definition = definition.concat(this._definitionProvider.createDefinitionForKeyword(keyword, restOfLine[0], symbol));
                }
            }
            for (let location of definition) {
                if (location !== null) {
                    this.extendsFile(this.convertUriStringToFilePath(location.uri));
                }
            }
        }
    }
    convertUriStringToFilePath(fileUrlAsString) {
        let fileUrl = url.parse(fileUrlAsString);
        let filePath = decodeURI(fileUrl.pathname);
        return filePath;
    }
    scanForSymbols() {
        for (let file of this._fileContent) {
            for (let line of file.fileContent) {
                let lineIndex = file.fileContent.indexOf(line);
                const regex = /^\s*(?:export)?\s*(\w*(?:\[\w*\])?)\s*(?:=|:=|\+=|=\+|-=|=-|\?=|\?\?=|\.=|=\.)/g;
                let symbolContent = this.investigateLine(line, regex);
                if (symbolContent !== undefined) {
                    symbolContent.filePath = file.filePath;
                    symbolContent.lineNumber = lineIndex;
                    this._symbolsDefinition.push(symbolContent);
                }
            }
        }
    }
    investigateLine(lineString, regex) {
        let symbolContent = undefined;
        let m;
        while ((m = regex.exec(lineString)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            if (m.length === 2) {
                let symbol = m[1];
                let symbolStartPosition = lineString.indexOf(symbol);
                let symbolEndPosition = symbolStartPosition + symbol.length;
                let filterdSymbolName = this.filterSymbolName(symbol);
                symbolContent = {
                    symbolName: filterdSymbolName,
                    startPosition: symbolStartPosition,
                    endPostion: symbolEndPosition
                };
            }
        }
        return symbolContent;
    }
    filterSymbolName(symbol) {
        const regex = /^\w*/g;
        let m;
        let filterdSymbolName = undefined;
        while ((m = regex.exec(symbol)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            filterdSymbolName = m[0];
        }
        return filterdSymbolName;
    }
}
exports.SymbolScanner = SymbolScanner;
//# sourceMappingURL=SymbolScanner.js.map