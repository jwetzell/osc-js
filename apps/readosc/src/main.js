#!/usr/bin/env node

const { program, Option } = require('commander');
const osc = require('@jwetzell/osc');
const packageInfo = require('../package.json');
const slip = require('slip');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('simple util to read osc packets from stdin');
program.addOption(new Option('--slip', 'slip encode message').default(false));
program.action((options) => {
  const slipDecoder = new slip.Decoder({
    onMessage: (msg) =>{
      const [message, bytesAfterMessage] = osc.messageFromBuffer(msg);
      printOSCMessage(message)
    },
    maxMessageSize: 209715200,
    bufferSize: 2048
  });
  process.stdin.on('data', (data) => {
    try {
      if (options.slip){
        slipDecoder.decode(data)
      } else {
        let remainingBytes = data;
        while (remainingBytes.length > 0) {
          try {
            const [message, bytesAfterMessage] = osc.messageFromBuffer(remainingBytes);
            remainingBytes = bytesAfterMessage;
            printOSCMessage(message)
          } catch (error) {
            console.error({ error: error.toString() });
          }
        }
      }
    } catch (error) {
      console.error({ error: error.toString() });
    }
  });
});
program.parse();

function printOSCMessage(oscMessage) {
  console.log(JSON.stringify(oscMessage));
}
