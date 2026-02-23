// bertui/src/analyzer/index.js
// Bundle analyzer - reads Bun metafile, generates HTML report

import { join, relative } from 'path';
import { existsSync } from 'fs';
import logger from '../logger/logger.js';

/**
 * Analyze build output and generate HTML report
 */
export async function analyzeBuild(outDir, options = {}) {
  const {
    open = false,
    outputFile = join(outDir, 'bundle-report.html'),
    title = 'BertUI Bundle Report',
  } = options;

  // Collect all JS files from dist/assets
  const assetsDir = join(outDir, 'assets');
  if (!existsSync(assetsDir)) {
    logger.warn('No assets directory found. Run bun run build first.');
    return null;
  }

  const files = await collectFiles(assetsDir, outDir);
  const report = generateReport(files, title, outDir);

  await Bun.write(outputFile, report);
  logger.success(`📊 Bundle report: ${outputFile}`);

  if (open) {
    try {
      const { exec } = await import('child_process');
      const cmd = process.platform === 'darwin' ? 'open' :
        process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${cmd} ${outputFile}`);
    } catch (e) {}
  }

  return { outputFile, files };
}

async function collectFiles(assetsDir, outDir) {
  const { readdirSync, statSync } = await import('fs');
  const files = [];

  function scan(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const stat = statSync(fullPath);
        const relPath = relative(outDir, fullPath);
        const ext = entry.name.split('.').pop();

        files.push({
          name: entry.name,
          path: relPath,
          size: stat.size,
          sizeKB: (stat.size / 1024).toFixed(2),
          type: getFileType(ext),
          ext,
        });
      }
    }
  }

  scan(assetsDir);
  files.sort((a, b) => b.size - a.size);
  return files;
}

function getFileType(ext) {
  if (['js', 'mjs'].includes(ext)) return 'javascript';
  if (ext === 'css') return 'css';
  if (['map'].includes(ext)) return 'sourcemap';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'].includes(ext)) return 'image';
  return 'other';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getColor(type) {
  return {
    javascript: '#3b82f6',
    css: '#8b5cf6',
    sourcemap: '#6b7280',
    image: '#f59e0b',
    other: '#10b981',
  }[type] || '#6b7280';
}

function generateReport(files, title, outDir) {
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const jsFiles = files.filter(f => f.type === 'javascript');
  const cssFiles = files.filter(f => f.type === 'css');
  const imageFiles = files.filter(f => f.type === 'image');
  const otherFiles = files.filter(f => !['javascript','css','image'].includes(f.type));

  const jsTotal = jsFiles.reduce((s, f) => s + f.size, 0);
  const cssTotal = cssFiles.reduce((s, f) => s + f.size, 0);
  const imageTotal = imageFiles.reduce((s, f) => s + f.size, 0);

  const fileRows = files.map(f => {
    const pct = totalSize > 0 ? ((f.size / totalSize) * 100).toFixed(1) : 0;
    const barWidth = Math.max(2, Math.round((f.size / (files[0]?.size || 1)) * 200));
    const color = getColor(f.type);
    return `
      <tr>
        <td class="file-name">
          <span class="dot" style="background:${color}"></span>
          ${f.name}
        </td>
        <td class="file-path">${f.path}</td>
        <td class="file-type">${f.type}</td>
        <td class="file-size">${formatBytes(f.size)}</td>
        <td class="file-pct">
          <div class="bar-wrap">
            <div class="bar" style="width:${barWidth}px;background:${color}"></div>
            <span>${pct}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  const now = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 32px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .header .badge {
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .meta { color: #64748b; font-size: 13px; margin-top: 4px; }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
    }
    .card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .card .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .section-header {
      padding: 16px 24px;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-header h2 { font-size: 15px; font-weight: 600; color: #f1f5f9; }
    .section-header .count {
      background: #334155;
      color: #94a3b8;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 12px 24px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #334155;
    }
    td {
      padding: 12px 24px;
      font-size: 13px;
      border-bottom: 1px solid #1e293b;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #263348; }
    .file-name { font-weight: 600; color: #f1f5f9; white-space: nowrap; }
    .file-path { color: #64748b; font-size: 12px; font-family: monospace; }
    .file-type { color: #94a3b8; font-size: 12px; text-transform: uppercase; }
    .file-size { font-weight: 600; color: #10b981; white-space: nowrap; }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      vertical-align: middle;
    }
    .bar-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bar {
      height: 6px;
      border-radius: 3px;
      min-width: 2px;
    }
    .bar-wrap span { color: #64748b; font-size: 12px; white-space: nowrap; }
    .filter-bar {
      display: flex;
      gap: 8px;
      padding: 16px 24px;
      border-bottom: 1px solid #334155;
      flex-wrap: wrap;
    }
    .filter-btn {
      background: #334155;
      color: #94a3b8;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: #10b981;
      color: white;
    }
    input[type="search"] {
      background: #334155;
      border: 1px solid #475569;
      color: #f1f5f9;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      width: 240px;
    }
    input[type="search"]::placeholder { color: #64748b; }
    input[type="search"]:focus { border-color: #10b981; }
    .footer { color: #64748b; font-size: 12px; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="display:flex;align-items:center;gap:12px">
        <h1>📊 ${title}</h1>
        <span class="badge">⚡ BertUI</span>
      </div>
      <p class="meta">Generated ${now} · ${outDir}</p>
    </div>
  </div>

  <div class="cards">
    <div class="card">
      <div class="label">Total Size</div>
      <div class="value" style="color:#10b981">${formatBytes(totalSize)}</div>
      <div class="sub">${files.length} files</div>
    </div>
    <div class="card">
      <div class="label">JavaScript</div>
      <div class="value" style="color:#3b82f6">${formatBytes(jsTotal)}</div>
      <div class="sub">${jsFiles.length} files</div>
    </div>
    <div class="card">
      <div class="label">CSS</div>
      <div class="value" style="color:#8b5cf6">${formatBytes(cssTotal)}</div>
      <div class="sub">${cssFiles.length} files</div>
    </div>
    <div class="card">
      <div class="label">Images</div>
      <div class="value" style="color:#f59e0b">${formatBytes(imageTotal)}</div>
      <div class="sub">${imageFiles.length} files</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>All Files</h2>
      <span class="count">${files.length}</span>
    </div>
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterFiles('all', this)">All</button>
      <button class="filter-btn" onclick="filterFiles('javascript', this)">JS</button>
      <button class="filter-btn" onclick="filterFiles('css', this)">CSS</button>
      <button class="filter-btn" onclick="filterFiles('image', this)">Images</button>
      <input type="search" id="search" placeholder="Search files..." oninput="searchFiles(this.value)">
    </div>
    <table id="files-table">
      <thead>
        <tr>
          <th>File</th>
          <th>Path</th>
          <th>Type</th>
          <th>Size</th>
          <th>% of Total</th>
        </tr>
      </thead>
      <tbody>${fileRows}</tbody>
    </table>
  </div>

  <p class="footer">Built with BertUI · bundle-report.html</p>

  <script>
    let currentFilter = 'all';
    const rows = Array.from(document.querySelectorAll('#files-table tbody tr'));

    function filterFiles(type, btn) {
      currentFilter = type;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    }

    function searchFiles(query) {
      applyFilters(query);
    }

    function applyFilters(query = document.getElementById('search').value) {
      rows.forEach(row => {
        const typeCell = row.cells[2].textContent.trim();
        const nameCell = row.cells[0].textContent.trim();
        const matchesType = currentFilter === 'all' || typeCell === currentFilter;
        const matchesSearch = !query || nameCell.toLowerCase().includes(query.toLowerCase());
        row.style.display = matchesType && matchesSearch ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}