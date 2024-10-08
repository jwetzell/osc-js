import { messageFromBuffer, messageToBuffer } from './message';
import { OSCBundle } from './models';
import { oscTypeConverterMap } from './osc-types';

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
