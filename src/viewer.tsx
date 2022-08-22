import React from 'react';

import { DecodeResult, WireType } from './decoder';

import './viewer.less';

export interface ViewerProps {
  result: DecodeResult;
}

const Viewer: React.FC<ViewerProps> = props => {
  const renderData = (value: any, wireType: WireType) => {
    switch (wireType) {
      case WireType.Varint:
        return <span>{value}</span>;
      case WireType.Fixed64:
        return <span>{value}</span>;
      case WireType.LengthDelimited:
        return <span>{String.fromCharCode(...value)}</span>;
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

  return (
    <div className="proto-message-viewer">
      {
        props.result.blocks.map((message, index) => (
          <div className="proto-message-viewer-message" key={index}>
            <span>0x{message.tag.byte < 0x10 && '0'}{message.tag.byte.toString(16)}</span>
            <span>{message.tag.fieldNumber}</span>
            <span>{WireType[message.tag.wireType] || 'Unknown'}</span>
            <span className="proto-message-viewer-message-data">
              {renderData(message.value, message.tag.wireType)}
            </span>
          </div>
        ))
      }
    </div>
  );
};

Viewer.displayName = 'Viewer';

export default Viewer;
