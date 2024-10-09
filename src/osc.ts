import { OSCType, OSCArg, OSCMessage, OSCTypeConverter, OSCBundle, OSCTimeTag } from './models';

const oscTypeConverterMap: { [key: string]: OSCTypeConverter } = {
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

function argsToBuffer(args: OSCArg[]) {
  const argBuffers: Buffer[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const typeConverter = oscTypeConverterMap[arg.type];
    if (typeConverter === undefined) {
      throw new TypeError('unknown type '.concat(arg.type));
    }

    const buffer = typeConverter.toBuffer(arg.value);
    if (buffer !== undefined) {
      argBuffers.push(buffer);
    }
  }
  return Buffer.concat(argBuffers);
}

export function messageToBuffer(message: OSCMessage): Buffer {
  const addressBuffer = oscTypeConverterMap.s.toBuffer(message.address);
  if (addressBuffer === undefined) {
    throw new Error('problem encoding address');
  }

  const typeString = message.args.map((arg) => arg.type).join('');
  const typesBuffer = oscTypeConverterMap.s.toBuffer(`,${typeString}`);
  if (typesBuffer === undefined) {
    throw new Error('problem encoding types');
  }
  const argsBuffer = argsToBuffer(message.args);
  return Buffer.concat([addressBuffer, typesBuffer, argsBuffer]);
}

export function messageFromBuffer(bytes: Buffer): OSCMessage | undefined {
  if (bytes[0] !== 47) {
    throw new Error('osc message must start with a /');
  }

  const oscArgs: OSCArg[] = [];

  const [address, bytesAfterAddress] = oscTypeConverterMap.s.fromBuffer(bytes);
  if (typeof address === 'string') {
    let [typeString, bytesAfterType] = oscTypeConverterMap.s.fromBuffer(bytesAfterAddress);
    if (typeof typeString === 'string') {
      if (!typeString.startsWith(',')) {
        throw new Error('osc type string must start with a ,');
      }
      let argsBuffer = bytesAfterType;
      for (let index = 1; index < typeString.length; index++) {
        const argType = typeString.charAt(index) as OSCType;

        const oscTypeConverter = oscTypeConverterMap[argType];
        if (oscTypeConverter === undefined) {
          throw new Error('unknown OSC type');
        }
        const [value, remainingBytes] = oscTypeConverter.fromBuffer(argsBuffer);
        if (value !== undefined) {
          const arg: OSCArg = {
            type: argType,
            value: value,
          };
          oscArgs.push(arg);
        }
        argsBuffer = remainingBytes;
      }

      return {
        address,
        args: oscArgs,
      };
    }
  }
}

export function bundleFromBuffer(bytes: Buffer): OSCBundle | undefined {
  if (bytes.length < 8) {
    throw new Error('bundle has to be at least 20 bytes');
  }

  if (bytes.subarray(0, 7).toString('ascii') !== '#bundle') {
    throw new Error('bundle must start with #bundle');
  }

  const [bundleHeader, bytesAfterHeader] = oscTypeConverterMap.s.fromBuffer(bytes);
  let [timeTag, bytesAfterTimeTag] = oscTypeConverterMap.t.fromBuffer(bytesAfterHeader);

  if (!Array.isArray(timeTag)) {
    throw new Error('problem getting bundle time tag');
  }

  const bundleContents = [];

  let endOfBundle = false;

  let [contentSize, remainingBytes] = oscTypeConverterMap.i.fromBuffer(bytesAfterTimeTag);
  if (typeof contentSize === 'number') {
    while (!endOfBundle) {
      if (remainingBytes.length < contentSize) {
        throw new Error('bundle does not contain enough data');
      }

      const bundleContentBytes = remainingBytes.subarray(0, contentSize);
      console.log(bundleContentBytes);

      if (bundleContentBytes[0] === 35) {
        // # character indicating contents is a bundle
        const content = bundleFromBuffer(bundleContentBytes);
        if (content) {
          bundleContents.push(content);
        }
      } else if (bundleContentBytes[0] === 47) {
        const content = messageFromBuffer(bundleContentBytes);
        if (content) {
          bundleContents.push(content);
        }
      } else {
        throw new Error('bundle contents does not look like a OSC message or bundle');
      }

      remainingBytes = remainingBytes.subarray(contentSize);
      if (remainingBytes.length === 0) {
        endOfBundle = true;
      }
    }
  }

  return {
    timeTag,
    contents: bundleContents,
  };
}

export function bundleToBuffer(bundle: OSCBundle): Buffer {
  const headerBuffer = oscTypeConverterMap.s.toBuffer('#bundle');

  if (headerBuffer === undefined) {
    throw new Error('problem encoding buffer header');
  }

  const timeTagBuffer = oscTypeConverterMap.t.toBuffer(bundle.timeTag);

  if (timeTagBuffer === undefined) {
    throw new Error('problem encoding buffer time tag');
  }

  const contentsBuffers: Buffer[] = [];

  bundle.contents.forEach((bundleContent) => {
    if ('address' in bundleContent) {
      const contentBuffer = messageToBuffer(bundleContent);
      const contentSizeBuffer = oscTypeConverterMap.i.toBuffer(contentBuffer.length);

      if (contentBuffer && contentSizeBuffer) {
        contentsBuffers.push(Buffer.concat([contentSizeBuffer, contentBuffer]));
      }
    }
  });

  return Buffer.concat([headerBuffer, timeTagBuffer, ...contentsBuffers]);
}
