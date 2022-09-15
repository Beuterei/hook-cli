#!/usr/bin/env node

import yargs from 'yargs';

void yargs(process.argv.slice(2))
    .scriptName('hook-cli')
    .alias('v', 'version')
    .commandDir('modules', { extensions: ['ts', 'js'] }) // ts for dev and js for build
    .demandCommand()
    .alias('h', 'help')
    .help('help')
    .epilogue('for more information, look at the readme').argv;
