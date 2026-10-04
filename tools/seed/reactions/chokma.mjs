// 2-toifa: Ion almashinish — cho'kma hosil bo'lishi (120). Generator: node tools/seed/reactions/chokma.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt, colorWord, textureUz, takenSignatures } from './lib.mjs';

const CAT = 'ion-almashinish-chokma';
const PFX = 'chokma';

const CAT_SRC = {
  'Ba^2+': ['BaCl2', 'Ba(NO3)2'], 'Ca^2+': ['CaCl2', 'Ca(NO3)2'], 'Sr^2+': ['Sr(NO3)2', 'SrCl2'], 'Mg^2+': ['MgCl2', 'MgSO4'],
  'Al^3+': ['AlCl3', 'Al2(SO4)3'], 'Zn^2+': ['ZnSO4', 'ZnCl2'], 'Fe^2+': ['FeSO4', 'FeCl2'], 'Fe^3+': ['FeCl3', 'Fe(NO3)3'],
  'Cu^2+': ['CuSO4', 'CuCl2', 'Cu(NO3)2'], 'Ag^+': ['AgNO3'], 'Pb^2+': ['Pb(NO3)2', '(CH3COO)2Pb'], 'Mn^2+': ['MnSO4', 'MnCl2'],
  'Ni^2+': ['NiSO4', 'NiCl2'], 'Co^2+': ['CoCl2', 'Co(NO3)2'], 'Cr^3+': ['CrCl3', 'Cr2(SO4)3'], 'Li^+': ['LiCl'],
};
const AN_SRC = {
  'OH^-': ['NaOH', 'KOH'], 'CO3^2-': ['Na2CO3', 'K2CO3'], 'SO4^2-': ['Na2SO4', 'K2SO4', 'H2SO4'], 'Cl^-': ['NaCl', 'KCl', 'HCl'],
  'Br^-': ['KBr', 'NaBr'], 'I^-': ['KI', 'NaI'], 'S^2-': ['Na2S', 'K2S'], 'PO4^3-': ['Na3PO4', 'K3PO4'], 'HPO4^2-': ['Na2HPO4'],
  'SiO3^2-': ['Na2SiO3', 'K2SiO3'], 'CrO4^2-': ['K2CrO4', 'Na2CrO4'], 'C2O4^2-': ['(NH4)2C2O4', 'Na2C2O4'], 'SO3^2-': ['Na2SO3', 'K2SO3'],
  'F^-': ['NaF', 'KF'], 'CH3COO^-': ['CH3COONa'], 'NO2^-': ['NaNO2', 'KNO2'], 'SCN^-': ['KSCN', 'NH4SCN'], 'HCO3^-': ['NaHCO3'], 'S2O3^2-': ['Na2S2O3'],
};
// tartib: pedagogik ahamiyati bo'yicha (birinchilari albatta kiradi)
const PRIORITY = [
  ['Cu^2+', 'OH^-'], ['Fe^3+', 'OH^-'], ['Fe^2+', 'OH^-'], ['Mg^2+', 'OH^-'], ['Al^3+', 'OH^-'], ['Zn^2+', 'OH^-'], ['Ni^2+', 'OH^-'], ['Co^2+', 'OH^-'], ['Mn^2+', 'OH^-'], ['Cr^3+', 'OH^-'], ['Ag^+', 'OH^-'], ['Pb^2+', 'OH^-'], ['Ca^2+', 'OH^-'],
  ['Ag^+', 'Cl^-'], ['Ag^+', 'Br^-'], ['Ag^+', 'I^-'], ['Ba^2+', 'SO4^2-'], ['Pb^2+', 'SO4^2-'], ['Sr^2+', 'SO4^2-'], ['Ca^2+', 'SO4^2-'], ['Ag^+', 'SO4^2-'],
  ['Ca^2+', 'CO3^2-'], ['Ba^2+', 'CO3^2-'], ['Sr^2+', 'CO3^2-'], ['Mg^2+', 'CO3^2-'], ['Pb^2+', 'CO3^2-'], ['Zn^2+', 'CO3^2-'], ['Mn^2+', 'CO3^2-'], ['Ni^2+', 'CO3^2-'], ['Co^2+', 'CO3^2-'], ['Fe^2+', 'CO3^2-'], ['Ag^+', 'CO3^2-'], ['Li^+', 'CO3^2-'],
  ['Al^3+', 'CO3^2-'], ['Fe^3+', 'CO3^2-'], ['Cr^3+', 'CO3^2-'], ['Cu^2+', 'CO3^2-'], ['Al^3+', 'S^2-'], ['Cr^3+', 'S^2-'], ['Fe^3+', 'S^2-'], ['Cu^2+', 'I^-'], ['Al^3+', 'HCO3^-'], ['Fe^3+', 'HCO3^-'],
  ['Cu^2+', 'S^2-'], ['Pb^2+', 'S^2-'], ['Ag^+', 'S^2-'], ['Zn^2+', 'S^2-'], ['Fe^2+', 'S^2-'], ['Mn^2+', 'S^2-'], ['Ni^2+', 'S^2-'], ['Co^2+', 'S^2-'],
  ['Pb^2+', 'I^-'], ['Pb^2+', 'Cl^-'], ['Pb^2+', 'Br^-'],
  ['Ba^2+', 'CrO4^2-'], ['Pb^2+', 'CrO4^2-'], ['Ag^+', 'CrO4^2-'], ['Sr^2+', 'CrO4^2-'],
  ['Ca^2+', 'PO4^3-'], ['Ba^2+', 'PO4^3-'], ['Ag^+', 'PO4^3-'], ['Fe^3+', 'PO4^3-'], ['Al^3+', 'PO4^3-'], ['Zn^2+', 'PO4^3-'], ['Cu^2+', 'PO4^3-'], ['Mg^2+', 'PO4^3-'], ['Pb^2+', 'PO4^3-'], ['Mn^2+', 'PO4^3-'], ['Ni^2+', 'PO4^3-'], ['Co^2+', 'PO4^3-'], ['Sr^2+', 'PO4^3-'], ['Li^+', 'PO4^3-'], ['Cr^3+', 'PO4^3-'], ['Fe^2+', 'PO4^3-'],
  ['Ca^2+', 'HPO4^2-'], ['Ba^2+', 'HPO4^2-'],
  ['Ca^2+', 'C2O4^2-'], ['Ba^2+', 'C2O4^2-'], ['Sr^2+', 'C2O4^2-'], ['Fe^2+', 'C2O4^2-'], ['Zn^2+', 'C2O4^2-'], ['Cu^2+', 'C2O4^2-'], ['Pb^2+', 'C2O4^2-'], ['Ag^+', 'C2O4^2-'], ['Mn^2+', 'C2O4^2-'], ['Ni^2+', 'C2O4^2-'], ['Co^2+', 'C2O4^2-'],
  ['Ca^2+', 'SiO3^2-'], ['Ba^2+', 'SiO3^2-'], ['Mg^2+', 'SiO3^2-'], ['Cu^2+', 'SiO3^2-'], ['Co^2+', 'SiO3^2-'], ['Fe^2+', 'SiO3^2-'], ['Zn^2+', 'SiO3^2-'], ['Ni^2+', 'SiO3^2-'], ['Mn^2+', 'SiO3^2-'], ['Pb^2+', 'SiO3^2-'], ['Sr^2+', 'SiO3^2-'],
  ['Ba^2+', 'SO3^2-'], ['Ca^2+', 'SO3^2-'], ['Sr^2+', 'SO3^2-'], ['Ag^+', 'SO3^2-'], ['Pb^2+', 'SO3^2-'], ['Zn^2+', 'SO3^2-'], ['Mn^2+', 'SO3^2-'],
  ['Ca^2+', 'F^-'], ['Mg^2+', 'F^-'], ['Sr^2+', 'F^-'], ['Ba^2+', 'F^-'], ['Pb^2+', 'F^-'], ['Li^+', 'F^-'],
  ['Ag^+', 'SCN^-'], ['Ag^+', 'CH3COO^-'], ['Ag^+', 'NO2^-'], ['Mg^2+', 'C2O4^2-'], ['Sr^2+', 'HPO4^2-'], ['Mg^2+', 'HPO4^2-'], ['Ag^+', 'S2O3^2-'],
];

