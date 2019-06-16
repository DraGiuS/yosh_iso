/* --------------------------------------------------------------------------------------------
 * Copyright (c) Eugen Wiens. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.Diagnstic
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const execa = require('execa');
const find = require('find');
const path = require('path');
const fs = require('fs');
var logger = require('winston');
const OutputParser_1 = require("./OutputParser");
/**
 * BitBakeProjectScanner
 */
class BitBakeProjectScanner {
    constructor(connection) {
        this._classFileExtension = 'bbclass';
        this._includeFileExtension = 'inc';
        this._recipesFileExtension = 'bb';
        this._layers = new Array();
        this._classes = new Array();
        this._includes = new Array();
        this._recipes = new Array();
        this._deepExamine = false;
        this._settingsScriptInterpreter = '/bin/bash';
        this._settingsWorkingFolder = 'vscode-bitbake-build';
        this._settingsGenerateWorkingFolder = true;
        this._settingsBitbakeSourceCmd = '.';
        this._settingsMachine = undefined;
        this._oeEnvScript = 'oe-init-build-env';
        this._scanStatus = {
            scanIsRunning: false,
            scanIsPending: false
        };
        this._outputParser = new OutputParser_1.OutputParser(connection);
    }
    get projectPath() {
        return this._projectPath;
    }
    get layers() {
        return this._layers;
    }
    get classes() {
        return this._classes;
    }
    get includes() {
        return this._includes;
    }
    get recipes() {
        return this._recipes;
    }
    set deepExamine(deepExamine) {
        this._deepExamine = deepExamine;
    }
    set scriptInterpreter(scriptInterpreter) {
        this._settingsScriptInterpreter = scriptInterpreter;
    }
    set workingPath(workingPath) {
        this._settingsWorkingFolder = workingPath;
    }
    set generateWorkingPath(generateWorkingPath) {
        this._settingsGenerateWorkingFolder = generateWorkingPath;
    }
    set machineName(machine) {
        if (machine === "") {
            this._settingsMachine = undefined;
        }
        else {
            this._settingsMachine = machine;
        }
    }
    setProjectPath(projectPath) {
        this._projectPath = projectPath;
    }
    rescanProject() {
        logger.info(`request rescanProject ${this._projectPath}`);
        if (this._scanStatus.scanIsRunning === false) {
            this._scanStatus.scanIsRunning = true;
            logger.info('start rescanProject');
            try {
                if (this.parseAllRecipes()) {
                    this.scanAvailableLayers();
                    this.scanForClasses();
                    this.scanForIncludeFiles();
                    this.scanForRecipes();
                    this.scanRecipesAppends();
                    logger.info('scan ready');
                    this.printScanStatistic();
                }
            }
            catch (error) {
                logger.error(`scanning of project is abborted: ${error}`);
                throw error;
            }
            this._scanStatus.scanIsRunning = false;
            if (this._scanStatus.scanIsPending === true) {
                this._scanStatus.scanIsPending = false;
                this.rescanProject();
            }
        }
        else {
            logger.info('scan is already running, set the pending flag');
            this._scanStatus.scanIsPending = true;
        }
    }
    printScanStatistic() {
        logger.info(`Scan results for path: ${this._projectPath}`);
        logger.info('******************************************************************');
        logger.info(`Layer:     ${this._layers.length}`);
        logger.info(`Recipes:   ${this._recipes.length}`);
        logger.info(`Inc-Files: ${this._includes.length}`);
        logger.info(`bbclass:   ${this._classes.length}`);
    }
    scanForClasses() {
        this._classes = this.searchFiles(this._classFileExtension);
    }
    scanForIncludeFiles() {
        this._includes = this.searchFiles(this._includeFileExtension);
    }
    scanAvailableLayers() {
        this._layers = new Array();
        let output = this.executeCommandInBitBakeEnvironment('bitbake-layers show-layers');
        if (output.length > 0) {
            try {
                let tempStr = output.split('\n');
                tempStr = tempStr.slice(2);
                for (let element of tempStr) {
                    let tempElement = element.split(/\s+/);
                    let layerElement = {
                        name: tempElement[0],
                        path: tempElement[1],
                        priority: parseInt(tempElement[2])
                    };
                    if ((layerElement.name !== undefined) && (layerElement.path !== undefined) && layerElement.priority !== undefined) {
                        this._layers.push(layerElement);
                    }
                }
            }
            catch (error) {
                logger.error(`can not scan available layers error: ${error}`);
                this._outputParser.parse(error);
            }
        }
    }
    searchFiles(pattern) {
        let elements = new Array();
        for (let layer of this._layers) {
            try {
                let files = find.fileSync(new RegExp(`.${pattern}$`), layer.path);
                for (let file of files) {
                    let pathObj = path.parse(file);
                    let element = {
                        name: pathObj.name,
                        path: pathObj,
                        extraInfo: `layer: ${layer.name}`,
                        layerInfo: layer,
                    };
                    elements.push(element);
                }
            }
            catch (error) {
                logger.error(`find error: pattern: ${pattern} layer.path: ${layer.path} error: ${JSON.stringify(error)}`);
                throw error;
            }
        }
        return elements;
    }
    scanForRecipes() {
        this._recipes = new Array();
        let output = this.executeCommandInBitBakeEnvironment('bitbake-layers show-recipes');
        if (output.length > 0) {
            let outerReg = /(.+)\:\n((?:\s+\S+\s+\S+(?:\s+\(skipped\))?\n)+)/g;
            let innerReg = /\s+(\S+)\s+(\S+(?:\s+\(skipped\))?)\n/g;
            let match;
            while ((match = outerReg.exec(output)) !== null) {
                if (match.index === outerReg.lastIndex) {
                    outerReg.lastIndex++;
                }
                let matchInner;
                let extraInfoString = new Array();
                let layerName;
                let version;
                while ((matchInner = innerReg.exec(match[2])) !== null) {
                    if (matchInner.index === innerReg.lastIndex) {
                        innerReg.lastIndex++;
                    }
                    if (extraInfoString.length === 0) {
                        layerName = matchInner[1];
                        version = matchInner[2];
                    }
                    extraInfoString.push(`layer: ${matchInner[1]}`);
                    extraInfoString.push(`version: ${matchInner[2]} `);
                }
                let layer = this._layers.find((obj) => {
                    return obj.name === layerName;
                });
                let element = {
                    name: match[1],
                    extraInfo: extraInfoString.join('\n'),
                    layerInfo: layer,
                    version: version
                };
                this._recipes.push(element);
            }
        }
        this.scanForRecipesPath();
    }
    parseAllRecipes() {
        logger.debug('parseAllRecipes');
        let parsingOutput;
        let parsingSuccess = true;
        try {
            parsingOutput = this.executeCommandInBitBakeEnvironment('bitbake -p', this._settingsMachine);
        }
        catch (error) {
            logger.error(`parsing all recipes is abborted: ${error}`);
            parsingOutput = error;
        }
        if (parsingOutput.length > 0) {
            this._outputParser.parse(parsingOutput);
            if (this._outputParser.errorsFound()) {
                this._outputParser.reportProblems();
                parsingSuccess = false;
            }
        }
        return parsingSuccess;
    }
    scanForRecipesPath() {
        let tmpFiles = this.searchFiles(this._recipesFileExtension);
        for (let file of tmpFiles) {
            let recipeName = file.name.split(/[_]/g)[0];
            let element = this._recipes.find((obj) => {
                return obj.name === recipeName;
            });
            if (element !== undefined) {
                element.path = file.path;
            }
        }
        if (this._deepExamine === true) {
            let recipesWithOutPath = this._recipes.filter((obj) => {
                return obj.path === undefined;
            });
            logger.info(`${recipesWithOutPath.length} recipes must be examined more deeply.`);
            for (let recipeWithOutPath of recipesWithOutPath) {
                let output = this.executeCommandInBitBakeEnvironment(`bitbake-layers show-recipes -f ${recipeWithOutPath.name}`);
                let regExp = /(\s.*\.bb)/g;
                let match;
                if (output.length > 0) {
                    while ((match = regExp.exec(output)) !== null) {
                        if (match.index === regExp.lastIndex) {
                            regExp.lastIndex++;
                        }
                        recipeWithOutPath.path = path.parse(match[0].trim());
                    }
                }
            }
        }
    }
    scanRecipesAppends() {
        let output = this.executeCommandInBitBakeEnvironment('bitbake-layers show-appends');
        if (output.length > 0) {
            let outerReg = new RegExp(`(\\S.*\\.bb)\\:(?:\\s*\\/\\S*.bbappend)+`, 'g');
            let match;
            while ((match = outerReg.exec(output)) !== null) {
                if (match.index === outerReg.lastIndex) {
                    outerReg.lastIndex++;
                }
                let matchInner;
                let fullRecipeNameAsArray = match[1].split('_');
                if (fullRecipeNameAsArray.length > 0) {
                    let recipeName = fullRecipeNameAsArray[0];
                    let recipe = this.recipes.find((obj) => {
                        return obj.name === recipeName;
                    });
                    if (recipe !== undefined) {
                        let innerReg = /(\S*\.bbappend)/g;
                        while ((matchInner = innerReg.exec(match[0])) !== null) {
                            if (matchInner.index === innerReg.lastIndex) {
                                innerReg.lastIndex++;
                            }
                            if (recipe.appends === undefined) {
                                recipe.appends = new Array();
                            }
                            recipe.appends.push(path.parse(matchInner[0]));
                        }
                        ;
                    }
                }
            }
        }
    }
    executeCommandInBitBakeEnvironment(command, machine = undefined) {
        let returnValue = '';
        if (this.isBitbakeAvailable() === true) {
            let scriptContent = this.generateBitBakeCommandScriptFileContent(command, machine);
            let pathToScriptFile = this._projectPath + '/' + this._settingsWorkingFolder;
            let scriptFileName = pathToScriptFile + '/executeBitBakeCmd.sh';
            if (!fs.existsSync(pathToScriptFile)) {
                fs.mkdirSync(pathToScriptFile);
            }
            fs.writeFileSync(scriptFileName, scriptContent);
            fs.chmodSync(scriptFileName, '0755');
            returnValue = this.executeCommand(scriptFileName);
        }
        return returnValue;
    }
    executeCommand(command) {
        let stdOutput;
        if (this._projectPath !== null) {
            try {
                let returnObject = execa.shellSync(command);
                if (returnObject.status === 0) {
                    stdOutput = returnObject.stdout;
                }
                else {
                    let data = fs.readFileSync(command);
                    logger.error('error on executing command: ' + data.toString());
                }
            }
            catch (error) {
                throw error;
            }
        }
        return stdOutput;
    }
    generateBitBakeCommandScriptFileContent(bitbakeCommand, machine = undefined) {
        let scriptFileBuffer = [];
        let scriptBitbakeCommand = bitbakeCommand;
        scriptFileBuffer.push('#!' + this._settingsScriptInterpreter);
        scriptFileBuffer.push(this._settingsBitbakeSourceCmd + ' ./' + this._oeEnvScript + ' ' + this._settingsWorkingFolder + ' > /dev/null');
        if (machine !== undefined) {
            scriptBitbakeCommand = `MACHINE=${machine} ` + scriptBitbakeCommand;
        }
        scriptFileBuffer.push(scriptBitbakeCommand);
        return scriptFileBuffer.join('\n');
    }
    isBitbakeAvailable() {
        let settingActive = this._settingsGenerateWorkingFolder;
        let oeEnvScriptExists = fs.existsSync(this._oeEnvScript);
        let bitbakeAvailable = false;
        if (settingActive && oeEnvScriptExists) {
            bitbakeAvailable = true;
        }
        return bitbakeAvailable;
    }
}
exports.BitBakeProjectScanner = BitBakeProjectScanner;
//# sourceMappingURL=BitBakeProjectScanner.js.map