import { bundleFromBuffer } from './bundle.js';
import { messageFromBuffer } from './message.js';
import { OSCBundle, OSCMessage } from './models.js';

export * from './models.js';
export * from './message.js';
export * from './bundle.js';

export function fromBuffer(bytes: Uint8Array): [OSCBundle | OSCMessage | undefined, Uint8Array | undefined] {
  if (bytes[0] === 47) {
    // starts with '/'
    return messageFromBuffer(bytes);
  } else if (bytes[0] === 35) {
    // starts with '#'
    return bundleFromBuffer(bytes);
  } else {
    throw new Error('bytes do not look like an OSC message or bundle');
  }
}
