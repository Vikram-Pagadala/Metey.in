/* METEY site behaviour. Pages arrive fully rendered (see tools/build.mjs); this script
   only adds motion and interaction, and every part checks that its element is on the page. */
(function(){
"use strict";
const root = document.documentElement;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const M = window.METEY || null; /* only loaded on the home page */

try {

/* give every drawn stroke a unit path length and a stagger index */
function prep(scope){
  $$("svg", scope).forEach(svg => { $$(".dr,.a-draw", svg).forEach((e, i) => { e.setAttribute("pathLength", "1"); e.style.setProperty("--k", i); }); });
}

/* word-split headings */
const escT = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function split(el){
  if (el._s) return; el._s = 1;
  let i = 0;
  const words = t => t.split(/(\s+)/).map(x => (!x || /^\s+$/.test(x)) ? x : `<span class="w"><span style="--i:${i++}">${escT(x)}</span></span>`).join("");
  const walk = node => { let o = ""; node.childNodes.forEach(n => { if (n.nodeType === 3) o += words(n.textContent); else if (n.nodeType === 1){ const tg = n.tagName.toLowerCase(); o += `<${tg}>${walk(n)}</${tg}>`; } }); return o; };
  el.setAttribute("aria-label", el.textContent.trim());
  el.innerHTML = walk(el);
}
$$("[data-split]").forEach(split);
prep(document);

/* ======================= images: photograph over drawing ======================= */
function imgLoaded(t){
  const p = t.parentNode; if (!p) return;
  if (t.naturalWidth < 40){ imgFailed(t); return; }
  if (p.classList.contains("shot")) setTimeout(() => p.classList.add("has"), p.closest(".car") ? 1100 : 350);
  else if (p.classList.contains("face")) p.classList.add("has");
  else if (p.classList.contains("gal-b")) p.classList.add("ok");
}
function imgFailed(t){
  if (t.id === "lbImg") return;
  const p = t.parentNode;
  if (p && p.classList.contains("gal-b")){
    const w = p.closest(".gal-wrap"); p.remove();
    if (w && !$(".gal-b", w)) w.hidden = true;
  } else t.remove();
}
document.addEventListener("load", e => { if (e.target && e.target.tagName === "IMG") imgLoaded(e.target); }, true);
document.addEventListener("error", e => { if (e.target && e.target.tagName === "IMG") imgFailed(e.target); }, true);
/* images that finished before this script ran */
$$("img").forEach(t => { if (t.complete){ if (t.naturalWidth) imgLoaded(t); else if (t.getAttribute("src")) imgFailed(t); } });
document.addEventListener("mouseover", e => { const s = e.target.closest && e.target.closest(".shot.has"); if (s) s.classList.add("flip"); });
document.addEventListener("mouseout", e => { const s = e.target.closest && e.target.closest(".shot.flip"); if (s && !s.contains(e.relatedTarget)) s.classList.remove("flip"); });

/* ======================= lightbox ======================= */
const lb = $("#lb"), lbImg = $("#lbImg"); let lbList = [], lbI = 0, lbFrom = null;
function lbShow(i){ if (!lbList.length) return; lbI =(i + lbList.length) % lbList.length; lbImg.src = lbList[lbI].src; lbImg.alt = lbList[lbI].alt; }
function lbOpen(g){
  const all = $$(".gal-b.ok", g.parentNode);
  lbList = all.map(b => ({ src: b.getAttribute("data-full"), alt: $("img", b).alt }));
  lbFrom = g; lbShow(all.indexOf(g));
  if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
  /* the close button can only take focus once .open makes the dialog visible */
  lb.classList.add("open");
  $("#lbX").focus();
}
function lbClose(){
  lb.classList.remove("open");
  if (lb.close) lb.close(); else lb.removeAttribute("open");
}
if (lb){
  /* Escape closes a modal dialog natively; this keeps focus returning to the thumbnail */
  lb.addEventListener("close", () => { lb.classList.remove("open"); if (lbFrom) lbFrom.focus(); });
  $("#lbX").addEventListener("click", lbClose);
  $("#lbPrev").addEventListener("click", () => lbShow(lbI - 1));
  $("#lbNext").addEventListener("click", () => lbShow(lbI + 1));
  lb.addEventListener("click", e => { if (e.target === lb) lbClose(); });
  lb.addEventListener("keydown", e => { if (e.key === "ArrowLeft") lbShow(lbI - 1); if (e.key === "ArrowRight") lbShow(lbI + 1); });
}

/* ======================= reveal on scroll ======================= */
const SEL = "[data-rv],[data-split],[data-in]";
let io = null;
function countUp(b){
  if (b._c) return; const to = +b.getAttribute("data-count"), from = +(b.getAttribute("data-from") || 0);
  if (RM){ b.textContent = to; return; }
  b._c = 1; const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 1900), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); else b._c = 0; };
  requestAnimationFrame(step);
}
function reveal(el){ if (el.classList.contains("in")) return; el.classList.add("in"); $$("[data-count]", el).forEach(countUp); }
function startIO(){
  if ("IntersectionObserver" in window){
    io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } }); }, { threshold:.06, rootMargin:"0px 0px -5% 0px" });
    $$(SEL).forEach(el => io.observe(el));
  } else $$(SEL).forEach(reveal);
}

