// bertui/src/build/sitemap-generator.js - SIMPLIFIED
import { join } from 'path';
import logger from '../../logger/logger.js';

function calculatePriority(route) {
  if (route === '/') return 1.0;
  if (route.includes(':')) return 0.6;
  const depth = route.split('/').filter(Boolean).length;
  if (depth === 1) return 0.8;
  if (depth === 2) return 0.7;
  return 0.6;
}

function generateSitemapXML(routes, baseUrl) {
  const urls = routes.map(route => {
    const url = `${baseUrl}${route.route}`;
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function generateSitemap(routes, config, outDir) {
  logger.info('🗺️  Generating sitemap.xml...');
  
  if (!config?.baseUrl) {
    logger.error('❌ baseUrl is required in bertui.config.js for sitemap generation!');
    logger.error('   Add: baseUrl: "https://your-domain.com" to your config');
    throw new Error('Missing baseUrl in config - sitemap generation failed');
  }
  
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const currentDate = new Date().toISOString().split('T')[0];
  
  logger.info(`   Base URL: ${baseUrl}`);
  
  const staticRoutes = routes.filter(r => r.type === 'static');
  logger.info(`   ${staticRoutes.length} static routes will be included in sitemap`);
  
  // SIMPLE: No file reading, just route processing
  const sitemapRoutes = staticRoutes.map(route => ({
    route: route.route,
    lastmod: currentDate,
    priority: calculatePriority(route.route)
  }));
  
  const xml = generateSitemapXML(sitemapRoutes, baseUrl);
  const sitemapPath = join(outDir, 'sitemap.xml');
  await Bun.write(sitemapPath, xml);
  
  logger.success(`✅ Sitemap generated: ${sitemapRoutes.length} URLs`);
  logger.info(`   Location: ${sitemapPath}`);
  
  return { routes: sitemapRoutes, path: sitemapPath };
}