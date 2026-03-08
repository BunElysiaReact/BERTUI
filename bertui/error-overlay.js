// bertui/error-overlay.js
// Drop-in error overlay for BertUI dev mode.
// Does NOT open its own WebSocket — the HMR socket in the HTML shell calls
// window.__BERTUI_SHOW_ERROR__ / window.__BERTUI_HIDE_ERROR__ directly.

(function () {
  'use strict';

  let overlayElement = null;

  function createOverlay() {
    if (overlayElement) return overlayElement;
    const overlay = document.createElement('div');
    overlay.id = 'bertui-error-overlay';
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.95);color:#fff;
      font-family:'Monaco','Menlo','Ubuntu Mono',monospace;font-size:14px;line-height:1.5;
      z-index:9999999;overflow:auto;padding:20px;box-sizing:border-box;display:none;
    `;
    document.body.appendChild(overlay);
    overlayElement = overlay;
    return overlay;
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function showError(error) {
    const overlay = createOverlay();
    const type    = error.type    || 'Runtime Error';
    const msg     = error.message || 'Unknown error';
    const stack   = error.stack   || '';
    const file    = error.file    || '';
    const loc     = [error.line, error.column].filter(Boolean).join(':');

    overlay.innerHTML = `
      <div style="max-width:1100px;margin:0 auto">
        <div style="display:flex;align-items:center;margin-bottom:28px">
          <div style="background:#ef4444;width:48px;height:48px;border-radius:50%;
                      display:flex;align-items:center;justify-content:center;
                      font-size:22px;margin-right:14px">❌</div>
          <div>
            <h1 style="margin:0;font-size:26px;color:#ef4444">${escapeHtml(type)}</h1>
            <p style="margin:4px 0 0;color:#888;font-size:13px">BertUI dev — fix the error and HMR will reload</p>
          </div>
        </div>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:18px;margin-bottom:16px">
          ${file ? `<div style="color:#fbbf24;font-weight:bold;margin-bottom:8px">${escapeHtml(file)}${loc ? ':' + loc : ''}</div>` : ''}
          <div style="color:#fff;white-space:pre-wrap;word-break:break-word">${escapeHtml(msg)}</div>
        </div>

        ${stack ? `
        <div style="background:#0a0a0a;border:1px solid #222;border-radius:8px;padding:18px;margin-bottom:16px">
          <div style="color:#888;font-weight:bold;margin-bottom:8px">Stack Trace</div>
          <pre style="margin:0;color:#ccc;white-space:pre-wrap;word-break:break-word;font-size:12px">${escapeHtml(stack)}</pre>
        </div>` : ''}

        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button onclick="window.__BERTUI_HIDE_ERROR__()"
            style="background:#3b82f6;color:#fff;border:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">
            Dismiss (Esc)
          </button>
          <button onclick="location.reload()"
            style="background:#10b981;color:#fff;border:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">
            Reload
          </button>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #333;color:#555;font-size:12px">
          💡 Save your file — HMR will recompile and reload automatically.
        </div>
      </div>`;

    overlay.style.display = 'block';
  }

  function hideError() {
    if (overlayElement) overlayElement.style.display = 'none';
  }

  function parseErrorStack(err) {
    const stack = (err && err.stack) || '';
    for (const line of stack.split('\n')) {
      const m = line.match(/\((.+):(\d+):(\d+)\)/) ||
                line.match(/at (.+):(\d+):(\d+)/)   ||
                line.match(/(.+):(\d+):(\d+)/);
      if (m) return { file: m[1].trim(), line: m[2], column: m[3] };
    }
    return {};
  }

  // Runtime errors
  window.addEventListener('error', (e) => {
    const loc = parseErrorStack(e.error || {});
    showError({
      type: 'Runtime Error',
      message: e.message,
      stack: e.error?.stack,
      file: e.filename || loc.file,
      line: e.lineno   || loc.line,
      column: e.colno  || loc.column,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    const err = e.reason;
    const loc = parseErrorStack(err);
    showError({
      type: 'Unhandled Promise Rejection',
      message: err?.message || String(e.reason),
      stack: err?.stack,
      ...loc,
    });
  });

  // Esc to dismiss
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideError(); });

  // Public API — called by the HMR socket handler in dev-server-utils.js
  window.__BERTUI_SHOW_ERROR__ = showError;
  window.__BERTUI_HIDE_ERROR__ = hideError;

  console.log('%c🔥 BertUI Error Overlay active', 'color:#10b981;font-weight:bold');
})();