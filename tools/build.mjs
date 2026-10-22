// Builds the static site from src/ into the repository root.
//   node tools/build.mjs
// Edit src/layout.html, src/pages/*.html and assets/js/render.js (data), then run this
// and commit the generated pages. No dependencies; Node 18+.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
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
/* join sentences while they fit a search snippet (160 characters); cut the first at a word if it is too long alone */
const fit = parts => parts.filter(Boolean).map(strip).reduce((d, x, i) => i === 0 ? (x.length > 158 ? x.slice(0, 157).replace(/\s+\S*$/, "") + "…" : x) : (d + " " + x).length <= 160 ? d + " " + x : d, "");
const attr = s => s.replace(/&(?!amp;|#\d+;|[a-z]+;)/g, "&amp;").replace(/"/g, "&quot;");

/* ---------- page list ----------
   Titles stay near 60 characters and lead with the search phrase for the page; descriptions stay under 160.
   name is the short label used in breadcrumbs and llms.txt. */
const BRAND = "METEY Engineering &amp; Consultancy";
const PAGES = [
  { route: "home", src: "home", nav: null, name: "Home",
    title: "Structural &amp; Architectural Engineers in Hyderabad | METEY",
    description: "Chartered structural engineers and architects in Hyderabad since 2013, specialising in precast, monolithic and high-rise design for projects across India." },
  { route: "firm", src: "firm", nav: "firm", name: "The Firm",
    title: "About METEY | Structural Engineering Consultancy, Hyderabad",
    description: "Established in Hyderabad in 2013, METEY is a chartered architectural and structural engineering consultancy. Our principles, specialist capabilities and team." },
  { route: "practice", src: "practice", nav: "practice", name: "Practice",
    title: "Structural Design, Architecture &amp; Precast Services | METEY",
    description: "Architecture and master planning, structural design, precast and monolithic fast-build technologies, interiors, peer review and construction-stage services." },
  { route: "projects", src: "projects", nav: "projects", name: "Projects",
    title: "Projects: Affordable Housing, High-Rise &amp; Industrial | METEY",
    description: "METEY projects in six states: PMAY and EWS affordable housing, precast and monolithic housing, towers, corporate, institutional and industrial buildings." },
  { route: "insights", src: "insights", nav: "insights", name: "Insights",
    title: "Precast &amp; Monolithic Construction Papers | METEY",
    description: "Technical papers by METEY on precast concrete connections, monolithic EWS housing and green building technologies for PMAY, and talks at national conferences." },
  { route: "3d-lab", src: "3d-lab", nav: "3d-lab", standalone: true, name: "3D Lab",
    title: "3D Engineering Lab: Interactive Building Models | METEY",
    description: "Explore interactive building models with structural X-ray, floor separation, precast assembly, camera and lighting controls." },
  { route: "careers", src: "careers", nav: "careers", name: "Careers",
    title: "Structural Engineering &amp; Architecture Internships | METEY",
    description: "Internships and careers for civil and structural engineers and architects at METEY, Hyderabad, mentored by chartered engineers on live projects." },
  { route: "contact", src: "contact", nav: null, name: "Contact",
    title: "Contact METEY | Structural Engineers, New Nagole, Hyderabad",
    description: "Contact METEY Engineering &amp; Consultancy, New Nagole, Hyderabad: +91 40 2414 5925, info@metey.in. Send an enquiry for structural or architectural design." }
];
M.PROJECTS.forEach(p => PAGES.push({
  route: "project-" + p.id, src: "project", nav: "projects", project: p, name: p.name,
  title: `${p.name}${p.loc && !p.name.includes(p.loc.split(",")[0]) ? `, ${p.loc.split(",")[0]}` : ""} | METEY Projects`,
  description: fit([p.text, p.loc && !p.text.includes(p.loc.split(",")[0]) && `${p.loc}.`, `${M.sectorName(p.sector)} project by METEY, Hyderabad.`]),
  image: p.img ? `/assets/uploads/${p.img.d}${p.img.n[0]}${p.img.e}` : null
}));

/* ---------- shared pieces ---------- */
const NAV = [["firm","The Firm"],["practice","Practice"],["projects","Projects"],["insights","Insights"],["3d-lab","3D Lab"],["careers","Careers"]];
const MENU = [["home","Home"]].concat(NAV, [["contact","Contact"]]);
const ORG_ID = SITE + "/#organization";
const BUSINESS = {
  "@type": "ProfessionalService",
  "@id": ORG_ID,
  name: "METEY Engineering and Consultancy Pvt. Ltd.",
  alternateName: ["METEY", "METEY Engineering & Consultancy"],
  url: SITE + "/",
  logo: SITE + "/assets/logo.png",
  image: SITE + SHARE_IMAGE,
  description: "Chartered architectural and structural engineering practice based in Hyderabad, specialising in precast concrete systems, monolithic construction, high-rise, industrial and infrastructure engineering across India.",
  telephone: "+91-40-2414-5925",
  email: "info@metey.in",
  foundingDate: "2013",
  slogan: "Committed to people. Committed to the future.",
  areaServed: { "@type": "Country", name: "India" },
  knowsAbout: ["Structural engineering", "Architecture", "Master planning", "Precast concrete construction", "Monolithic construction", "Affordable housing (PMAY, EWS)", "High-rise buildings", "Earthquake-resistant design", "Wind analysis", "Structural steel and composite structures", "Peer review", "Interior design"],
  address: { "@type": "PostalAddress", streetAddress: "2-4-216, Road 9A, Snehapuri Colony, New Nagole", addressLocality: "Hyderabad", addressRegion: "Telangana", postalCode: "500035", addressCountry: "IN" },
  contactPoint: [
    { "@type": "ContactPoint", telephone: "+91-40-2414-5925", contactType: "customer service", areaServed: "IN" },
    { "@type": "ContactPoint", telephone: "+91-97001-59325", contactType: "customer service", areaServed: "IN" },
    { "@type": "ContactPoint", telephone: "+91-97161-00567", contactType: "customer service", areaServed: "IN" }
  ],
  openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "09:30", closes: "18:30" }
};
const WEBSITE = { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: "METEY Engineering & Consultancy", inLanguage: "en-IN", publisher: { "@id": ORG_ID } };
const decode = s => s.replace(/&amp;/g, "&");
const ldJson = data => `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", ...data }, null, 2).replace(/</g, "\\u003c")}\n</script>`;
/* Home > (Projects >) page, for every page but the home page */
const crumbs = pg => {
  const trail = [["Home", "/"]];
  if (pg.project) trail.push(["Projects", M.href("projects")]);
  trail.push([decode(pg.name), M.href(pg.route)]);
  return { "@type": "BreadcrumbList", itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t[0], item: SITE + t[1] })) };
};
const pageHead = pg => {
  const robots = '<meta name="robots" content="index, follow, max-image-preview:large">';
  if (pg.route === "home") return `${robots}\n${ldJson({ "@graph": [BUSINESS, WEBSITE] })}\n${OLD_HASH}`;
  return `${robots}\n${ldJson(crumbs(pg))}`;
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
    head: pageHead(pg),
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

/* sitemap: lastmod is the last commit touching the page's sources, so rebuilding alone does not change it */
const today = new Date().toISOString().slice(0, 10);
function lastChanged(files){
  try {
    if (execFileSync("git", ["status", "--porcelain", "--", ...files], { cwd: ROOT, encoding: "utf8" }).trim()) return today;
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], { cwd: ROOT, encoding: "utf8" }).trim() || today;
  } catch { return today; }
}
const sources = pg => pg.standalone ? [`src/pages/${pg.src}.html`, "assets/js/3d-lab.js"] : [`src/pages/${pg.src}.html`, "assets/js/render.js"];
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const images = pg => pg.project && pg.project.img ? pg.project.img.n.map(n => SITE + encodeURI(`/assets/uploads/${pg.project.img.d}${n}${pg.project.img.e}`)) : pg.route === "home" ? [SITE + SHARE_IMAGE] : [];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PAGES.map(pg => `  <url>
    <loc>${SITE + M.href(pg.route)}</loc>
    <lastmod>${lastChanged(sources(pg))}</lastmod>${images(pg).map(u => `
    <image:image><image:loc>${xml(u)}</image:loc></image:image>`).join("")}
  </url>`).join("\n")}
</urlset>
`);

/* llms.txt: a plain-language map of the site for AI assistants and answer engines */
write("llms.txt", `# METEY Engineering & Consultancy

> Chartered architectural and structural engineering consultancy in Hyderabad, India, established in 2013, with a branch office in Amaravati, Andhra Pradesh. METEY specialises in precast concrete, monolithic and other fast-build construction technologies, high-rise and industrial structures, and affordable (PMAY/EWS) housing across India.

- Head office: 2-4-216, Road 9A, Snehapuri Colony, New Nagole, Hyderabad 500035, Telangana
- Phone: +91 40 2414 5925
- Email: info@metey.in

## Pages

${PAGES.filter(pg => !pg.project).map(pg => `- [${decode(pg.name)}](${SITE + M.href(pg.route)}): ${strip(decode(pg.description))}`).join("\n")}

## Projects

${PAGES.filter(pg => pg.project).map(pg => `- [${decode(pg.name)}](${SITE + M.href(pg.route)}): ${strip(decode(pg.description))}`).join("\n")}
`);

console.log(`Built ${PAGES.length} pages, 404.html, sitemap.xml and llms.txt`);
