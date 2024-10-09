const oscTypeConverterMap = {
  s: {
    fromString: (string) => string,
  },
  f: {
    fromString: (string) => Number.parseFloat(string),
  },
  i: {
    fromString: (string) => Number.parseInt(string, 10),
  },
  b: {
    fromString: (string) => Buffer.from(string, 'hex'),
  },
};

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
  argToTypedArg,
};
