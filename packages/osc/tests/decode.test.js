const { deepEqual, equal, throws } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
    {
        description: 'simple bundle',
        expected: {
          timeTag: [32, 0],
          contents: [{ address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] }],
        },
        bytes: new Uint8Array([
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
      {
        description: 'osc 1.0 spec example 1',
        bytes: new Uint8Array([
          47, 111, 115, 99, 105, 108, 108, 97, 116, 111, 114, 47, 52, 47, 102, 114, 101, 113, 117, 101, 110, 99, 121, 0, 44,
          102, 0, 0, 67, 220, 0, 0,
        ]),
        expected: { address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] },
      },
]

describe('OSC Bytes Decoding', () => {
    tests.forEach((bytesTest) => {
      it(bytesTest.description, () => {
        const [decoded, remainingBytes] = osc.fromBuffer(bytesTest.bytes);
        deepEqual(decoded, bytesTest.expected);
        equal(remainingBytes.length, 0)
      });
    });
  });