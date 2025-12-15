// index.js
import logger from "./src/logger/logger.js";
import { defaultConfig } from "./src/config/defaultConfig.js";
import { loadConfig } from "./src/config/loadConfig.js";
import { startDev } from "./src/dev.js";
import { buildProduction } from "./src/build.js";
import { compileProject } from "./src/client/compiler.js";
import { buildCSS, copyCSS } from "./src/build/css-builder.js";
import { program } from "./src/cli.js";

// Named exports
export { 
    logger,
    defaultConfig,
    loadConfig,
    startDev,
    buildProduction,
    compileProject,
    buildCSS,
    copyCSS,
    program
};

// Default export
export default {
    logger,
    defaultConfig,
    loadConfig,
    startDev,
    buildProduction,
    compileProject,
    buildCSS,
    copyCSS,
    program,
    version: "0.2.1"
};