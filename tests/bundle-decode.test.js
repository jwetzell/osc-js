const { deepEqual } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
  {
    description: 'simple contents single message',
    expected: {
      timeTag: [32, 0],
      contents: [{ address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] }],
    },
    bundle: Buffer.concat([
      Buffer.from('#bundle', 'ascii'),
      Buffer.from([0x00]),
      Buffer.from([0, 0, 0, 32, 0, 0, 0, 0]),
      Buffer.from('00000020', 'hex'),
      Buffer.from('2f6f7363696c6c61746f722f342f6672657175656e6379002c66000043dc0000', 'hex'),
    ]),
  },
];

describe('OSC Bundle Decoding', () => {
  tests.forEach((bundleTest) => {
    it(bundleTest.description, () => {
      const encoded = osc.bundleFromBuffer(bundleTest.bundle);
      deepEqual(encoded, bundleTest.expected);
    });
  });
});
