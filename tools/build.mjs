// Builds the static site from src/ into the repository root.
//   node tools/build.mjs
// Edit src/layout.html, src/pages/*.html and assets/js/render.js (data), then run this
// and commit the generated pages. No dependencies; Node 18+.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

/* ---------- settings ---------- */
const SITE = "https://metey.in";
/* Paste the Google Apps Script web-app URL here (see integrations/google-apps-script/README.md).
   While it is empty, the form hands the enquiry over to email or WhatsApp instead. */
const ENQUIRY_ENDPOINT = "";
const SHARE_IMAGE = "/assets/og-image.jpg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

/* load the shared data and renderers the same way the browser does */
const ctx = { globalThis: {} };
vm.runInNewContext(read("assets/js/render.js"), ctx);
const M = ctx.globalThis.METEY;
const R = M.render;

const strip = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const attr = s => s.replace(/&(?!amp;|#\d+;|[a-z]+;)/g, "&amp;").replace(/"/g, "&quot;");

/* ---------- page list ---------- */
const BRAND = "METEY Engineering &amp; Consultancy";
const PAGES = [
  { route: "home", file: "index.html", src: "home", nav: null,
    title: `${BRAND} | Architectural &amp; Structural Engineers, Hyderabad`,
    description: "Chartered architects and structural engineers in Hyderabad, specialising in precast, monolithic and advanced structural systems for projects across India." },
  { route: "firm", src: "firm", nav: "firm",
    title: `The Firm | ${BRAND}`,
    description: "METEY Engineering and Consultancy, established in Hyderabad in 2013: principles, specialist capabilities and the team of engineers and architects." },
  { route: "practice", src: "practice", nav: "practice",
    title: `Practice Areas | ${BRAND}`,
    description: "Architecture and master planning, structural engineering, precast and fast-build technologies, interior design, peer review and construction-stage services." },
  { route: "projects", src: "projects", nav: "projects",
    title: `Projects | ${BRAND}`,
    description: "Selected METEY projects across six states: affordable housing, residential towers, corporate, institutional and industrial buildings." },
  { route: "insights", src: "insights", nav: "insights",
    title: `Insights &amp; Publications | ${BRAND}`,
    description: "Technical papers by METEY on precast connections, monolithic housing and green building technologies, and talks at national conferences." },
  { route: "3d-lab", src: "3d-lab", nav: "3d-lab", standalone: true,
    title: `3D Engineering Lab | ${BRAND}`,
    description: "Explore interactive building models with structural X-ray, floor separation, precast assembly, camera and lighting controls." },
  { route: "careers", src: "careers", nav: "careers",
    title: `Careers &amp; Internships | ${BRAND}`,
    description: "Internships and careers for architects and structural engineers at METEY, Hyderabad, under the mentorship of chartered engineers." },
  { route: "contact", src: "contact", nav: null,
    title: `Contact | ${BRAND}`,
    description: "Contact METEY Engineering and Consultancy, New Nagole, Hyderabad. Phone +91 40 2414 5925, info@metey.in. Send a project enquiry." }
];
M.PROJECTS.forEach(p => PAGES.push({
  route: "project-" + p.id, src: "project", nav: "projects", project: p,
  title: `${p.name} | ${BRAND}`,
  description: strip(`${p.text}${p.loc ? ` ${p.loc}.` : ""} ${M.sectorName(p.sector)} project by METEY Engineering and Consultancy.`),
  image: p.img ? `/assets/uploads/${p.img.d}${p.img.n[0]}${p.img.e}` : null
}));

/* ---------- shared pieces ---------- */
const NAV = [["firm","The Firm"],["practice","Practice"],["projects","Projects"],["insights","Insights"],["3d-lab","3D Lab"],["careers","Careers"]];
const MENU = [["home","Home"]].concat(NAV, [["contact","Contact"]]);
const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "EngineeringBusiness",
  name: "METEY Engineering and Consultancy Pvt. Ltd.",
  alternateName: "METEY",
  url: SITE + "/",
  logo: SITE + "/assets/logo.png",
  image: SITE + SHARE_IMAGE,
  description: "Chartered architectural and structural engineering practice based in Hyderabad, specialising in precast concrete systems, monolithic construction, high-rise, industrial and infrastructure engineering across India.",
  telephone: "+91-40-2414-5925",
  email: "info@metey.in",
  foundingDate: "2013",
  address: { "@type": "PostalAddress", streetAddress: "2-4-216, Road 9A, Snehapuri Colony, New Nagole", addressLocality: "Hyderabad", addressRegion: "Telangana", postalCode: "500035", addressCountry: "IN" },
  contactPoint: [
    { "@type": "ContactPoint", telephone: "+91-40-2414-5925", contactType: "customer service", areaServed: "IN" },
    { "@type": "ContactPoint", telephone: "+91-97001-59325", contactType: "customer service", areaServed: "IN" },
    { "@type": "ContactPoint", telephone: "+91-97161-00567", contactType: "customer service", areaServed: "IN" }
  ],
  openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "09:30", closes: "18:30" }
};
/* links shared before the site had separate pages (/#firm, /#project-jindal) still work */
const OLD_HASH = `<script>(function(h){var m=/^#(firm|practice|projects|insights|careers|contact|project-[\\w-]+|practice-[\\w-]+)$/.exec(h);if(!m)return;var r=m[1];location.replace(r.indexOf("project-")===0?"/projects/"+r.slice(8)+"/":r.indexOf("practice-")===0?"/practice/#p-"+r.slice(9):"/"+r+"/")})(location.hash)</script>`;
const INTRO = `<div class="intro" aria-hidden="true"><span class="intro-logo"><img src="/assets/logo.png" alt="" width="116" height="150"></span></div>`;
const LIGHTBOX = `<dialog class="lb" id="lb" aria-label="Photograph">
  <img id="lbImg" alt="">
  <button class="round x" type="button" id="lbX" aria-label="Close"></button>
  <button class="round prev" type="button" id="lbPrev" aria-label="Previous photograph"><svg aria-hidden="true"><use href="#arr"/></svg></button>
  <button class="round next" type="button" id="lbNext" aria-label="Next photograph"><svg aria-hidden="true"><use href="#arr"/></svg></button>
</dialog>`;