/* ======================= home: systems explorer ======================= */
const sysStage = $("#sysStage");
let sysI = 0, sysT = null, sysOn = false;
function sysShow(i){
  sysI = i;
  $$(".sys-tab").forEach((b, k) => { b.classList.remove("on", "run"); b.setAttribute("aria-selected", k === i); if (k === i){ void b.offsetWidth; b.classList.add("on"); if (sysOn && !RM) b.classList.add("run"); } });
  sysStage.setAttribute("aria-labelledby", "sys-tab-" + i);
  sysStage.innerHTML = M.diagram(M.SYSTEMS[i].id); prep(sysStage);
  $("#sysCap").textContent = M.SYSTEMS[i].cap;
  $(".sys-stage").style.setProperty("--sc", M.PAL[M.SYSTEMS[i].c][1]);
  clearTimeout(sysT);
  if (sysOn && !RM) sysT = setTimeout(() => sysShow((sysI + 1) % M.SYSTEMS.length), 8500);
}
if (sysStage && M){
  $("#sysTabs").addEventListener("click", e => { const s = e.target.closest("[data-sys]"); if (s) sysShow(+s.getAttribute("data-sys")); });
  $(".sys-stage").style.setProperty("--sc", M.PAL[M.SYSTEMS[0].c][1]);
}

