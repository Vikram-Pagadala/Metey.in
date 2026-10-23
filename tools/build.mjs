// Builds the static site from src/ into the repository root.
//   node tools/build.mjs
// Content is in src/data/*.json, page templates in src/pages/*.html and the shared frame in
// src/layout.html; assets/js/render.js turns the data into HTML. Run this after any change and
// commit the generated pages. No dependencies; Node 18+.
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

/* ---------- content ---------- */
const DATA = Object.fromEntries(["site", "projects", "team", "clients", "services", "insights"].map(k => [k, JSON.parse(read(`src/data/${k}.json`))]));

/* pixel size from the file header (JPEG, PNG, WebP), so data files need not carry width and height */
function imageSize(file){
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP"){
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === "VP8L") { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (b[0] === 0xff && b[1] === 0xd8){
    for (let i = 2; i < b.length - 9;){
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  throw new Error(`Cannot read the size of ${file}`);
}
/* every image named in the data must exist; missing sizes are filled in */
const confirms = [];
(function walk(node, where){
  if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${where}[${i}]`));
  if (!node || typeof node !== "object") return;
  if (typeof node.src === "string" && /\.(jpe?g|png|webp)$/i.test(node.src)){
    for (const p of [node.src, node.thumb].filter(Boolean)) if (!fs.existsSync(path.join(ROOT, p))) throw new Error(`Missing image ${p} (${where})`);
    if (!node.width || !node.height) [node.width, node.height] = imageSize(path.join(ROOT, node.src));
  }
  for (const [k, v] of Object.entries(node)){
    if (k === "confirm") confirms.push(`${node.slug ? "project " + node.slug : where.replace(/^data\./, "")}: ${[].concat(v).join(" | ")}`);
    else walk(v, `${where}.${k}`);
  }
})(DATA, "data");

/* load the renderers the same way the browser does, with the content handed over */
const ctx = { globalThis: { METEY_DATA: DATA } };
vm.runInNewContext(read("assets/js/render.js"), ctx);
const M = ctx.globalThis.METEY;
const R = M.render;
const C = DATA.site.company;

const strip = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
/* join sentences while they fit a search snippet (160 characters); cut the first at a word if it is too long alone */
const fit = parts => parts.filter(Boolean).map(strip).reduce((d, x, i) => i === 0 ? (x.length > 158 ? x.slice(0, 157).replace(/\s+\S*$/, "") + "…" : x) : (d + " " + x).length <= 160 ? d + " " + x : d, "");
const attr = s => s.replace(/&(?!amp;|#\d+;|[a-z]+;)/g, "&amp;").replace(/"/g, "&quot;");
const decode = s => s.replace(/&amp;/g, "&");
const telLink = n => n.replace(/[^\d+]/g, "");
const PHONE = C.phones[0].number, EMAIL = C.emails[0].address;
const stateCount = strip(R.stateCount());

/* ---------- page list ----------
   Titles stay within 70 characters and lead with the search phrase for the page; descriptions stay under 160.
   name is the short label used in navigation, breadcrumbs and llms.txt. */
const BRAND = "Metey Engineering &amp; Consultancy";
const PAGES = [
  { route: "home", src: "home", name: "Home",
    title: "Architecture &amp; Structural Engineering Consultants in India | METEY",
    description: DATA.site.home.hero.sub },
  { route: "about", src: "about", name: "About",
    title: "About METEY | Architecture &amp; Structural Engineering, Hyderabad",
    description: "Established in 2013, METEY's core strengths are architecture and structural engineering, with precast, monolithic and other modern construction technologies." },
  { route: "services", src: "services", name: "Services",
    title: "Services: Architecture, Structural, PMC &amp; Precast Design | METEY",
    description: "Architecture, structural consultancy, MEP, interiors, peer review and value engineering, and project management consultancy for projects across India." },
  { route: "technologies", src: "technologies", name: "Technologies",
    title: "Construction Technologies: Precast, Monolithic &amp; Composite | METEY",
    description: "Precast, monolithic (Mivan), composite, insulated wall (EPS), light gauge steel, Perma form, polymer wall and timber structures, designed by Metey across India." },
  { route: "projects", src: "projects", name: "Projects",
    title: "Projects Across India: Housing, High-Rise &amp; Industrial | METEY",
    description: `${M.PROJECTS.length} projects in ${stateCount}: PMAY and EWS housing, precast and monolithic towers, education, commercial and industrial buildings.` },
  { route: "clients", src: "clients", name: "Clients",
    title: "Clients | DRDO, GHMC, APTIDCO, NTPC, Tata Projects | METEY",
    description: "METEY clients include DRDO, GHMC, APTIDCO, APCPDCL, Tata Projects, NTPC, Jindal Steel & Power, Numaligarh Refinery and IIT Patna." },
  { route: "team", src: "team", name: "Team",
    title: "Team | Architects &amp; Structural Engineers, Hyderabad | METEY",
    description: "Er. C.A. Prasad, Director & Chief Structural Engineer with 48 years of experience, and METEY's architects, structural engineers and quantity surveyors." },
  { route: "insights", src: "insights", name: "Insights",
    title: "Precast &amp; Monolithic Construction Papers | METEY",
    description: "Technical papers by METEY on precast concrete connections, monolithic EWS housing and green building technologies for PMAY, and talks at national conferences." },
  { route: "careers", src: "careers", name: "Careers",
    title: "Structural Engineering &amp; Architecture Internships | METEY",
    description: "Internships and careers for civil and structural engineers and architects at METEY, Hyderabad, mentored by chartered engineers on live projects." },
  { route: "contact", src: "contact", name: "Contact",
    title: "Contact METEY | Structural Engineers, New Nagole, Hyderabad",
    description: `Contact Metey Engineering & Consultancy, New Nagole, Hyderabad: ${PHONE}, ${EMAIL}. Structural and architectural design across India.` }
];
const shareImage = p => { const im = p.images.find(i => !i.lowRes && /\.jpe?g$/.test(i.src)) || p.images.find(i => !i.lowRes); return im ? im.src : null; };
const projectTitle = t => [`${t} | METEY Projects`, `${t} | METEY`, t].find(x => x.length <= 70) || t;
M.PROJECTS.forEach(p => PAGES.push({
  route: "project-" + p.slug, src: "project", nav: "projects", project: p, name: M.esc(p.title),
  title: M.esc(projectTitle(p.title)),
  description: fit([p.description, p.keyFacts && p.keyFacts.join(" · ") + ".", [p.client, p.location].filter(Boolean).join(", ") + ".",
    `${p.category || (p.sectors || []).map(M.sectorName).join(", ") || "A"} project by METEY, Hyderabad.`]),
  image: shareImage(p)
}));

/* ---------- moved pages ----------
   /firm/ and /practice/ became /about/ and /services/, the 3D Lab gave way to /technologies/; projects that the 2026 profile renamed keep their old address */
const MOVED = [["/firm/", "/about/"], ["/practice/", "/services/"], ["/3d-lab/", "/technologies/"]].concat(M.PROJECTS.flatMap(p => (p.redirectFrom || []).map(o => [`/projects/${o}/`, `/projects/${p.slug}/`])));
const vercel = JSON.parse(read("vercel.json"));
vercel.redirects = MOVED.flatMap(([from, to]) => [{ source: from, destination: to, permanent: true }, { source: from.slice(0, -1), destination: to, permanent: true }]);
write("vercel.json", JSON.stringify(vercel, null, 2) + "\n");

/* ---------- shared pieces ---------- */
const NAV = ["about", "services", "technologies", "projects", "clients", "team"];
const MENU = ["home"].concat(NAV, ["insights", "careers", "contact"]);
const pageName = r => PAGES.find(p => p.route === r).name;
const ORG_ID = SITE + "/#organization";
const BUSINESS = {
  "@type": "ProfessionalService",
  "@id": ORG_ID,
  name: C.name,
  alternateName: [C.shortName, "Metey Engineering & Consultancy"],
  url: SITE + "/",
  logo: SITE + C.logo.png,
  image: SITE + SHARE_IMAGE,
  description: `Architecture and structural engineering consultants for projects across India, established in 2013 (earlier ${C.formerName}), head office in Hyderabad, designing with precast, monolithic, composite, insulated wall, light gauge steel and timber construction.`,
  telephone: PHONE,
  email: EMAIL,
  foundingDate: "2013",
  slogan: C.tagline,
  founder: { "@type": "Person", name: DATA.team.founder.name, jobTitle: DATA.team.founder.role, image: SITE + DATA.team.founder.photo.src },
  sameAs: [C.facebook],
  areaServed: [{ "@type": "Country", name: "India" }].concat(M.statesWorked().map(s => ({ "@type": s.id === "delhi" ? "City" : "State", name: s.name }))),
  knowsAbout: ["Architecture", "Structural engineering", "MEP design", "Interior design", "Peer review", "Value engineering", "Project management consultancy", "Precast concrete construction", "Monolithic (Mivan) construction", "Composite construction", "Insulated wall (EPS) construction", "Light gauge steel", "Government housing (PMAY, EWS)", "High-rise buildings", "Earthquake-resistant design"],
  address: { "@type": "PostalAddress", streetAddress: C.address.street, addressLocality: C.address.city, addressRegion: C.address.region, postalCode: C.address.postalCode, addressCountry: "IN" },
  contactPoint: C.phones.map(p => ({ "@type": "ContactPoint", telephone: p.number, contactType: "customer service", areaServed: "IN" })),
  openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: C.hours.days, opens: C.hours.opens, closes: C.hours.closes }
};
const WEBSITE = { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: "Metey Engineering & Consultancy", inLanguage: "en-IN", publisher: { "@id": ORG_ID } };
const ldJson = data => `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", ...data }, null, 2).replace(/</g, "\\u003c")}\n</script>`;
/* Home > (Projects >) page, for every page but the home page */
const crumbs = pg => {
  const trail = [["Home", "/"]];
  if (pg.project) trail.push(["Projects", M.href("projects")]);
  trail.push([decode(pg.name), M.href(pg.route)]);
  return { "@type": "BreadcrumbList", itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t[0], item: SITE + t[1] })) };
};
/* links shared before the site had separate pages (/#firm, /#project-jindal) still work */
const HASH_MOVES = Object.fromEntries(MOVED.map(([from, to]) => [from.replace(/^\/(projects\/)?|\/$/g, "").replace(/^(?!firm|practice|3d-lab)/, "project-"), to]));
const OLD_HASH = `<script>(function(h,m){var k=/^#([\\w-]+)$/.exec(h);if(!k)return;k=k[1];var to=m[k]||(/^(projects|insights|careers|contact|about|services|technologies|team|clients)$/.test(k)?"/"+k+"/":/^project-[\\w-]+$/.test(k)?"/projects/"+k.slice(8)+"/":/^practice-[\\w-]+$/.test(k)?"/services/#p-"+k.slice(9):null);if(to)location.replace(to)})(location.hash,${JSON.stringify(HASH_MOVES)})</script>`;
const pageHead = pg => {
  const robots = '<meta name="robots" content="index, follow, max-image-preview:large">';
  if (pg.route === "home") return `${robots}\n${ldJson({ "@graph": [BUSINESS, WEBSITE] })}\n${OLD_HASH}`;
  return `${robots}\n${ldJson(crumbs(pg))}`;
};
const INTRO = `<div class="intro" aria-hidden="true"><span class="intro-logo"><img src="${C.logo.src}" alt="" width="176" height="207"></span></div>`;
const LIGHTBOX = `<dialog class="lb" id="lb" aria-label="Image viewer">
  <img id="lbImg" alt="">
  <button class="round x" type="button" id="lbX" aria-label="Close"></button>
  <button class="round prev" type="button" id="lbPrev" aria-label="Previous image"><svg aria-hidden="true"><use href="#arr"/></svg></button>
  <button class="round next" type="button" id="lbNext" aria-label="Next image"><svg aria-hidden="true"><use href="#arr"/></svg></button>
</dialog>`;
const FOOT_CONTACT = `<p>${M.esc(C.address.street).replace(", New Nagole", ",<br>New Nagole")},<br>${M.esc(C.address.city)} ${C.address.postalCode}</p>
        <p><a href="tel:${telLink(PHONE)}">${PHONE}</a><br><a href="mailto:${EMAIL}">${EMAIL}</a><br><a href="${C.facebook}" target="_blank" rel="noopener">Facebook</a></p>`;

/* tokens available to every template */
const COMMON = {
  logo: C.logo.src, companyName: M.esc(C.name), tagline: M.esc(C.tagline), gradients: R.gradients(), year: new Date().getFullYear(),
  footLinks: () => MENU.filter(r => r !== "home").map(r => `<li><a href="${M.href(r)}">${pageName(r)}</a></li>`).join("\n          "),
  footContact: FOOT_CONTACT
};
/* content tokens in src/pages/*.html */
const TOKENS = Object.assign({}, R, {
  companyName: M.esc(C.name),
  typesRow: R.types, wm: () => read("src/map.svg").trim(),
  carFrame: () => R.carFrame(0), carBody: () => R.carBody(0),
  projGrid: R.grid, projectCount: M.PROJECTS.length, stateCount,
  stateNames: () => JSON.stringify(M.STATE_NAMES),
  endpoint: ENQUIRY_ENDPOINT, email: EMAIL, emailCc: (C.emails[1] || C.emails[0]).address, whatsapp: C.whatsapp, phone: PHONE, phoneLink: telLink(PHONE)
});

/* ---------- build ---------- */
const layout = read("src/layout.html");
const outFile = r => r === "home" ? "index.html" : r.indexOf("project-") === 0 ? `projects/${r.slice(8)}/index.html` : `${r}/index.html`;
const fill = (tpl, map) => tpl.replace(/\{\{([\w:]+)\}\}/g, (m, k) => {
  if (k.indexOf("art:") === 0) return R.art(k.slice(4));
  if (!(k in map)) throw new Error(`Unknown token {{${k}}}`);
  const v = map[k];
  return typeof v === "function" ? v() : v;
});
const navFor = active => NAV.map(r => `<a href="${M.href(r)}"${r === active ? ' aria-current="page"' : ""}>${pageName(r)}</a>`).join("\n    ");
const menuFor = active => MENU.map((r, i) => `<a href="${M.href(r)}" style="--i:${i}"${r === active ? ' aria-current="page"' : ""}>${pageName(r)}</a>`).join("\n  ");

/* a project folder left over from a removed or renamed project is deleted (it holds only the generated page) */
for (const d of fs.readdirSync(path.join(ROOT, "projects"), { withFileTypes: true })){
  if (!d.isDirectory() || M.PROJECTS.some(p => p.slug === d.name)) continue;
  const dir = path.join(ROOT, "projects", d.name);
  if (fs.readdirSync(dir).every(n => n === "index.html")) fs.rmSync(dir, { recursive: true });
}

for (const pg of PAGES){
  const tokens = Object.assign({}, TOKENS, pg.project ? { projDetail: () => R.project(pg.project) } : {});
  const isHome = pg.route === "home";
  const html = fill(layout, Object.assign({}, COMMON, {
    title: pg.title,
    description: attr(pg.description),
    url: SITE + M.href(pg.route),
    image: SITE + encodeURI(pg.image || SHARE_IMAGE),
    head: pageHead(pg),
    styles: isHome ? '<link rel="stylesheet" href="/assets/css/home.css">' : "",
    intro: isHome ? INTRO : "",
    nav: navFor(pg.nav || pg.route),
    menu: menuFor(pg.nav || pg.route),
    content: fill(read(`src/pages/${pg.src}.html`), tokens),
    after: pg.project || pg.route === "technologies" ? LIGHTBOX : "",
    scripts: (isHome ? `<script src="/assets/js/render.js" defer></script>\n` : "") + `<script src="/assets/js/site.js" defer></script>`
  }));
  write(outFile(pg.route), html);
}

/* not-found page, served by Vercel for unknown paths */
write("404.html", fill(layout, Object.assign({}, COMMON, {
  title: `Page not found | ${BRAND}`, description: "This page could not be found.", url: SITE + "/",
  styles: "", image: SITE + SHARE_IMAGE, head: '<meta name="robots" content="noindex">', intro: "",
  nav: navFor(null), menu: menuFor(null),
  content: `<section class="banner navy grid-bg"><div class="wrap"><div class="stack"><p class="eyebrow">Error 404</p><h1>This page could not be <em>found</em></h1><p class="lead">The link may be out of date. Try the <a href="/projects/">projects</a> or go back to the <a href="/">home page</a>.</p></div></div></section>`,
  after: "", scripts: `<script src="/assets/js/site.js" defer></script>`
})));

/* contact card offered on the contact page */
write("assets/metey-contact.vcf", [
  "BEGIN:VCARD", "VERSION:3.0", "N:Prasad;C.A.;;Er.;", `FN:${DATA.team.founder.name} (Director)`, `ORG:${C.name}`, `TITLE:${DATA.team.founder.role}`,
  ...C.phones.map((p, i) => `TEL;TYPE=${i ? "WORK" : "CELL,PREF"},VOICE:${telLink(p.number)}`),
  ...C.emails.map((e, i) => `EMAIL;TYPE=${i ? "WORK" : "PREF"},INTERNET:${e.address}`),
  `URL:${SITE}`, `ADR;TYPE=WORK:;;${C.address.street};${C.address.city};${C.address.region};${C.address.postalCode};${C.address.country}`,
  `NOTE:${C.tagline}. Architecture and structural engineering consultancy, Hyderabad head office and Amaravati branch office.`, "END:VCARD", ""
].join("\r\n"));

/* sitemap: lastmod is the last commit touching the page's sources, so rebuilding alone does not change it */
const today = new Date().toISOString().slice(0, 10);
function lastChanged(files){
  try {
    if (execFileSync("git", ["status", "--porcelain", "--", ...files], { cwd: ROOT, encoding: "utf8" }).trim()) return today;
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], { cwd: ROOT, encoding: "utf8" }).trim() || today;
  } catch { return today; }
}
const sources = pg => pg.project ? ["src/pages/project.html", "src/data/projects.json"] : [`src/pages/${pg.src}.html`, "src/data", "assets/js/render.js"];
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const images = pg => pg.project ? pg.project.images.map(im => SITE + encodeURI(im.src)) : pg.route === "home" ? [SITE + SHARE_IMAGE] : pg.route === "team" ? [SITE + DATA.team.founder.photo.src] : pg.route === "technologies" ? DATA.services.technologies.items.flatMap(t => (t.images || []).map(im => SITE + encodeURI(im.src))) : [];
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
write("llms.txt", `# Metey Engineering & Consultancy

> ${C.name}: architecture and structural engineering consultants. Established ${C.established}; head office in Hyderabad, branch office in ${C.branch}. ${DATA.site.home.hero.sub}

- Head office: ${C.address.street}, ${C.address.city} ${C.address.postalCode}, ${C.address.region}
- Phone: ${C.phones.map(p => p.number).join(", ")}
- Email: ${C.emails.map(e => e.address).join(", ")}
- Facebook: ${C.facebook}

## Pages

${PAGES.filter(pg => !pg.project).map(pg => `- [${decode(pg.name)}](${SITE + M.href(pg.route)}): ${strip(decode(pg.description))}`).join("\n")}

## Projects

${PAGES.filter(pg => pg.project).map(pg => `- [${decode(pg.name)}](${SITE + M.href(pg.route)}): ${strip(decode(pg.description))}`).join("\n")}
`);

console.log(`Built ${PAGES.length} pages, 404.html, sitemap.xml, llms.txt, vercel.json redirects and the vCard`);
if (confirms.length) console.log(`${confirms.length} items in src/data are marked "confirm" and need checking with METEY:\n  ` + confirms.join("\n  "));
