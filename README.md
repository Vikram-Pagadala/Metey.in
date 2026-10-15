# metey.in

Static website for METEY Engineering and Consultancy, deployed on Vercel.

## Editing the site

The HTML pages in this folder (`index.html`, `firm/`, `projects/` …) are **generated**. Don't edit them directly. Edit the sources, then rebuild:

| To change | Edit |
| --- | --- |
| Header, footer, `<head>` tags | `src/layout.html` |
| Text on a page | `src/pages/<page>.html` |
| Projects, team, practice areas, articles, stats | `assets/js/render.js` (the data lists at the top) |
| Page titles and descriptions, form endpoint | `tools/build.mjs` |
| Styles | `assets/css/site.css` (not generated) |
| Behaviour (animations, filter, form) | `assets/js/site.js` (not generated) |

```sh
node tools/build.mjs        # regenerates all pages, 404.html and sitemap.xml
```

Commit the regenerated files along with your change. Vercel serves them as they are; there is no build step on Vercel.

Adding a project to `PROJECTS` in `render.js` and rebuilding creates its page at `/projects/<id>/` and adds it to the sitemap.

## Previewing locally

The pages use root paths (`/assets/...`), so open them through a local server rather than double-clicking the file:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Enquiry form

Enquiries go to a Google Sheet and send an email notification. Setup steps: [google-apps-script/README.md](google-apps-script/README.md).
