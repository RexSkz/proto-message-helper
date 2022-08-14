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
    byte: number;
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
    const tag = { byte, fieldNumber, wireType };
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
        let length = 0;
        const originI = i;
        while (i < buf.length - 1) {
          i++;
          const v = buf.readUInt8(i);
          const msb = v & (1 << 0x7);
          if (msb === 0) {
            length = v;
            i++;
            break;
          }
          length = length << 7 | v & 0x7f;
        }
        blocks.push({
          range: [originI, i + length - 1],
          tag,
          value: buf.slice(i, i + length),
        });
        i += length;
        break;
      case WireType.StartGroup:
        console.warn('Wire type 3 (start group) is deprecated, skipping');
        blocks.push({
          range: [i, i],
          tag,
          value: null,
        });
        i += 1;
        break;
      case WireType.EndGroup:
        console.warn('Wire type 4 (end group) is deprecated, skipping');
        blocks.push({
          range: [i, i],
          tag,
          value: null,
        });
        i += 1;
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
        const err = new Error(`Unknown wire type at ${i}: ${wireType}`);
        if (options.breakOnError) {
          throw err;
        }
        console.warn(err);
        blocks.push({
          range: [i, i],
          tag,
          value: null,
        });
        i += 1;
    }
  }
  return {
    blocks,
  };
};

export default decoder;
