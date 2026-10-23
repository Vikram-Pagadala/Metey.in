# Metey Engineering & Consultancy

Official website for **Metey Engineering & Consultancy Pvt Ltd** (earlier PS Engineering Consultant), architecture and structural engineering consultants in Hyderabad since 2013, with a branch office in Amaravati. METEY designs durable, sustainable and fast-to-build structures across India, from 30+ storey towers to precast mass housing, using precast, monolithic, composite, insulated wall, light gauge steel and timber construction.

🌐 **Website:** [metey.in](https://metey.in/)

---

## 🏗️ Overview

METEY provides architecture, structural consultancy, MEP (through co-consultants), interiors, peer review and value engineering, and project management consultancy. The site presents the practice, its construction technologies, team, clients and projects across India. Its content comes from the company profile of 31 May 2026.

### Key Pages & Features
- **Home (`/`)**: A full-screen slideshow of iconic projects, a client names strip, introduction and key numbers, sectors, the building-systems explorer, service cards, a project map of India, featured projects and portfolio renders.
- **About (`/about/`)**: Company story, history from PS Engineering Consultant, areas of expertise, the Director's message and the PSI affiliation.
- **Services (`/services/`)**: Six services, with the section in view marked in the side index.
- **Construction Technologies (`/technologies/`)**: Precast, monolithic, composite, insulated wall, light gauge steel, Perma form, polymer wall and timber, each in the same format: description, how it is built, the projects that used it, photographs and papers.
- **Projects (`/projects/`)**: 42 projects filterable by category and sector, or by state from the home map. Each project has a page with its key facts, a gallery with a lightbox and, where there is one, a link to the client's website.
- **Clients (`/clients/`)**: Client and project tables, and the summary of projects designed in India and abroad.
- **Team (`/team/`)**: The founder's profile, the team as cards (with a photo where one exists, otherwise initials), and the Director's international experience, kept separate from company projects.
- **Insights (`/insights/`)**: Published technical papers (PDF) and conference talks.
- **Careers (`/careers/`)** and **Contact (`/contact/`)**: Internships, offices, direct contacts, vCard and the enquiry form.

---

## 🛠️ Tech Stack

- **HTML5 & Vanilla CSS3**: Semantic markup, responsive layouts for desktop, tablet and phone, local fonts and reduced-motion support.
- **Vanilla JavaScript**: Navigation, hero slideshow, project filtering, carousel, gallery lightbox, enquiry form and scroll animation.
- **Typography**: Bodoni Moda for headings, Montserrat for labels and EB Garamond for text, hosted locally.
- **Node.js build (no dependencies)**: Generates every page from shared templates and data, plus the sitemap and `llms.txt`.
- **SEO & Performance**: Keyword-targeted titles and descriptions, JSON-LD structured data (business, website, breadcrumbs), XML sitemap with images, robots.txt, llms.txt, Open Graph and Twitter cards, responsive images with lazy loading.

---

## 📁 Project Structure

```text
metey.in/
├── src/
│   ├── data/                   # Edit these: all site content
│   │   ├── site.json           # Company details, contacts, home page and about page
│   │   ├── projects.json       # Every project: facts, description, categories, images
│   │   ├── services.json       # Services and construction technologies
│   │   ├── team.json           # Founder, team groups, director's experience
│   │   ├── clients.json        # Client tables and summary
│   │   └── insights.json       # Papers and talks
│   ├── layout.html             # Shared head, navigation and footer
│   ├── map.svg                 # India map on the home page (made by tools/make-map.py)
│   └── pages/                  # Page templates
├── assets/
│   ├── css/                    # site.css (shared), home.css
│   ├── js/
│   │   ├── render.js           # Turns the data into HTML; draws the diagrams
│   │   └── site.js             # Site interactions and enquiry form
│   ├── images/metey/           # Images from the 2026 company profile (WebP, by folder)
│   ├── uploads/                # Earlier project photos and published papers
│   ├── fonts/                  # Locally hosted fonts
│   ├── favicon.png, apple-touch-icon.png, og-image.jpg
│   └── metey-contact.vcf       # Generated
├── tools/                      # build, check, local server, map generator
├── tests/ui.mjs                # Browser tests for layouts, project pages and every button
├── integrations/
│   └── google-apps-script/     # Optional enquiry backend and setup guide
├── index.html, about/, services/, technologies/, projects/, clients/, team/,
│   insights/, careers/, contact/, 404.html   # Generated pages (do not edit)
├── sitemap.xml, llms.txt       # Generated
├── vercel.json                 # Redirects for moved pages are generated
├── robots.txt
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

- **Content changes are data edits.** Change a file in `src/data/`, then run `build` and `check`. The generated HTML in the page folders is overwritten on every build.
- **Adding a project:** add an entry to `src/data/projects.json` and put its images in `assets/images/metey/projects/<slug>/`. Its page, card, filters, sitemap entry and gallery are generated. Image sizes are read from the files, so `width` and `height` can be left out. Mark images below about 800 px wide `"lowRes": true`: they appear only as thumbnails and are never stretched.
- **Renamed or removed pages:** list the old project slug in `redirectFrom`; the build writes the redirect into `vercel.json` and removes the old folder.
- **Open questions:** any data entry can carry a `"confirm"` note. The build lists them all after each run, so nothing marked for checking is forgotten.
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
