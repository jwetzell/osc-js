const oscTypeConverterMap = {
  s: {
    toBuffer: (string) => {
      let oscString = `${string}\u0000`;
      const padSize = 4 - (oscString.length % 4);
      if (padSize < 4) {
        oscString = oscString.padEnd(oscString.length + padSize, '\u0000');
      }
      return Buffer.from(oscString, 'ascii');
    },
    fromString: (string) => string,
  },
  f: {
    toBuffer: (number) => {
      const buffer = Buffer.alloc(4);
      buffer.writeFloatBE(number);
      return buffer;
    },
    fromString: (string) => Number.parseFloat(string),
  },
  i: {
    toBuffer: (number) => {
      const buffer = Buffer.alloc(4);
      buffer.writeInt32BE(number);
      return buffer;
    },
    fromString: (string) => Number.parseInt(string, 10),
  },
  b: {
    toBuffer: (data) => {
      const sizeBuffer = oscTypeConverterMap.i.toBuffer(data.length);
      const padSize = 4 - (data.length % 4);
      const padBuffer = Buffer.from(Array(padSize).fill(0));
      return Buffer.concat([sizeBuffer, data, padBuffer]);
    },
    fromString: (string) => Buffer.from(string, 'hex'),
  },
};

function argsToBuffer(args) {
  const argBuffers = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const typeConverter = oscTypeConverterMap[arg.type];
    if (typeConverter === undefined) {
      throw new Error('osc type error: unknown type '.concat(arg.type));
    }

    if (typeConverter.fromString === undefined) {
      throw new Error('osc type error: no string converter for type '.concat(arg.type));
    }

    argBuffers.push(typeConverter.toBuffer(arg.value));
  }
  return Buffer.concat(argBuffers);
}

function toBuffer({ address, args }) {
  const addressBuffer = oscTypeConverterMap.s.toBuffer(address);
  const typeString = args.map((arg) => arg.type).join('');
  const typesBuffer = oscTypeConverterMap.s.toBuffer(`,${typeString}`);
  const argsBuffer = argsToBuffer(args);
  return Buffer.concat([addressBuffer, typesBuffer, argsBuffer]);
}

function argToTypedArg(rawArg, type = 's') {
  const typeConverter = oscTypeConverterMap[type];
  if (typeConverter === undefined) {
    throw new Error('osc type error: unknown type '.concat(type));
  }

  if (typeConverter.fromString === undefined) {
    throw new Error('osc type error: no string converter for type '.concat(type));
  }

  return typeConverter.fromString(rawArg);
}

module.exports = {
  toBuffer,
  argToTypedArg,
};
