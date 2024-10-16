const { deepEqual, throws } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const goodTests = [
  {
    description: 'simple address no args',
    message: { address: '/hello', args: [] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 0, 0, 0]),
  },
  {
    description: 'simple address string arg',
    message: { address: '/hello', args: [{ type: 's', value: 'arg1' }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 115, 0, 0, 97, 114, 103, 49, 0, 0, 0, 0]),
  },
  {
    description: 'simple address integer arg',
    message: { address: '/hello', args: [{ type: 'i', value: 35 }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 105, 0, 0, 0, 0, 0, 35]),
  },
  {
    description: 'simple address float arg',
    message: { address: '/hello', args: [{ type: 'f', value: 34.5 }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 102, 0, 0, 66, 10, 0, 0]),
  },
  {
    description: 'simple address blob arg',
    message: { address: '/hello', args: [{ type: 'b', value: new TextEncoder().encode('blob') }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 98, 0, 0, 0, 0, 0, 4, 98, 108, 111, 98]),
  },
  {
    description: 'simple address True arg',
    message: { address: '/hello', args: [{ type: 'T', value: true }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 84, 0, 0]),
  },
  {
    description: 'simple address False arg',
    message: { address: '/hello', args: [{ type: 'F', value: false }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 70, 0, 0]),
  },
  {
    description: 'simple address color arg',
    message: { address: '/hello', args: [{ type: 'r', value: { r: 20, g: 21, b: 22, a: 10 } }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 114, 0, 0, 20, 21, 22, 10]),
  },
  {
    description: 'simple address nil arg',
    message: { address: '/hello', args: [{ type: 'N', value: null }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 78, 0, 0]),
  },
  {
    description: 'simple address int64 arg',
    message: { address: '/hello', args: [{ type: 'h', value: 281474976710655n }] },
    expected: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 104, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255]),
  },
  {
    description: 'simple address float64 arg',
    message: { address: '/hello', args: [{ type: 'd', value: 12.7654763 }] },
    expected: new Uint8Array([
      47, 104, 101, 108, 108, 111, 0, 0, 44, 100, 0, 0, 0x40, 0x29, 0x87, 0xec, 0x82, 0x74, 0xb9, 0xe6,
    ]),
  },
  {
    description: 'simple address array arg',
    message: {
      address: '/hello',
      args: [
        [
          { type: 'd', value: 12.7654763 },
          { type: 'i', value: 1000 },
        ],
      ],
    },
    expected: new Uint8Array([
      47, 104, 101, 108, 108, 111, 0, 0, 44, 91, 100, 105, 93, 0, 0, 0, 0x40, 0x29, 0x87, 0xec, 0x82, 0x74, 0xb9, 0xe6,
      0, 0, 3, 232,
    ]),
  },
  {
    description: 'osc 1.0 spec example 1',
    message: { address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] },
    expected: new Uint8Array([
      47, 111, 115, 99, 105, 108, 108, 97, 116, 111, 114, 47, 52, 47, 102, 114, 101, 113, 117, 101, 110, 99, 121, 0, 44,
      102, 0, 0, 67, 220, 0, 0,
    ]),
  },
  {
    description: 'osc 1.0 spec example 2',
    message: {
      address: '/foo',
      args: [
        { type: 'i', value: 1000 },
        { type: 'i', value: -1 },
        { type: 's', value: 'hello' },
        // thanks IEEE 754
        { type: 'f', value: 1.2339999675750732421875 },
        { type: 'f', value: 5.677999973297119140625 },
      ],
    },
    expected: new Uint8Array([
      47, 102, 111, 111, 0, 0, 0, 0, 44, 105, 105, 115, 102, 102, 0, 0, 0, 0, 3, 232, 255, 255, 255, 255, 104, 101, 108,
      108, 111, 0, 0, 0, 63, 157, 243, 182, 64, 181, 178, 45,
    ]),
  },
];

const badTests = [
  {
    description: 'bad string arg',
    message: { address: '/address', args: [{ type: 's', value: 123 }] },
    throwsMessage: { name: /^TypeError$/, message: /non string/ },
  },

  {
    description: 'bad integer arg',
    message: { address: '/address', args: [{ type: 'i', value: 'hi' }] },
    throwsMessage: { name: /^TypeError$/, message: /non number/ },
  },
  {
    description: 'bad float arg',
    message: { address: '/address', args: [{ type: 'f', value: 'hi' }] },
    throwsMessage: { name: /^TypeError$/, message: /non number/ },
  },
  {
    description: 'bad blob arg',
    message: { address: '/address', args: [{ type: 'b', value: 123 }] },
    throwsMessage: { name: /^TypeError$/, message: /non Uint8Array/ },
  },
  {
    description: 'unknown arg type',
    message: { address: '/address', args: [{ type: 'z', value: 123 }] },
    throwsMessage: { name: /^TypeError$/, message: /unknown type z/ },
  },
  {
    description: 'address that does not start with / should throw',
    message: { address: 'address', args: [] },
    throwsMessage: {
      name: /^Error$/,
      message: 'osc message must start with a /',
    },
  },
];

describe('OSC Message Encoding Pass', () => {
  goodTests.forEach((messageTest) => {
    it(messageTest.description, () => {
      const encoded = osc.messageToBuffer(messageTest.message);
      deepEqual(encoded, messageTest.expected);
    });
  });
});

describe('OSC Message Encoding Throws', () => {
  badTests.forEach((messageTest) => {
    it(messageTest.description, () => {
      throws(() => {
        osc.messageToBuffer(messageTest.message);
      }, messageTest.throwsMessage);
    });
  });
});
