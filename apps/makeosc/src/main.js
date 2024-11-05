#!/usr/bin/env node

const { Option, program } = require('commander');
const slip = require('slip');
const osc = require('@jwetzell/osc');
const { argToTypedArg } = require('./utils');
const packageInfo = require('../package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('simple util to make osc buffers');
program.addOption(new Option('--address <address>', 'OSC address').makeOptionMandatory());
program.addOption(new Option('--args <args...>', 'osc args').default([]));
program.addOption(new Option('--slip', 'slip encode message').default(false));
program.addOption(new Option('--types <types...>', 'osc arg types').choices(['s', 'i', 'f', 'b']).default([]));
program.addOption(
  new Option('-f --format <format>', 'output format').choices(['bytes', 'json', 'f', 'b']).default('bytes')
);
program.action((options) => {
  const { address, args, types, format } = options;

  const typedArgs = args?.map((rawArg, index) => {
    const argType = types[index] || 's';

    return {
      type: argType,
      value: argToTypedArg(rawArg, argType),
    };
  });

  const oscMsg = {
    address,
    args: typedArgs,
  };

  if (format === 'json') {
    process.stdout.write(JSON.stringify(oscMsg));
  } else if (format === 'bytes') {
    let oscMsgBuffer = osc.messageToBuffer(oscMsg);
    if (options.slip) {
      oscMsgBuffer = slip.encode(oscMsgBuffer);
    }
    process.stdout.write(oscMsgBuffer);
  }
});
program.parse();

process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    process.exit(0);
  }
});
