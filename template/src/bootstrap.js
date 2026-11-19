import { BrowserRouter } from 'react-router-dom';
import { globalInit } from './preset';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import installEmbedBridge from './commons/installEmbedBridge';

// 应用中心主页 iframe：尽早挂钩 history，供父页前进/后退
installEmbedBridge();

const root = ReactDOM.createRoot(document.getElementById('root'));
const renderRoot = async App => {
  const globalPreset = await globalInit();
  root.render(
    <BrowserRouter basename={globalPreset.appUrl.routerBasename()}>
      <App themeToken={globalPreset.themeToken} globalPreset={globalPreset} />
    </BrowserRouter>
  );
};

if (process.env.NODE_ENV === 'development') {
  import('@kne/modules-dev/dist/create-entry.css');
  import('@kne/modules-dev/dist/create-entry.modern').then(module => {
    renderRoot(module.default(({ globalPreset }) => <App globalPreset={globalPreset} />));
  });
} else {
  renderRoot(App);
}
