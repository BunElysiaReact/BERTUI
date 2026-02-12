// bertui/src/client/fast-refresh.js
// React Fast Refresh integration

import RefreshRuntime from 'react-refresh';

// Inject into global scope
if (typeof window !== 'undefined') {
  // Setup Fast Refresh globals
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, id);
  };
  
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
  
  // Store runtime in global
  window.$RefreshRuntime$ = RefreshRuntime;
  
  // Inject into global hook
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: (fiber) => {},
      onCommitFiberRoot: (rendererId, root) => {},
      onCommitFiberUnmount: () => {}
    };
  }
  
  // Setup refresh handler
  RefreshRuntime.injectIntoGlobalHook(window);
  
  // Create queue for batched updates
  let updateQueue = [];
  let scheduled = false;
  
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    
    queueMicrotask(() => {
      scheduled = false;
      const queue = updateQueue;
      updateQueue = [];
      
      if (queue.length > 0 && window.$RefreshRuntime$) {
        window.$RefreshRuntime$.performReactRefresh();
      }
    });
  };
  
  // Listen for HMR updates
  window.addEventListener('hmr-module-updated', (event) => {
    const { moduleId } = event.detail;
    updateQueue.push(moduleId);
    scheduleUpdate();
  });
  
  console.log('%c⚡ React Fast Refresh enabled', 'color: #3b82f6; font-weight: bold');
}

// Export for module usage
export const setupFastRefresh = () => {
  if (typeof window !== 'undefined' && window.$RefreshRuntime$) {
    return window.$RefreshRuntime$;
  }
  return null;
};

export const performReactRefresh = () => {
  if (typeof window !== 'undefined' && window.$RefreshRuntime$) {
    window.$RefreshRuntime$.performReactRefresh();
  }
};