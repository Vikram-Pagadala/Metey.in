# METEY Engineering & Consultancy

Official website for **METEY Engineering & Consultancy Pvt. Ltd.**, a chartered architectural and structural engineering consultancy based in Hyderabad since 2013, with a branch office in Amaravati. METEY specialises in precast, monolithic and other fast-build construction technologies for housing, high-rise, institutional and industrial projects across India.

🌐 **Website:** [metey.in](https://metey.in/)

---

## 🏗️ Overview

METEY provides architecture, structural design and construction-stage consultancy, from concept to commissioning, and the site presents its practice, projects and research, including an interactive 3D Engineering Lab.

### Key Pages & Features
- **Home (`/`)**: Practice highlights, an interactive 3D building preview, the building-systems explorer, a project map of India and featured projects.
- **The Firm (`/firm/`)**: Principles, structural specialisms, disciplines and the studio team.
- **Practice (`/practice/`)**: Architecture and master planning, structural engineering, precast and fast-build technologies, interiors, peer review and construction-stage services.
- **Projects (`/projects/`)**: Portfolio filterable by sector, or by state from the homepage map, plus a project register. Each project has its own page with a photo gallery and lightbox.
- **Insights (`/insights/`)**: Published technical papers (PDF) and conference talks.
- **3D Lab (`/3d-lab/`)**: Interactive models with structural X-ray, floor separation, precast crane assembly, camera presets and lighting. Direct links: `?model=jindal`, `?model=dundigal`, `?model=sailife`.
- **Careers (`/careers/`)**: Internships and expressions of interest.
- **Contact (`/contact/`)**: Offices, direct contacts with copy buttons, vCard and the enquiry form.

---

## 🛠️ Tech Stack

- **HTML5 & Vanilla CSS3**: Semantic markup, responsive layouts for desktop, tablet and phone, local fonts and reduced-motion support.
- **Vanilla JavaScript**: Navigation, project filtering, carousel, gallery lightbox, enquiry form and scroll animation.
- **Three.js**: The 3D Lab and homepage preview, bundled locally in `assets/vendor/` and loaded only where needed.
- **Node.js build (no dependencies)**: Generates every page from shared templates and data, plus the sitemap and `llms.txt`.
- **SEO & Performance**: Keyword-targeted titles and descriptions, JSON-LD structured data (business, website, breadcrumbs), XML sitemap with images, robots.txt, llms.txt, Open Graph and Twitter cards, responsive images with lazy loading.

---

## 📁 Project Structure

```text
metey.in/
├── src/                        # Edit these: page sources
│   ├── layout.html             # Shared head, navigation and footer
│   ├── map.svg                 # Homepage map of India
│   └── pages/                  # Page content (3d-lab.html is a standalone page)
├── assets/
│   ├── css/                    # site.css (shared), home.css, 3d-lab.css
│   ├── js/
│   │   ├── render.js           # Project, team and article data; HTML renderers
│   │   ├── site.js             # Site interactions and enquiry form
│   │   ├── hero-model.js       # Homepage 3D preview
│   │   ├── 3d-lab.js           # 3D Lab controls
│   │   └── 3d-engine.js        # Shared Three.js models and viewer
│   ├── vendor/                 # Three.js and OrbitControls (keep license headers)
│   ├── fonts/                  # Locally hosted fonts
│   ├── uploads/                # Project photos, thumbnails, portraits and papers
│   ├── favicon.png, apple-touch-icon.png, logo.png, og-image.jpg
│   └── metey-contact.vcf
├── tools/                      # build, check, local server, map generator
├── tests/ui.mjs                # Browser tests for layouts and every button
├── integrations/
│   └── google-apps-script/     # Optional enquiry backend and setup guide
├── index.html, firm/, practice/, projects/, insights/,
│   3d-lab/, careers/, contact/, 404.html   # Generated pages (do not edit)
├── sitemap.xml, llms.txt       # Generated
├── robots.txt
├── vercel.json
└── README.md
```

---

## 💻 Development

Requires Node.js 18 or later.

```sh
npm run build     # Generate pages, sitemap.xml and llms.txt from src/
npm run check     # Links, images, fonts, PDFs, titles, descriptions, structured data, sitemap, JS syntax
npm run dev       # Preview at http://localhost:8000
npm install       # Once, for the browser tests only
npm test          # Every page at three screen sizes, then every button and control
```

- Edit `src/` and `assets/`, then run `build` and `check`. The generated HTML in the page folders is overwritten on every build.
- To add a project, add it to `PROJECTS` in `assets/js/render.js`. Its page, sitemap entry and gallery are generated.
- Page titles, descriptions and structured data live in `tools/build.mjs`. `check` fails if a title is over 70 characters or a description over 160.
- `npm test` uses Google Chrome if it is installed (or `CHROME_PATH`), otherwise Playwright's Chromium (`npx playwright install chromium`).
- Use `PORT=8001 npm run dev` if port 8000 is busy. Preview through the server, not by opening files, since asset URLs start at `/`.

---

## ✉️ Contact Form

Until a backend is configured, the form prepares an email or WhatsApp message with the visitor's details filled in. It never claims an enquiry was delivered. To save enquiries to Google Sheets with email alerts, follow the [enquiry setup guide](integrations/google-apps-script/README.md) and paste the web-app URL into `ENQUIRY_ENDPOINT` in `tools/build.mjs`.

---

## 🚀 Deployment

Vercel serves the committed generated files. `.vercelignore` keeps sources, tools, tests and integration code out of the deployment. Before pushing, run `npm run build`, `npm run check` and `npm test`.

---

## 📄 License

This project is licensed under the [Apache 2.0 License](LICENSE).
