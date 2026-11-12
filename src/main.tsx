import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BRAND_NAME, POWERED_BY } from './config/brandConfig';

document.title = `${BRAND_NAME} — Smart Cloud POS & ERP | ${POWERED_BY}`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

