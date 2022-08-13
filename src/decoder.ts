// The trailing slash is important, which tells the Node.JS to use the npm
// package named `buffer` instead of the core module named `buffer`.
import { Buffer } from 'buffer/';

export enum WireType {
  Varint = 0,
  Fixed64 = 1,
  LengthDelimited = 2,
  StartGroup = 3,
  EndGroup = 4,
  Fixed32 = 5,
}

export interface MessageBlock {
  range: [number, number];
  tag: {
    fieldNumber: number;
    wireType: WireType;
  };
  value: any;
}

export interface DecodeResult {
  blocks: MessageBlock[];
}

export interface DecoderOptions {
  breakOnError?: boolean;
}

const defaultOptions: DecoderOptions = {
  breakOnError: false,
};

const decoder = (buf: Buffer, options?: DecoderOptions): DecodeResult => {
  options = { ...defaultOptions, ...options };

  const blocks: MessageBlock[] = [];
  let i = 0;
  while (i < buf.length) {
    const byte = buf.readUInt8(i);
    const fieldNumber = byte >> 3;
    const wireType = byte & 0x07;
    const tag = { fieldNumber, wireType };
    switch (wireType) {
      case WireType.Varint:
        blocks.push({
          range: [i, i + 1],
          tag,
          value: buf.readInt8(i),
        });
        i += 1;
        break;
      case WireType.Fixed64:
        blocks.push({
          range: [i, i + 8],
          tag,
          value: buf.readDoubleBE(i),
        });
        i += 8;
        break;
      case WireType.LengthDelimited:
        const length = buf.readUInt32BE(i + 1);
        blocks.push({
          range: [i, i + 1 + 4 + length],
          tag,
          value: buf.slice(i + 5, i + 5 + length),
        });
        i += 5 + length;
        break;
      case WireType.StartGroup:
        blocks.push({
          range: [i, i + 1],
          tag,
          value: decoder(buf.slice(i + 1), options),
        });
        i += 1;
        break;
      case WireType.EndGroup:
        break;
      case WireType.Fixed32:
        blocks.push({
          range: [i, i + 4],
          tag,
          value: buf.readFloatBE(i),
        });
        i += 4;
        break;
      default:
        const err = new Error(`Unknown wire type: ${wireType}`);
        if (options.breakOnError) {
          throw err;
        }
        console.warn(err);
        i += 1;
    }
  }
  return {
    blocks,
  };
};

export default decoder;
