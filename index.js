import clipboard from 'clipboardy';
import { Logger } from './src/io/Logger.js';
import { ConfigBuilder } from './src/io/ConfigBuilder.js';
import { Transpiler } from './src/encoding/Transpiler.js';

(async () => {
    try {
        const Config = new ConfigBuilder();
        const QueryTranspiler = new Transpiler(Config);
        Logger.registerVerbosity(Config.values.VERBOSITY);

        clipboard.write(
            QueryTranspiler.transpile(clipboard.readSync())
        ).then(() => {
            Logger.reset();
            Logger.success('Transpiled query copied to clipboard!');
            process.exit(0);
        }).catch((err) => {
            Logger.hardErr('Failed to write transpiled query to clipboard: ' + err.message);
            process.exit(-1);
        });
    } catch(err) {
        Logger.hardErr(err);
    }
})();