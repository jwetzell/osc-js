export type OSCType = 's' | 'i' | 'f' | 'b' | 'T' | 'F';
export type OSCArg = {
  type: OSCType;
  value: string | number | Buffer | boolean;
};

export type OSCMessage = {
  address: string;
  args: OSCArg[];
};

export type OSCTypeConverter = {
  toBuffer: (value: string | number | Buffer | boolean) => Buffer | undefined;
  fromString: (string: string) => string | number | Buffer | boolean;
};
