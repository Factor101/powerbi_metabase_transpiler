import 'dotenv/config';
import { Logger } from './Logger.js';

/**
 * @constant CONFIG_TYPES
 * @type {Object.<string, Function>}
 * @description Configuration settings and their types / constructors
 */
const CONFIG_TYPES = {
    DB_HOST: String,
    DB_NAME: String,
    REPLACE_POWERBI_PARAMS: Boolean,
    REPLACE_METABASE_PARAMS: Boolean,
    POWERBI_PARAMS_USE_CONCATENATION: Boolean,
    REMOVE_METABASE_OPTIONAL_CLAUSES: Boolean,
    STRIP_METABASE_OPTIONAL_CLAUSES: Boolean,
    INLINE_POWERBI_QUERY: Boolean,
    VERBOSITY: Number,
    USE_SPACES: Boolean,
    TAB_SIZE: Number
};

/**
 * Loads configuration settings from environment variables.
 * @class
 * @classdesc Builds and audits configuration settings
 * @property {boolean} isLoaded - Whether the configuration has been loaded
 * @property {Object} config - Configuration settings
 * @property {Function} audit - Audits the configuration settings
 */
export const ConfigBuilder = function()
{
    this.values = {
        DB_HOST: process.env?.DB_HOST,
        DB_NAME: process.env?.DB_NAME,
        REPLACE_POWERBI_PARAMS: process.env?.REPLACE_POWERBI_PARAMS,
        REPLACE_METABASE_PARAMS: process.env?.REPLACE_METABASE_PARAMS,
        POWERBI_PARAMS_USE_CONCATENATION: process.env?.POWERBI_PARAMS_USE_CONCATENATION,
        REMOVE_METABASE_OPTIONAL_CLAUSES: process.env?.REMOVE_METABASE_OPTIONAL_CLAUSES,
        STRIP_METABASE_OPTIONAL_CLAUSES: process.env?.STRIP_METABASE_OPTIONAL_CLAUSES,
        INLINE_POWERBI_QUERY: process.env?.INLINE_POWERBI_QUERY,
        VERBOSITY: process.env?.VERBOSITY,
        USE_SPACES: process.env?.USE_SPACES,
        TAB_SIZE: process.env?.TAB_SIZE
    };
    
    /**
     * Audits configuration, ensuring all settings are present and of the correct type.
     * @returns {void}
     */
    this.audit = () => 
    {
        Logger.info("Loading config...");
        Logger.push();
        Logger.info("Performing audit...");
        for(const k in this.values)
        {
            if(this.values[k] === void(0) || this.values[k] === null) {
                Logger.hardErr(`Missing configuration: ${k}`);
            }

            switch(CONFIG_TYPES[k])
            {
                case String: // all this.values values are strings already
                    break;

                case Boolean:
                    const val = this.values[k].toLowerCase();
                    const isTrue = val === 'true';

                    if(!isTrue && val !== 'false') {
                        Logger.hardErr(`Expected type "boolean" for setting "${k}", found "${val}"`);
                    }

                    this.values[k] = isTrue;
                    break;

                case Number:
                    this.values[k] = Number(this.values[k]);
                    if(isNaN(this.values[k])) {
                        Logger.hardErr(`Expected type "number" for setting "${k}", found "${this.values[k]}"`);
                    }
                    break;

                default:
                    Logger.hardErr(`Invalid type for setting "${k}"`);
                    break;
            }
        }

        if(this.values.TAB_SIZE < 0) {
            Logger.hardErr(`Setting "TAB_SIZE" must be a number, found ${this.values.TAB_SIZE}`);
        }

        if(this.values.VERBOSITY < 0 || this.values.VERBOSITY > 3) {
            Logger.err(`Setting "VERBOSITY" must be a number 0-3, found ${this.values.VERBOSITY}`);
            Logger.info("Defaulting VERBOSITY to 3...");
            this.values.VERBOSITY = 3;
        }

        if(this.values.REMOVE_METABASE_OPTIONAL_CLAUSES && this.values.STRIP_METABASE_OPTIONAL_CLAUSES) {
            Logger.warn("Settings conflict:")
            Logger.pushPop(() => {
                Logger.warn("Both REMOVE_METABASE_OPTIONAL_CLAUSES and STRIP_METABASE_OPTIONAL_CLAUSES are set to true!");
                Logger.warn("STRIP_METABASE_OPTIONAL_CLAUSES will be ignored.");
                this.values.STRIP_METABASE_OPTIONAL_CLAUSES = false;
            });
        }

        Logger.pop();
        Logger.success("Config audit complete");
    }

    this.audit();
}