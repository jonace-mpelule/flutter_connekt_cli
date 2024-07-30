#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
program.version('1.0.0');
program.command('start').description("Start Flutter ConneKt preview server").action(() => {
    require('./startServer');
});
program.parse(process.argv);
