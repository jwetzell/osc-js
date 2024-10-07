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
    fromBuffer: (bytes: Buffer) => {
      let stringEnd = 0;
      let stringPaddingEnd = 0;
      for (let index = 0; index < bytes.length; index++) {
        if(bytes[index] === 0){
          stringEnd = index;
          stringPaddingEnd = index + 1;
          const stringPadding = 4-(stringEnd+1) % 4;

          if(stringPadding < 4){
            stringPaddingEnd += stringPadding;
          }
          break;
        }
      }

      return [bytes.toString('ascii', 0, stringEnd), bytes.subarray(stringPaddingEnd)]
    }
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
      throw new Error('osc type i toBuffer called with non number value');
    },
    fromString: (string: string) => Number.parseInt(string, 10),
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
          const padBuffer = Buffer.from(Array(padSize).fill(0));
          return Buffer.concat([sizeBuffer, data, padBuffer]);
        }
      }
      throw new Error('osc type b toBuffer called with non Buffer value');
    },
    fromString: (string: string) => Buffer.from(string, 'hex'),
    fromBuffer: (buffer) => {
      const [blobLength, blobBytes] = oscTypeConverterMap.i.fromBuffer(buffer);
      if (typeof blobLength === 'number'){
        if(blobBytes.length < blobLength){
         throw new Error('not enough bytes left for blob length specified') 
        }
        const value = blobBytes.subarray(0,blobLength)
        const blobPadding = 4- (blobLength %4)
        const blobEnd = blobPadding < 4 ? blobLength + blobPadding : blobLength
        return [value, blobBytes.subarray(blobEnd)]
      } else {
        throw new Error('unexpected value for blob length')
      }
    },
  },
  T: {
    toBuffer: () => {
      return Buffer.alloc(0)
    },
    fromString: (string: string) => true,
    fromBuffer: (buffer) => {
      return [true, buffer];
    },
  },
  F: {
    toBuffer: () => {
      return Buffer.alloc(0)
    },
    fromString: (string: string) => false,
    fromBuffer: (buffer) => {
      return [false, buffer];
    },
  }
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

export function messageToBuffer(message: OSCMessage) {

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
  if(bytes[0] !== 47){
    throw new Error('osc message must start with a /')
  }

  const oscArgs: OSCArg[] = []

  if(oscTypeConverterMap.s.fromBuffer) {
    const [address, bytesAfterAddress] = oscTypeConverterMap.s.fromBuffer(bytes)
    if(typeof address === 'string'){
      console.log(`address: ${address}`)
      console.log(`bytesAfterAddresss: ${bytesAfterAddress}`)
      let [typeString, bytesAfterType] = oscTypeConverterMap.s.fromBuffer(bytesAfterAddress)
      console.log(`typeString: ${typeString}`)
      console.log(`bytesAfterType: ${bytesAfterType}`)
      if(typeof typeString === 'string'){
        if(!typeString.startsWith(',')){
          throw new Error('osc type string must start with a ,')
        }
      }
    }
  }

  return
}