import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

import './index.css';

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Доступна новая версия приложения. Перезагрузить страницу сейчас?')) {
      updateSW(true);
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);
