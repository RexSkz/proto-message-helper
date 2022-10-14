import React from 'react';
import ReactDOM from 'react-dom';
import { Buffer } from 'buffer/';

import { decoder, Viewer } from '../src';
import type { DecodeResult } from '../src';

import './index.less';

const Demo: React.FC = () => {
  const [mode, setMode] = React.useState('file');
  const [text, setText] = React.useState('');
  const [result, setResult] = React.useState<DecodeResult | null>(null);

  const analyse = () => {
    switch (mode) {
      case 'base64': {
        const buf = Buffer.from(text, 'base64');
        setResult(decoder(buf));
        break;
      }
      case 'hex': {
        const buf = Buffer.from(text, 'hex');
        setResult(decoder(buf));
        break;
      }
      case 'file': {
        const file = document.getElementById('file') as HTMLInputElement;
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const buf = Buffer.from(fileReader.result as ArrayBuffer);
          console.log(buf.toString());
          setResult(decoder(buf));
        };
        if (file.files && file.files.length > 0) {
          fileReader.readAsArrayBuffer(file.files[0]);
        }
        break;
      }
    }
  };

  return (
    <div className="demo-root">
      <h1>Proto Message Helper</h1>
      <p>A protobuf message (binary) viewer tool which provides the better output.</p>
      <select className="input-select" value={mode} onChange={e => setMode(e.target.value)}>
        <option value="base64">Base64</option>
        <option value="hex">Hex</option>
        <option value="file">File (Binary)</option>
      </select>
      <button className="input-button" onClick={analyse}>Analyse</button>
      {
        mode === 'file' && (
          <p style={{ margin: '0 0 16px', border: '1px solid #bbb', borderRadius: 4, padding: 8 }}>
            <input id="file" type="file" />
          </p>
        )
      }
      {
        mode !== 'file' && (
          <textarea
            className="input-textbox"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            placeholder={mode === 'base64' ? 'Input base64 string, eg. ChBxbXMu...' : 'Input hex string, e.g. 4d 5a 90 00...'}
          />
        )
      }
      {result ? <Viewer result={result} /> : <pre className="output-pre">(No result)</pre>}
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
