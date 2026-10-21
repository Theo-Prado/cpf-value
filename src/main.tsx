import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/theme.css';

const container = document.getElementById('root');

if (container === null) {
  throw new Error('Elemento raiz "#root" nao encontrado no documento.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
