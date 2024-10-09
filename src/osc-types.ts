import { OSCType, OSCArg, OSCMessage, OSCTypeConverter, OSCBundle, OSCTimeTag } from './models';

export const oscTypeConverterMap: { [key: string]: OSCTypeConverter } = {
  s: {
    toBuffer: (string) => {
      if (typeof string === 'string') {
        let oscString = `${string}\u0000`;
        const padSize = 4 - (oscString.length % 4);
        if (padSize < 4) {
          oscString = oscString.padEnd(oscString.length + padSize, '\u0000');
        }
        return Buffer.from(oscString, 'ascii');
      }
      throw new TypeError('osc type s toBuffer called with non string value');
    },
    fromBuffer: (bytes: Buffer) => {
      let stringEnd = 0;
      let stringPaddingEnd = 0;
      for (let index = 0; index < bytes.length; index++) {
        if (bytes[index] === 0) {
          stringEnd = index;
          stringPaddingEnd = index + 1;
          const stringPadding = 4 - ((stringEnd + 1) % 4);

          if (stringPadding < 4) {
            stringPaddingEnd += stringPadding;
          }
          break;
        }
      }

      return [bytes.toString('ascii', 0, stringEnd), bytes.subarray(stringPaddingEnd)];
    },
  },
  f: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatBE(number);
        return buffer;
      }
      throw new TypeError('osc type f toBuffer called with non number value');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 4) {
        throw new Error('not enough bytes to read a osc float');
      }

      const value = buffer.readFloatBE();
      return [value, buffer.subarray(4)];
    },
  },
  i: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32BE(number);
        return buffer;
      }
      throw new TypeError('osc type i toBuffer called with non number value');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 4) {
        throw new Error('not enough bytes to read a osc integer');
      }

      const value = buffer.readInt32BE();
      return [value, buffer.subarray(4)];
    },
  },
  b: {
    toBuffer: (data) => {
      if (Buffer.isBuffer(data)) {
        const sizeBuffer = oscTypeConverterMap.i.toBuffer(data.length);
        if (sizeBuffer) {
          const padSize = 4 - (data.length % 4);
          const padBuffer = padSize < 4 ? Buffer.from(Array(padSize).fill(0)) : Buffer.from([]);
          return Buffer.concat([sizeBuffer, data, padBuffer]);
        }
      }
      throw new TypeError('osc type b toBuffer called with non Buffer value');
    },
    fromBuffer: (buffer) => {
      const [blobLength, blobBytes] = oscTypeConverterMap.i.fromBuffer(buffer);
      if (typeof blobLength === 'number') {
        if (blobBytes.length < blobLength) {
          throw new Error('not enough bytes left for blob length specified');
        }
        const value = blobBytes.subarray(0, blobLength);
        const blobPadding = 4 - (blobLength % 4);
        const blobEnd = blobPadding < 4 ? blobLength + blobPadding : blobLength;
        return [value, blobBytes.subarray(blobEnd)];
      } else {
        throw new Error('unexpected value for blob length');
      }
    },
  },
  T: {
    toBuffer: () => {
      return Buffer.alloc(0);
    },
    fromBuffer: (buffer) => {
      return [true, buffer];
    },
  },
  F: {
    toBuffer: () => {
      return Buffer.alloc(0);
    },
    fromBuffer: (buffer) => {
      return [false, buffer];
    },
  },
  t: {
    toBuffer: (timetag) => {
      if (!Array.isArray(timetag)) {
        throw new TypeError('osc type t toBuffer called with non array value');
      }

      if (timetag.length != 2) {
        throw new TypeError('osc type t array should have exactly 2 elements');
      }

      const seconds = timetag[0];
      if (typeof seconds !== 'number') {
        throw new TypeError('osc type t seconds part should be a number');
      }

      const fractional = timetag[1];
      if (typeof fractional !== 'number') {
        throw new TypeError('osc type t fractional part should be a number');
      }

      const secondsBuffer = oscTypeConverterMap.i.toBuffer(seconds);
      const fractionalBuffer = oscTypeConverterMap.i.toBuffer(fractional);

      if (secondsBuffer && fractionalBuffer) {
        return Buffer.concat([secondsBuffer, fractionalBuffer]);
      }
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 8) {
        throw new Error('osc time tag must be greater than 8 bytes');
      }
      const [seconds, bytesAfterSeconds] = oscTypeConverterMap.i.fromBuffer(buffer);
      const [fractional, bytesAfterFractional] = oscTypeConverterMap.i.fromBuffer(bytesAfterSeconds);
      if (typeof seconds === 'number' && typeof fractional === 'number') {
        const timeTag: OSCTimeTag = [seconds, fractional];
        return [timeTag, bytesAfterFractional];
      }
      return [undefined, bytesAfterFractional];
    },
  },
};