const taken = takenSignatures(CAT);
const out = [];
const usedNet = new Set();

// aniq manbali qo'shimcha tajribalar (kislota bilan cho'ktirish)
const FORCED = { 'Ba^2+|SO4^2-|2': ['BaCl2', 'H2SO4'], 'Ag^+|Cl^-|2': ['AgNO3', 'HCl'] };
PRIORITY.push(['Ba^2+', 'SO4^2-', 2], ['Ag^+', 'Cl^-', 2]);
function chooseSources(cat, an, variant) {
  if (variant && FORCED[`${cat}|${an}|${variant}`]) return FORCED[`${cat}|${an}|${variant}`];
  for (const cs of CAT_SRC[cat] || []) {
    for (const as of AN_SRC[an] || []) {
      if (!db.substances[cs] || !db.substances[as]) continue;
      if (cs === as) continue;
      const key = [cs, as].sort().join('+');
      if (taken.has(key)) continue;
      return [cs, as];
    }
  }
  return null;
}

function ionsOf(id) {
  const s = sub(id);
  if (s.strong_acid || id === 'H2SO4') return id === 'H2SO4' ? { 'H^+': 2, 'SO4^2-': 1 } : s.dissociation;
  return s.dissociation || s.ions;
}

function spectatorSalt(catSrc, anSrc, cat, an) {
  const ci = Object.keys(ionsOf(catSrc)).find((k) => k !== cat && db.ions[k]?.charge < 0);
  const ai = Object.keys(ionsOf(anSrc)).find((k) => k !== an && db.ions[k]?.charge > 0);
  if (!ci || !ai) return null;
  if (ai === 'H^+') {
    const acid = { 'Cl^-': 'HCl', 'NO3^-': 'HNO3', 'SO4^2-': 'H2SO4', 'CH3COO^-': 'CH3COOH', 'Br^-': 'HBr', 'I^-': 'HI' }[ci];
    return acid;
  }
  return db.saltOf(ai, ci);
}

