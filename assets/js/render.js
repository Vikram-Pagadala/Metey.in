/* METEY drawing and page sections.
   Every function here returns an HTML/SVG string and touches no DOM, so the same file
   is used by tools/build.mjs (to write the static pages) and by the browser (for the
   systems diagrams on the home page). Content lives in src/data/*.json; the build hands it
   over as globalThis.METEY_DATA, and the browser, which only draws diagrams, has none. */
(function(){
"use strict";
const D = globalThis.METEY_DATA || {};
const ARR = '<svg aria-hidden="true"><use href="#arr"/></svg>';
const SLATE = ["#2C4A6E","#A9B8C8"];
const PAL = { terra:SLATE, teal:SLATE, blue:SLATE, plum:SLATE, ochre:SLATE, green:SLATE, brass:["#8A6420","#D9B25F"] };
const SKY_ONE = ["#C3CDD7","#E2E6EA","#ECE9E3"];
const GROUP_C = { architects:"terra", "structural-engineers":"blue", "design-engineers":"teal", "site-engineers":"ochre", administration:"plum" };
const SERVICE_C = { architecture:"terra", structural:"blue", mep:"green", interiors:"plum", technologies:"teal", "peer-review":"ochre", pmc:"blue" };

/* filters on the projects page, in the order the content pack lists them */
const SECTORS = [["all","All"],["government-housing","Government Housing"],["education","Education"],["commercial","Commercial"],["industrial","Industrial"],["residential","Residential"]];
const CATEGORIES = [["all","All"],["architecture","Architecture"],["structural","Structural"],["precast","Precast"],["monolithic","Monolithic"],["composite-eps","Composite / EPS"],["conventional","Conventional"],["interiors","Interiors"],["peer-review","Peer Review"]];
const SEC_C = { all:"brass", "government-housing":"terra", education:"plum", commercial:"blue", industrial:"ochre", residential:"teal" };
const STATE_NAMES = { telangana:"Telangana", "andhra-pradesh":"Andhra Pradesh", karnataka:"Karnataka", goa:"Goa", odisha:"Odisha", assam:"Assam", bihar:"Bihar",
  "uttar-pradesh":"Uttar Pradesh", haryana:"Haryana", chhattisgarh:"Chhattisgarh", "tamil-nadu":"Tamil Nadu", delhi:"Delhi" };
const SYSTEMS = [
  { id:"precast", c:"teal", name:"Precast", line:"Walls, slabs and frames cast off site and erected by crane.", cap:"Wall panels lowered into place, then hollow-core slabs, floor by floor" },
  { id:"mono", c:"terra", name:"Monolithic", line:"Walls and slabs cast together in aluminium formwork, floor after floor.", cap:"Formwork set, walls and slab poured as one, formwork lifted to the next floor" },
  { id:"eps", c:"ochre", name:"Insulated wall", line:"EPS panels finished with sprayed concrete on both faces.", cap:"A section through the wall: insulating core, wire mesh, sprayed concrete" },
  { id:"lgs", c:"blue", name:"Light-gauge steel", line:"Cold-formed steel framing for light, quick structures.", cap:"Tracks, studs and bracing assembled, then sheathed" },
  { id:"comp", c:"plum", name:"Composite", line:"Steel frames carrying hollow-core or deck slabs.", cap:"A steel frame with a deck slab below and hollow-core planks above" }
];

/* ======================= drawing helpers ======================= */
const f = n => Math.round(n * 10) / 10;
const R = (x, y, w, h, c, rx) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" class="${c}"${rx ? ` rx="${rx}"` : ""}/>`;
const L = (a, b, c, d, k) => `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(d)}" class="${k}"/>`;
const P = (d, k) => `<path d="${d}" class="${k}"/>`;
const C = (x, y, r, k) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" class="${k}"/>`;
const T = (x, y, t, k) => `<text x="${f(x)}" y="${f(y)}" class="${k}">${t}</text>`;
const A = (inner, cls, t) => `<g class="${cls}" style="--t:${f(t)}s">${inner}</g>`;

/* ---- icons ---- */
const PCI = L(36,5,36,16,"dr") + P("M20 24L36 16L52 24","dr") + L(20,24,20,28,"dr") + L(52,24,52,28,"dr") + R(14,28,44,30,"dr") + R(27,36,18,13,"dr") + L(8,64,64,64,"dr");
const IC = {
  A: P("M10 26L36 10L62 26Z","dr") + L(12,31,60,31,"dr") + [18,30,42,54].map(x => L(x,34,x,55,"dr")).join("") + L(10,58,62,58,"dr") + L(7,63,65,63,"dr"),
  S: R(14,12,44,48,"dr") + L(14,36,58,36,"dr") + L(14,12,58,36,"dr") + L(58,12,14,36,"dr") + L(14,60,36,36,"dr") + L(58,60,36,36,"dr"),
  PC: PCI,
  ID: L(36,5,36,17,"dr") + P("M31 17H41L47 30H25Z","dr") + L(12,46,60,46,"dr") + L(18,46,18,64,"dr") + L(54,46,54,64,"dr") + C(36,40,5,"dr"),
  PR: C(30,30,17,"dr") + L(43,43,62,62,"dr") + P("M21 30L28 37L40 23","dr"),
  CS: L(22,64,22,14,"dr") + L(8,14,64,14,"dr") + P("M10 14L22 5L50 14","dr") + L(22,5,22,14,"dr") + L(48,14,48,34,"dr") + R(41,34,14,11,"dr") + L(12,64,32,64,"dr"),
  economy: L(36,10,36,60,"dr") + L(14,20,58,20,"dr") + P("M14 20L7 38H21Z","dr") + P("M7 38Q14 47 21 38","dr") + P("M58 20L51 38H65Z","dr") + P("M51 38Q58 47 65 38","dr") + L(26,60,46,60,"dr"),
  MEP: L(8,18,64,18,"dr") + L(8,30,40,30,"dr") + C(50,30,8,"dr") + L(58,30,64,30,"dr") + P("M20 18V58","dr") + P("M44 46H64","dr") + P("M44 38V58","dr") + L(10,58,62,58,"dr") + P("M30 40l-5 8h8l-5 8","dr"),
  efficiency: C(36,40,21,"dr") + L(36,40,36,27,"dr") + L(36,40,46,46,"dr") + L(31,12,41,12,"dr") + L(36,12,36,19,"dr")
};
const icon = (k, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 72 72" aria-hidden="true">${IC[k]}</svg>`;

/* ---- banner line art ---- */
const ART = {
  about(){
    let s = P("M30 72L260 12L490 72Z","ba dr") + P("M70 66L260 26L450 66Z","bb dr") + C(260,50,9,"bb dr") + R(30,72,460,12,"ba dr") + R(42,84,436,10,"ba dr");
    for (let i = 0; i < 6; i++){ const x = 62 + i * 79.2; s += R(x-12,94,24,5,"ba dr") + L(x-8,99,x-9,184,"ba dr") + L(x+8,99,x+9,184,"ba dr") + L(x,104,x,180,"bb dr") + R(x-13,184,26,6,"ba dr"); }
    return s + R(30,190,460,8,"ba dr") + R(14,198,492,8,"ba dr") + R(0,206,520,8,"ba dr");
  },
  services(){
    let s = C(170,34,7,"bb dr") + L(170,22,170,10,"ba dr") + L(166,40,118,176,"ba dr") + L(174,40,222,176,"ba dr") + P("M118 176l-3 12","bb dr") + P("M222 176l3 12","bb dr") + P("M92 170Q170 214 248 170","bb dr") + L(140,110,200,110,"ba dr");
    s += P("M300 188H480V44Z","ba dr") + P("M352 170H462V84Z","ba dr") + R(40,196,440,18,"ba dr");
    for (let x = 52; x < 480; x += 12) s += L(x,196,x,(x - 52) % 60 === 0 ? 208 : 203,"bb dr");
    return s;
  },
  projects(){
    let s = "";
    [[20,60,90],[86,44,150],[136,70,110],[212,50,186],[268,64,130],[338,40,96],[384,58,164],[448,52,120]].forEach((b, i) => {
      s += R(b[0],206-b[2],b[1],b[2],"ba dr");
      for (let y = 206 - b[2] + 14; y < 200; y += 16) s += L(b[0]+8,y,b[0]+b[1]-8,y,i % 2 ? "bb dr" : "ba dr");
    });
    return s + L(0,206,520,206,"ba dr") + L(237,20,237,6,"bb dr");
  },
  insights(){
    let s = P("M260 56C220 34 150 34 96 50V190C150 174 220 174 260 196Z","ba dr") + P("M260 56C300 34 370 34 424 50V190C370 174 300 174 260 196Z","ba dr") + L(260,56,260,196,"bb dr");
    for (let i = 0; i < 6; i++){ const y = 78 + i * 18; s += P(`M118 ${y}C160 ${y-10} 210 ${y-8} 244 ${y+6}`,"bb dr") + P(`M276 ${y+6}C310 ${y-8} 360 ${y-10} 402 ${y}`,"bb dr"); }
    return s + P("M84 62V204C150 186 220 188 260 208C300 188 370 186 436 204V62","ba dr");
  },
  careers(){
    let d = "M40 206";
    for (let i = 0; i < 6; i++) d += `H${104 + i * 64}V${180 - i * 26}`;
    let s = P(d + "H490V206Z","ba dr");
    for (let i = 0; i < 6; i++) s += L(52 + i * 64, 196 - i * 26, 92 + i * 64, 196 - i * 26, "bb dr");
    return s + L(456,50,456,12,"bb dr") + P("M456 12L486 22L456 32","bb dr") + C(96,58,22,"bb dr") + C(96,58,30,"ba dr");
  },
  team(){
    let s = L(20,206,500,206,"ba dr");
    [70,160,250,340,430].forEach((x, i) => { const h = i % 2 ? 0 : 10; s += C(x,96 - h,18,"ba dr") + P(`M${x-34} 206V${160 - h}Q${x} ${118 - h} ${x+34} ${160 - h}V206`,"ba dr") + L(x,140 - h,x,206,"bb dr"); });
    return s + P("M40 60H480","bb dr") + L(40,54,40,66,"bb dr") + L(480,54,480,66,"bb dr");
  },
  clients(){
    let s = L(0,206,520,206,"ba dr");
    [[30,70,96],[110,56,150],[176,88,118],[274,60,176],[344,74,128],[428,62,90]].forEach((b, i) => {
      s += R(b[0],206-b[2],b[1],b[2],"ba dr");
      for (let x = b[0] + 10; x < b[0] + b[1] - 6; x += 14) s += L(x,206-b[2]+12,x,200,i % 2 ? "bb dr" : "ba dr");
    });
    return s + C(450,52,20,"bb dr") + C(450,52,28,"ba dr");
  },
  contact(){
    let s = C(260,112,92,"ba dr") + C(260,112,72,"bb dr") + P("M260 12L274 98L360 112L274 126L260 212L246 126L160 112L246 98Z","ba dr") + P("M260 52L270 102L320 112L270 122L260 172L250 122L200 112L250 102Z","bb dr");
    for (let a = 0; a < 360; a += 15){ const r2 = a % 45 === 0 ? 104 : 98, t = a * Math.PI / 180; s += L(260 + 92 * Math.cos(t), 112 + 92 * Math.sin(t), 260 + r2 * Math.cos(t), 112 + r2 * Math.sin(t), "ba dr"); }
    return s;
  }
};

/* ---- project elevations ---- */
const G = 172;
function block(x, w, h, cols, rows, o){
  o = o || {};
  const y = G - h, cw = w / cols, rh = h / rows;
  let s = R(x,y,w,h,"b");
  for (let i = 1; i < rows; i++) s += L(x,y+i*rh,x+w,y+i*rh,"t");
  if (o.glass){ for (let j = 1; j < cols; j++) s += L(x+j*cw,y,x+j*cw,G,"t"); }
  else for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){ if (o.skip && o.skip(i, j)) continue; s += R(x+j*cw+cw*.24,y+i*rh+rh*.26,cw*.52,rh*.48,"w"); }
  return s + R(x+w*.8,y,w*.2,h,"sh") + R(x,y,w,Math.min(3.2,rh*.45),"ac");
}
const FORMS = {
  demo(){ let s = ""; for (let i = 0; i < 7; i++){ const x = 24 + i * 39.6; s += block(x,32,i % 2 ? 66 : 52,2,3) + T(x+16,G+15,i+1,"n"); } return s; },
  towers(){ return block(40,52,134,4,24) + block(134,52,134,4,24) + block(228,52,134,4,24); },
  tower(){ return block(118,84,142,6,17,{glass:true}) + block(66,188,26,10,2); },
  slab(){ return block(60,200,121,10,11); },
  mono(){ return block(28,80,76,5,5) + block(120,80,76,5,5) + block(212,80,76,5,5); },
  mono2(){ return block(40,108,78,6,5) + block(172,108,78,6,5); },
  wall(){
    let s = block(60,200,66,8,3,{skip:(i, j) => i === 0 && j > 4});
    for (let j = 5; j < 8; j++){ const x = 60 + j * 25; for (let k = 4; k < 25; k += 5) s += L(x+k,G-66,x+k-4,G-44,"t"); }
    return s;
  },
  villa(){
    let s = "";
    [44,176].forEach(x => {
      s += R(x,G-46,100,46,"b") + P(`M${x-8} ${G-46}L${x+50} ${G-78}L${x+108} ${G-46}Z`,"b");
      s += R(x+12,G-34,18,18,"w") + R(x+70,G-34,18,18,"w") + R(x+42,G-28,16,28,"w") + R(x+80,G-46,20,46,"sh");
    });
    return s;
  },
  rows(){ return block(24,84,60,4,4) + block(118,84,78,4,5) + block(212,84,60,4,4); },
  hall(){
    let s = R(40,G-50,240,50,"b") + R(30,G-58,260,8,"b");
    for (let x = 52; x <= 268; x += 24) s += L(x,G-50,x,G,"k");
    return s + P(`M108 ${G-58}L160 ${G-82}L212 ${G-58}Z`,"b") + R(30,G-4,260,4,"b");
  },
  school(){ return block(36,248,54,12,3) + R(138,G-68,44,68,"b") + R(152,G-24,16,24,"w") + L(138,G-54,182,G-54,"t"); },
  campus(){ return block(22,104,66,6,4) + block(194,104,66,6,4) + block(122,76,90,4,5); },
  plant(){
    let s = block(22,118,62,6,4);
    s += L(140,G-34,238,G-34,"k") + L(140,G-28,238,G-28,"k") + L(150,G-28,150,G,"k") + L(228,G-28,228,G,"k");
    s += R(166,G-84,20,84,"b",10) + R(196,G-84,20,84,"b",10);
    return s + block(238,60,46,3,2);
  },
  shed(){
    let s = P(`M28 ${G}L28 ${G-52}L98 ${G-72}L168 ${G-52}L168 ${G}Z`,"b");
    for (let x = 38; x < 168; x += 10) s += L(x,G-50,x,G,"t");
    s += R(182,G-98,54,98,"b") + L(182,G-98,236,G-49,"t") + L(236,G-98,182,G-49,"t") + L(182,G-49,236,G,"t") + L(236,G-49,182,G,"t") + L(182,G-49,236,G-49,"k");
    return s + R(254,G-142,12,142,"b");
  }
};
const SCALE = { demo:1.12, towers:1.2, tower:1.3, slab:1.4, mono:1.12, mono2:1.2, wall:1.4, villa:1.15, rows:1.1, hall:1.15, school:1.18, campus:1.1, plant:1.1, shed:1.15 };
function plate(form, c){
  let s = `<rect x="0" y="-40" width="320" height="212" fill="url(#gSky)"/>` + C(250,66,72,"glow") + C(250,66,15,"disc");
  s += `<g class="cloud"><ellipse cx="62" cy="2" rx="28" ry="7"/><ellipse cx="86" cy="-4" rx="19" ry="6"/></g><g class="cloud c2"><ellipse cx="190" cy="-16" rx="23" ry="6"/><ellipse cx="212" cy="-12" rx="15" ry="5"/></g>`;
  let far = "M0 172", x = 0;
  [30,50,36,64,44,56,32,70,48,60,38,52,30,62,44,50].forEach(h => { far += `V${G - h}H${x + 20}`; x += 20; });
  s += P(far + "V172Z","far") + R(0,G,320,28,"gnd");
  s += `<g transform="translate(160 ${G}) scale(${SCALE[form] || 1}) translate(-160 ${-G})">${FORMS[form]()}</g>`;
  const tree = (tx, r) => L(tx,G,tx,G-r*1.5,"tr") + C(tx,G-r*2,r,"tc");
  s += tree(12,5) + tree(308,6) + L(0,G,320,G,"g");
  for (let k = 6; k < 320; k += 10) s += L(k,G+6,k-5,G+11,"t");
  return `<svg class="pl c-${c}" viewBox="0 -40 320 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative elevation">${s}</svg>`;
}

/* ---- building-system diagrams ---- */
const note = (x, y, text, x2, y2, t, anchor) => A(`<text x="${x}" y="${y}" class="nt"${anchor ? ` text-anchor="${anchor}"` : ""}>${text}</text>` + (x2 != null ? L(x2[0],x2[1],y2[0],y2[1],"nl") + C(y2[0],y2[1],2.2,"nd") : ""), "a-fade", t);
const dgGround = () => { let s = L(40,296,440,296,"gl"); for (let x = 48; x < 440; x += 12) s += L(x,296,x-6,302,"gh"); return s; };
const DG = {
  precast(){
    let s = dgGround(), t = .2; const x0 = 96, bw = 72, sh = 66, gy = 296;
    for (let i = 0; i < 3; i++){
      const y = gy - (i + 1) * sh + 8;
      for (let j = 0; j < 4; j++){ s += A(R(x0+j*bw,y,bw,sh-8,"pn") + R(x0+j*bw+20,y+16,32,26,"wn"), "a-drop", t); t += .16; }
      let sl = R(x0,y-8,4*bw,8,"cc"); for (let k = 0; k < 18; k++) sl += C(x0+8+k*16,y-4,2.4,"vd");
      s += A(sl, "a-slide", t); t += .45;
    }
    s += note(96,44,"WALL PANELS",[132,50],[132,112],t) + note(250,44,"HOLLOW-CORE SLABS",[300,50],[300,98],t+.2);
    return s;
  },
  mono(){
    let s = dgGround(); const x0 = 120, W = 240, wt = 14, sh = 78, gy = 296;
    for (let i = 0; i < 3; i++){
      const yb = gy - i * sh, t = i * 2.1 + .2, walls = [x0, x0 + W/2 - wt/2, x0 + W - wt];
      let fm = "", cc = "";
      walls.forEach(wx => { cc += R(wx,yb-sh+12,wt,sh-12,"cc"); fm += R(wx-6,yb-sh+12,5,sh-12,"fm") + R(wx+wt+1,yb-sh+12,5,sh-12,"fm"); });
      cc += R(x0,yb-sh,W,12,"cc");
      fm += R(x0+wt+6,yb-sh+12,W/2-wt*1.5-12,5,"fm") + R(x0+W/2+wt/2+6,yb-sh+12,W/2-wt*1.5-12,5,"fm");
      s += A(fm, i === 2 ? "a-fade" : "a-form", t) + A(cc, "a-grow", t + .5);
    }
    s += note(40,36,"ALUMINIUM FORMWORK",[80,42],[116,96],4.9) + note(262,36,"WALLS AND SLAB, ONE POUR",[330,42],[330,64],5.4);
    return s;
  },
  eps(){
    const y1 = 56, y2 = 280;
    let s = A(R(214,y1,52,y2-y1,"ep") + R(214,y1,52,y2-y1,"epd"), "a-fade", .1);
    const zig = (x, d) => { let p = `M${x} ${y1}`; for (let y = y1; y < y2 - 6; y += 12) p += `l${d} 6l${-d} 6`; return p; };
    s += `<path d="${zig(206,4)}" class="ms a-draw" style="--t:.7s"/><path d="${zig(274,-4)}" class="ms a-draw" style="--t:.9s"/>`;
    for (let y = y1 + 16; y < y2 - 20; y += 44) s += `<line x1="206" y1="${y}" x2="274" y2="${y+14}" class="ms a-draw" style="--t:1.2s"/>`;
    s += A(R(176,y1,30,y2-y1,"cc"), "a-growx gx-l", 1.9) + A(R(274,y1,30,y2-y1,"cc"), "a-growx gx-r", 1.9);
    [110,190].forEach((ny, q) => {
      s += A(P(`M96 ${ny-8}L116 ${ny}L96 ${ny+8}Z`,"nz") + P(`M384 ${ny-8}L364 ${ny}L384 ${ny+8}Z`,"nz"), "a-fade", 1.5);
      for (let k = 0; k < 5; k++){ s += `<circle cx="120" cy="${ny - 6 + k * 3}" r="1.6" class="sp a-spray" style="--t:${f(1.6 + k * .2 + q * .1)}s"/><circle cx="360" cy="${ny - 6 + k * 3}" r="1.6" class="sp a-spray rv2" style="--t:${f(1.6 + k * .2 + q * .1)}s"/>`; }
    });
    s += note(240,40,"EPS CORE",null,null,.4,"middle") + note(322,250,"WIRE MESH",[318,247],[277,247],1.4) + note(240,306,"SPRAYED CONCRETE, BOTH FACES",null,null,2.8,"middle");
    return s;
  },
  lgs(){
    const x0 = 96, x1 = 384, gy = 292, top = 84;
    let s = dgGround() + A(R(x0,gy-6,x1-x0,6,"sl"), "a-fade", .1), t = .4;
    const studs = []; for (let x = x0; x <= x1 - 30; x += 36) studs.push(x); studs.push(x1 - 6);
    studs.forEach(x => { s += A(R(x,top+6,6,gy-top-12,"sl"), "a-grow", t); t += .12; });
    s += A(R(x0,top,x1-x0,6,"sl"), "a-fade", t); t += .3;
    s += `<line x1="${x0}" y1="188" x2="${x1}" y2="188" class="st a-draw" style="--t:${f(t)}s"/>`; t += .4;
    s += `<line x1="${x0+3}" y1="${gy-6}" x2="${x0+147}" y2="${top+6}" class="br a-draw" style="--t:${f(t)}s"/><line x1="${x0+147}" y1="${gy-6}" x2="${x0+3}" y2="${top+6}" class="br a-draw" style="--t:${f(t+.2)}s"/>`; t += .8;
    s += A(R(x1-144,top,144,gy-top,"bdg") + L(x1-72,top,x1-72,gy,"gh"), "a-slide", t);
    s += note(96,44,"COLD-FORMED STUDS",[136,50],[136,84],t) + note(96,316,"BRACING",null,null,t+.2) + note(384,316,"SHEATHING",null,null,t+.4,"end");
    return s;
  },
  comp(){
    const gy = 296, cols = [110,240,370];
    let s = dgGround(), t = .2;
    cols.forEach(cx => { s += A(R(cx-5,96,10,gy-96,"sl"), "a-grow", t); t += .2; });
    [206,116].forEach(by => { [0,1].forEach(b => { s += A(R(cols[b]+5,by,cols[b+1]-cols[b]-10,9,"sl"), "a-growx gx-r", t); t += .22; }); });
    let d = "M105 206"; for (let x = 105; x < 375; x += 18) d += "l3-7h6l3 7h6";
    s += `<path d="${d}" class="br a-draw" style="--t:${f(t)}s"/>`; t += .8;
    s += A(R(105,186,270,13,"cc"), "a-fade", t); t += .5;
    let hc = R(105,104,270,12,"cc"); for (let k = 0; k < 16; k++) hc += C(116+k*16.5,110,3,"vd");
    s += A(hc, "a-slide", t); t += .6;
    s += note(40,316,"STEEL FRAME",null,null,t) + note(392,180,"DECK SLAB",[388,184],[376,192],t+.2) + note(196,84,"HOLLOW-CORE SLAB",[240,88],[240,104],t+.4);
    return s;
  }
};
const diagram = id => `<svg class="dg" viewBox="0 0 480 330" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated diagram">${DG[id]()}</svg>`;

/* ---- building types: a photograph of one of our projects for each sector (full size: the tall arch crops it) ---- */
const TYPES2 = [
  { name:"Offices", c:"blue", go:"apcpdcl-corporate-office-vijayawada", img:"/assets/images/metey/projects/apcpdcl-corporate-office-vijayawada/apcpdcl-built-photo.webp" },
  { name:"Commercial", c:"ochre", go:"jindal-corporate-tower-raigarh", img:"/assets/uploads/2018/09/Jindal-corporate-tower-1.jpg" },
  { name:"Educational institutions", c:"plum", go:"iit-patna-secondary-school", img:"/assets/images/metey/projects/iit-patna-secondary-school/iit-patna-school-render.webp" },
  { name:"Hospitals", c:"teal", go:"gsl-medical-college-rajahmundry", img:"/assets/images/metey/projects/gsl-medical-college-rajahmundry/hostel-block-1.webp" },
  { name:"Shopping malls", c:"terra", go:"golf-links-ghaziabad-landcraft", img:"/assets/images/metey/projects/golf-links-ghaziabad-landcraft/zonal-shopping-complex.webp" },
  { name:"Residential", c:"green", go:"vasavi-urban-bachupally", img:"/assets/images/metey/projects/vasavi-urban-bachupally/vasavi-urban-render.webp" },
  { name:"Industrial structures", c:"brass", go:"sai-life-sciences-pharma", img:"/assets/images/metey/projects/sai-life-sciences-pharma/sai-life-building.webp" }
];
const grad = (id, st) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${st[0]}"/><stop offset=".62" stop-color="${st[1]}"/><stop offset="1" stop-color="${st[2]}"/></linearGradient>`;

/* ======================= links between pages ======================= */
/* "home", "about", "project-<slug>" */
const href = r => r === "home" ? "/" : r.indexOf("project-") === 0 ? `/projects/${r.slice(8)}/` : `/${r}/`;

/* ======================= small helpers ======================= */
/* data files hold plain text, so everything taken from them is escaped on the way into HTML */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ticks = a => `<ul class="ticks">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
/* initials avatar: "Mr. K. Akhil Sai Mohan" -> KM */
const initials = n => { const w = n.replace(/^(Mr|Ms|Mrs|Dr|Er)\.\s*/, "").replace(/\./g, " ").split(/\s+/).filter(Boolean); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
const pad = n => (n < 10 ? "0" : "") + n;
const more = (r, t) => `<a class="more" href="${href(r)}">${esc(t)} ${ARR}</a>`;
/* the first sentence, not fooled by abbreviations such as "e.g." */
const firstSentence = t => t.split(/(?<=\b[a-z\d]{2,}\.)\s+(?=[A-Z])/i)[0];
const optionName = (list, k) => (list.find(s => s[0] === k) || ["", ""])[1];
const sectorName = k => optionName(SECTORS, k);
const categoryName = k => optionName(CATEGORIES, k);

/* one <img> for any image in the data. Archive photos also have a 400 px thumbnail;
   content-pack images come in one size and are never stretched past it (see .lowres). */
const SIZES_CARD = "(max-width: 600px) 92vw, (max-width: 1024px) 45vw, 400px", SIZES_BIG = "(max-width: 56rem) 92vw, 50vw";
function pic(im, o){
  o = o || {};
  const small = o.thumb && im.thumb;
  const srcset = im.thumb ? ` srcset="${im.thumb} 400w, ${im.src} ${im.width}w" sizes="${o.sizes || SIZES_CARD}"` : "";
  const w = small ? 400 : im.width, h = small ? 284 : im.height;
  return `<img src="${small ? im.thumb : im.src}"${srcset} alt="${o.alt === undefined ? esc(im.alt) : esc(o.alt)}" width="${w}" height="${h}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${o.cls ? ` class="${o.cls}"` : ""}>`;
}
/* captioned: the alt text also shows under each picture */
const thumbs = (list, cls, captioned) => `<div class="${cls || "pf"}${captioned ? " pf-cap" : ""}">${list.map(im => `<figure class="pf-i${im.lowRes ? " lowres" : ""}">${pic(im, { thumb: true, alt: captioned ? "" : undefined })}${captioned ? `<figcaption>${esc(im.alt)}</figcaption>` : ""}</figure>`).join("")}</div>`;

/* ======================= projects ======================= */
const PROJECTS = D.projects || [];
const FEAT = PROJECTS.filter(p => p.featured);
const project = slug => PROJECTS.find(p => p.slug === slug);
const colour = p => SEC_C[(p.sectors || [])[0]] || "brass";
/* cards may use a low-resolution image; the large picture on a project page may not */
const cardImage = p => p.images[p.cover != null ? p.cover : Math.max(0, p.images.findIndex(im => !im.lowRes))];
const bigImage = p => { const c = p.cover != null && p.images[p.cover]; return c && !c.lowRes ? c : p.images.find(im => !im.lowRes) || null; };
const shot = (p, big, eager) => {
  const im = big ? bigImage(p) : cardImage(p);
  return `<div class="shot">${plate(p.form, colour(p))}${im ? pic(im, big ? { sizes: SIZES_BIG, eager } : { thumb: true, alt: "" }) : ""}<span class="tag"></span></div>`;
};
const kicker = p => (p.sectors || []).length ? p.sectors.map(sectorName).join(" · ") : (p.categories || []).map(categoryName).join(" · ");
const card = (p, i) => `<a class="card c-${colour(p)}" href="${href("project-" + p.slug)}" data-cats="${(p.categories || []).join(" ")}" data-sectors="${(p.sectors || []).join(" ")}" data-states="${(p.states || []).join(" ")}" style="--i:${i}"><div class="mat tilt">${shot(p)}</div>${kicker(p) ? `<p class="eyebrow">${esc(kicker(p))}</p>` : ""}<h3>${esc(p.title)}</h3>${p.location || p.client ? `<p class="meta">${esc(p.location || p.client)}</p>` : ""}</a>`;
const chipRow = (name, key, list) => `<div class="chips" role="group" aria-label="Filter by ${name}" data-filter="${key}"><span class="chips-l">${name}</span>${list.map(s => {
  const n = s[0] === "all" ? PROJECTS.length : PROJECTS.filter(p => (p[key] || []).indexOf(s[0]) >= 0).length;
  return n ? `<button class="chip c-${SEC_C[s[0]] || "brass"}" type="button" data-value="${s[0]}" aria-pressed="${s[0] === "all"}">${s[1]} · ${n}</button>` : "";
}).join("")}</div>`;

function projectPage(p){
  const i = PROJECTS.indexOf(p), prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
  const facts = [];
  if (p.client) facts.push(["Client", p.client]);
  if (p.archived && (p.sectors || []).length) facts.push(["Sector", p.sectors.map(sectorName).join(", ")]);
  if (p.location) facts.push(["Location", p.location]);
  if (p.category) facts.push(["Category", p.category]);
  if (p.system) facts.push(["System", p.system]);
  if (p.status) facts.push(["Status", p.status]);
  if (p.archivePhotos) facts.push(["Archive", p.archivePhotos + " photographs"]);
  const gallery = `<div class="gal-wrap"><h2 class="h3">Drawings and photographs</h2><div class="gal">${p.images.map((im, k) => `<button class="gal-b" type="button" data-full="${im.src}" data-w="${im.width}" aria-label="Enlarge image ${k + 1} of ${p.images.length}">${pic(im, { thumb: true })}</button>`).join("")}</div></div>`;
  return `<div class="pd-grid"><div class="mat" data-rv="wipe" style="--wc:${PAL[colour(p)][0]}">${shot(p, true, true)}</div><div class="stack" style="gap:1.5rem">${kicker(p) ? `<p class="eyebrow tint c-${colour(p)}" data-rv>${esc(kicker(p))}</p>` : ""}<h1 data-split>${esc(p.title)}</h1>` +
    (p.description ? `<p data-rv>${esc(p.description)}</p>` : "") +
    (p.list ? (p.archived ? `<ol class="nums" data-rv>${p.list.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : `<div data-rv>${ticks(p.list)}</div>`) : "") +
    (p.keyFacts ? `<div class="stack" data-rv><p class="label">Key facts</p>${ticks(p.keyFacts)}</div>` : "") +
    (facts.length ? `<dl class="facts" data-rv>${facts.map(x => `<div><dt>${x[0]}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl>` : "") +
    (p.website ? `<p data-rv><a class="more" href="${p.website.url}" target="_blank" rel="noopener">Visit the ${esc(p.website.name)} website ${ARR}</a></p>` : "") +
    `<p class="note" data-rv>Project calculations, comprehensive structural detailing sheets, and technical parameters available on client consultation.</p></div></div>${gallery}` +
    `<nav class="pd-nav" aria-label="More projects"><a class="more prev" href="${href("project-" + prev.slug)}">${ARR} ${esc(prev.title)}</a><a class="more" href="${href("project-" + next.slug)}">${esc(next.title)} ${ARR}</a></nav>`;
}

/* states with work, most projects first; Telangana (head office) leads */
function statesWorked(){
  const n = {};
  PROJECTS.forEach(p => (p.states || []).forEach(s => { n[s] = (n[s] || 0) + 1; }));
  return Object.keys(n).sort((a, b) => (b === "telangana") - (a === "telangana") || n[b] - n[a]).map(s => ({ id: s, name: STATE_NAMES[s], count: n[s], projects: PROJECTS.filter(p => (p.states || []).indexOf(s) >= 0) }));
}

/* ======================= services ======================= */
const SVC = D.services ? D.services.services : [];
const TECH = D.services ? D.services.technologies : null;
const service = id => SVC.concat(TECH ? [TECH] : []).find(s => s.id === id);
const svcHref = s => s.id === "technologies" ? href("technologies") : `${href("services")}#${svcAnchor(s)}`;
const svcAnchor = s => s.anchor || s.id;

/* ======================= render ======================= */
const render = {
  marquee: items => { const one = items.map(t => `<span>${esc(t)}</span>`).join(""); return one + one + one + one; },
  gradients: () => grad("gSky", SKY_ONE),
  art: k => `<svg viewBox="0 0 520 220" aria-hidden="true">${ART[k]()}</svg>`,
  esc,

  /* ---- home ---- */
  /* the last two words of the headline take the accent colour */
  heroTitle: () => { const w = esc(D.site.home.hero.headline).split(" "); return w.slice(0, -2).join(" ") + " <em>" + w.slice(-2).join(" ") + "</em>"; },
  heroSub: () => esc(D.site.home.hero.sub),
  heroSlides: () => D.site.home.hero.slides.map((sl, i) => {
    const p = project(sl.project), im = p.images.find(x => x.src === sl.src);
    /* only the first photograph loads with the page; site.js fills in the rest */
    const img = i ? `<img data-src="${im.src}" alt="${esc(im.alt)}" width="${im.width}" height="${im.height}" decoding="async">` : pic(im, { eager: true, sizes: "100vw" });
    return `<figure class="hs${i ? "" : " on"}" data-slide="${i}">${img}<figcaption><a href="${href("project-" + p.slug)}"><span class="hs-n">${pad(i + 1)} / ${pad(D.site.home.hero.slides.length)}</span><b>${esc(p.title)}</b>${p.location ? `<span>${esc(p.location)}</span>` : ""}</a></figcaption></figure>`;
  }).join(""),
  heroDots: () => D.site.home.hero.slides.map((sl, i) => `<button type="button" data-hs="${i}" aria-label="${esc(project(sl.project).title)}"${i ? "" : ' aria-current="true"'}><i></i></button>`).join(""),
  heroButtons: () => D.site.home.hero.buttons.map((b, i) => i ? `<a class="more" href="${b[1]}">${esc(b[0])} ${ARR}</a>` : `<a class="btn" href="${b[1]}">${esc(b[0])} ${ARR}</a>`).join("\n        "),
  intro: () => D.site.home.intro.map((t, i) => `<p${i ? ' class="soft"' : ' class="dropcap"'} data-rv>${esc(t)}</p>`).join(""),
  counters: () => D.site.home.counters.filter(s => s.value != null).map((s, i) => {
    if (s.roll) return `<div class="stat stat-roll" data-rv data-in><div class="ticket" aria-label="${esc(s.value.toLocaleString("en-IN"))} ${esc(s.unit || "")}"><b aria-hidden="true">${s.value.toLocaleString("en-IN").split("").map(ch => /\d/.test(ch) ? `<span class="reel" style="--n:${ch}"><span>${"0123456789".split("").map(d => `<i>${d}</i>`).join("")}</span></span>` : `<span class="sep">${ch}</span>`).join("")}</b>${s.unit ? `<span class="unit">${esc(s.unit)}</span>` : ""}</div><p>${esc(s.label)}</p></div>`;
    const big = s.value >= 1000 && s.from == null;
    const shown = big ? s.value.toLocaleString("en-IN") : s.value;
    return `<div class="stat c-${["brass","terra","teal","blue","plum","ochre"][i % 6]}" data-rv data-in style="--d:${(i % 3) * .12}s"><div class="medal"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="r1" cx="50" cy="50" r="48.5"/><circle class="r2" cx="50" cy="50" r="42"/><circle class="r3" cx="50" cy="50" r="42" pathLength="1" transform="rotate(-90 50 50)"/></svg><b>${s.prefix ? esc(s.prefix) : ""}<span data-count="${s.value}" data-from="${s.from || 0}"${big ? " data-group" : ""}>${shown}</span>${s.suffix ? esc(s.suffix) : ""}</b></div>${s.unit ? `<p class="unit">${esc(s.unit)}</p>` : ""}<p>${esc(s.label)}</p></div>`;
  }).join(""),
  serviceTiles: () => D.site.home.services.map(service).map((s, i) => `<a class="tile c-${SERVICE_C[s.id]}" href="${svcHref(s)}" data-rv style="--d:${(i % 3) * .12}s"><span class="code" aria-hidden="true">${s.icon === "CS" ? "PMC" : s.icon}</span>${icon(s.icon)}<h3>${esc(s.card)}</h3><p>${esc(firstSentence(s.text))}</p><span class="go">Read more ${ARR}</span></a>`).join(""),
  clientsList: () => esc(D.site.home.clients.join(", ")),
  clientStrip: () => render.marquee(D.site.home.clients),
  portfolio: () => thumbs(D.site.home.portfolio),
  sysTabs: () => SYSTEMS.map((s, i) => `<button class="sys-tab c-${s.c}${i ? "" : " on"}" type="button" role="tab" id="sys-tab-${i}" aria-controls="sysStage" data-sys="${i}" aria-selected="${!i}"><i></i><b>${s.name}</b><span>${s.line}</span></button>`).join(""),
  sysStage: () => diagram(SYSTEMS[0].id),
  sysCap: () => SYSTEMS[0].cap,
  types: () => TYPES2.map((t, i) => { const p = project(t.go), im = p.images.find(x => x.src === t.img); return `<div class="type c-${t.c}" data-rv style="--d:${i * .08}s"><div class="arch tilt">${pic(Object.assign({}, im, { thumb: null }))}</div><h3>${t.name}</h3>${p ? more("project-" + p.slug, p.title) : ""}</div>`; }).join(""),
  stateCount: () => { const s = statesWorked(); const ut = s.filter(x => x.id === "delhi").length; return `${s.length - ut} states${ut ? " and Delhi" : ""}`; },
  places: () => statesWorked().map((s, i) => {
    const names = s.projects.slice(0, 2).map(p => `<a href="${href("project-" + p.slug)}">${esc(p.title)}</a>`).join(", ");
    const rest = s.count > 2 ? ` <a href="/projects/?state=${s.id}">and ${s.count - 2} more</a>` : "";
    return `<div class="place c-${["brass","terra","plum","teal","ochre","blue"][i % 6]}" data-rv style="--d:${(i % 6) * .06}s"><i></i><h3>${s.name}</h3><p>${s.id === "telangana" ? "Head office, Hyderabad. " : ""}${names}${rest}.</p></div>`;
  }).join(""),
  carDots: () => FEAT.map((p, i) => `<button type="button" data-dot="${i}" aria-label="${esc(p.title)}"${i ? "" : ' aria-current="true"'}></button>`).join(""),
  carFrame: i => shot(FEAT[i], true),
  carBody: i => { const p = FEAT[i]; return `<p class="car-count"><b>${pad(i + 1)}</b> / ${pad(FEAT.length)}</p>${kicker(p) ? `<p class="eyebrow tint c-${colour(p)}">${esc(kicker(p))}</p>` : ""}<h3>${esc(p.title)}</h3><p class="soft">${esc(p.description ? firstSentence(p.description) : (p.keyFacts || []).join(" · "))}${p.location ? `<br><span class="car-meta">${esc(p.location)}</span>` : ""}</p><p>${more("project-" + p.slug, "View project")}</p>`; },
  /* every slide after the first waits in a <template>, so its images load only when it is shown */
  carTemplates: () => FEAT.map((p, i) => `<template id="carF${i}">${render.carFrame(i)}</template><template id="carB${i}">${render.carBody(i)}</template>`).join(""),

  /* ---- about ---- */
  story: () => `<p class="dropcap" data-rv>${esc(D.site.about.story.text)}</p><div data-rv>${ticks(D.site.about.story.points)}</div>`,
  history: () => `<ol class="timeline">${D.site.about.history.map((h, i) => `<li data-rv style="--d:${i * .12}s"><span class="when">${esc(h[0])}</span><p>${esc(h[1])}</p></li>`).join("")}</ol>`,
  expertise: () => `<p data-rv>${esc(D.site.about.expertise.intro)}</p><ul class="ticks" data-rv>${D.site.about.expertise.areas.map(a => `<li><b>${esc(a[0])}</b>${a[1] ? esc(a[1]) : ""}</li>`).join("")}</ul>`,
  message: () => { const m = D.site.about.message, ph = D.team.founder.photo; return `<figure class="portrait" data-rv>${pic(ph)}<figcaption>${esc(m.name)}</figcaption></figure><blockquote class="message" data-rv>${m.paragraphs.map(t => `<p>${esc(t)}</p>`).join("")}<footer><b>${esc(m.name)}</b> — ${esc(m.role)}</footer></blockquote>`; },
  promises: () => D.site.about.principles.items.map((p, i) => `<div class="promise c-${["ochre","teal","terra"][i]}" data-rv style="--d:${i * .14}s">${icon(p[0])}<h3>${esc(p[1])}</h3><p>${esc(p[2])}</p></div>`).join(""),

  /* ---- team ---- */
  founder: () => { const f = D.team.founder; return `<figure class="portrait" data-rv>${pic(f.photo)}</figure><div class="stack"><p class="eyebrow" data-rv>Founder &amp; Director</p><h2 data-split>${esc(f.name)}</h2><p class="label" data-rv>${esc(f.role)}</p><div data-rv>${ticks(f.profile)}</div></div>`; },
  teamCount: () => 1 + D.team.groups.reduce((n, g) => n + g.people.length, 0),
  teamGroups: () => D.team.groups.map(g => `<section class="tgroup c-${GROUP_C[g.id] || "brass"}" id="${g.id}" aria-labelledby="${g.id}-h"><h2 class="h3" id="${g.id}-h" data-rv>${esc(g.name)}</h2><div class="people">${g.people.map((m, i) => {
    const facts = [["Qualification", m.qualification], ["Experience", m.experience], ["Work", m.work]].filter(x => x[1]);
    return `<article class="pcard" data-rv style="--d:${(i % 4) * .06}s"><div class="face" aria-hidden="true">${initials(m.name)}${m.photo ? `<img src="${m.photo.src}" alt="" width="${m.photo.width}" height="${m.photo.height}" loading="lazy" decoding="async">` : ""}</div><div class="pcard-b"><h3>${esc(m.name)}</h3>${m.role ? `<p class="role">${esc(m.role)}</p>` : ""}${facts.length ? `<dl>${facts.map(x => `<div><dt>${x[0]}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl>` : ""}${m.about ? `<p class="soft">${esc(m.about)}</p>` : ""}</div></article>`;
  }).join("")}</div></section>`).join(""),
  experience: () => { const x = D.team.directorExperience; return `<p class="soft" data-rv>${esc(x.note)}</p><ul class="xp" data-rv>${x.items.map(it => `<li><h3>${esc(it.name)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ""}</li>`).join("")}</ul>${thumbs(x.images, "pf", true)}`; },

  /* ---- services ---- */
  svcIndex: () => SVC.map(s => `<a class="c-${SERVICE_C[s.id]}" href="#${svcAnchor(s)}"><span class="bubble">${icon(s.icon)}</span><span>${esc(s.name)}</span></a>`).join("") + (TECH ? `<a class="c-${SERVICE_C.technologies} ext" href="${href("technologies")}"><span class="bubble">${icon(TECH.icon)}</span><span>${esc(TECH.name)} ${ARR}</span></a>` : ""),
  svcBody: () => SVC.map(s => {
    const rel = (s.projects || []).map(project).filter(Boolean);
    let body = `<div class="prac-body"><div class="stack"><p>${esc(s.text)}</p>` + (s.examples ? ticks(s.examples) : "") + (rel.length ? `<div class="links">${rel.map(p => more("project-" + p.slug, p.title)).join("")}</div>` : "") + `</div>` +
      (s.scope ? `<div class="stack"><p class="label">Scope</p>${ticks(s.scope)}</div>` : "<div></div>") + `</div>`;
    if (s.tiers) body += `<p class="soft measure">${esc(s.tiers.intro)}</p><div class="steps">` + s.tiers.levels.map((t, k) => `<div class="step navy c-${["brass","teal","terra"][k]}"><span class="num">${t.num}</span><h3>${esc(t.name)}</h3>${ticks(t.includes)}<dl><div><dt>Ends with</dt><dd>${esc(t.ends)}</dd></div><div><dt>Terms</dt><dd>${esc(t.terms)}</dd></div></dl></div>`).join("") + `</div>`;
    return `<section class="prac c-${SERVICE_C[s.id]}" id="${svcAnchor(s)}" data-rv><header><div><p class="eyebrow">Service</p><h2>${esc(s.name)}</h2></div>${icon(s.icon, "auto")}</header>${body}</section>`;
  }).join(""),

  /* ---- technologies ---- */
  techIntro: () => esc(TECH.text),
  techIndex: () => TECH.items.map(t => `<a class="c-${SERVICE_C.technologies}" href="#${t.id}"><span class="bubble num">${pad(TECH.items.indexOf(t) + 1)}</span><span>${esc(t.name)}</span></a>`).join(""),
  techBody: () => TECH.items.map((t, i) => {
    const sys = t.system && SYSTEMS.find(x => x.id === t.system);
    const rel = (t.category ? PROJECTS.filter(p => (p.categories || []).indexOf(t.category) >= 0) : (t.projects || []).map(project).filter(Boolean));
    const papers = (t.papers || []).flatMap(k => D.insights.articles.filter(a => a.title.toLowerCase().indexOf(k) >= 0));
    const side = sys ? `<figure class="tech-fig sys-stage navy"><span class="corner a"></span><span class="corner b"></span><span class="corner c"></span><span class="corner d"></span><div class="sys-svg">${diagram(sys.id)}</div><figcaption class="sys-cap">${esc(sys.cap)}</figcaption></figure>` : "";
    const gal = t.images ? `<div class="gal">${t.images.map((im, k) => `<button class="gal-b" type="button" data-full="${im.src}" data-w="${im.width}" aria-label="Enlarge image ${k + 1} of ${t.images.length}: ${esc(im.alt)}">${pic(im, { thumb: true })}</button>`).join("")}</div>` : "";
    return `<section class="techsec c-${SERVICE_C.technologies}" id="${t.id}" aria-labelledby="${t.id}-h"><header><p class="eyebrow">Technology ${pad(i + 1)}</p><h2 id="${t.id}-h">${esc(t.name)}</h2></header>` +
      `<div class="tech-body${side ? "" : " solo"}"><div class="stack"><p class="tech-lead">${esc(t.text)}</p>` +
      (sys ? `<div class="stack"><p class="label">How it is built</p><p>${esc(sys.line)}</p></div>` : "") +
      (t.note ? `<p class="note">${esc(t.note)}</p>` : "") +
      (rel.length ? `<div class="stack"><p class="label">Projects by Metey · ${rel.length}</p><ul class="tech-projects">${rel.map(p => `<li><a href="${href("project-" + p.slug)}">${esc(p.title)}</a>${p.location ? `<span>${esc(p.location)}</span>` : ""}</li>`).join("")}</ul></div>` : "") +
      (papers.length ? `<div class="stack"><p class="label">Further reading</p><div class="links">${papers.map(a => `<a class="more" href="${a.file}" target="_blank" rel="noopener">${esc(a.title)} ${ARR}</a>`).join("")}</div></div>` : "") +
      `</div>${side}</div>${gal}</section>`;
  }).join(""),

  /* ---- clients ---- */
  clientTables: () => D.clients.tables.map(t => `<section class="ctable" id="${t.id}" aria-labelledby="${t.id}-h"><h2 class="h3" id="${t.id}-h" data-rv>${esc(t.name)}</h2><div class="tbl-wrap stackable" data-rv tabindex="0" role="region" aria-labelledby="${t.id}-h"><table><thead><tr>${t.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, k) => k ? `<td data-label="${esc(t.columns[k])}">${esc(c)}</td>` : `<th scope="row" class="name">${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div></section>`).join(""),
  clientSummary: () => { const t = D.clients.summary; return `<h2 class="h3" id="summary-h" data-rv>${esc(t.name)}</h2><div class="tbl-wrap stackable" data-rv tabindex="0" role="region" aria-labelledby="summary-h"><table class="summary"><thead><tr>${t.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r => `<tr><td class="num">${esc(r[0])}</td><td class="name">${esc(r[1])}</td><td data-label="${esc(t.columns[2])}">${esc(r[2])}</td></tr>`).join("")}</tbody></table></div>`; },

  /* ---- projects ---- */
  filters: () => chipRow("Category", "categories", CATEGORIES) + chipRow("Sector", "sectors", SECTORS),
  grid: () => PROJECTS.map(card).join(""),
  project: projectPage,

  /* ---- insights ---- */
  articles: () => D.insights.articles.map((a, i) => `<a class="entry" href="${a.file}" target="_blank" rel="noopener" data-rv style="--d:${i * .06}s"><span class="src">${esc(a.source)}</span><h3>${esc(a.title)}</h3><span class="round">${ARR}</span></a>`).join(""),
  events: () => D.insights.events.map((e, i) => `<div class="entry" data-rv style="--d:${i * .06}s"><span class="src">${esc(e.source)}</span><div><h3>${esc(e.title)}</h3><p class="soft entry-note">${esc(e.note)}</p></div></div>`).join(""),
  shelf: () => {
    const SP = [["terra",15.2],["teal",16],["blue",14],["plum",15],["plum",15.8],["ochre",17.2],["green",12.6]];
    return D.insights.articles.map((a, i) => { const sp = SP[i % SP.length]; return `<a class="spine c-${sp[0]}" href="${a.file}" target="_blank" rel="noopener" style="--h:${sp[1]}rem;--i:${i}" aria-label="${esc(a.title)}, ${esc(a.source)}">${esc(a.spine)}</a>`; }).join("") + '<span class="bookend" aria-hidden="true"></span>';
  },

  /* ---- contact ---- */
  serviceOptions: () => ["Not sure yet"].concat(SVC.concat(TECH ? [TECH] : []).map(s => s.card)).map(o => `<option>${esc(o)}</option>`).join("\n            "),
  contactList: () => {
    const c = D.site.company, a = c.address;
    const kv = (label, value, link) => `<div class="kv"><span>${esc(label)}</span><a class="val" href="${link}">${esc(value)}</a><button class="copy" type="button" data-copy="${esc(link.replace(/^(tel|mailto):/, ""))}">Copy</button></div>`;
    const tel = n => "tel:" + n.replace(/[^\d+]/g, "");
    let s = `<div><p class="label">Head office</p><p>${esc(a.street)},<br>${esc(a.city)} – ${esc(a.postalCode)}, ${esc(a.region)}, ${esc(a.country)}</p>` + c.phones.map(p => kv(p.label, p.number, tel(p.number))).join("") + c.emails.map(e => kv(e.label, e.address, "mailto:" + e.address)).join("") + `</div>`;
    s += `<div><p class="label">Branch office</p><p>${esc(c.branch)}</p></div>`;
    s += c.people.map(p => `<div><p class="label">${esc(p.label)}</p>${p.name ? `<p>${esc(p.name)}</p>` : ""}${p.phone ? kv("Mobile", p.phone, tel(p.phone)) : ""}${p.email ? kv("Email", p.email, "mailto:" + p.email) : ""}</div>`).join("");
    return s + `<div><p class="label">Online</p><div class="kv"><span>Facebook</span><a class="val" href="${c.facebook}" target="_blank" rel="noopener">facebook.com/meteyengineeringnconsultancy</a></div></div>`;
  }
};

globalThis.METEY = { STATE_NAMES, SECTORS, CATEGORIES, ARR, PAL, SEC_C, PROJECTS, FEAT, SYSTEMS, sectorName, categoryName, statesWorked, href, esc, diagram, render };
})();
