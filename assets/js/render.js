/* METEY site data and drawing.
   Every function here returns an HTML/SVG string and touches no DOM, so the same file
   is used by tools/build.mjs (to write the static pages) and by the browser (for the
   pieces that change after load: the featured carousel and the systems diagrams). */
(function(){
"use strict";
const ARR = '<svg aria-hidden="true"><use href="#arr"/></svg>';
const WP = "/assets/uploads/";
const SLATE = ["#2C4A6E","#A9B8C8"];
const PAL = { terra:SLATE, teal:SLATE, blue:SLATE, plum:SLATE, ochre:SLATE, green:SLATE, brass:["#8A6420","#D9B25F"] };
const SEC_C = { all:"brass", housing:"terra", residential:"teal", civic:"blue", institutional:"plum", industrial:"ochre" };
const PRAC_C = { A:"terra", S:"blue", PC:"teal", ID:"plum", PR:"ochre", CS:"green" };
const SKY_ONE = ["#C3CDD7","#E2E6EA","#ECE9E3"];
const SKY = { housing:SKY_ONE, residential:SKY_ONE, civic:SKY_ONE, institutional:SKY_ONE, industrial:SKY_ONE };
const GROUND = { housing:"#D6D0C4", residential:"#D6D0C4", civic:"#D6D0C4", institutional:"#D6D0C4", industrial:"#D6D0C4" };
const LIFE_C = ["terra","blue","ochre","plum","teal"];
const ROLE_C = { "Director":"brass", "Manager, Engineering":"brass", "Structural Engineer":"blue", "Design Engineer":"teal", "Architect":"terra" };

/* ======================= data ======================= */
const PRACTICES = [
  { code:"A", id:"architecture", name:"Architecture and Master Planning",
    line:"Layouts, buildings and master plans, from gated communities to towers.",
    intro:["The quality of our surroundings shapes the quality of our lives, at home, at work and in public.",
           "We bring the same care to a single building and to the layout of a whole community: how it works, how it performs in its climate, and how it sits in its physical and cultural setting."],
    scope:["Gated-community and group-housing layouts","Residential buildings and multi-storey towers","Offices and commercial buildings","Educational institutions","Function halls","Industrial buildings","Master planning","Green buildings"],
    links:[["projects","Projects and further schemes"]] },
  { code:"S", id:"structural", name:"Structural Engineering",
    line:"Tall buildings, long spans, steel and composite frames, designed for wind and earthquake.",
    intro:["We design structures to stand safely against everything they will meet, and to carry no more material than they need.",
           "Our particular strengths are tall buildings, long clear spans, and steel and composite frames, designed for wind and earthquake."],
    scope:["Design and detailing","3D modelling","Multi-storey and tall buildings","Earthquake-resistant design","Wind analysis for towers","Large column-free spans","Structural steel and composite structures","Industrial structures","Foundations for towers","Bridges","FRP structures","Strengthening existing buildings"],
    links:[["project-jindal","Jindal Corporate Tower"],["project-vasavi","Vasavi Towers"],["project-power-plant","11 MW Power Plant"]] },
  { code:"PC", id:"precast", name:"Precast and Fast-Build Technologies",
    line:"Precast, monolithic, insulated wall, light-gauge steel and composite systems.",
    intro:["When a building has to open sooner, the method of construction is a design decision.",
           "We design in the systems that shorten a programme. Seven of them stand together at the Kethanakonda demonstration site."],
    scope:["Precast walls with hollow-core slabs","Prestressed elements","Monolithic construction in aluminium formwork","Insulated walls: EPS with sprayed concrete","Light-gauge steel construction","Composite frames: steel with hollow-core or deck slabs"],
    links:[["project-kethanakonda","Kethanakonda demonstration"],["project-ews-monolithic","EWS monolithic housing"],["insights","Articles on precast"]] },
  { code:"ID", id:"interiors", name:"Interior Design",
    line:"Light, materials, colour and furnishings planned as one scheme.",
    intro:["Light, materials, colour, furnishings and works of art are planned as one scheme with the building. Each element goes through the same questioning and refinement as the architecture itself.",
           "We look at how colour, texture, furniture, lighting and space work together for the people who use the building."],
    scope:["Space planning","Lighting","Materials and colour","Furniture and furnishings","Works of art"], links:[] },
  { code:"PR", id:"peer-review", name:"Peer Review",
    line:"An independent check of structural design, at three levels.",
    intro:["An independent check of another consultant's structural design, offered at three levels. Each level includes everything in the one before.",
           "To begin, we need the design basis report prepared by the main consultant and signed by the client."],
    scope:null, links:[] },
  { code:"CS", id:"construction-stage", name:"Construction-Stage Services",
    line:"Pre-bid engineering, supervision, monitoring and quantity surveying.",
    intro:["Support from tender to handover, so that what is built matches what was designed.",
           "We work alongside the contractor, the project manager and specialist suppliers until delivery is complete."],
    scope:["Pre-bid engineering","Procurement support","Formwork design","Site survey","Executive supervision","Construction monitoring","Project management","Quantity surveying and contracts"], links:[] }
];
const TIERS = [
  { num:"I", name:"Independent check",
    incl:["We build our own analysis model, in our own software.","We check the member sizes on the main consultant's drawings against gravity, wind and earthquake loads.","Where a section falls short, we say so and recommend a size."],
    ends:"Certification of the design.", terms:"One-time. No part in later revisions or in construction." },
  { num:"II", name:"Check and optimise",
    incl:["Everything in level I.","Member sizes optimised, in discussion with the main consultant and the client.","Drawings revised where needed, with the main consultant."],
    ends:"Certification and a written report.", terms:"Two months at the least, depending on when drawings are issued." },
  { num:"III", name:"Through construction",
    incl:["Everything in level II.","Consultancy continued through the construction period, where the client asks for it."],
    ends:"The close of construction support.", terms:"Charged in addition to the review." }
];
const PROMISES = [
  ["economy","Economy","Cost-effective results, with every structure sized for economy."],
  ["efficiency","Efficiency","We stay in touch with every team on the project, from contractors and project managers to specialist suppliers, until delivery is complete in all respects."],
  ["PC","Current technology","The newest sound methods of construction, chosen to suit the building and its programme."]
];
const SYSTEMS = [
  { id:"precast", c:"teal", name:"Precast", line:"Walls, slabs and frames cast off site and erected by crane.", cap:"Wall panels lowered into place, then hollow-core slabs, floor by floor" },
  { id:"mono", c:"terra", name:"Monolithic", line:"Walls and slabs cast together in aluminium formwork, floor after floor.", cap:"Formwork set, walls and slab poured as one, formwork lifted to the next floor" },
  { id:"eps", c:"ochre", name:"Insulated wall", line:"EPS panels finished with sprayed concrete on both faces.", cap:"A section through the wall: insulating core, wire mesh, sprayed concrete" },
  { id:"lgs", c:"blue", name:"Light-gauge steel", line:"Cold-formed steel framing for light, quick structures.", cap:"Tracks, studs and bracing assembled, then sheathed" },
  { id:"comp", c:"plum", name:"Composite", line:"Steel frames carrying hollow-core or deck slabs.", cap:"A steel frame with a deck slab below and hollow-core planks above" }
];
const LIFE = [
  ["I","Plan",["Master planning","Layouts for gated communities and group housing","Site survey"]],
  ["II","Design",["Architecture","Structural design and detailing","Interior design","3D modelling"]],
  ["III","Verify",["Peer review","Optimisation of member sizes"]],
  ["IV","Procure",["Pre-bid engineering","Procurement support","Quantity surveying and contracts"]],
  ["V","Build",["Formwork design","Executive supervision","Construction monitoring","Project management"]]
];
const STATS = [
  [2013, 1990, "Founded in Hyderabad, with a branch in Amaravati", "brass"],
  [23, 0, "Architects, engineers and visualisers", "terra"],
  [6, 0, "States with METEY projects", "teal"],
  [5, 0, "Fast-build systems we design in", "blue"]
];
const TYPES = ["Offices","Commercial","Educational institutions","Hospitals","Shopping malls","Residential","Industrial structures"];
const SECTORS = [["all","All"],["housing","Affordable housing"],["residential","Residential"],["civic","Commercial and civic"],["institutional","Institutional"],["industrial","Industrial"]];
const STATE_NAMES = { telangana:"Telangana", "andhra-pradesh":"Andhra Pradesh", karnataka:"Karnataka", goa:"Goa", odisha:"Odisha", assam:"Assam" };
const seq = (pre, a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(pre + i); return o; };
const PROJECTS = [
  { id:"kethanakonda", states:["andhra-pradesh"], form:"demo", sector:"housing", feat:1, name:"Technology Demonstration Housing", loc:"Kethanakonda, Amaravati region, Andhra Pradesh", sys:"Seven building systems", photos:57,
    text:"A demonstration site for affordable (EWS) housing, where seven building systems were constructed at one location.",
    list:["Monolithic construction in aluminium formwork","Insulated walls: EPS with sprayed concrete on both faces","Precast walls with precast hollow-core slabs","Composite construction: a structural steel frame with hollow-core slabs, and steel framing with deck-slab floors","An EWS housing system from Malaysia","An EWS housing system from Turkey","An EWS housing system from China"],
    img:{ d:"2018/09/", e:".jpg", n:["Kethanakonda-43","Kethanakonda-1","Kethanakonda-8","Kethanakonda-15","Kethanakonda-22","Kethanakonda-29","Kethanakonda-36","Kethanakonda-50"] } },
  { id:"vasavi", form:"towers", sector:"residential", feat:1, name:"Vasavi Towers", loc:"", sys:"3B + S + 23 floors", photos:8,
    text:"Twelve blocks on a 22-acre site, each of three basements, a stilt floor and 23 floors.",
    img:{ d:"2020/09/", e:".jpeg", n:["WhatsApp-Image-2020-09-22-at-6.35.11-PM","WhatsApp-Image-2020-09-22-at-6.35.12-PM","WhatsApp-Image-2020-09-22-at-6.35.19-PM-1","WhatsApp-Image-2020-09-22-at-6.35.19-PM","WhatsApp-Image-2020-09-22-at-6.35.20-PM-1","WhatsApp-Image-2020-09-22-at-6.35.20-PM","WhatsApp-Image-2020-09-22-at-6.35.21-PM-1","WhatsApp-Image-2020-09-22-at-6.35.21-PM"] } },
  { id:"jindal", form:"tower", sector:"civic", feat:1, name:"Jindal Corporate Tower", loc:"", sys:"Composite structure", photos:7,
    text:"A corporate tower built as a composite structure.",
    img:{ d:"2018/09/", e:".jpg", n:["Jindal-corporate-tower-2","Jindal-corporate-tower-1","Jindal-corporate-tower-3","Jindal-corporate-tower-4","Jindal-corporate-tower-5","Jindal-corporate-tower-6","Jindal-corporate-tower-7"] } },
  { id:"sai-life", states:["telangana"], form:"plant", sector:"industrial", feat:1, name:"Sai Life Sciences", loc:"Hyderabad", sys:"Pharmaceutical facility", photos:18,
    text:"A pharmaceutical facility in Hyderabad.",
    img:{ d:"2020/09/", e:".jpeg", n:["WhatsApp-Image-2020-09-02-at-11.10.06-AM","WhatsApp-Image-2020-09-02-at-11.10.07-AM-1","WhatsApp-Image-2020-09-02-at-11.10.07-AM","WhatsApp-Image-2020-09-02-at-11.10.08-AM-1","WhatsApp-Image-2020-09-02-at-11.10.08-AM","WhatsApp-Image-2020-09-02-at-11.10.09-AM"] } },
  { id:"nursing-school", states:["assam"], form:"campus", sector:"institutional", feat:1, name:"Nursing School, Numaligarh Refinery", loc:"Assam", sys:"", photos:80,
    text:"A nursing school for Numaligarh Refinery Limited.",
    img:{ d:"2018/11/", e:".jpg", n:["Nursing-schooll1","Nursing-schooll5","Nursing-schooll10","Nursing-schooll15","Nursing-schooll20","IMG-20170917-WA0043","IMG-20170916-WA0020","IMG-20170907-WA0012"] } },
  { id:"dundigal", states:["telangana"], form:"slab", sector:"housing", feat:1, name:"11-Storey EWS Housing", loc:"Dundigal, Hyderabad", sys:"Eleven storeys", photos:8, status:"Listed as ongoing",
    text:"Eleven-storey housing for the economically weaker section at Dundigal, Hyderabad.",
    img:{ d:"2018/11/", e:".jpg", n:seq("EWS-Housing-Dundigal", 1, 8) } },
  { id:"ews-monolithic", states:["andhra-pradesh","karnataka"], form:"mono", sector:"housing", name:"EWS Monolithic Housing", loc:"Andhra Pradesh and Bangalore", sys:"Monolithic, aluminium formwork", photos:24,
    text:"Housing for the economically weaker section, cast monolithically in aluminium formwork at sites in Andhra Pradesh and Bangalore.",
    img:{ d:"2018/09/", e:".jpg", n:["EWS-MONOLITHIC-CONSTRUCTION-AP11","EWS-MONOLITHIC-CONSTRUCTION-AP1","EWS-MONOLITHIC-CONSTRUCTION-AP4","EWS-MONOLITHIC-CONSTRUCTION-AP7","EWS-MONOLITHIC-CONSTRUCTION-AP10","EWS-MONOLITHIC-CONSTRUCTION-AP13","EWS-MONOLITHIC-CONSTRUCTION-AP16","EWS-MONOLITHIC-CONSTRUCTION-AP19"] } },
  { id:"mandadam", states:["andhra-pradesh"], form:"mono2", sector:"housing", name:"EWS Housing, Mandadam", loc:"Mandadam, Amaravati", sys:"Monolithic construction", photos:5,
    text:"Affordable housing built with monolithic construction technology. Designed by METEY; developed by KMV Projects.",
    img:{ d:"2019/06/", e:".jpg", n:["20190620_091232","20190620_091428","20190620_091449","20190620_091501","20190620_091530"] } },
  { id:"odisha", states:["odisha"], form:"wall", sector:"housing", name:"Insulated Wall Construction", loc:"Odisha", sys:"Insulated wall system", photos:12,
    text:"Insulated wall construction in Odisha.",
    img:{ d:"2018/09/", e:".jpg", n:["Insulated-wall-construction-Orissa6"].concat(seq("Insulated-wall-construction-Orissa", 1, 5), seq("Insulated-wall-construction-Orissa", 7, 8)) } },
  { id:"goa-villas", states:["goa"], form:"villa", sector:"residential", name:"Goa Villas", loc:"Goa", sys:"", photos:24,
    text:"Villas in Goa.",
    img:{ d:"2018/11/", e:".jpg", n:seq("Goa-Villasl", 1, 8) } },
  { id:"landcraft", form:"rows", sector:"residential", name:"Landcraft", loc:"", sys:"", photos:14,
    text:"Recorded during construction and after completion.",
    img:{ d:"2020/05/", e:".jpg", n:seq("", 7, 14) } },
  { id:"conference-hall", states:["andhra-pradesh"], form:"hall", sector:"civic", name:"Conference Hall", loc:"Kethanakonda, Andhra Pradesh", sys:"", photos:8,
    text:"A conference hall at Kethanakonda.",
    img:{ d:"2018/11/", e:".jpg", n:seq("Kethanakonda-conference-hall", 1, 4).concat(["2016-02-15-11.02.10","2016-02-15-11.14.23","2016-02-15-11.32.14","2016-02-15-11.32.32"]) } },
  { id:"montessori", states:["karnataka"], form:"school", sector:"institutional", name:"Montessori School", loc:"Bangalore", sys:"", photos:28,
    text:"A Montessori school in Bangalore.",
    img:{ d:"2018/11/", e:".jpg", n:["Montessory-school1","Montessory-school4","Montessory-school8","Montessory-school12","Montessory-school16","Montessory-school20","Montessory-school24","Montessory-school28"] } },
  { id:"power-plant", form:"shed", sector:"industrial", name:"11 MW Power Plant", loc:"", sys:"Industrial structure", photos:7,
    text:"Structures for an 11 MW power plant.",
    img:{ d:"2018/09/", e:".jpg", n:["11MW-Power-plant-4","11MW-Power-plant-1","11MW-Power-plant-2","11MW-Power-plant-3","11MW-Power-plant-5","11MW-Power-plant-6","11MW-Power-plant-7"] } }
];
const REGISTER = [
  ["Assam","Institutional","Architecture, structure","1.8 acres","7,143 sq m"],
  ["Assam","Institutional, hostel","Architecture, structure","",""],
  ["Assam","Institutional","","",""],
  ["Visakhapatnam","Residential and commercial, economic city","Architecture, structure","28.08 acres",""],
  ["Rajahmundry, Andhra Pradesh","Recreational, food court","","",""],
  ["Rajahmundry, Andhra Pradesh","Institutional, hostel","Architecture, structure","","4,192 sq m"],
  ["Patrunivalasa, Andhra Pradesh","Residential","Architecture, structure","",""],
  ["Kandukuru, Andhra Pradesh","Residential","Architecture, structure","",""]
];
const TEAM = [
  ["C A Prasad","Director","2018/11/team1.png"],["V. Narasimha Reddy","Manager, Engineering","2018/11/team2.png"],
  ["Naveen Nunna","Structural Engineer","2018/11/team3.png"],["Nikhil N. Bidri","Structural Engineer","2018/11/team4.png"],["Umeshchandra M","Structural Engineer","2018/11/team5.png"],["Ravi Kumar","Structural Engineer","2018/11/team14.png"],
  ["A. Mahitha","Design Engineer","2018/11/team8.png"],["B. Bhavani","Design Engineer","2018/11/team0.png"],["Siva Bharath Pulugu","Design Engineer","2021/09/Passport-Pic-scaled-e1631881153599.jpg"],["V. Saida Reddy","Design Engineer","2018/11/team12.png"],["Ch. Manoj Kumar","Design Engineer","2020/09/Manoj.jpg"],["Ashok Bandi","Design Engineer","2018/11/team.png"],
  ["Akhil Kollipara","Architect","2018/11/team21.png"],["G. Neeharika","Architect","2018/11/team18.png"],["Ch. Kamalalaya","Architect","2018/11/team16.png"],["P. Prudhvi","Architect","2018/11/team20.png"]
];
const UP = WP + "2019/09/";
const ARTICLES = [
  ["Structural Connections for Precast Concrete Buildings","Master Builder · July 2015", UP + "STRUCTURAL-CONNECTIONS-FOR-PRECAST-CONCRETE-BUILDINGS-MASTER-BUILDER-JULY2015.pdf"],
  ["Innovative Green Building Technologies for the PMAY Scheme","Master Builder · July 2016", UP + "Article-published-in-july-2016-edition-of-Master-Builder-Innovative-green-building-technologies-for-PMAY-scheme.pdf"],
  ["Article in NBM&amp;CW","NBM&amp;CW · February 2017", UP + "NBMCW-Article-FEB-2017-issue.pdf"],
  ["Behavioral Study of Precast Concrete Structure","Part one", UP + "Behavioral-Study-of-Precast-Concrete-Structure.pdf"],
  ["Behavioral Study of Precast Concrete Structure","Part two", UP + "Behavioral-Study-of-Precast-Concrete-Structure-Part-2.pdf"],
  ["Affordable Housing Construction in Andhra Pradesh","Article", UP + "Affordable-Housing-Construction-in-Andhra-Pradesh.pdf"],
  ["Article for the PSEC website","Sai Kiran", UP + "Psec-website-Article-by-sai-kiran.pdf"]
];
const EVENTS = [
  ["Green Building Congress","Hyderabad · 2019","Indian Green Building Council"],
  ["A Regional Perspective on DfMA","Singapore","Conference presentation"],
  ["Workshop on Fire Safety in Buildings","Visakhapatnam · 2019","GVP College of Engineering"],
  ["National Techno Event, Udghosh","Guntur · 2019","Chalapathi Institute of Engineering and Technology"]
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
  efficiency: C(36,40,21,"dr") + L(36,40,36,27,"dr") + L(36,40,46,46,"dr") + L(31,12,41,12,"dr") + L(36,12,36,19,"dr")
};
const icon = (k, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 72 72" aria-hidden="true">${IC[k]}</svg>`;

/* ---- banner line art ---- */
const ART = {
  firm(){
    let s = P("M30 72L260 12L490 72Z","ba dr") + P("M70 66L260 26L450 66Z","bb dr") + C(260,50,9,"bb dr") + R(30,72,460,12,"ba dr") + R(42,84,436,10,"ba dr");
    for (let i = 0; i < 6; i++){ const x = 62 + i * 79.2; s += R(x-12,94,24,5,"ba dr") + L(x-8,99,x-9,184,"ba dr") + L(x+8,99,x+9,184,"ba dr") + L(x,104,x,180,"bb dr") + R(x-13,184,26,6,"ba dr"); }
    return s + R(30,190,460,8,"ba dr") + R(14,198,492,8,"ba dr") + R(0,206,520,8,"ba dr");
  },
  practice(){
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
function plate(form, sector){
  const sk = SKY[sector] ? sector : "housing";
  let s = `<rect x="0" y="-40" width="320" height="212" fill="url(#gSky-${sk})"/>` + C(250,66,72,"glow") + C(250,66,15,"disc");
  s += `<g class="cloud"><ellipse cx="62" cy="2" rx="28" ry="7"/><ellipse cx="86" cy="-4" rx="19" ry="6"/></g><g class="cloud c2"><ellipse cx="190" cy="-16" rx="23" ry="6"/><ellipse cx="212" cy="-12" rx="15" ry="5"/></g>`;
  let far = "M0 172", x = 0;
  [30,50,36,64,44,56,32,70,48,60,38,52,30,62,44,50].forEach(h => { far += `V${G - h}H${x + 20}`; x += 20; });
  s += P(far + "V172Z","far") + R(0,G,320,28,"gnd");
  s += `<g transform="translate(160 ${G}) scale(${SCALE[form] || 1}) translate(-160 ${-G})">${FORMS[form]()}</g>`;
  const tree = (tx, r) => L(tx,G,tx,G-r*1.5,"tr") + C(tx,G-r*2,r,"tc");
  s += tree(12,5) + tree(308,6) + L(0,G,320,G,"g");
  for (let k = 6; k < 320; k += 10) s += L(k,G+6,k-5,G+11,"t");
  return `<svg class="pl c-${SEC_C[sk]}" style="--gd:${GROUND[sk]}" viewBox="0 -40 320 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative elevation">${s}</svg>`;
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

/* ---- building types ---- */
const TYPE_SKY = ["#1E3152","#4D6483","#A3B0BF"];
const TYPES2 = [
  { name:"Offices", c:"blue", sky:TYPE_SKY, cx:160, s:1.45, draw:() => block(118,84,142,6,17,{glass:true}), go:["project-jindal","Jindal Corporate Tower"] },
  { name:"Commercial", c:"ochre", sky:TYPE_SKY, cx:160, s:1.5, draw:() => block(100,120,96,6,6) + R(100,G-20,120,5,"ac"), go:["project-conference-hall","Conference Hall"] },
  { name:"Educational institutions", c:"plum", sky:TYPE_SKY, cx:160, s:.84, draw:() => FORMS.school(), go:["project-montessori","Montessori School"] },
  { name:"Hospitals", c:"teal", sky:TYPE_SKY, cx:160, s:1.2, draw:() => block(80,160,112,8,7) + R(146,G-134,28,22,"b") + R(158,G-130,4,14,"ac") + R(153,G-125,14,4,"ac") },
  { name:"Shopping malls", c:"terra", sky:TYPE_SKY, cx:160, s:.9, draw:() => { let s = R(40,G-58,240,58,"b") + R(40,G-66,240,8,"ac"); for (let x = 52; x < 262; x += 34) s += P(`M${x} ${G}V${G-30}a13 13 0 0 1 26 0V${G}Z`,"w"); return s + R(128,G-88,64,22,"b") + R(136,G-80,48,6,"ac") + R(232,G-58,48,58,"sh"); } },
  { name:"Residential", c:"green", sky:TYPE_SKY, cx:160, s:1.35, draw:() => block(92,56,134,4,24) + block(172,56,134,4,24), go:["project-vasavi","Vasavi Towers"] },
  { name:"Industrial structures", c:"brass", sky:TYPE_SKY, cx:147, s:.86, draw:() => FORMS.shed(), go:["project-sai-life","Sai Life Sciences"] }
];
const grad = (id, st) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${st[0]}"/><stop offset=".62" stop-color="${st[1]}"/><stop offset="1" stop-color="${st[2]}"/></linearGradient>`;
function typeScene(t, i){
  let s = `<rect x="0" y="0" width="240" height="282" fill="url(#gType-${i})"/>` + C(178,96,70,"glow") + C(178,96,17,"disc");
  s += `<g class="cloud"><ellipse cx="60" cy="70" rx="26" ry="7"/><ellipse cx="82" cy="64" rx="17" ry="6"/></g>`;
  let far = "M0 282", x = 0;
  [34,52,40,66,46,58,36,62,44,54,38,48].forEach(h => { far += `V${282 - h}H${x + 20}`; x += 20; });
  s += P(far + "V282Z","far") + `<rect x="0" y="280" width="240" height="40" class="gnd"/>`;
  s += `<g transform="translate(120 280) scale(${t.s}) translate(${-t.cx} ${-G})">${t.draw()}</g>`;
  const tree = (tx, r) => L(tx,280,tx,280-r*1.5,"tr") + C(tx,280-r*2,r,"tc");
  s += tree(22,7) + tree(218,8) + L(0,280,240,280,"g");
  for (let k = 6; k < 240; k += 10) s += L(k,286,k-5,291,"t");
  return `<svg class="pl" viewBox="0 0 240 320" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${t.name}, illustrated">${s}</svg>`;
}

/* ======================= links between pages ======================= */
/* routes kept from the old one-page site: "firm", "project-jindal", "practice-structural" */
const href = r => r === "home" ? "/" : r.indexOf("project-") === 0 ? `/projects/${r.slice(8)}/` : r.indexOf("practice-") === 0 ? `/practice/#p-${r.slice(9)}` : `/${r}/`;

/* ======================= page sections ======================= */
const sectorName = k => (SECTORS.find(s => s[0] === k) || ["",""])[1];
const thumb = (p, i) => WP + p.img.d + p.img.n[i || 0] + "-400x284" + p.img.e;
const full = (p, i) => WP + p.img.d + p.img.n[i || 0] + p.img.e;
const SIZES_CARD = "(max-width: 600px) 92vw, (max-width: 1024px) 45vw, 400px", SIZES_BIG = "(max-width: 56rem) 92vw, 50vw";
const shot = (p, big, alt) => `<div class="shot">${plate(p.form, p.sector)}${p.img ? `<img src="${big ? full(p) : thumb(p)}" srcset="${thumb(p)} 400w, ${full(p)} 1200w" sizes="${big ? SIZES_BIG : SIZES_CARD}" alt="${alt || ""}" loading="lazy" decoding="async">` : ""}<span class="tag"></span></div>`;
const card = (p, i) => {
  const meta = [p.loc, p.sys].filter(Boolean).join(" · ");
  return `<a class="card c-${SEC_C[p.sector]}" href="${href("project-" + p.id)}" data-sector="${p.sector}" data-states="${(p.states || []).join(" ")}" style="--i:${i}"><div class="mat tilt">${shot(p)}</div><p class="eyebrow">${sectorName(p.sector)}</p><h3>${p.name}</h3>${meta ? `<p class="meta">${meta}</p>` : ""}</a>`;
};
const ticks = a => `<ul class="ticks">${a.map(x => `<li>${x}</li>`).join("")}</ul>`;
const initials = n => { const w = n.replace(/\./g, "").split(/\s+/); return (w[0][0] + w[w.length - 1][0]).toUpperCase(); };
const pad = n => (n < 10 ? "0" : "") + n;
const more = (r, t) => `<a class="more" href="${href(r)}">${t} ${ARR}</a>`;
const FEAT = PROJECTS.filter(p => p.feat);

const render = {
  marquee: items => { const one = items.map(t => `<span>${t}</span>`).join(""); return one + one + one + one; },
  gradients: () => Object.keys(SKY).map(k => grad("gSky-" + k, SKY[k])).join("") + TYPES2.map((t, i) => grad("gType-" + i, t.sky)).join(""),
  art: k => `<svg viewBox="0 0 520 220" aria-hidden="true">${ART[k]()}</svg>`,
  stats: () => STATS.map((s, i) => `<div class="stat c-${s[3]}" data-rv data-in style="--d:${i * .12}s"><div class="medal"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="r1" cx="50" cy="50" r="48.5"/><circle class="r2" cx="50" cy="50" r="42"/><circle class="r3" cx="50" cy="50" r="42" pathLength="1" transform="rotate(-90 50 50)"/></svg><b data-count="${s[0]}" data-from="${s[1]}">${s[0]}</b></div><p>${s[2]}</p></div>`).join(""),
  sysTabs: () => SYSTEMS.map((s, i) => `<button class="sys-tab c-${s.c}${i ? "" : " on"}" type="button" role="tab" id="sys-tab-${i}" aria-controls="sysStage" data-sys="${i}" aria-selected="${!i}"><i></i><b>${s.name}</b><span>${s.line}</span></button>`).join(""),
  sysStage: () => diagram(SYSTEMS[0].id),
  sysCap: () => SYSTEMS[0].cap,
  types: () => TYPES2.map((t, i) => `<div class="type c-${t.c}" data-rv style="--d:${i * .08}s"><div class="arch tilt">${typeScene(t, i)}</div><h3>${t.name}</h3>${t.go ? more(t.go[0], t.go[1]) : ""}</div>`).join(""),
  tiles: () => PRACTICES.map((p, i) => `<a class="tile c-${PRAC_C[p.code]}" href="${href("practice-" + p.id)}" data-rv style="--d:${(i % 3) * .12}s"><span class="code" aria-hidden="true">${p.code}</span>${icon(p.code)}<h3>${p.name}</h3><p>${p.line}</p><span class="go">Open sheet ${p.code} ${ARR}</span></a>`).join(""),
  life: () => LIFE.map((s, i) => `<div class="stage c-${LIFE_C[i]}" style="--i:${i}"><span class="node">${s[0]}</span><h3>${s[1]}</h3><ul>${s[2].map(x => `<li>${x}</li>`).join("")}</ul></div>`).join(""),
  promises: () => PROMISES.map((p, i) => `<div class="promise c-${["ochre","teal","terra"][i]}" data-rv style="--d:${i * .14}s">${icon(p[0])}<h3>${p[1]}</h3><p>${p[2]}</p></div>`).join(""),
  team: () => TEAM.map((t, i) => `<div class="person c-${ROLE_C[t[1]] || "brass"}" data-rv style="--d:${(i % 6) * .07}s"><div class="face">${initials(t[0])}<img src="${WP + t[2]}" alt="" width="180" height="180" loading="lazy" decoding="async"></div><h3>${t[0]}</h3><p>${t[1]}</p></div>`).join(""),
  pracIndex: () => PRACTICES.map(p => `<a class="c-${PRAC_C[p.code]}" href="#p-${p.id}"><span class="bubble">${p.code}</span><span>${p.name}</span></a>`).join(""),
  pracBody: () => PRACTICES.map(p => {
    let body;
    if (p.id === "peer-review"){
      body = `<div class="stack measure"><p>${p.intro[0]}</p><p class="soft">${p.intro[1]}</p></div><div class="steps">` + TIERS.map((t, k) => `<div class="step navy c-${["brass","teal","terra"][k]}"><span class="num">${t.num}</span><h3>${t.name}</h3>${ticks(t.incl)}<dl><div><dt>Ends with</dt><dd>${t.ends}</dd></div><div><dt>Terms</dt><dd>${t.terms}</dd></div></dl></div>`).join("") + `</div>`;
    } else {
      body = `<div class="prac-body"><div class="stack"><p>${p.intro[0]}</p><p class="soft">${p.intro[1]}</p>` + (p.links.length ? `<div class="links">${p.links.map(l => more(l[0], l[1])).join("")}</div>` : "") + `</div><div class="stack"><p class="label">Scope</p>${ticks(p.scope)}</div></div>`;
    }
    return `<section class="prac c-${PRAC_C[p.code]}" id="p-${p.id}" data-rv><header><div><p class="eyebrow">Sheet ${p.code}</p><h2>${p.name}</h2></div>${icon(p.code, "auto")}</header>${body}</section>`;
  }).join(""),
  register: () => REGISTER.map(r => `<tr><td class="name">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join(""),
  articles: () => ARTICLES.map((a, i) => `<a class="entry" href="${a[2]}" target="_blank" rel="noopener" data-rv style="--d:${i * .06}s"><span class="src">${a[1]}</span><h3>${a[0]}</h3><span class="round">${ARR}</span></a>`).join(""),
  events: () => EVENTS.map((e, i) => `<div class="entry" data-rv style="--d:${i * .06}s"><span class="src">${e[1]}</span><div><h3>${e[0]}</h3><p class="soft entry-note">${e[2]}</p></div></div>`).join(""),
  shelf: () => {
    const SP = [["Precast Connections","terra",15.2],["Green Building, PMAY","teal",16],["NBM&amp;CW, Feb 2017","blue",14],["Precast Behaviour I","plum",15],["Precast Behaviour II","plum",15.8],["Affordable Housing, AP","ochre",17.2],["PSEC Article","green",12.6]];
    return ARTICLES.map((a, i) => `<a class="spine c-${SP[i][1]}" href="${a[2]}" target="_blank" rel="noopener" style="--h:${SP[i][2]}rem;--i:${i}" aria-label="${a[0]}, ${a[1]}">${SP[i][0]}</a>`).join("") + '<span class="bookend" aria-hidden="true"></span>';
  },
  places: () => {
    const lk = (id, t) => `<a href="${href("project-" + id)}">${t}</a>`;
    const PL = [
      ["brass","Telangana",`Head office, Hyderabad. ${lk("sai-life","Sai Life Sciences")} and ${lk("dundigal","11-storey EWS housing")} at Dundigal.`],
      ["terra","Andhra Pradesh",`Branch office, Amaravati. ${lk("kethanakonda","Demonstration housing")} and a ${lk("conference-hall","conference hall")} at Kethanakonda, ${lk("mandadam","EWS housing")} at Mandadam, and schemes in Visakhapatnam, Rajahmundry, Patrunivalasa and Kandukuru.`],
      ["plum","Karnataka",`${lk("montessori","Montessori School")} and ${lk("ews-monolithic","EWS monolithic housing")} in Bangalore.`],
      ["teal","Goa",`${lk("goa-villas","Goa Villas")}.`],
      ["ochre","Odisha",`${lk("odisha","Insulated wall construction")}.`],
      ["blue","Assam",`${lk("nursing-school","Nursing School")} for Numaligarh Refinery, and three institutional schemes.`]
    ];
    return PL.map((p, i) => `<div class="place c-${p[0]}" data-rv style="--d:${i * .08}s"><i></i><h3>${p[1]}</h3><p>${p[2]}</p></div>`).join("");
  },
  chips: () => SECTORS.map(s => { const n = s[0] === "all" ? PROJECTS.length : PROJECTS.filter(p => p.sector === s[0]).length; return `<button class="chip c-${SEC_C[s[0]]}" type="button" data-sector="${s[0]}" aria-pressed="${s[0] === "all"}">${s[1]} · ${n}</button>`; }).join(""),
  grid: () => PROJECTS.map(card).join(""),
  carDots: () => FEAT.map((p, i) => `<button type="button" data-dot="${i}" aria-label="${p.name}"${i ? "" : ' aria-current="true"'}></button>`).join(""),
  carFrame: i => shot(FEAT[i], true, FEAT[i].name),
  carBody: i => {
    const p = FEAT[i], meta = [p.loc, p.sys].filter(Boolean).join(" · ");
    return `<p class="car-count"><b>${pad(i + 1)}</b> / ${pad(FEAT.length)}</p><p class="eyebrow tint c-${SEC_C[p.sector]}">${sectorName(p.sector)}</p><h3>${p.name}</h3><p class="soft">${p.text}${meta ? `<br><span class="car-meta">${meta}</span>` : ""}</p><p>${more("project-" + p.id, "View project")}</p>`;
  },
  project: p => {
    const i = PROJECTS.indexOf(p), prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
    const facts = [["Sector", sectorName(p.sector)]];
    if (p.loc) facts.push(["Location", p.loc]);
    if (p.sys) facts.push(["System", p.sys]);
    if (p.status) facts.push(["Status", p.status]);
    facts.push(["Archive", p.photos + " photographs"]);
    const gal = p.img ? `<div class="gal-wrap"><h2 class="h3">From the archive</h2><div class="gal">${p.img.n.map((n, k) => `<button class="gal-b" type="button" data-full="${full(p, k)}" aria-label="Enlarge photograph ${k + 1}"><img src="${thumb(p, k)}" alt="${p.name}, photograph ${k + 1}" width="400" height="284" loading="lazy" decoding="async"></button>`).join("")}</div></div>` : "";
    return `<div class="pd-grid"><div class="mat" data-rv="wipe" style="--wc:${PAL[SEC_C[p.sector]][0]}">${shot(p, true, p.name)}</div><div class="stack" style="gap:1.5rem"><p class="eyebrow tint c-${SEC_C[p.sector]}" data-rv>${sectorName(p.sector)}</p><h1 data-split>${p.name}</h1><p data-rv>${p.text}</p>` +
      (p.list ? `<ol class="nums" data-rv>${p.list.map(x => `<li>${x}</li>`).join("")}</ol>` : "") +
      `<dl class="facts" data-rv>${facts.map(x => `<div><dt>${x[0]}</dt><dd>${x[1]}</dd></div>`).join("")}</dl><p class="note" data-rv>Project calculations, comprehensive structural detailing sheets, and technical parameters available on client consultation.</p></div></div>${gal}` +
      `<nav class="pd-nav" aria-label="More projects"><a class="more prev" href="${href("project-" + prev.id)}">${ARR} ${prev.name}</a><a class="more" href="${href("project-" + next.id)}">${next.name} ${ARR}</a></nav>`;
  }
};

globalThis.METEY = { STATE_NAMES, ARR, PAL, SEC_C, PROJECTS, FEAT, SYSTEMS, TYPES, sectorName, href, diagram, render };
})();
