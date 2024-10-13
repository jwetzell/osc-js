const { deepEqual, throws, equal } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
  {
    description: 'simple address no args',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 0, 0, 0]),
    expected: { address: '/hello', args: [] },
  },
  {
    description: 'simple address string arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 115, 0, 0, 97, 114, 103, 49, 0, 0, 0, 0]),
    expected: { address: '/hello', args: [{ type: 's', value: 'arg1' }] },
  },
  {
    description: 'simple address integer arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 105, 0, 0, 0, 0, 0, 35]),
    expected: { address: '/hello', args: [{ type: 'i', value: 35 }] },
  },
  {
    description: 'simple address float arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 102, 0, 0, 66, 10, 0, 0]),
    expected: { address: '/hello', args: [{ type: 'f', value: 34.5 }] },
  },
  {
    description: 'simple address blob arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 98, 0, 0, 0, 0, 0, 4, 98, 108, 111, 98]),
    expected: { address: '/hello', args: [{ type: 'b', value: new TextEncoder().encode('blob') }] },
  },
  {
    description: 'simple address True arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 84, 0, 0]),
    expected: { address: '/hello', args: [{ type: 'T', value: true }] },
  },
  {
    description: 'simple address False arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 70, 0, 0]),
    expected: { address: '/hello', args: [{ type: 'F', value: false }] },
  },
  {
    description: 'simple address color arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 114, 0, 0, 20, 21, 22, 10]),
    expected: { address: '/hello', args: [{ type: 'r', value: { r: 20, g: 21, b: 22, a: 10 } }] },
  },
  {
    description: 'simple address nil arg',
    bytes: new Uint8Array([47, 104, 101, 108, 108, 111, 0, 0, 44, 78, 0, 0]),
    expected: { address: '/hello', args: [{ type: 'N', value: null }] },
  },
  {
    description: 'osc 1.0 spec example 1',
    bytes: new Uint8Array([
      47, 111, 115, 99, 105, 108, 108, 97, 116, 111, 114, 47, 52, 47, 102, 114, 101, 113, 117, 101, 110, 99, 121, 0, 44,
      102, 0, 0, 67, 220, 0, 0,
    ]),
    expected: { address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] },
  },
  {
    description: 'osc 1.0 spec example 2',
    bytes: new Uint8Array([
      47, 102, 111, 111, 0, 0, 0, 0, 44, 105, 105, 115, 102, 102, 0, 0, 0, 0, 3, 232, 255, 255, 255, 255, 104, 101, 108,
      108, 111, 0, 0, 0, 63, 157, 243, 182, 64, 181, 178, 45,
    ]),
    expected: {
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
  },
];

describe('OSC Message Decoding', () => {
  tests.forEach((messageTest) => {
    it(messageTest.description, () => {
      const [decoded, remainingBytes] = osc.messageFromBuffer(messageTest.bytes);
      equal(remainingBytes.length, 0);
      deepEqual(decoded, messageTest.expected);
    });
  });

  it('bad address', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x42, 0x0a, 0x00, 0x00])
        );
      },
      { name: /^Error$/, message: /must start with/ }
    );
  });

  it('bad type string', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x66, 0x00, 0x00, 0x00, 0x42, 0x0a, 0x00])
        );
      },
      { name: /^Error$/, message: /type string must start with/ }
    );
  });

  it('unknown type', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([
            0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x2c, 0x7a, 0x00, 0x00, 0x42, 0x0a, 0x00, 0x00,
          ])
        );
      },
      { name: /^Error$/, message: /unknown/ }
    );
  });

  it('float arg missing bytes', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x42, 0x0a, 0x00])
        );
      },
      { name: /^Error$/, message: /not enough bytes/ }
    );
  });

  it('int arg missing bytes', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x2c, 0x69, 0x00, 0x00, 0x00, 0x00, 0x00])
        );
      },
      { name: /^Error$/, message: /not enough bytes/ }
    );
  });

  it('blob bytes too small', () => {
    throws(
      () => {
        osc.messageFromBuffer(
          new Uint8Array([
            0x2f, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x2c, 0x62, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x62, 0x6c,
            0x6f,
          ])
        );
      },
      { name: /^Error$/, message: /not enough bytes/ }
    );
  });
});