function concFor(code) { return code === 'M' ? 1 : 0.1; }

for (const [cat, an, variant] of PRIORITY) {
  if (out.length >= 120) break;
  const special = db.specialPairs.find((p) => p.cation === cat && p.anion === an);
  const code = db.solubility(cat, an);
  if (!special && code !== 'N' && code !== 'M') { console.log('  o\'tkazildi (jadvalda N/M emas):', cat, an); continue; }
  const pptId = special ? special.parsed.right.find((t) => t.mark === '↓').id : db.saltOf(cat, an);
  if (!pptId) { console.log('  cho\'kma moddasi yo\'q:', cat, an); continue; }
  const src = chooseSources(cat, an, variant);
  if (!src) { console.log('  manba yo\'q:', cat, an); continue; }
  const [cs, as] = src;
  const spect = spectatorSalt(cs, as, cat, an);
  if (!spect) { console.log('  tomoshabin tuz yo\'q:', cs, as); continue; }
  const left = [term(cs, 'aq'), term(as, 'aq')];
  const right = [term(pptId, 's', 1, { mark: '↓' }), term(spect, 'aq')];
  const gasIds = [], extraPpt = [];
  let redox = null;
  if (special) {
    for (const t of special.parsed.right) {
      if (t.mark === '↑') { right.push(term(t.id, 'g', 1, { mark: '↑' })); gasIds.push(t.id); }
      else if (t.mark === '↓' && t.id !== pptId) { right.push(term(t.id, 's', 1, { mark: '↓' })); extraPpt.push(t.id); }
      else if (!t.mark && !db.ions[t.id] && t.id !== 'H2O') { right.push(term(t.id, 'aq')); redox = t.id; }
    }
    if (special.parsed.left.some((t) => t.id === 'H2O')) left.push(term('H2O', 'l'));
    if (special.parsed.right.some((t) => t.id === 'H2O')) right.push(term('H2O', 'l'));
    if (special.parsed.right.some((t) => t.id === 'Fe^2+')) { right.push(term(db.saltOf('Fe^2+', Object.keys(ionsOf(cs)).find((k) => db.ions[k]?.charge < 0)), 'aq')); redox = 'Fe'; }
  }
  try { balanced(left, right); } catch (e) { console.log('  balans yo\'q:', cs, as, e.message); continue; }
  // nol koeffitsiyentli suvni olib tashlash
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  if (usedNet.has(net) && out.length > 100 && !variant) continue;
  usedNet.add(net);
  const pptS = sub(pptId);
  const pptN = shortName(pptId);
  const c1 = concFor(code), c2 = concFor(code);
  const n0 = 0.0002;
  const k1 = left[0].k, k2 = left[1].k;
  const reactants = [
    { species: cs, state: 'aq', conc_M: c1, volume_mL: Math.round((n0 * k1 / c1) * 1000 * 100) / 100 },
    { species: as, state: 'aq', conc_M: c2, volume_mL: Math.round((n0 * k2 / c2) * 1000 * 100) / 100 },
  ];
  const look = { species: pptId, color: pptS.precipitate?.color || pptS.appearance.color, texture: pptS.precipitate?.texture || 'mayda-kristall' };
  const cw = colorWord(look.color);
  const catN = shortName(cs), anN = shortName(as);
  const catD = db.ions[cat].display, anD = db.ions[an].display;
  const amphoteric = ['Al^3+', 'Zn^2+', 'Cr^3+', 'Pb^2+'].includes(cat) && an === 'OH^-';
  const notes = {
    'Fe(OH)2': "Havoda Fe(OH)₂ asta-sekin oksidlanib, cho'kma yashil, so'ng qo'ng'ir tusga kiradi (Fe(OH)₃ hosil bo'ladi).",
    'Mn(OH)2': "Havoda Mn(OH)₂ oksidlanib, cho'kma tez qo'ng'irlashadi.",
    'Co(OH)2': "Avval ko'k rangli asosli tuz cho'kmasi tushadi; ishqor qo'shilib turganda u pushti Co(OH)₂ ga aylanadi.",
    PbI2: "PbI₂ issiq suvda eriydi; eritma sovitilganda oltinrang yaltiroq tangachalar ko'rinishida qayta kristallanadi (\"oltin yomg'ir\").",
    PbCl2: "PbCl₂ kam eriydi: cho'kma faqat yetarlicha konsentrlangan eritmalarda tushadi va qizdirilganda eriydi.",
    CaSO4: "CaSO₄ kam eriydi — cho'kma faqat konsentrlangan eritmalardan tushadi.",
    Ag2SO4: "Ag₂SO₄ kam eriydi — cho'kma faqat konsentrlangan eritmalardan tushadi.",
    'Ca(OH)2': "Ca(OH)₂ kam eriydi — cho'kma konsentrlangan eritmalardan tushadi (ohakli suv — uning to'yingan eritmasi).",
    AgCl: 'AgCl yorug\'likda asta qorayadi (kumush ajraladi).',
    Ag2O: 'Kumush gidroksid beqaror: hosil bo\'lishi bilanoq suv ajratib, qo\'ng\'ir-qora Ag₂O ga aylanadi.',
    CaC2O4: 'Bu reaksiya kalsiy ioni uchun sifat reaksiyasi: CaC₂O₄ sirka kislotada erimaydi, xlorid kislotada eriydi.',
    BaSO4: 'BaSO₄ kislotalarda ham erimaydi — bu sulfat ioni uchun sifat reaksiyasi.',
    'Al(OH)3': "Ishqor ortiqcha qo'shilsa, amfoter Al(OH)₃ erib ketadi.",
    'Zn(OH)2': "Ishqor ortiqcha qo'shilsa, amfoter Zn(OH)₂ erib ketadi.",
    'Cr(OH)3': "Ishqor ortiqcha qo'shilsa, amfoter Cr(OH)₃ erib, yashil eritma hosil qiladi.",
    'Pb(OH)2': "Ishqor ortiqcha qo'shilsa, amfoter Pb(OH)₂ erib ketadi.",
    H2SiO3: '',
  };
  let explanation;
  let steps;
  let mechType = 'ion-almashinish';
  let eb = null;
  if (special && (redox || pptId === 'CuI' || (pptId === 'FeS' && cat === 'Fe^3+'))) {
    mechType = 'oksidlanish-qaytarilish';
    if (pptId === 'CuI') eb = ['Cu⁺² + 1e⁻ = Cu⁺¹', '2I⁻ − 2e⁻ = I2'];
    if (pptId === 'FeS') eb = ['Fe⁺³ + 1e⁻ = Fe⁺²', 'S⁻² − 2e⁻ = S⁰'];
    explanation = `${special.note_uz[0].toUpperCase() + special.note_uz.slice(1)}: ${catD} ionlari ${anD} ionlarini oksidlaydi. ${pptId === 'CuI' ? "Mis(II) yodid mavjud emas — mis(I) yodidning oq cho'kmasi hosil bo'ladi, ajralgan yod esa eritmani qo'ng'ir rangga bo'yaydi." : "Natijada temir(II) sulfidning qora cho'kmasi va oltingugurt hosil bo'ladi."}`;
    steps = [`${catD} — oksidlovchi, ${anD} — qaytaruvchi.`, 'Elektronlar qaytaruvchidan oksidlovchiga o\'tadi.', `Hosil bo'lgan ionlar ${pptN} cho'kmasini beradi.`];
  } else if (special) {
    explanation = `Eruvchanlik jadvalida bu tuz "—" bilan belgilangan: u suvli eritmada mavjud emas. ${catD} va ${anD} ionlari birgalikda gidrolizlanadi — ${cat === 'Ag^+' ? "AgOH beqaror bo'lib, darhol Ag₂O va suvga parchalanadi" : `kation OH⁻ bilan ${pptN} cho'kmasini, anion esa H⁺ bilan ${gasIds.map((g) => db.displayOf(g)).join(', ')} gazini hosil qiladi`}.`;
    steps = [`Kation gidrolizi: ${catD} + H₂O ⇄ ... + H⁺ (muhit kislotali).`, `Anion gidrolizi: ${anD} + H₂O ⇄ ... + OH⁻ (muhit ishqoriy).`, 'Hosil bo\'lgan H⁺ va OH⁻ ionlari bir-birini neytrallaydi va ikkala gidroliz oxirigacha boradi.'];
    if (cat === 'Ag^+') steps = ['Ag⁺ va OH⁻ ionlari AgOH hosil qiladi.', 'AgOH beqaror: 2AgOH → Ag₂O + H₂O.'];
    if (pptId === '(CuOH)2CO3') explanation = "Mis(II) karbonat eritmada hosil bo'lmaydi: qisman gidroliz tufayli yashil rangli asosli tuz — mis(II) gidroksokarbonat (malaxit tarkibiga mos) cho'kadi va CO₂ ajraladi.";
  } else {
    explanation = `Eritmalar aralashtirilganda ${catD} va ${anD} ionlari uchrashib, suvda ${code === 'M' ? 'kam eriydigan' : 'erimaydigan'} ${pptN} hosil qiladi; qolgan ionlar eritmada qoladi. Ion almashinish reaksiyasi cho'kma hosil bo'lgani uchun oxirigacha boradi. ${notes[pptId] || ''}`.trim();
    steps = ['Ikkala tuz eritmada ionlarga to\'liq dissotsilangan.', `${catD} va ${anD} ionlari to\'qnashib, kristall panjara hosil qiladi — ${pptN} cho'kmaga tushadi.`, "Tomoshabin ionlar o'zgarishsiz qoladi va qisqartirilgan ionli tenglamaga kirmaydi."];
  }
  const settle = look.texture === 'iviqsimon' ? "cho'kma iviqsimon (dirildoq) bo'lib, sekin cho'kadi" : (look.texture === 'suzmasimon' ? "cho'kma parchalar ko'rinishida tez cho'kadi" : "cho'kma asta-sekin probirka tubiga cho'kadi");
  const procedure = [`Probirkaga ${fmt(reactants[0].volume_mL)} ml ${catN} eritmasidan quying.`, `Tomizgich bilan ${fmt(reactants[1].volume_mL)} ml ${anN} eritmasidan qo'shing.`, `Cho'kmaning rangi va tuzilishini kuzating: ${settle}.`];
  if (amphoteric) procedure.splice(2, 0, "Ishqorni ortiqcha qo'shmang — amfoter gidroksid erib ketadi.");
  if (gasIds.length) procedure.push('Gaz pufakchalari ajralishiga e\'tibor bering.');
  const obsText = `${cap(cw)} ${textureUz(look.texture)} cho'kma tushadi${gasIds.length ? ', gaz pufakchalari ajraladi' : ''}${pptId === 'CuI' ? ", eritma ajralgan yoddan qo'ng'ir tusga kiradi" : ''}.`;
  const effects = [{ type: 'turbidity' }];
  if (gasIds.length) effects.push({ type: 'bubbles' });
  if (pptId === 'PbI2') effects.push({ type: 'crystals' });
  const questions = [
    `Reaksiyaning to'liq va qisqartirilgan ionli tenglamalarini izohlang.`,
    `${cap(pptN)} cho'kmasini olish uchun yana qaysi eritmalardan foydalanish mumkin?`,
    special ? 'Qanday tuzlar suvli eritmada birgalikdagi gidroliz tufayli mavjud bo\'la olmaydi?' : 'Ion almashinish reaksiyalari qanday hollarda oxirigacha boradi?',
  ];
  const level = special ? '9-sinf' : (['PO4^3-', 'SiO3^2-', 'CrO4^2-', 'C2O4^2-', 'F^-', 'SO3^2-', 'SCN^-', 'NO2^-', 'CH3COO^-', 'HPO4^2-'].includes(an) ? '9-sinf' : '8-sinf');
  const unsure = ['Cr^3+'].includes(cat) && an === 'PO4^3-' || ['Fe^2+', 'Ni^2+', 'Mn^2+', 'Co^2+'].includes(cat) && an === 'SO3^2-' || pptId === 'Mn3(PO4)2' || pptId === 'Fe3(PO4)2' || pptId === 'Sr3(PO4)2' || pptId === 'Co3(PO4)2' || pptId === 'Ni3(PO4)2' || an === 'SiO3^2-' && !['Ca^2+', 'Ba^2+'].includes(cat) || pptId === 'MgC2O4' || pptId === 'AgNO2' || pptId === 'CH3COOAg';
  out.push(makeRecord({
    id: nextId(PFX), category: CAT,
    title: `${cap(catN)} va ${anN} eritmalarining o'zaro ta'siri (${pptN} cho'kmasi)`,
    level, topic: special ? 'Birgalikdagi gidroliz' : (mechType === 'oksidlanish-qaytarilish' ? 'Ion almashinish va oksidlanish-qaytarilish' : "Ion almashinish reaksiyalari: cho'kma hosil bo'lishi"),
    engine: 'rules', reactants, conditions: {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: eb },
    mechType, steps,
    obs: { precipitate: look, gas: gasIds.length ? { species: gasIds[0], color: db.substances[gasIds[0]].gas?.color || null } : null, solution_color_change: pptId === 'CuI' ? { from: '#4aa3dc', to: '#b0682a' } : null, heat: 'sezilarsiz', flame: null, effects, text_uz: obsText },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'tomizgich'], procedure,
    safety: safetyFor([cs, as, pptId], gasIds.includes('H2S') ? "Vodorod sulfid zaharli — tajribani mo'rili shkafda o'tkazing." : ''),
    explanation, questions, confidence: unsure ? "o'rta" : 'yuqori',
  }));
}
writeCategory(CAT, out);
