import React from 'react';

import { DecodeResult, MessageBlock, WireType } from './decoder';

import './viewer.less';

export interface ViewerProps {
  result: DecodeResult;
}

interface Part {
  value: string;
  printable: boolean;
}

const Viewer: React.FC<ViewerProps> = props => {
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

  return (
    <div className="proto-message-viewer">
      <div className="proto-message-viewer-message proto-message-viewer-message-header">
        <span className="proto-message-viewer-message-icon">&nbsp;</span>
        <span className="proto-message-viewer-message-byte">Tag</span>
        <span className="proto-message-viewer-message-field-number">Field</span>
        <span className="proto-message-viewer-message-wire-type">WireType</span>
        <span className="proto-message-viewer-message-data">Data</span>
      </div>
      {
        props.result.blocks.map((message, index) => {
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
            <div className={classes} key={index}>
              <span className="proto-message-viewer-message-icon">
                {
                  message.hasError
                    ? '❌'
                    : message.deprecated
                      ? '⚠️'
                      : '✅'
                }
              </span>
              <span className="proto-message-viewer-message-byte" {...copyableProps}>0x{message.tag.byte.toString(16).padStart(2, '0')}</span>
              <span className="proto-message-viewer-message-field-number" {...copyableProps}>
                {message.tag.fieldNumber}
                {message.tag.fieldName ? `(${message.tag.fieldName})` : ''}
              </span>
              <span className="proto-message-viewer-message-wire-type" {...copyableProps}>{renderWireType(message)}</span>
              <span className="proto-message-viewer-message-data" {...copyableProps}>
                {renderData(message.value, message.tag.wireType)}
              </span>
            </div>
          );
        })
      }
    </div>
  );
};

Viewer.displayName = 'Viewer';

export default Viewer;
