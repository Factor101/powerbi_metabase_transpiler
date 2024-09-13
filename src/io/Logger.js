import chalk from 'chalk';
import 'dotenv/config';

const CHALK_ORANGE = chalk.hex('#FFA500');
const INDENT_SIZE = 4;
const MIN_INDENT = 0;

export const Logger = {
    // internal utility
    pad: () => chalk.grey('-'.repeat(Logger.indentDepth)),
    verbosity: process.env?.VERBOSITY ?? 3,
    indentDepth: MIN_INDENT,

    // util methods
    registerVerbosity: (v) => Logger.verbosity = v,
    push: () => Logger.indentDepth += INDENT_SIZE,
    pop: () => Logger.indentDepth = Math.max(0, Logger.indentDepth - INDENT_SIZE),
    pushPop: (fn, ...args) => { 
        Logger.push(); 
        fn(...args); 
        Logger.pop(); 
    },
    reset: () => Logger.indentDepth = MIN_INDENT,
    getDepth: () => Logger.indentDepth,

    // output methods
    // abuse short circuiting to implement verbosity levels 
    info: (s) => Logger.verbosity > 2 && console.log(`${Logger.pad()}${chalk.gray("[i] " + s)}`),
    success: (s) => Logger.verbosity > 1 && console.log(`${Logger.pad()}${chalk.bold.green("[✓] " + s)}`),
    err: (s) => Logger.verbosity > 0 && console.error(`${Logger.pad()}${chalk.bold.red("[!] " + s)}`),
    warn: (s) => Logger.verbosity > 1 && console.log(`${Logger.pad()}${CHALK_ORANGE("[?] " + s)}`),
    blank: (s) => console.log(s),
    hardErr: (s) => {
        Logger.verbosity = 3; // horrible hack but we are exiting anyway ¯\_(ツ)_/¯
        Logger.err("Fatal Error: " + s);
        Logger.err("Aborting...");
        process.exit(-1);
    }
};
