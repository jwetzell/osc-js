export type OSCType = 's' | 'i' | 'f' | 'b';
export type OSCArg = {
  type: OSCType;
  value: string | number | Buffer;
};

export type OSCMessage = {
  address: string;
  args: OSCArg[];
};

export type OSCTypeConverter = {
  toBuffer: (value: number | string | Buffer) => Buffer | undefined;
  fromString: (string: string) => number | string | Buffer;
};
