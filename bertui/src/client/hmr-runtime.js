// bertui/src/client/hmr-runtime.js
// ONE SOLUTION - Fast Refresh HMR

(function(global) {
  let socket = null;
  let reconnectTimer = null;

  function connect() {
    const protocol = global.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${global.location.host}/__hmr`);
    
    socket.onopen = () => {
      console.log('%c🔥 HMR connected', 'color: #10b981; font-weight: bold');
    };
    
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'hmr-update') {
        console.log(`%c🔥 HMR: ${data.module} (${data.time}ms)`, 'color: #10b981');
        
        try {
          const url = new URL(data.module, global.location.origin);
          url.searchParams.set('t', Date.now());
          await import(url.toString());
          
          if (global.$RefreshRuntime$) {
            global.$RefreshRuntime$.performReactRefresh();
          }
        } catch (err) {
          console.error('HMR update failed:', err);
          global.location.reload();
        }
      }
      
      if (data.type === 'full-reload') {
        global.location.reload();
      }
    };
    
    socket.onclose = () => {
      console.log('%c⚠️ HMR disconnected, reconnecting...', 'color: #f59e0b');
      reconnectTimer = setTimeout(connect, 2000);
    };
  }

  if (global.document) {
    global.addEventListener('load', connect);
  }

  // Fast Refresh setup
  if (typeof window !== 'undefined') {
    window.$RefreshReg$ = (type, id) => {};
    window.$RefreshSig$ = () => (type) => type;
  }

})(typeof window !== 'undefined' ? window : global);

export const hmr = { connect: () => {} };