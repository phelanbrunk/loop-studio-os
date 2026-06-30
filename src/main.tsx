import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0F1014',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#FFFFFF',
          fontSize: '13px',
        },
      }}
    />
  </>
);
