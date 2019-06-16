'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
let fs = require('fs');
let configuration = new configuration_1.Configuration();
function activate(context) {
    configuration.configureCommentBlocks(context);
    configuration.registerCommands();
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map