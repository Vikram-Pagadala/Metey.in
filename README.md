# metey.in

METEY Engineering & Consultancy's static website, including the interactive 3D Engineering Lab. Built with HTML, CSS and JavaScript. Node.js 18+ is required for development; no package installation is needed.

## Work locally

```sh
npm run build     # Generate public pages and sitemap from src/
npm run check     # Check links, assets and JavaScript syntax
npm run dev       # Preview at http://localhost:8000
```

Use `PORT=8001 npm run dev` if port 8000 is busy. Preview through the server rather than opening HTML files directly, since asset URLs start at `/`.

## Repository structure

| Path | Purpose |
| --- | --- |
| `src/layout.html` | Shared page head, navigation and footer |
| `src/pages/` | Editable page content; `3d-lab.html` is the standalone Lab template |
| `src/map.svg` | Source map used on the homepage |
| `assets/css/site.css` | Shared site styles |
| `assets/css/home.css` | Homepage preview, layout and spacing |
| `assets/css/3d-lab.css` | Full Lab styles |
| `assets/js/render.js` | Project, team and article data; shared HTML/SVG renderers |
| `assets/js/site.js` | Navigation, galleries, filtering, animation and enquiry form |
| `assets/js/hero-model.js` | Homepage 3D preview and its controls |
| `assets/js/3d-lab.js` | Full Lab controls and model selection |
| `assets/js/3d-engine.js` | Shared Three.js model geometry and viewer lifecycle |
| `assets/vendor/` | Bundled Three.js and OrbitControls; keep license headers |
| `assets/uploads/` | Referenced project photos, thumbnails, portraits and publications |
| `assets/fonts/` | Locally hosted fonts |
| `tools/` | Build, validation, local server and optional map generator |
| `integrations/google-apps-script/` | Optional enquiry backend and setup guide |
| `index.html`, page folders, `404.html`, `sitemap.xml` | Generated public files committed for static hosting |

Edit the sources, then run build and check. Direct changes to generated HTML are overwritten. Adding a project to `PROJECTS` in `render.js` generates its route and sitemap entry. Page metadata and the enquiry endpoint are configured in `tools/build.mjs`.

## 3D Lab

The full viewer is at `/3d-lab/`. Direct model links accept `?model=jindal`, `?model=dundigal` or `?model=sailife`.

The homepage starts at a 50/50 architecture/structure blend and auto-spins, with controls on the right. Reduced-motion preferences pause the initial spin. The preview loads Three.js only when it approaches the viewport; other content pages do not load the 3D engine. Project thumbnails are reused by the homepage cards. Models and specifications are illustrative.

## Contact form

The Google Apps Script endpoint is currently empty. The form prepares email and WhatsApp links until a backend is configured; it does not claim successful delivery. Follow the [enquiry setup guide](integrations/google-apps-script/README.md) to enable Google Sheets and email notifications.

## Deployment and maintenance

Vercel serves the committed generated files. `.vercelignore` excludes source templates, development tools and integration code. Before pushing changes, run `npm run build` and `npm run check`, then review desktop and mobile layouts and any affected interactions. Browser automation is optional; the build and validation commands have no external dependencies.

Keep referenced photos, full-size gallery images, PDFs and local fonts. `npm run check` reports missing links and unreferenced media so future cleanup can be based on actual usage. Development dependencies, logs and browser reports are ignored by Git.
