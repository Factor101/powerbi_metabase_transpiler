import { Logger } from '../io/Logger.js';
import "../typedefs.js";

/**
 * Transpiles Metabase/Native Queries to PowerBI M.
 * @class PowerTranspiler
 * @classdesc Stores and transforms a Metabase/Metabase SQL query to PowerBI
 * @param {ConfigBuilder} cfg
 * @property {ConfigBuilder} cfg - Configuration settings
 * @property {string} query - SQL query to encode
 * @property {Set<string>} params - Set of parameters to replace, if any
 */
export const PowerTranspiler = function(cfg)
{
    // define static REGEX prop
    if(!this.__proto__.constructor?.REGEX) {
        this.__proto__.constructor.REGEX = {
            PARAMS: /\{\s*?\{(.*?)\}\s*\}/g, // g1 = param name
            OPTIONAL_CLAUSE: /\[\s*?\[(.*?)\]\s*?\]/g, // g1 = clause body
            QUOTES: /(?<!")"(?!")/g
        };
    }

    this.query;
    this.cfg = cfg;
    this.params = new Set();

    /**
     * Transpiles a Metabase/Native SQL query to PowerBI M.
     * @param {string} sql
     * @returns {string} transpile query
     */
    this.transpile = (sql) =>
    {
        Logger.info('Converting query to PowerBI...');
        this.query = sql;
        this.escapeQuotes();
        this.transpileMetabaseSyntax();
        this.formatWhitespace();
        return this.buildQuery();
    }

    this.escapeQuotes = () => this.query = this.query.replace(PowerTranspiler.REGEX.QUOTES, '""');

    /**
     * Builds a PowerBI query from a transformed Metabase query.
     * @returns {string} PowerBI query
     */
    this.buildQuery = () =>
    {
        Logger.info(`Assembling PowerBI query...`);
        Logger.push();

        const host = this.cfg.values.DB_HOST;
        const db = this.cfg.values.DB_NAME;
        const tab = this.cfg.values.USE_SPACES ? ' '.repeat(this.cfg.values?.TAB_SIZE ?? 4) : '\t';
        const params = Array.from(this.params);
        // heinous crimes ahead beware
        const paramHeader = params.reduce((a, b, i) => `${a}${tab + b} = ${b}, /** DEFINE PARAM TYPE HERE */${i !== params.length - 1 ? "\n" : ''}`, '');
        const paramFooter = params.length !== 0 || !this.cfg.values.REPLACE_METABASE_PARAMS
            ? `${tab.repeat(2)}[\n${params.reduce((a, b, i) => `${a}${tab.repeat(3) + b} = ${b + (i + 1 !== params.length ? ",\n" : '')}`, '')}\n${tab.repeat(2)}],`
            : `${tab.repeat(2)}null,`;
        
        Logger.info('PowerBI query assembled!');
        return (
            `let\n` +
            `${paramHeader}\n` +
            `${tab}Source = Value.NativeQuery(\n` +
            `${tab.repeat(2)}PostgreSQL.Database("${host}", "${db}"),\n` +
            `${tab.repeat(2)}"${this.query}",\n` +
            `${paramFooter}\n` +
            `${tab.repeat(2)}[EnableFolding = true]\n` +
            `${tab})\n` +
            `in\n` +
            `${tab}Source`
          );
    }

    /**
     * Transpiles Metabase specific syntax to PowerBI M,
     * such as optional clauses and parameters.
     * @returns {void}
     */
    this.transpileMetabaseSyntax = () =>
    {
        if(this.cfg.values.REMOVE_METABASE_OPTIONAL_CLAUSES) {
            Logger.pushPop(this.removeOptionalClauses);
        }
        
        if(this.cfg.values.STRIP_METABASE_OPTIONAL_CLAUSES) {
            Logger.pushPop(this.stripOptionalClauses);
        }

        if(this.cfg.values.REPLACE_METABASE_PARAMS) {
            Logger.pushPop(this.replaceParams);
        }
    }

    /**
     * Formats whitespace in the query, removing newlines and tabs.
     * @returns {void}
     */
    this.formatWhitespace = () =>
    {
        if(this.cfg.values.INLINE_POWERBI_QUERY) {
            this.makeInline();
        }

        if(this.cfg.values.USE_SPACES && /\t/.test(this.query)) {
            this.query = this.query.replace(/\t/g, ' '.repeat(this.cfg.values.TAB_SIZE));
        }
    }


    /**
     * Replaces newlines and carriage returns with PowerBI syntax.
     * @returns {void}
     */
    this.makeInline = () =>
    {
        this.query = this.query
            .replace(/\n/g, '#(lf)') // replace line feeds
            .replace(/\r/g, '#(cr)'); // replace carriage returns
    }

    /**
     * Replaces Metabase parameters with PowerBI M syntax.
     * @returns {void}
     */
    this.replaceParams = () =>
    {
        Logger.info("Attempting to replace Metabase parameters...");
        Logger.warn("Ensure paramaters are properly implemented in PowerBI");
        Logger.push();

        // replace Metabase syntax params
        // e.g. {{param}} -> @param
        this.query = this.query.replace(PowerTranspiler.REGEX.PARAMS, (match, p1) => {
            //Logger.info(`Replaced Metabase parameter: "{{${p1}}}"`);
            this.params.add(p1);
            return `@${p1}`;
        });

        Logger.pop();
    }

    /**
     * Strips Metabase optional clauses within the query.
     * @returns {void}
     */
    this.stripOptionalClauses = () =>
    {
        Logger.info("Attempting to strip Metabase Optional Clauses...");
        Logger.push();

        // strip Metabase optional clauses
        // e.g. [[ where foo is bar ... ]] -> where foo is bar ...
        this.query = this.query.replace(PowerTranspiler.REGEX.OPTIONAL_CLAUSE, (match, p1) => {
            Logger.info(`Stripped Metabase Optional Clause: [[${p1}]]`);
            return p1;
        });

        Logger.pop();
    }

    /**
     * Removes Metabase optional clauses from the query.
     * @returns {void}
     */
    this.removeOptionalClauses = () =>
    {
        Logger.info("Attempting to remove Metabase Optional Clauses...");
        Logger.warn("This may break queries chaining optional clauses with metabase SQL");
        Logger.push();

        // remove Metabase optional clauses
        // e.g. [[ where foo is bar ... ]] -> ''
        this.query = this.query.replace(PowerTranspiler.REGEX.OPTIONAL_CLAUSE, (match) => {
            Logger.info(`Removed Metabase Optional Clause: ${match.substring(0, 10)}...`);
            return '';
        });

        Logger.pop();
    }
}