/* content tokens in src/pages/*.html */
const TOKENS = {
  mqTypes: () => R.marquee(M.TYPES),
  stats: R.stats, typesRow: R.types, sysTabs: R.sysTabs, sysStage: R.sysStage, sysCap: R.sysCap,
  tiles: R.tiles, life: R.life, wm: () => read("src/map.svg").trim(), places: R.places,
  carFrame: () => R.carFrame(0), carBody: () => R.carBody(0), carDots: R.carDots,
  promises: R.promises, team: R.team, pracIndex: R.pracIndex, pracBody: R.pracBody,
  chips: R.chips, projGrid: R.grid, register: R.register,
  shelf: R.shelf, articles: R.articles, events: R.events,
  endpoint: () => ENQUIRY_ENDPOINT,
  stateNames: () => JSON.stringify(M.STATE_NAMES)
};

/* ---------- build ---------- */
const layout = read("src/layout.html");
const outFile = r => r === "home" ? "index.html" : r.indexOf("project-") === 0 ? `projects/${r.slice(8)}/index.html` : `${r}/index.html`;
const fill = (tpl, map) => tpl.replace(/\{\{([\w:]+)\}\}/g, (m, k) => {
  if (k.indexOf("art:") === 0) return R.art(k.slice(4));
  if (!(k in map)) throw new Error(`Unknown token {{${k}}}`);
  const v = map[k];
  return typeof v === "function" ? v() : v;
});

const year = new Date().getFullYear();
for (const pg of PAGES){
  const url = SITE + M.href(pg.route);
  const tokens = Object.assign({}, TOKENS, pg.project ? { projDetail: () => R.project(pg.project) } : {});
  const content = pg.standalone ? "" : fill(read(`src/pages/${pg.src}.html`), tokens);
  const isHome = pg.route === "home";
  const html = fill(pg.standalone ? read(`src/pages/${pg.src}.html`) : layout, {
    title: pg.title,
    description: attr(pg.description),
    url,
    image: SITE + encodeURI(pg.image || SHARE_IMAGE),
    head: isHome ? `<script type="application/ld+json">\n${JSON.stringify(SCHEMA, null, 2)}\n</script>\n${OLD_HASH}` : "",
    styles: isHome ? '<link rel="stylesheet" href="/assets/css/home.css">' : "",
    gradients: R.gradients(),
    intro: isHome ? INTRO : "",
    nav: NAV.map(n => `<a href="${M.href(n[0])}"${n[0] === pg.nav ? ' aria-current="page"' : ""}>${n[1]}</a>`).join("\n    "),
    menu: MENU.map((n, i) => `<a href="${M.href(n[0])}" style="--i:${i}"${n[0] === (pg.nav || pg.route) ? ' aria-current="page"' : ""}>${n[1]}</a>`).join("\n  "),
    content,
    year,
    after: pg.project ? LIGHTBOX : "",
    scripts: (isHome ? `<script src="/assets/js/render.js" defer></script>\n<script src="/assets/js/hero-model.js" defer></script>\n` : "") + `<script src="/assets/js/site.js" defer></script>`
  });
  write(outFile(pg.route), html);
}

/* not-found page, served by Vercel for unknown paths */
write("404.html", fill(layout, {
  title: `Page not found | ${BRAND}`, description: "This page could not be found.", url: SITE + "/",
  styles: "", image: SITE + SHARE_IMAGE, head: '<meta name="robots" content="noindex">', gradients: R.gradients(), intro: "",
  nav: NAV.map(n => `<a href="${M.href(n[0])}">${n[1]}</a>`).join("\n    "),
  menu: MENU.map((n, i) => `<a href="${M.href(n[0])}" style="--i:${i}">${n[1]}</a>`).join("\n  "),
  content: `<section class="banner navy grid-bg"><div class="wrap"><div class="stack"><p class="eyebrow">Error 404</p><h1>This page could not be <em>found</em></h1><p class="lead">The link may be out of date. Try the <a href="/projects/">projects</a> or go back to the <a href="/">home page</a>.</p></div></div></section>`,
  year, after: "", scripts: `<script src="/assets/js/site.js" defer></script>`
}));

/* sitemap */
const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(pg => `  <url><loc>${SITE + M.href(pg.route)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`Built ${PAGES.length} pages, 404.html and sitemap.xml`);
