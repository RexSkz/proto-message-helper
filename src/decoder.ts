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
    fieldNumbers: number[];
    fieldType?: string;
    wireType: WireType;
  };
  value: any;
  deprecated?: boolean;
  hasError?: boolean;
  indent: number;
}

export interface DecodeResult {
  buffer: Buffer;
  blocks: MessageBlock[];
  hasError: boolean;
}

export interface DecoderOptions {
  breakOnError?: boolean;
}

const defaultOptions: DecoderOptions = {
  breakOnError: false,
};

const _decoder = (
  buf: Buffer,
  options: DecoderOptions,
  indent: number,
  offset: number,
  prefix: number[] = [],
): DecodeResult => {
  options = { ...defaultOptions, ...options };

  const blocks: MessageBlock[] = [];
  let seemsNotASubMessage = false;
  let i = 0;
  while (i < buf.length) {
    const byte = buf.readUInt8(i);
    const fieldNumber = byte >> 3;
    const fieldNumbers = [...prefix, fieldNumber];
    const wireType = byte & 0x07;
    const tag = {
      byte,
      fieldNumber,
      fieldNumbers,
      wireType,
    };
    i++;
    switch (wireType) {
      case WireType.Varint:
        blocks.push({
          range: [i + offset, i + 1 + offset],
          tag,
          value: buf.readInt8(i),
          indent,
        });
        i += 1;
        break;
      case WireType.Fixed64:
        blocks.push({
          range: [i + offset, i + 8 + offset],
          tag,
          value: buf.readBigInt64BE(i),
          indent,
        });
        i += 8;
        break;
      case WireType.LengthDelimited:
        let length = 0;
        while (i < buf.length - 1) {
          const v = buf.readUInt8(i);
          const msb = v & (1 << 0x7);
          if (msb === 0) {
            length = v;
            i++;
            break;
          }
          length = length << 7 | v & 0x7f;
          i++;
        }
        if (i + length - 1 >= buf.length) {
          seemsNotASubMessage = true;
          const err = new Error(`Unexpected end of buffer at ${i + length - 1}`);
          if (options.breakOnError) {
            throw err;
          }
        }
        blocks.push({
          range: [i + offset, i + length - 1 + offset],
          tag,
          value: buf.slice(i, i + length),
          indent,
        });
        try {
          const subMessages = _decoder(
            buf.slice(i, i + length),
            options,
            indent + 1,
            i,
            fieldNumbers,
          );
          if (!subMessages.hasError) blocks.push(...subMessages.blocks);
        } catch { }
        i += length;
        break;
      case WireType.StartGroup:
        if (indent === 0) {
          console.warn('Wire type 3 (start group) is deprecated, skipping');
        }
        seemsNotASubMessage = true;
        blocks.push({
          range: [i + offset, i + offset],
          tag,
          value: null,
          deprecated: true,
          indent,
        });
        i += 1;
        break;
      case WireType.EndGroup:
        if (indent === 0) {
          console.warn('Wire type 4 (end group) is deprecated, skipping');
        }
        seemsNotASubMessage = true;
        blocks.push({
          range: [i + offset, i + offset],
          tag,
          value: null,
          deprecated: true,
          indent,
        });
        i += 1;
        break;
      case WireType.Fixed32:
        blocks.push({
          range: [i + offset, i + 4 + offset],
          tag,
          value: buf.readInt32BE(i),
          indent,
        });
        i += 4;
        break;
      default:
        seemsNotASubMessage = true;
        const err = new Error(`Unknown wire type at ${i}: ${wireType}`);
        if (options.breakOnError) {
          throw err;
        }
        if (indent === 0) {
          console.error(err);
        }
        blocks.push({
          range: [i + offset, i + offset],
          tag,
          value: null,
          hasError: true,
          indent,
        });
        i += 1;
    }
  }
  return {
    buffer: buf,
    blocks,
    hasError: seemsNotASubMessage,
  };
};

const decoder = (buf: Buffer, options?: DecoderOptions): DecodeResult => {
  return _decoder(buf, options, 0, 0, []);
};

export default decoder;