/* ======================= home: featured carousel ======================= */
const feat = $("#featured");
let carI = 0, carT = null, carOn = false, carHold = false;
function carArm(){ clearTimeout(carT); if (carOn && !carHold && !RM) carT = setTimeout(() => carShow(carI + 1), 7500); }
function carShow(i){
  carI = (i + M.FEAT.length) % M.FEAT.length;
  const body = $("#carBody"), frame = $("#carFrame");
  const put = () => {
    frame.innerHTML = M.render.carFrame(carI); frame.firstElementChild.classList.add("enter");
    body.innerHTML = M.render.carBody(carI);
    body.classList.remove("out", "enter"); void body.offsetWidth; body.classList.add("enter");
    $$("#carDots button").forEach((b, k) => { if (k === carI) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    carArm();
  };
  if (RM) put(); else { body.classList.add("out"); setTimeout(put, 260); }
}
if (feat && M){
  $("#carPrev").addEventListener("click", () => carShow(carI - 1));
  $("#carNext").addEventListener("click", () => carShow(carI + 1));
  $("#carDots").addEventListener("click", e => { const d = e.target.closest("[data-dot]"); if (d) carShow(+d.getAttribute("data-dot")); });
  feat.addEventListener("mouseenter", () => { carHold = true; clearTimeout(carT); });
  feat.addEventListener("mouseleave", () => { carHold = false; carArm(); });
  feat.addEventListener("focusin", () => { carHold = true; clearTimeout(carT); });
  feat.addEventListener("focusout", () => { carHold = false; carArm(); });
}

/* pause the timed pieces while they are off screen */
if ("IntersectionObserver" in window){
  if (sysStage && M) new IntersectionObserver(es => { es.forEach(e => {
    const was = sysOn; sysOn = e.isIntersecting;
    if (sysOn && !was) sysShow(sysI); else if (!sysOn) clearTimeout(sysT);
  }); }, { threshold:.25 }).observe($("#systems"));
  if (feat && M) new IntersectionObserver(es => { es.forEach(e => { carOn = e.isIntersecting; carArm(); }); }, { threshold:.25 }).observe(feat);
}

/* ======================= home: structural frame, drawn in 3D ======================= */
(function(){
  const cv = $("#frame3d"), ctx = cv && cv.getContext && cv.getContext("2d"); if (!ctx) return;
  const NX = 4, NY = 6, NZ = 3, E = [], GD = [];
  const pt = (i, j, k) => [(i - (NX - 1) / 2) * 1.25, j * .72, (k - (NZ - 1) / 2) * 1.25];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) for (let k = 0; k < NZ; k++){
    E.push([pt(i,j,k), pt(i,j+1,k), j, 0]);
    if (i < NX - 1) E.push([pt(i,j+1,k), pt(i+1,j+1,k), j + .5, 1]);
    if (k < NZ - 1) E.push([pt(i,j+1,k), pt(i,j+1,k+1), j + .5, 3]);
  }
  for (let j = 0; j < NY; j++){ E.push([pt(0,j,0), pt(1,j+1,0), j + .7, 2]); E.push([pt(NX-1,j,NZ-1), pt(NX-2,j+1,NZ-1), j + .7, 2]); }
  for (let i = -3; i <= 3; i++){ GD.push([[i*1.25,0,-3.3],[i*1.25,0,3.3]]); GD.push([[-3.9,0,i*1.1],[3.9,0,i*1.1]]); }
  let W = 0, H = 0, on = false, raf = 0;
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
  const proj = (p, a) => { const x = p[0] * Math.cos(a) - p[2] * Math.sin(a), z = p[0] * Math.sin(a) + p[2] * Math.cos(a), y = p[1] - 2.1, t = .36, y2 = y * Math.cos(t) - z * Math.sin(t), z2 = y * Math.sin(t) + z * Math.cos(t), s = 9 / (9 + z2), u = Math.min(W, H * 1.2) / 7.4; return [W / 2 + x * s * u, H * .55 - y2 * s * u, z2]; };
  const draw = ms => {
    ctx.clearRect(0, 0, W, H);
    const a = ms / 7000 + .6, ph = RM ? NY + 1 : (ms / 1000) % (NY + 5), fade = ph > NY + 3 ? Math.max(0, 1 - (ph - NY - 3) / 1.6) : 1;
    ctx.lineCap = "round"; ctx.lineWidth = 1; ctx.strokeStyle = "rgba(169,182,195,.16)";
    GD.forEach(g => { const p = proj(g[0], a), q = proj(g[1], a); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
    E.forEach(e => {
      const v = Math.max(0, Math.min(1, (ph - e[2]) * 1.6)); if (v <= 0) return;
      const p = proj(e[0], a), q = proj(e[1], a), al = Math.max(.22, Math.min(.95, .58 - (p[2] + q[2]) / 9)) * fade;
      ctx.strokeStyle = e[3] === 0 ? `rgba(243,238,226,${al})` : e[3] === 1 ? `rgba(240,197,94,${al})` : e[3] === 3 ? `rgba(99,199,178,${al})` : `rgba(231,148,104,${al * .85})`;
      ctx.lineWidth = e[3] === 0 ? 1.6 : e[3] === 2 ? .9 : 1.2;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + (q[0] - p[0]) * v, p[1] + (q[1] - p[1]) * v); ctx.stroke();
    });
  };
  const tick = ms => { draw(ms); if (on && !RM) raf = requestAnimationFrame(tick); };
  window.addEventListener("resize", () => { if (on){ size(); if (RM) draw(0); } });
  if ("IntersectionObserver" in window){
    new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting && !on){ on = true; size(); raf = requestAnimationFrame(tick); } else if (!e.isIntersecting){ on = false; cancelAnimationFrame(raf); } }); }, { threshold:.05 }).observe(cv);
  } else { on = true; size(); requestAnimationFrame(tick); }
})();

/* ======================= home: building types row ======================= */
const typesRow = $("#typesRow");
if (typesRow){
  const typesBy = d => typesRow.scrollBy({ left:d * typesRow.clientWidth * .7, behavior:RM ? "auto" : "smooth" });
  $("#typesPrev").addEventListener("click", () => typesBy(-1));
  $("#typesNext").addEventListener("click", () => typesBy(1));
  /* drag to scroll with a mouse */
  let down = false, sx = 0, sl = 0, moved = 0;
  typesRow.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = typesRow.scrollLeft; });
  window.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 5){ typesRow.classList.add("drag"); typesRow.scrollLeft = sl - dx; } });
  window.addEventListener("pointerup", () => { down = false; setTimeout(() => typesRow.classList.remove("drag"), 0); });
  typesRow.addEventListener("click", e => { if (moved > 5){ e.preventDefault(); e.stopPropagation(); } }, true);
}

