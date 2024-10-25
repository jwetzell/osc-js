const { deepEqual } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/cjs/index');

const tests = [
  {
    description: 'simple contents single message',
    bundle: {
      timeTag: [32, 0],
      contents: [{ address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] }],
    },
    expected: new Uint8Array([
      ...new TextEncoder().encode('#bundle'),
      ...new Uint8Array([0x00]),
      ...new Uint8Array([0, 0, 0, 32, 0, 0, 0, 0]),
      ...new Uint8Array([0x00, 0x00, 0x00, 0x20]),
      ...new Uint8Array([
        0x2f, 0x6f, 0x73, 0x63, 0x69, 0x6c, 0x6c, 0x61, 0x74, 0x6f, 0x72, 0x2f, 0x34, 0x2f, 0x66, 0x72, 0x65, 0x71,
        0x75, 0x65, 0x6e, 0x63, 0x79, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x43, 0xdc, 0x00, 0x00,
      ]),
    ]),
  },
];

describe('OSC Bundle Encoding', () => {
  tests.forEach((bundleTest) => {
    it(bundleTest.description, () => {
      const encoded = osc.bundleToBuffer(bundleTest.bundle);
      deepEqual(encoded, bundleTest.expected);
    });
  });
});
