import { OSCType, OSCArg, OSCMessage, OSCTypeConverter } from './models';

const oscTypeConverterMap: { [key in OSCType]: OSCTypeConverter } = {
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
      throw new Error('osc type s toBuffer called with non string value');
    },
    fromString: (string: string) => string,
  },
  f: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatBE(number);
        return buffer;
      }
      throw new Error('osc type f toBuffer called with non number value');
    },
    fromString: (string: string) => Number.parseFloat(string),
  },
  i: {
    toBuffer: (number) => {
      if (typeof number === 'number') {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32BE(number);
        return buffer;
      }
      throw new Error('osc type i toBuffer called with non number value');
    },
    fromString: (string: string) => Number.parseInt(string, 10),
  },
  b: {
    toBuffer: (data) => {
      if (Buffer.isBuffer(data)) {
        const sizeBuffer = oscTypeConverterMap.i.toBuffer(data.length);
        if (sizeBuffer) {
          const padSize = 4 - (data.length % 4);
          const padBuffer = Buffer.from(Array(padSize).fill(0));
          return Buffer.concat([sizeBuffer, data, padBuffer]);
        }
      }
      throw new Error('osc type b toBuffer called with non Buffer value');
    },
    fromString: (string: string) => Buffer.from(string, 'hex'),
  },
};

function argsToBuffer(args: OSCArg[]) {
  const argBuffers: Buffer[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const typeConverter = oscTypeConverterMap[arg.type];
    if (typeConverter === undefined) {
      throw new Error('osc type error: unknown type '.concat(arg.type));
    }

    if (typeConverter.fromString === undefined) {
      throw new Error('osc type error: no string converter for type '.concat(arg.type));
    }

    const buffer = typeConverter.toBuffer(arg.value);
    if (buffer !== undefined) {
      argBuffers.push(buffer);
    }
  }
  return Buffer.concat(argBuffers);
}

function toBuffer({ address, args }: OSCMessage) {
  const addressBuffer = oscTypeConverterMap.s.toBuffer(address);
  if (addressBuffer === undefined) {
    throw new Error('problem encoding address');
  }

  const typeString = args.map((arg) => arg.type).join('');
  const typesBuffer = oscTypeConverterMap.s.toBuffer(`,${typeString}`);
  if (typesBuffer === undefined) {
    throw new Error('problem encoding types');
  }
  const argsBuffer = argsToBuffer(args);
  return Buffer.concat([addressBuffer, typesBuffer, argsBuffer]);
}

function stringArgToTypedArg(rawArg: string, type: OSCType = 's') {
  const typeConverter = oscTypeConverterMap[type];
  if (typeConverter === undefined) {
    throw new Error('osc type error: unknown type '.concat(type));
  }

  if (typeConverter.fromString === undefined) {
    throw new Error('osc type error: no string converter for type '.concat(type));
  }

  return typeConverter.fromString(rawArg);
}

export default {
  toBuffer,
  stringArgToTypedArg,
};
