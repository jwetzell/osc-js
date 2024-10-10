const { deepEqual, throws } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
  {
    description: 'simple address no args',
    message: { address: '/hello', args: [] },
    expected: Buffer.from('2f68656c6c6f00002c000000', 'hex'),
  },
  {
    description: 'simple address string arg',
    message: { address: '/hello', args: [{ type: 's', value: 'arg1' }] },
    expected: Buffer.from('2f68656c6c6f00002c7300006172673100000000', 'hex'),
  },
  {
    description: 'simple address integer arg',
    message: { address: '/hello', args: [{ type: 'i', value: 35 }] },
    expected: Buffer.from('2f68656c6c6f00002c69000000000023', 'hex'),
  },
  {
    description: 'simple address float arg',
    message: { address: '/hello', args: [{ type: 'f', value: 34.5 }] },
    expected: Buffer.from('2f68656c6c6f00002c660000420a0000', 'hex'),
  },
  {
    description: 'simple address blob arg',
    message: { address: '/hello', args: [{ type: 'b', value: new TextEncoder().encode('blob') }] },
    expected: Buffer.from('2f68656c6c6f00002c62000000000004626c6f62', 'hex'),
  },
  {
    description: 'simple address True arg',
    message: { address: '/hello', args: [{ type: 'T', value: true }] },
    expected: Buffer.from('2f68656c6c6f00002c540000', 'hex'),
  },
  {
    description: 'simple address False arg',
    message: { address: '/hello', args: [{ type: 'F', value: false }] },
    expected: Buffer.from('2f68656c6c6f00002c460000', 'hex'),
  },
];

describe('OSC Message Encoding', () => {
  tests.forEach((messageTest) => {
    it(messageTest.description, () => {
      const encoded = osc.messageToBuffer(messageTest.message);
      deepEqual(encoded, messageTest.expected);
    });
  });
  it('bad string arg', () => {
    throws(
      () => {
        osc.messageToBuffer({ address: '/address', args: [{ type: 's', value: 123 }] });
      },
      { name: /^TypeError$/ }
    );
  });

  it('bad integer arg', () => {
    throws(
      () => {
        osc.messageToBuffer({ address: '/address', args: [{ type: 'i', value: 'hi' }] });
      },
      { name: /^TypeError$/ }
    );
  });

  it('bad float arg', () => {
    throws(
      () => {
        osc.messageToBuffer({ address: '/address', args: [{ type: 'f', value: 'hi' }] });
      },
      { name: /^TypeError$/ }
    );
  });

  it('bad blob arg', () => {
    throws(
      () => {
        osc.messageToBuffer({ address: '/address', args: [{ type: 'b', value: 123 }] });
      },
      { name: /^TypeError$/ }
    );
  });

  it('unknown arg type', () => {
    throws(
      () => {
        osc.messageToBuffer({ address: '/address', args: [{ type: 'z', value: 123 }] });
      },
      { name: /^TypeError$/ }
    );
  });
});
