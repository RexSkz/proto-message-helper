import React from 'react';
import ReactDOM from 'react-dom';
import { Buffer } from 'buffer/';

import { decoder, Viewer } from '../src';
import type { DecodeResult } from '../src';

import './index.less';

const Demo: React.FC = () => {
  const [modeMessage, setModeMessage] = React.useState('file');
  const [textMessage, setTextMessage] = React.useState('');
  const [modeProto, setModeProto] = React.useState('file');
  const [textProto, setTextProto] = React.useState('');
  const [result, setResult] = React.useState<DecodeResult | null>(null);
  const [sortByField, setSortByField] = React.useState(false);

  const read = (mode: string, text: string, id: string) => {
    switch (mode) {
      case 'base64': {
        if (!text) return Promise.reject('No base64 data');
        const buf = Buffer.from(text, 'base64');
        return Promise.resolve(buf);
      }
      case 'hex': {
        if (!text) return Promise.reject('No hex data');
        const buf = Buffer.from(text, 'hex');
        return Promise.resolve(buf);
      }
      case 'file': {
        return new Promise<Buffer>((resolve, reject) => {
          const file = document.getElementById(id) as HTMLInputElement;
          const fileReader = new FileReader();
          fileReader.onload = () => {
            const buf = Buffer.from(fileReader.result as ArrayBuffer);
            resolve(buf);
          };
          if (file.files && file.files.length > 0) {
            fileReader.readAsArrayBuffer(file.files[0]);
          } else {
            reject('No file selected');
          }
        });
      }
      default: {
        return Promise.reject('Unknown mode');
      }
    }
  };

  const analyse = async () => {
    const message = await read(modeMessage, textMessage, 'file-message');
    let proto: Buffer | null = null;
    try {
      proto = await read(modeProto, textProto, 'file-proto');
    } catch {
      // ignore
    }
    setResult(decoder(message, { protoFile: proto?.toString() || undefined }));
  };

  return (
    <div className="demo-root">
      <h1>Proto Message Helper</h1>
      <p>A protobuf message (binary) viewer tool which provides the better output.</p>
      <div className="demo-input">
        <div className="demo-input-message">
          <span>Binary message (required): </span>
          <select className="input-select" value={modeMessage} onChange={e => setModeMessage(e.target.value)}>
            <option value="base64">Base64</option>
            <option value="hex">Hex</option>
            <option value="file">File</option>
          </select>
          {
            modeMessage === 'file' && (
              <p style={{ margin: 0, border: '1px solid #858585', borderRadius: 4, padding: 8 }}>
                <input id="file-message" type="file" />
              </p>
            )
          }
          {
            modeMessage !== 'file' && (
              <textarea
                className="input-textbox"
                value={textMessage}
                onChange={e => setTextMessage(e.target.value)}
                rows={10}
                placeholder={modeMessage === 'base64' ? 'Input base64 string, eg. ChBxbXMu...' : 'Input hex string, e.g. 4d 5a 90 00...'}
              />
            )
          }
        </div>
        <div className="demo-input-proto">
          <span>Proto file (optional): </span>
          <select className="input-select" value={modeProto} onChange={e => setModeProto(e.target.value)}>
            <option value="base64">Base64</option>
            <option value="hex">Hex</option>
            <option value="file">File</option>
          </select>
          {
            modeProto === 'file' && (
              <p style={{ margin: 0, border: '1px solid #858585', borderRadius: 4, padding: 8 }}>
                <input id="file-proto" type="file" />
              </p>
            )
          }
          {
            modeProto !== 'file' && (
              <textarea
                className="input-textbox"
                value={textProto}
                onChange={e => setTextProto(e.target.value)}
                rows={10}
                placeholder={modeProto === 'base64' ? 'Input base64 string, eg. ChBxbXMu...' : 'Input hex string, e.g. 4d 5a 90 00...'}
              />
            )
          }
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
        <button className="analyse" onClick={analyse}>Analyse</button>
        {
          !!result && (
            <label htmlFor="sort-by-field">
              <input
                type="checkbox"
                id="sort-by-field"
                checked={sortByField}
                onChange={e => setSortByField(e.target.checked)}
              />
              Sort by field ID
            </label>
          )
        }
      </div>
      {result ? <Viewer result={result} sortByField={sortByField} /> : <pre className="output-pre">(No result)</pre>}
      <div className="demo-footer">
        <p>Made with ♥ by Rex Zeng</p>
      </div>
      <a href="https://github.com/rexskz/proto-message-helper">
        <img
          style={{ position: 'absolute', top: 0, right: 0, border: 'none' }}
          src="https://camo.githubusercontent.com/38ef81f8aca64bb9a64448d0d70f1308ef5341ab/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67"
          alt="Fork me on GitHub"
        />
      </a>
    </div>
  );
};

ReactDOM.render(<Demo />, document.getElementById('root'));
