import { OSCMessage, OSCArg, OSCType } from './models';
import { oscTypeConverterMap } from './osc-types';

function argsToBuffer(args: OSCArg[]) {
  const argBuffers: Uint8Array[] = [];
  let argBuffersTotalLength = 0;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const typeConverter = oscTypeConverterMap[arg.type];
    if (typeConverter === undefined) {
      throw new TypeError('unknown type '.concat(arg.type));
    }

    const buffer = typeConverter.toBuffer(arg.value);
    if (buffer !== undefined) {
      argBuffers.push(buffer);
      argBuffersTotalLength += buffer.length;
    }
  }
  const buffer = new Uint8Array(argBuffersTotalLength);
  let offset = 0;
  argBuffers.forEach((argBuffer) => {
    buffer.set(argBuffer, offset);
    offset += argBuffer.length;
  });
  return buffer;
}

export function messageToBuffer(message: OSCMessage): Uint8Array {
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
  const buffer = new Uint8Array(addressBuffer.length + typesBuffer.length + argsBuffer.length);
  buffer.set(addressBuffer, 0);
  buffer.set(typesBuffer, addressBuffer.length);
  buffer.set(argsBuffer, addressBuffer.length + typesBuffer.length);
  return buffer;
}

export function messageFromBuffer(bytes: Uint8Array): [OSCMessage | undefined, Uint8Array | undefined] {
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
      return [
        {
          address,
          args: oscArgs,
        },
        argsBuffer,
      ];
    }
  }
  return [undefined, undefined];
}