/* hero parallax */
const hero = $(".hero"), heroArt = $("#heroArt");
if (!RM && hero && heroArt) hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); heroArt.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3)); heroArt.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3)); });

/* ======================= projects: sector filter, and state filter from the map ======================= */
const chips = $("#chips"), grid = $("#projGrid"), stateNote = $("#stateNote");
function showCards(test){
  grid.classList.remove("pop");
  let n = 0;
  $$(".card", grid).forEach(card => { const show = test(card); card.hidden = !show; if (show) card.style.setProperty("--i", n++); });
  void grid.offsetWidth; grid.classList.add("pop");
}
function clearState(){
  if (!stateNote || stateNote.hidden) return;
  stateNote.hidden = true;
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
}
if (chips && grid){
  chips.addEventListener("click", e => {
    const c = e.target.closest("[data-sector]"); if (!c) return;
    const sector = c.getAttribute("data-sector");
    $$("[data-sector]", chips).forEach(b => b.setAttribute("aria-pressed", b === c));
    clearState();
    showCards(card => sector === "all" || card.getAttribute("data-sector") === sector);
  });
  /* /projects/?state=karnataka arrives from the map on the home page */
  let state = null;
  try { state = new URLSearchParams(location.search).get("state"); } catch (e) {}
  let names = {};
  try { names = JSON.parse(stateNote.getAttribute("data-names")); } catch (e) {}
  if (state && names[state]){
    const cards = $$(".card", grid).filter(card => (card.getAttribute("data-states") || "").split(" ").indexOf(state) >= 0);
    showCards(card => cards.indexOf(card) >= 0);
    $$("[data-sector]", chips).forEach(b => b.setAttribute("aria-pressed", "false"));
    stateNote.innerHTML = `Showing ${cards.length} project${cards.length === 1 ? "" : "s"} in <b>${escT(names[state])}</b>. <button type="button" class="more" id="stateAll">Show all projects</button>`;
    stateNote.hidden = false;
    $("#stateAll").addEventListener("click", () => { clearState(); $$("[data-sector]", chips).forEach(b => b.setAttribute("aria-pressed", b.getAttribute("data-sector") === "all")); showCards(() => true); });
  }
}

/* ======================= page chrome ======================= */
const topBar = $("#top"), prog = $("#prog");
function onScroll(){
  const y = window.pageYOffset || 0, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  topBar.classList.toggle("solid", y > 30);
  prog.style.setProperty("--p", Math.min(1, y / max).toFixed(4));
  if (!RM && heroArt && y < 1400) heroArt.style.setProperty("--sy", (y * .09).toFixed(1) + "px");
}
window.addEventListener("scroll", onScroll, { passive:true });
window.addEventListener("resize", onScroll);

/* mobile menu: while open, everything behind it is inert so focus stays in the menu */
const burger = $("#burger"), behind = [$("main"), $("footer")].filter(Boolean);
function setMenu(open){
  root.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", open);
  behind.forEach(el => { el.inert = open; });
  if (open){ const a = $("#menu a"); if (a) a.focus(); }
}
burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("menu-open")){ setMenu(false); burger.focus(); } });
$$("#menu a").forEach(a => a.addEventListener("click", () => setMenu(false)));
$("#menu").addEventListener("keydown", e => {
  /* keep Tab cycling between the menu links and the close button */
  if (e.key !== "Tab") return;
  const links = $$("#menu a"), first = links[0], last = links[links.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); burger.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); burger.focus(); }
});

