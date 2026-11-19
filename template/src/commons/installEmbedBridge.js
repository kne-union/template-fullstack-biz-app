const EMBED_MSG_SOURCE = 'kne-pwa-document';
const EMBED_HOST_SOURCE = 'kne-app-center-home';
const SCROLLBAR_STYLE_ID = 'kne-embed-thin-scrollbar';

const THIN_SCROLLBAR_CSS = `
html.kne-embed-mobile-scroll,
html.kne-embed-mobile-scroll body {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.28) transparent;
}
html.kne-embed-mobile-scroll::-webkit-scrollbar,
html.kne-embed-mobile-scroll *::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
html.kne-embed-mobile-scroll::-webkit-scrollbar-track,
html.kne-embed-mobile-scroll *::-webkit-scrollbar-track {
  background: transparent;
}
html.kne-embed-mobile-scroll::-webkit-scrollbar-thumb,
html.kne-embed-mobile-scroll *::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.28);
  border-radius: 999px;
}
html.kne-embed-mobile-scroll::-webkit-scrollbar-thumb:hover,
html.kne-embed-mobile-scroll *::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}
`;

const ensureThinScrollbarStyle = () => {
  if (document.getElementById(SCROLLBAR_STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = SCROLLBAR_STYLE_ID;
  style.textContent = THIN_SCROLLBAR_CSS;
  document.head.appendChild(style);
};

const setMobileScrollbar = enabled => {
  ensureThinScrollbarStyle();
  document.documentElement.classList.toggle('kne-embed-mobile-scroll', !!enabled);
};

/**
 * 嵌在应用中心「主页」iframe 时上报地址变化，并响应父页后退/前进/刷新/视口。
 * 本地 CRA(3041) 不经 app-runtime HTML 注入，须在前端入口自行安装。
 */
const installEmbedBridge = () => {
  if (typeof window === 'undefined' || window.__kneEmbedBridgeInstalled) {
    return false;
  }
  try {
    if (!window.parent || window.parent === window) {
      return false;
    }
  } catch (e) {
    return false;
  }

  window.__kneEmbedBridgeInstalled = true;
  // 嵌在应用中心时默认用细滚动条；父页切电脑端可关掉
  setMobileScrollbar(true);

  const report = () => {
    try {
      window.parent.postMessage(
        {
          source: EMBED_MSG_SOURCE,
          type: 'location',
          href: String(window.location.href),
          pathname: String(window.location.pathname || ''),
          search: String(window.location.search || ''),
          hash: String(window.location.hash || '')
        },
        '*'
      );
    } catch (e) {
      // ignore
    }
  };

  ['pushState', 'replaceState'].forEach(method => {
    const original = window.history[method];
    if (!original) {
      return;
    }
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      report();
      return result;
    };
  });

  window.addEventListener('popstate', report);
  window.addEventListener('message', event => {
    const data = event && event.data;
    if (!data || data.source !== EMBED_HOST_SOURCE) {
      return;
    }
    try {
      if (data.type === 'history') {
        if (data.action === 'back') {
          window.history.back();
        } else if (data.action === 'forward') {
          window.history.forward();
        } else if (data.action === 'reload') {
          window.location.reload();
        }
      } else if (data.type === 'viewport') {
        setMobileScrollbar(data.mode === 'mobile');
      }
    } catch (e) {
      // ignore
    }
  });

  report();
  return true;
};

export default installEmbedBridge;
