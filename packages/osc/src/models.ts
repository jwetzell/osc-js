export type OSCType = 's' | 'i' | 'f' | 'b' | 'T' | 'F' | 't';
export type OSCArg = {
  type: OSCType;
  value: string | number | Uint8Array | boolean | OSCTimeTag;
};

export type OSCTimeTag = [number, number];

export type OSCBundle = {
  timeTag: OSCTimeTag;
  contents: (OSCBundle | OSCMessage)[];
};

export type OSCMessage = {
  address: string;
  args: OSCArg[];
};

export type OSCTypeConverter = {
  toBuffer: (value: string | number | Uint8Array | boolean | OSCTimeTag) => Uint8Array | undefined;
  fromBuffer: (buffer: Uint8Array) => [string | number | Uint8Array | boolean | OSCTimeTag | undefined, Uint8Array];
};
