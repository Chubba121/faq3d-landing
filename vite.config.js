import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { CATALOG_ENDPOINT, GOOGLE_SHEETS_CSV_URL } from './src/config/constants.js'

// ─── SEO ─────────────────────────────────────────────────────────────────────
// Dominio público del sitio, sin barra final. Es el ÚNICO lugar donde se define:
// se usa en canonical, Open Graph, robots.txt y sitemap.xml.
// Al compilar también se puede sobreescribir con la variable de entorno SITE_URL.
const SITE_URL = (process.env.SITE_URL ?? 'https://faq3d.com.ar').replace(/\/+$/, '')

const robotsTxt = () => `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

const sitemapXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

/**
 * Reemplaza %SITE_URL% y %CATALOG_URL% en index.html y genera robots.txt +
 * sitemap.xml.
 *
 * `catalogUrl` cambia según el comando: al compilar apunta al endpoint propio
 * (`api/catalog.js`), que cachea la planilla en el CDN; en `npm run dev` va
 * directo a Google, porque la función de Vercel no corre en el server de Vite.
 */
function seoFiles(catalogUrl) {
  return {
    name: 'faq3d-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', SITE_URL)
        // El script inline del index.html pide el catálogo antes de que se
        // descargue el bundle.
        .replaceAll('%CATALOG_URL%', catalogUrl)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robotsTxt())
          return
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(sitemapXml())
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml() })
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), seoFiles(command === 'serve' ? GOOGLE_SHEETS_CSV_URL : CATALOG_ENDPOINT)],
}))
