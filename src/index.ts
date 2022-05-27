import yargs from 'yargs';
import packageJson from '../package.json';

yargs(process.argv.slice(2))
    .scriptName('hook-cli')
    .alias('v', 'version')
    .version(packageJson.version)
    .commandDir('modules', { extensions: ['ts'] })
    .demandCommand()
    .alias('h', 'help')
    .help('help')
    .epilogue('for more information, look at the readme').argv;
