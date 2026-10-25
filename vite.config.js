import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { GOOGLE_SHEETS_CSV_URL } from './src/config/constants.js'

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

/** Reemplaza %SITE_URL% en index.html y genera robots.txt + sitemap.xml. */
function seoFiles() {
  return {
    name: 'faq3d-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', SITE_URL)
        // La URL del CSV viene de la misma constante que usa la app: el
        // script inline del index.html pide la planilla antes de que se
        // descargue el bundle.
        .replaceAll('%SHEETS_CSV_URL%', GOOGLE_SHEETS_CSV_URL)
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

export default defineConfig({
  plugins: [react(), seoFiles()],
})
