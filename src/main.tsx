import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { TransitProvider } from './context/TransitContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TransitProvider>
        <App />
      </TransitProvider>
    </AuthProvider>
  </StrictMode>,
);
