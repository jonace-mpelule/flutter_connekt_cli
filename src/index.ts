#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();

program.version('1.0.0')

program.command('start').description("Start Flutter ConneKt preview server").action(() => {
    require('./startServer')
});

program.parse(process.argv)
