import React from 'react';
import ReactDOM from 'react-dom';

import { decoder } from '../src';
import type { DecodeResult } from '../src';

import './index.less';

const Demo: React.FC = () => {
  const [result, setResult] = React.useState<DecodeResult | null>(null);

  return (
    <div className="demo-root">
      <h1>Proto Message Helper</h1>
      <div className="statistics">
        <img src="https://img.shields.io/npm/v/proto-message-helper.svg" />
        <img src="https://img.shields.io/npm/dm/proto-message-helper.svg" />
        <img src="https://codecov.io/gh/RexSkz/proto-message-helper/branch/master/graph/badge.svg?token=8YRG3M4WTO" />
        <iframe
          src="https://ghbtns.com/github-btn.html?user=rexskz&repo=proto-message-helper&type=star&count=true"
          frameBorder="0"
          scrolling="0"
          width="150"
          height="20"
          title="GitHub"
        />
      </div>
      <p>A protobuf message (binary) viewer tool which provide the better output.</p>
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
