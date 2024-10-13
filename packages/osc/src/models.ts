export type OSCType = 's' | 'i' | 'f' | 'b' | 'T' | 'F' | 't' | 'r' | 'N';
export type OSCArg = {
  type: OSCType;
  value: string | number | Uint8Array | boolean | OSCTimeTag | OSCColor | null;
};

export type OSCTimeTag = [number, number];

export type OSCColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type OSCBundle = {
  timeTag: OSCTimeTag;
  contents: (OSCBundle | OSCMessage)[];
};

export type OSCMessage = {
  address: string;
  args: OSCArg[];
};

export type OSCTypeConverter = {
  toBuffer: (value: string | number | Uint8Array | boolean | OSCTimeTag | OSCColor | null) => Uint8Array | undefined;
  fromBuffer: (
    buffer: Uint8Array
  ) => [string | number | Uint8Array | boolean | OSCTimeTag | OSCColor | null | undefined, Uint8Array];
};
