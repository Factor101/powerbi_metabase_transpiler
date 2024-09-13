import clipboard from 'clipboardy';
import { Logger } from './Logger.js';
import '../typedefs.js';

export const ClipboardHandler = function()
{
    this.fetch = async function()
    {
        const sql = await clipboard.read();
        Logger.info("Reading clipboard...");
    }

    this.write = async function(sql)
    {
        await clipboard.write(sql);
        Logger.info("Transpiled query copied to clipboard!");
    }
}