import React from 'react';
import type { Buffer } from 'buffer/';

import { DecodeResult, MessageBlock, WireType } from './decoder';

import './viewer.less';

export interface ViewerProps {
  result: DecodeResult;
  sortByField?: boolean;
  showRawData?: boolean;
}

interface Part {
  value: string;
  printable: boolean;
}

const Viewer: React.FC<ViewerProps> = props => {
  const [highlightRange, setHighlightRange] = React.useState<[number, number]>([-1, -1]);

  const blocks = React.useMemo(() => {
    return props.sortByField
      ? [...props.result.blocks].sort((a, b) => a.tag.fieldNumber - b.tag.fieldNumber)
      : props.result.blocks;
  }, [props.result.blocks, props.sortByField]);

  const renderWireType = (message: MessageBlock) => {
    if (message.tag.wireType === WireType.LengthDelimited) {
      return `${WireType[message.tag.wireType]}(${message.value.length})`;
    }
    return WireType[message.tag.wireType] || 'Unknown';
  };

  const renderData = (value: any, wireType: WireType) => {
    switch (wireType) {
      case WireType.Varint:
        return <span>{value}</span>;
      case WireType.Fixed64:
        return <span>{(value as BigInt)?.toString()}</span>;
      case WireType.LengthDelimited:
        const parts: Part[] = [];
        let printablePart = '';
        let unPrintablePart = '';
        for (let i = 0; i < value.length; i++) {
          const char: number = value[i];
          if (char >= 0x20 && char <= 0x7e) {
            // is a printable ASCII character
            if (unPrintablePart) {
              parts.push({ value: unPrintablePart, printable: false });
              unPrintablePart = '';
            }
            printablePart += String.fromCharCode(char);
          } else {
            // is not a printable ASCII character
            if (printablePart) {
              parts.push({ value: printablePart, printable: true });
              printablePart = '';
            }
            unPrintablePart += `\\0x${char.toString(16).padStart(2, '0')}`;
          }
        }
        if (printablePart) {
          parts.push({ value: printablePart, printable: true });
        }
        if (unPrintablePart) {
          parts.push({ value: unPrintablePart, printable: false });
        }
        return (
          <span>
            {
              parts.map((part, index) => (
                <span
                  key={index}
                  className={`proto-message-viewer-message-data-${part.printable ? 'printable' : 'unprintable'}`}
                >
                  {part.value}
                </span>
              ))
            }
          </span>
        );
      case WireType.StartGroup:
        return <span>StartGroup</span>;
      case WireType.EndGroup:
        return <span>EndGroup</span>;
      case WireType.Fixed32:
        return <span>{value}</span>;
      default:
        return <span>/</span>;
    }
  };

  const copyText = async (e: React.MouseEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText;
    await navigator.clipboard.writeText(text);
    alert(`Copied to clipboard: ${text}`);
  };

  const renderRangeHighlight = (buffer: Buffer, range: [number, number]) => {
    const str = buffer.toString('hex').replace(/(?<=^(?:..)+)/g, ' ').trim();
    if (range[0] < 0 && range[1] < 0) return str;

    const start = range[0] * 3;
    const end = range[1] * 3 + 2;
    return (
      <>
        {str.slice(0, start)}
        <span className="proto-message-viewer-message-data-highlight">
          {str.slice(start, end)}
        </span>
        {str.slice(end)}
      </>
    );
  };

  const renderIndent = (indent: number) => {
    if (props.sortByField) return null;
    return (
      <span className="proto-message-viewer-message-indent-text">
        {'│ '.repeat(indent)}
      </span>
    );
  };

  return (
    <>
      {
        props.showRawData ? (
          <pre className="output-pre">{renderRangeHighlight(props.result.buffer, highlightRange)}</pre>
        ) : null
      }
      <div className="proto-message-viewer">
        <div className="proto-message-viewer-message proto-message-viewer-message-header">
          <span className="proto-message-viewer-message-icon">&nbsp;</span>
          <span className="proto-message-viewer-message-byte">Tag</span>
          <span className="proto-message-viewer-message-field-number">Field</span>
          <span className="proto-message-viewer-message-wire-type">WireType</span>
          <span className="proto-message-viewer-message-indent">Indent</span>
          <span className="proto-message-viewer-message-data">Data</span>
        </div>
        {
          blocks.map((message, index) => {
            const classes = [
              'proto-message-viewer-message',
              message.deprecated && 'proto-message-viewer-message-deprecated',
              message.hasError && 'proto-message-viewer-message-error',
            ].filter(Boolean).join(' ');
            const copyableProps = {
              onClick: copyText,
              title: 'Click to copy',
            };
            return (
              <div
                className={classes}
                key={index}
                onMouseEnter={() => setHighlightRange(message.range)}
                onMouseLeave={() => setHighlightRange([-1, -1])}
              >
                <span className="proto-message-viewer-message-icon">
                  {
                    message.hasError
                      ? '❌'
                      : message.deprecated
                        ? '⚠️'
                        : '✅'
                  }
                </span>
                <span className="proto-message-viewer-message-byte" {...copyableProps}>
                  0x{message.tag.byte.toString(16).padStart(2, '0')}
                </span>
                <span className="proto-message-viewer-message-field-number" {...copyableProps}>
                  0b{message.tag.fieldNumber.toString(2).padStart(5, '0')}
                  {
                    message.tag.fieldName && (
                      <abbr className="proto-message-viewer-message-field-type">
                        <span>{message.tag.fieldType}</span>
                        ({message.tag.fieldName})
                      </abbr>
                    )
                  }
                </span>
                <span className="proto-message-viewer-message-wire-type" {...copyableProps}>
                  {renderIndent(message.indent)}
                  0b{message.tag.wireType.toString(2).padStart(3, '0')}&nbsp;
                  {renderWireType(message)}
                </span>
                <span className="proto-message-viewer-message-indent" {...copyableProps}>
                  {message.indent}
                </span>
                <span className="proto-message-viewer-message-data" {...copyableProps}>
                  {renderIndent(message.indent)}
                  {renderData(message.value, message.tag.wireType)}
                </span>
              </div>
            );
          })
        }
      </div>
    </>
  );
};

Viewer.displayName = 'Viewer';

export default Viewer;
