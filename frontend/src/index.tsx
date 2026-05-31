import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

import './index.css';

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const shouldUpdate = window.confirm('Доступна новая версия приложения. Перезагрузить страницу сейчас?');

    if (shouldUpdate) {
      updateSW(true);
    }
  },
});
createRoot(document.getElementById('root')!).render(<App />);
