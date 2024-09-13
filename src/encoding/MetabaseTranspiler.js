import { Logger } from '../io/Logger.js';
import '../typedefs.js';

/**
 * Encodes SQL queries to Metabase
 * @class MetabaseEncoder
 * @classdesc Encodes SQL queries to Metabase
 * @param {ConfigBuilder} cfg 
 * @property {ConfigBuilder} cfg - Configuration settings
 * @property {string} query - SQL query to be encoded
 */
export const MetabaseEncoder = function(cfg)
{
    this.cfg = cfg;
    this.query;
    if(!this.__proto__.constructor?.REGEX) {
        this.__proto__.constructor.REGEX = {
            // g1 = query body
            QUERY_STRING: /(?:\.Database\((?:(?:\"|\')[^\"\']*){4}\s*\")(.*)(?=\"[^\[]+?)/is,
            // g1 = param name, ?g2 = param cast
            PARAMS: /((?:@[\w]+?[\w\d]*)|(?:(?<='"&)\w+(?=&"')))((?:\:{2})[\w]+?[\w\d]*)?/gis,
            OPTIONAL_CLAUSE: /\[\s*?\[(.*?)\]\s*?\]/g, // g1 = clause body
        };
    }


    /**
     * Transpiles a PowerBI M query to Metabase.
     * @param {string} sql 
     * @returns 
     */
    this.transpile = function(sql)
    {
        Logger.info('Converting query to Metabase...');
        this.query = sql;
        // in the event an M query is copied in full, this regexp will pull the raw query 
        this.query = this.query.match(MetabaseEncoder.REGEX.QUERY_STRING)?.[1] ?? this.query;
        
        if(this.cfg.values.REPLACE_POWERBI_PARAMS) {
            this.replaceParams();
        }

        this.formatWhitespace();
        Logger.info('Metabase query assembled!');
        return this.query;
    }

    /**
     * Replaces PowerBI parameters with Metabase parameters.
     * @returns {void}
     */
    this.replaceParams = () =>
    {
        this.query = this.query.replace(MetabaseEncoder.REGEX.PARAMS, (match, varName, typeCast) => {
            return `{{${varName.replace('@', '')}}}${typeCast ? `${typeCast}` : ''}`;
        });
    }

    /**
     * Formats whitespace in the query.
     * @returns {void}
     */
    this.formatWhitespace = () => 
    {
        this.query = this.query
            .replace(/#\(lf\)/ig, '\n')
            .replace(/#\(cr\)/ig, '\r');
    }
}