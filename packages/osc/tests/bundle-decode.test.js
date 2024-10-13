const { deepEqual, equal } = require('assert');
const { describe, it } = require('node:test');
const osc = require('../dist/index');

const tests = [
  {
    description: 'simple contents single message',
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
    expected: {
      timeTag: [32, 0],
      contents: [{ address: '/oscillator/4/frequency', args: [{ type: 'f', value: 440 }] }],
    },
  },
  {
    decription: 'resolume bundle example',
    bytes: new Uint8Array([
      0x23, 0x62, 0x75, 0x6e, 0x64, 0x6c, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
      0x28, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6c, 0x61, 0x79, 0x65, 0x72,
      0x73, 0x2f, 0x31, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d,
      0x6d, 0x9c, 0x9c, 0x00, 0x00, 0x00, 0x2c, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e,
      0x2f, 0x73, 0x65, 0x6c, 0x65, 0x63, 0x74, 0x65, 0x64, 0x6c, 0x61, 0x79, 0x65, 0x72, 0x2f, 0x70, 0x6f, 0x73, 0x69,
      0x74, 0x69, 0x6f, 0x6e, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c, 0x9c, 0x00, 0x00, 0x00, 0x3c, 0x2f, 0x63,
      0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6c, 0x61, 0x79, 0x65, 0x72, 0x73, 0x2f, 0x31,
      0x2f, 0x63, 0x6c, 0x69, 0x70, 0x73, 0x2f, 0x34, 0x2f, 0x74, 0x72, 0x61, 0x6e, 0x73, 0x70, 0x6f, 0x72, 0x74, 0x2f,
      0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c,
      0x9c, 0x00, 0x00, 0x00, 0x38, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x73,
      0x65, 0x6c, 0x65, 0x63, 0x74, 0x65, 0x64, 0x63, 0x6c, 0x69, 0x70, 0x2f, 0x74, 0x72, 0x61, 0x6e, 0x73, 0x70, 0x6f,
      0x72, 0x74, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00,
      0x3d, 0x6d, 0x9c, 0x9c, 0x00, 0x00, 0x00, 0x28, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f,
      0x6e, 0x2f, 0x6c, 0x61, 0x79, 0x65, 0x72, 0x73, 0x2f, 0x31, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e,
      0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c, 0x9c, 0x00, 0x00, 0x00, 0x2c, 0x2f, 0x63, 0x6f, 0x6d, 0x70,
      0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x73, 0x65, 0x6c, 0x65, 0x63, 0x74, 0x65, 0x64, 0x6c, 0x61, 0x79,
      0x65, 0x72, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c,
      0x9c, 0x00, 0x00, 0x00, 0x3c, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6c,
      0x61, 0x79, 0x65, 0x72, 0x73, 0x2f, 0x31, 0x2f, 0x63, 0x6c, 0x69, 0x70, 0x73, 0x2f, 0x34, 0x2f, 0x74, 0x72, 0x61,
      0x6e, 0x73, 0x70, 0x6f, 0x72, 0x74, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x00, 0x00,
      0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c, 0x9c, 0x00, 0x00, 0x00, 0x38, 0x2f, 0x63, 0x6f, 0x6d, 0x70, 0x6f, 0x73,
      0x69, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x73, 0x65, 0x6c, 0x65, 0x63, 0x74, 0x65, 0x64, 0x63, 0x6c, 0x69, 0x70, 0x2f,
      0x74, 0x72, 0x61, 0x6e, 0x73, 0x70, 0x6f, 0x72, 0x74, 0x2f, 0x70, 0x6f, 0x73, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x66, 0x00, 0x00, 0x3d, 0x6d, 0x9c, 0x9c,
    ]),
    expected: {
      timeTag: [0, 1],
      contents: [
        {
          address: '/composition/layers/1/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/selectedlayer/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/layers/1/clips/4/transport/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/selectedclip/transport/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/layers/1/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/selectedlayer/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/layers/1/clips/4/transport/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
        {
          address: '/composition/selectedclip/transport/position',
          args: [{ type: 'f', value: 0.05801068246364593505859375 }],
        },
      ],
    },
  },
];

describe('OSC Bundle Decoding', () => {
  tests.forEach((bundleTest) => {
    it(bundleTest.description, () => {
      const [encoded, remainingBytes] = osc.bundleFromBuffer(bundleTest.bytes);
      equal(remainingBytes.length, 0);
      deepEqual(encoded, bundleTest.expected);
    });
  });
});
