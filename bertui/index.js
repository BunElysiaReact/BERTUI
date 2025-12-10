// index.ts
import logger from "./src/logger/logger";
import { defaultConfig } from "./src/config/defaultConfig";
import { startDev } from "./src/dev";
import { buildProduction } from "./src/build";
import { compileProject } from "./src/client/compiler";
import { program } from "./src/cli";

// Named exports
export { 
    logger,
    defaultConfig,
    startDev,
    buildProduction,
    compileProject,
    program
};

// Default export
export default {
    logger,
    defaultConfig,
    startDev,
    buildProduction,
    compileProject,
    program,
    version: "0.1.0"
};