/* copy buttons and gallery thumbnails */
document.addEventListener("click", e => {
  const el = e.target.closest ? e.target : null; if (!el) return;
  const g = el.closest(".gal-b");
  if (g && lb){ lbOpen(g); return; }
  const k = el.closest("[data-copy]");
  if (k){
    const done = t => { k.textContent = t; setTimeout(() => { k.textContent = "Copy"; }, 1600); };
    const fallback = () => { try { const r = document.createRange(); r.selectNodeContents(k.parentNode.querySelector(".val")); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (err) {} done("Selected"); };
    try { navigator.clipboard.writeText(k.getAttribute("data-copy")).then(() => done("Copied"), fallback); } catch (err) { fallback(); }
  }
});

/* ======================= enquiry form ======================= */
const form = $("#enquiry");
if (form){
  const st = $("#formStatus"), btn = $("button[type=submit]", form);
  const OFFICE = "info@metey.in", CC = "prasad@metey.in", WA = "919700159325";
  const fields = { name: $("#f-name"), email: $("#f-email"), msg: $("#f-msg") };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const ARR = '<svg aria-hidden="true"><use href="#arr"/></svg>';
  Object.values(fields).forEach(f => f.addEventListener("input", () => f.removeAttribute("aria-invalid")));

  /* direct email / WhatsApp links carrying the enquiry, offered after sending or if sending fails */
  const directLinks = d => {
    const subject = encodeURIComponent(`Project enquiry${d.ref ? ` [${d.ref}]` : ""}: ${d.service} - ${d.name}`);
    const body = encodeURIComponent(`Name: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email}\nService: ${d.service}\n\nProject brief:\n${d.message}${d.ref ? `\n\nReference: ${d.ref}` : ""}`);
    const wa = encodeURIComponent(`Hello METEY Engineering, I would like to discuss a project (${d.service}). My name is ${d.name}.${d.ref ? ` Enquiry reference ${d.ref}.` : ""}`);
    return `<div class="links"><a class="more" href="mailto:${OFFICE}?cc=${CC}&subject=${subject}&body=${body}">Email us directly ${ARR}</a><a class="more" href="https://wa.me/${WA}?text=${wa}" target="_blank" rel="noopener">Message on WhatsApp ${ARR}</a></div>`;
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = {
      name: fields.name.value.trim(), email: fields.email.value.trim(), message: fields.msg.value.trim(),
      phone: $("#f-phone").value.trim(), service: $("#f-service").value
    };
    const bad = [];
    if (!d.name) bad.push(fields.name);
    if (!validEmail(d.email)) bad.push(fields.email);
    if (!d.message) bad.push(fields.msg);
    Object.values(fields).forEach(f => { if (bad.indexOf(f) >= 0) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid"); });
    if (bad.length){
      st.className = "status err";
      st.innerHTML = `<div class="ref">Incomplete details</div><div class="body">Please give your name, a valid email address and a short description of the project.</div>`;
      bad[0].focus();
      return;
    }

    const endpoint = form.getAttribute("data-endpoint");
    if (!endpoint){
      /* no collection endpoint configured: be honest and hand over to email or WhatsApp */
      st.className = "status";
      st.innerHTML = `<div class="head">Send your enquiry</div><div class="body">Choose how to send it. Your details are filled in for you.</div>${directLinks(d)}`;
      return;
    }

    btn.disabled = true; st.className = "status"; st.innerHTML = `<div class="body">Sending…</div>`;
    const payload = new URLSearchParams(new FormData(form));
    payload.set("page", location.pathname);
    fetch(endpoint, { method:"POST", body: payload })
      .then(r => r.json())
      .then(res => {
        if (!res || res.result !== "success") throw new Error((res && res.error) || "Not saved");
        d.ref = res.ref || "";
        st.className = "status";
        st.innerHTML = `${d.ref ? `<div class="ref">Reference · ${escT(d.ref)}</div>` : ""}<div class="head">Enquiry received</div><div class="body">Thank you, <strong>${escT(d.name)}</strong>. Your enquiry about <em>${escT(d.service)}</em> has reached our office. We will reply to <strong>${escT(d.email)}</strong>, usually within one business day.</div>`;
        form.reset();
      })
      .catch(() => {
        st.className = "status err";
        st.innerHTML = `<div class="ref">Not sent</div><div class="body">We could not send your enquiry just now. Please use one of these instead. Your details are filled in.</div>${directLinks(d)}`;
      })
      .then(() => { btn.disabled = false; });
  });
}

/* ======================= start ======================= */
onScroll();
const intro = $(".intro");
const shown = intro && !root.classList.contains("intro-seen") && !RM;
setTimeout(() => { startIO(); if (intro) setTimeout(() => intro.remove(), shown ? 800 : 0); }, shown ? 900 : 0);

} catch (err) {
  /* if anything above fails, show the page plainly instead of leaving it hidden */
  root.classList.remove("js");
  if (window.console) console.error(err);
}
})();
