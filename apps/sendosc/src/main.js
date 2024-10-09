#!/usr/bin/env node

const { Option, program } = require('commander');
const dgram = require('dgram');
const net = require('net');
const slip = require('slip');
const osc = require('./osc');
const packageInfo = require('../package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('simple util to sendosc');
program.addOption(new Option('--protocol <protocol>', 'Network protocol').choices(['tcp', 'udp']).default('udp'));
program.addOption(new Option('--host <host>', 'the host to send osc to').makeOptionMandatory());
program.addOption(new Option('--port <port>', 'the port to send osc to').makeOptionMandatory());
program.addOption(new Option('--address <address>', 'OSC address').makeOptionMandatory());
program.addOption(new Option('--args <args...>', 'osc args').default([]));
program.addOption(new Option('--slip', 'slip encode message').default(false));
program.addOption(new Option('--types <types...>', 'osc arg types').choices(['s', 'i', 'f', 'b']).default([]));
program.action((options) => {
  const { host, port, address, args, types } = options;

  const typedArgs = args?.map((rawArg, index) => {
    const argType = types[index] || 's';

    return {
      type: argType,
      value: osc.argToTypedArg(rawArg, argType),
    };
  });

  let oscMsgBuffer = osc.toBuffer({
    address,
    args: typedArgs,
  });

  if (options.slip) {
    oscMsgBuffer = slip.encode(oscMsgBuffer);
  }

  if (options.protocol === 'tcp') {
    const client = net.Socket();
    client.on('error', (error) => {
      console.error(error);
    });
    client.connect(port, host, () => {
      client.write(oscMsgBuffer, () => {
        client.destroy();
      });
    });
  } else if (options.protocol === 'udp') {
    const client = dgram.createSocket('udp4');
    client.send(oscMsgBuffer, port, host, (error) => {
      if (error) {
        console.error(error);
      }
      client.close();
    });
  }
});
program.parse();
