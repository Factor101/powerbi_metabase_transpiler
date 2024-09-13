import { Logger } from "../io/Logger.js";
import { PowerTranspiler } from "./PowerTranspiler.js";
import { MetabaseEncoder } from "./MetabaseTranspiler.js";
import "../typedefs.js";

/**
 * Detects and transpiles queries.
 * @class
 * @classdesc Transpiles Metabase/Metabase SQL queries to PowerBI and vice versa
 * @param {ConfigBuilder} cfg 
 * @property {LANGUAGE} LANGUAGE - Supported query languages
 * @property {Object.<string, PowerTranspiler | MetabaseEncoder>} encoders - Query encoders
 */
export const Transpiler = function(cfg)
{
    this.LANGUAGE = {
        POWERBI: "PowerBI",
        METABASE: "Metabase"
    };

    this.encoders = {
        [this.LANGUAGE.POWERBI]: new MetabaseEncoder(cfg),
        [this.LANGUAGE.METABASE]: new PowerTranspiler(cfg)
    };

    /**
     * Detects the source language of a SQL query
     * @param {string} sql - SQL query to parse 
     * @returns {LANGUAGE} - The detected encoding
     */
    this.detectSource = function(sql)
    {
        if(!/(select|from)/i.test(sql)) {
            Logger.hardErr(`No SQL statement found in ${sql.substring(0, 30)}...`);
            return;
        }

        Logger.info('SQL statement detected');
        Logger.info('Detecting encoding...');
        
        const isPowerBI = 
            /#\((lf|cr)\)/i.test(sql) &&
            /NativeQuery\(/i.test(sql);
            ///^\s*let/i.test(sql) &&

        const isMetabase = /(?:{|\[){2}|(?:}|\[){2}/i.test(sql);
        if(isPowerBI == isMetabase) {
            Logger.hardErr('Ambiguous encoding detected!');
            return;
        }

        return isPowerBI ? this.LANGUAGE.POWERBI : this.LANGUAGE.METABASE;
    }

    /**
     * Transpiles a SQL query to an opposite language.
     * @param {string} sql - SQL query to transpile 
     * @returns {string} - Transpiled query
     */
    this.transpile = function(sql)
    {
        const encoding = this.detectSource(sql);
        Logger.success(`Detected encoding: ${encoding}`);
        return this.encoders[encoding].transpile(sql);
    }
}