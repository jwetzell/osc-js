export type OSCType = 's' | 'i' | 'f' | 'b' | 'T' | 'F' | 't';
export type OSCArg = {
  type: OSCType;
  value: string | number | Buffer | boolean | OSCTimeTag;
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
  toBuffer: (value: string | number | Buffer | boolean | OSCTimeTag) => Buffer | undefined;
  fromBuffer: (buffer: Buffer) => [string | number | Buffer | boolean | OSCTimeTag | undefined, Buffer];
};
