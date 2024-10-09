const { deepEqual, throws } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
  {
    description: 'simple address no args',
    bytes: Buffer.from('2f68656c6c6f00002c000000', 'hex'),
    expected: { address: '/hello', args: [] },
  },
  {
    description: 'simple address string arg',
    bytes: Buffer.from('2f68656c6c6f00002c7300006172673100000000', 'hex'),
    expected: { address: '/hello', args: [{ type: 's', value: 'arg1' }] },
  },
  {
    description: 'simple address integer arg',
    bytes: Buffer.from('2f68656c6c6f00002c69000000000023', 'hex'),
    expected: { address: '/hello', args: [{ type: 'i', value: 35 }] },
  },
  {
    description: 'simple address float arg',
    bytes: Buffer.from('2f68656c6c6f00002c660000420a0000', 'hex'),
    expected: { address: '/hello', args: [{ type: 'f', value: 34.5 }] },
  },
  {
    description: 'simple address blob arg',
    bytes: Buffer.from('2f68656c6c6f00002c62000000000004626c6f62', 'hex'),
    expected: { address: '/hello', args: [{ type: 'b', value: Buffer.from('blob') }] },
  },
  {
    description: 'simple address True arg',
    bytes: Buffer.from('2f68656c6c6f00002c540000', 'hex'),
    expected: { address: '/hello', args: [{ type: 'T', value: true }] },
  },
  {
    description: 'simple address False arg',
    bytes: Buffer.from('2f68656c6c6f00002c460000', 'hex'),
    expected: { address: '/hello', args: [{ type: 'F', value: false }] },
  },
  {
    description: 'osc 1.0 spec example 1',
    bytes: Buffer.from('2f6f7363696c6c61746f722f342f6672657175656e6379002c66000043dc0000', 'hex'),
    expected: { address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] },
  },
  {
    description: 'osc 1.0 spec example 2',
    bytes: Buffer.from('2f666f6f000000002c69697366660000000003e8ffffffff68656c6c6f0000003f9df3b640b5b22d', 'hex'),
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
      const decoded = osc.messageFromBuffer(messageTest.bytes);
      deepEqual(decoded, messageTest.expected);
    });
  });

  it('bad address', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('68656c6c6f00002c660000420a0000', 'hex'));
      },
      { name: /^Error$/, message:/must start with/ }
    );
  });

  it('bad type string', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('2f68656c6c6f000066000000420a00', 'hex'));
      },
      { name: /^Error$/, message:/type string must start with/ }
    );
  });

  it('unknown type', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('2f68656c6c6f00002c7a0000420a0000', 'hex'));
      },
      { name: /^Error$/, message:/unknown/ }
    );
  });

  it('float arg missing bytes', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('2f68656c6c6f00002c660000420a00', 'hex'));
      },
      { name: /^Error$/, message:/not enough bytes/ }
    );
  });

  it('int arg missing bytes', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('2f68656c6c6f00002c690000000000', 'hex'));
      },
      { name: /^Error$/, message:/not enough bytes/ }
    );
  });

  it('blob bytes too small', () => {
    throws(
      () => {
        osc.messageFromBuffer(Buffer.from('2f68656c6c6f00002c62000000000004626c6f', 'hex'));
      },
      { name: /^Error$/, message:/not enough bytes/ }
    );
  });
});
