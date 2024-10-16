import { messageFromBuffer, messageToBuffer } from './message';
import { OSCBundle } from './models';
import { oscTypeConverterMap } from './osc-types';

export function bundleFromBuffer(bytes: Uint8Array): [OSCBundle | undefined, Uint8Array | undefined] {
  if (bytes.length < 20) {
    throw new Error('bundle has to be at least 20 bytes');
  }

  if (new TextDecoder().decode(bytes.subarray(0, 7)) !== '#bundle') {
    throw new Error('bundle must start with #bundle');
  }

  const [bundleHeader, bytesAfterHeader] = oscTypeConverterMap.s.fromBuffer(bytes);
  let [timeTag, bytesAfterTimeTag] = oscTypeConverterMap.t.fromBuffer(bytesAfterHeader);

  if (!Array.isArray(timeTag)) {
    throw new Error('problem getting bundle time tag');
  }

  const bundleContents = [];

  let endOfBundle = false;

  // let [contentSize, remainingBytes] = oscTypeConverterMap.i.fromBuffer(bytesAfterTimeTag);
  let remainingBytes = bytesAfterTimeTag;

  while (!endOfBundle) {
    let [contentSize, bytesAfterContentSize] = oscTypeConverterMap.i.fromBuffer(remainingBytes);

    if (typeof contentSize !== 'number') {
      throw new Error('problem decoding content size');
    }

    remainingBytes = bytesAfterContentSize;

    if (remainingBytes.length < contentSize) {
      throw new Error('bundle does not contain enough data');
    }

    const bundleContentBytes = bytesAfterContentSize.subarray(0, contentSize);

    if (bundleContentBytes[0] === 35) {
      // # character indicating contents is a bundle
      const [content, bytesAfterContent] = bundleFromBuffer(bundleContentBytes);
      if (content) {
        bundleContents.push(content);
      }
    } else if (bundleContentBytes[0] === 47) {
      const [content, bytesAfterContent] = messageFromBuffer(bundleContentBytes);
      if (content && content !== undefined) {
        bundleContents.push(content);
      }
    } else {
      throw new Error('bundle contents does not look like a OSC message or bundle');
    }

    remainingBytes = bytesAfterContentSize.subarray(contentSize);
    if (remainingBytes.length === 0) {
      endOfBundle = true;
    }
  }

  return [
    {
      timeTag,
      contents: bundleContents,
    },
    remainingBytes,
  ];
}

export function bundleToBuffer(bundle: OSCBundle): Uint8Array {
  const headerBuffer = oscTypeConverterMap.s.toBuffer('#bundle');

  if (headerBuffer === undefined) {
    throw new Error('problem encoding buffer header');
  }

  const timeTagBuffer = oscTypeConverterMap.t.toBuffer(bundle.timeTag);

  if (timeTagBuffer === undefined) {
    throw new Error('problem encoding buffer time tag');
  }

  const contentsBuffers: Uint8Array[] = [];

  let contentsBuffersTotalLength = 0;

  bundle.contents.forEach((bundleContent) => {
    if ('address' in bundleContent) {
      const contentBuffer = messageToBuffer(bundleContent);
      const contentSizeBuffer = oscTypeConverterMap.i.toBuffer(contentBuffer.length);

      if (contentBuffer && contentSizeBuffer) {
        const buffer = new Uint8Array(contentSizeBuffer.length + contentBuffer.length);
        buffer.set(contentSizeBuffer, 0);
        buffer.set(contentBuffer, contentSizeBuffer.length);
        contentsBuffers.push(buffer);
        contentsBuffersTotalLength += buffer.length;
      }
    }
  });

  const buffer = new Uint8Array(headerBuffer.length + timeTagBuffer.length + contentsBuffersTotalLength);
  let offset = 0;
  buffer.set(headerBuffer, offset);
  offset += headerBuffer.length;
  buffer.set(timeTagBuffer, offset);
  offset += timeTagBuffer.length;
  contentsBuffers.forEach((contentBuffer) => {
    buffer.set(contentBuffer, offset);
    offset += contentBuffer.length;
  });

  return buffer;
}
