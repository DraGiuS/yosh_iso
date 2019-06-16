"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Stolen from vscode-jshint.
const _ = require("lodash");
const minimatch = require("minimatch");
class FileMatcher {
    constructor() {
        this.excludePatterns = null;
        this.excludeCache = {};
    }
    pickTrueKeys(obj) {
        return _.keys(_.pickBy(obj, (value) => {
            return value === true;
        }));
    }
    configure(exclude) {
        this.excludeCache = {};
        this.excludePatterns = this.pickTrueKeys(exclude);
    }
    clear(exclude) {
        this.excludeCache = {};
    }
    relativeTo(fsPath, folder) {
        if (folder && fsPath.indexOf(folder) === 0) {
            let cuttingPoint = folder.length;
            if (cuttingPoint < fsPath.length && fsPath.charAt(cuttingPoint) === '/') {
                cuttingPoint += 1;
            }
            return fsPath.substr(cuttingPoint);
        }
        return fsPath;
    }
    folderOf(fsPath) {
        const index = fsPath.lastIndexOf('/');
        return index > -1 ? fsPath.substr(0, index) : fsPath;
    }
    match(excludePatterns, path, root) {
        const relativePath = this.relativeTo(path, root);
        return _.some(excludePatterns, (pattern) => {
            return minimatch(relativePath, pattern, { dot: true });
        });
    }
    excludes(fsPath, root) {
        if (fsPath) {
            if (this.excludeCache.hasOwnProperty(fsPath)) {
                return this.excludeCache[fsPath];
            }
            const shouldBeExcluded = this.match(this.excludePatterns, fsPath, root);
            this.excludeCache[fsPath] = shouldBeExcluded;
            return shouldBeExcluded;
        }
        return true;
    }
}
exports.FileMatcher = FileMatcher;
//# sourceMappingURL=filematcher.js.map