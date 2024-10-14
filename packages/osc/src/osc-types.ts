import { OSCTypeConverter, OSCTimeTag } from './models';

export const oscTypeConverterMap: { [key: string]: OSCTypeConverter } = {
  s: {
    toBuffer: (string) => {
      if (typeof string === 'string') {
        let oscString = `${string}\u0000`;
        const padSize = 4 - (oscString.length % 4);
        if (padSize < 4) {
          oscString = oscString.padEnd(oscString.length + padSize, '\u0000');
        }
        return new TextEncoder().encode(oscString);
      }
      throw new TypeError('osc type s toBuffer called with non string value');
    },
    fromBuffer: (bytes) => {
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

      return [new TextDecoder().decode(bytes.subarray(0, stringEnd)), bytes.subarray(stringPaddingEnd)];
    },
  },
  f: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const view = new DataView(new ArrayBuffer(4));
        view.setFloat32(0, number);
        return new Uint8Array(view.buffer);
      }
      throw new TypeError('osc type f toBuffer called with non number value');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 4) {
        throw new Error('not enough bytes to read a osc float');
      }
      const view = new DataView(new ArrayBuffer(4));

      buffer.slice(0, 4).forEach((byte, index) => {
        view.setUint8(index, byte);
      });

      const value = view.getFloat32(0);
      return [value, buffer.subarray(4)];
    },
  },
  i: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const view = new DataView(new ArrayBuffer(4));
        view.setInt32(0, number);
        return new Uint8Array(view.buffer);
      }
      throw new TypeError('osc type i toBuffer called with non number value');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 4) {
        throw new Error('not enough bytes to read a osc integer');
      }

      const view = new DataView(new ArrayBuffer(4));

      buffer.slice(0, 4).forEach((byte, index) => {
        view.setUint8(index, byte);
      });

      const value = view.getInt32(0);
      return [value, buffer.subarray(4)];
    },
  },
  b: {
    toBuffer: (data) => {
      if (data instanceof Uint8Array) {
        const sizeBuffer = oscTypeConverterMap.i.toBuffer(data.length);
        if (sizeBuffer) {
          let padSize = 4 - (data.length % 4);
          if (padSize === 4) {
            padSize = 0;
          }

          const buffer = new Uint8Array(4 + data.length + padSize);
          buffer.set(sizeBuffer);
          buffer.set(data, 4);
          return buffer;
        }
      }
      throw new TypeError('osc type b toBuffer called with non Uint8Array value');
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
      return new Uint8Array(0);
    },
    fromBuffer: (buffer) => {
      return [true, buffer];
    },
  },
  F: {
    toBuffer: () => {
      return new Uint8Array(0);
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
        const buffer = new Uint8Array(8);
        buffer.set(secondsBuffer);
        buffer.set(fractionalBuffer, 4);
        return buffer;
      }
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 8) {
        throw new Error('osc time tag must be at least 8 bytes');
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
  r: {
    toBuffer: (color) => {
      if (color === undefined || color === null) {
        throw new TypeError('osc type r called with undefined or null value');
      }

      if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color && 'a' in color) {
        const view = new DataView(new ArrayBuffer(4));

        view.setUint8(0, color.r);
        view.setUint8(1, color.g);
        view.setUint8(2, color.b);
        view.setUint8(3, color.a);

        return new Uint8Array(view.buffer);
      }
      throw new TypeError('osc type r called with non OSCColor object');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 4) {
        throw new Error('osc color must be at least 4 bytes');
      }

      const red = buffer[0];
      const green = buffer[1];
      const blue = buffer[2];
      const alpha = buffer[3];

      if (red !== undefined && green !== undefined && blue !== undefined && alpha !== undefined) {
        if (
          typeof red === 'number' &&
          typeof green === 'number' &&
          typeof blue === 'number' &&
          typeof alpha === 'number'
        ) {
          return [
            {
              r: red,
              g: green,
              b: blue,
              a: alpha,
            },
            buffer.subarray(4),
          ];
        }
      }
      throw new Error('problem converting osc ');
    },
  },
  N: {
    toBuffer: () => {
      return new Uint8Array(0);
    },
    fromBuffer: (buffer) => {
      return [null, buffer];
    },
  },
  I: {
    toBuffer: () => {
      return new Uint8Array();
    },
    fromBuffer: (buffer) => {
      return [Number.MAX_SAFE_INTEGER, buffer];
    },
  },
  h: {
    toBuffer: (number) => {
      const view = new DataView(new ArrayBuffer(8));

      if (typeof number === 'number') {
        view.setBigInt64(0, BigInt(number));
      } else if (typeof number === 'bigint') {
        view.setBigInt64(0, number);
      } else {
        throw new TypeError('osc type h toBuffer called with non number or bigint value');
      }
      return new Uint8Array(view.buffer);
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 8) {
        throw new Error('osc int64 must be at least 8 bytes');
      }

      const view = new DataView(new ArrayBuffer(8));
      buffer.subarray(0, 8).forEach((byte, index) => {
        view.setUint8(index, byte);
      });

      return [view.getBigInt64(0), buffer.subarray(8)];
    },
  },
  d: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const view = new DataView(new ArrayBuffer(8));
        view.setFloat64(0, number);
        return new Uint8Array(view.buffer);
      }
      throw new TypeError('osc type d toBuffer called with non number value');
    },
    fromBuffer: (buffer) => {
      if (buffer.length < 8) {
        throw new Error('not enough bytes to read a osc float');
      }
      const view = new DataView(new ArrayBuffer(8));

      buffer.subarray(0, 8).forEach((byte, index) => {
        view.setUint8(index, byte);
      });

      const value = view.getFloat64(0);
      return [value, buffer.subarray(8)];
    },
  },
};
