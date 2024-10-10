#!/usr/bin/env node

const { program } = require('commander');
const osc = require('@jwetzell/osc');
const packageInfo = require('../package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('simple util to read osc packets from stdin');
program.action(() => {
  process.stdin.on('data', (data) => {
    try {
      const message = osc.messageFromBuffer(data);
      console.log(JSON.stringify(message));
    } catch (error) {
      console.error({ error: error.toString() });
    }
  });
});
program.parse();
