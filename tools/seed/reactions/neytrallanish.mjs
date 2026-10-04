// 1-toifa: Neytrallanish (60). Generator: node tools/seed/reactions/neytrallanish.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt, mediumReason } from './lib.mjs';
import { Chemistry } from '../../../frontend/lab/js/engine/chemistry.js';
import { setupExperiment } from '../../lib/consistency.mjs';

const CAT = 'neytrallanish';
const PFX = 'neytr';

// [kislota, asos, kislota koeffitsiyenti bo'yicha mahsulot tuzi, mahsulot nisbati izohi, qo'shimcha]
const STRONG_PAIRS = [
  ['HCl', 'NaOH', 'NaCl'], ['HCl', 'KOH', 'KCl'], ['HCl', 'LiOH', 'LiCl'], ['HCl', 'Ba(OH)2', 'BaCl2'],
  ['HNO3', 'NaOH', 'NaNO3'], ['HNO3', 'KOH', 'KNO3'], ['HNO3', 'LiOH', 'LiNO3'], ['HNO3', 'Ba(OH)2', 'Ba(NO3)2'],
  ['H2SO4', 'NaOH', 'Na2SO4'], ['H2SO4', 'KOH', 'K2SO4'], ['H2SO4', 'LiOH', 'Li2SO4'], ['H2SO4', 'Ba(OH)2', 'BaSO4'],
  ['HBr', 'NaOH', 'NaBr'], ['HBr', 'KOH', 'KBr'], ['HI', 'NaOH', 'NaI'], ['HI', 'KOH', 'KI'],
];
const ACID_SALTS = [
  ['H2SO4', 'NaOH', 'NaHSO4', '1:1'], ['H2SO4', 'KOH', 'KHSO4', '1:1'],
  ['H3PO4', 'NaOH', 'NaH2PO4', '1:1'], ['H3PO4', 'NaOH', 'Na2HPO4', '1:2'], ['H3PO4', 'NaOH', 'Na3PO4', '1:3'],
  ['H3PO4', 'KOH', 'KH2PO4', '1:1'], ['H3PO4', 'KOH', 'K2HPO4', '1:2'], ['H3PO4', 'KOH', 'K3PO4', '1:3'],
  ['H3PO4', 'NH3·H2O', 'NH4H2PO4', '1:1'], ['H3PO4', 'NH3·H2O', '(NH4)2HPO4', '1:2'],
  ['H2C2O4', 'NaOH', 'Na2C2O4', '1:2'], ['H2C2O4', 'KOH', 'K2C2O4', '1:2'],
];
const WEAK = [
  ['CH3COOH', 'NaOH', 'CH3COONa'], ['CH3COOH', 'KOH', 'CH3COOK'], ['CH3COOH', 'NH3·H2O', 'CH3COONH4'], ['CH3COOH', 'Ba(OH)2', '(CH3COO)2Ba'],
  ['HCOOH', 'NaOH', 'HCOONa'], ['HCOOH', 'KOH', 'HCOOK'],
  ['HCl', 'NH3·H2O', 'NH4Cl'], ['HNO3', 'NH3·H2O', 'NH4NO3'], ['H2SO4', 'NH3·H2O', '(NH4)2SO4'], ['HBr', 'NH3·H2O', 'NH4Br'],
];
// erimaydigan asoslar (qattiq) + kislotalar
const INSOLUBLE = [
  ['HCl', 'Cu(OH)2', 'CuCl2'], ['H2SO4', 'Cu(OH)2', 'CuSO4'], ['HNO3', 'Cu(OH)2', 'Cu(NO3)2'], ['CH3COOH', 'Cu(OH)2', '(CH3COO)2Cu'],
  ['HCl', 'Fe(OH)3', 'FeCl3'], ['H2SO4', 'Fe(OH)3', 'Fe2(SO4)3'], ['HNO3', 'Fe(OH)3', 'Fe(NO3)3'],
  ['HCl', 'Fe(OH)2', 'FeCl2'], ['H2SO4', 'Fe(OH)2', 'FeSO4'],
  ['HCl', 'Mg(OH)2', 'MgCl2'], ['H2SO4', 'Mg(OH)2', 'MgSO4'], ['CH3COOH', 'Mg(OH)2', '(CH3COO)2Mg'],
  ['HCl', 'Ni(OH)2', 'NiCl2'], ['HCl', 'Co(OH)2', 'CoCl2'], ['H2SO4', 'Mn(OH)2', 'MnSO4'],
  ['HCl', 'Ca(OH)2', 'CaCl2'], ['HNO3', 'Ca(OH)2', 'Ca(NO3)2'],
  ['HCl', 'Mn(OH)2', 'MnCl2'], ['HNO3', 'Ni(OH)2', 'Ni(NO3)2'], ['H2SO4', 'Co(OH)2', 'CoSO4'], ['HNO3', 'Mg(OH)2', 'Mg(NO3)2'],
];
const GAS_ACID = [['H2S', 'NaOH', 'Na2S', '1:2']];

const chem = new Chemistry(db);
function mediumOf(rec) {
  const { v, env } = setupExperiment(chem, rec);
  for (let t = 0; t < 60; t += 0.5) chem.step(v, 0.5, env);
  const pH = chem.pH(v);
  if (pH === null) return null;
  if (pH < 6.3) return 'kislotali';
  if (pH > 7.7) return 'ishqoriy';
  return 'neytral';
}

const MEDIUM_WHY = {
  kislotali: (salt) => `${cap(shortName(salt))} eritmasining muhiti kuchsiz kislotali: tuz tarkibidagi ion gidrolizlanadi yoki vodorod tutadi.`,
  ishqoriy: (salt) => `${cap(shortName(salt))} eritmasining muhiti ishqoriy: kuchsiz kislota qoldig'i gidrolizlanib OH⁻ ionlarini hosil qiladi.`,
  neytral: (salt) => `Kuchli kislota va kuchli asosdan hosil bo'lgan ${shortName(salt)} gidrolizlanmaydi — eritma neytral.`,
};

const out = [];
function stoich(acid, base, salt, ratio) {
  const right = [term(salt, 'aq'), term('H2O', 'l')];
  const s = sub(salt);
  if (s.solubility === 'N' || s.solubility === 'M') { right[0].ph = 's'; right[0].mark = '↓'; }
  const left = [term(acid, sub(acid).state === 'g' ? 'g' : 'aq'), term(base, sub(base).solubility === 'N' || base === 'Ca(OH)2' ? 's' : 'aq')];
  if (base === 'NH3·H2O') left[1].forceIonic = false;
  balanced(left, right);
  return { left, right };
}

function amountsFor(left, base0 = 0.001) {
  // eritmalar: konsentratsiya va hajm (mol nisbatiga mos)
  const res = [];
  for (const t of left) {
    const s = sub(t.id);
    const n = base0 * t.k;
    if (t.ph === 'aq') {
      const c = t.id === 'NH3·H2O' ? 2 : (t.id === 'H3PO4' || t.id === 'H2C2O4' || t.id === 'CH3COOH' || t.id === 'HCOOH' ? 1 : 0.1);
      const cc = t.id === 'Ba(OH)2' ? 0.2 : (c === 0.1 && ['HCl', 'HNO3', 'H2SO4', 'HBr', 'HI', 'NaOH', 'KOH', 'LiOH'].includes(t.id) ? 0.5 : c);
      res.push({ species: t.id, state: 'aq', conc_M: cc, volume_mL: Math.round((n / cc) * 1000 * 100) / 100 });
    } else if (t.ph === 's') {
      res.push({ species: t.id, state: 's', mass_g: Math.round(n * s.M * 1000) / 1000 });
    } else res.push({ species: t.id, state: t.ph });
  }
  return res;
}

function build(acid, base, salt, kind, ratio) {
  const { left, right } = stoich(acid, base, salt, ratio);
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const acidN = shortName(acid), baseN = shortName(base), saltN = shortName(salt);
  const reactants = amountsFor(left);
  const baseSolid = left[1].ph === 's';
  const sOut = sub(salt);
  const pptSalt = sOut.solubility === 'N';
  if (!baseSolid && kind !== 'gaz' && base !== 'NH3·H2O') reactants.push({ species: 'C20H14O4', state: 'aq', conc_M: 0.003, volume_mL: 0.1, role: 'indikator' });
  if (base === 'NH3·H2O' || acid === 'CH3COOH' || acid === 'HCOOH') reactants.push({ species: 'C14H14N3NaO3S', state: 'aq', conc_M: 0.003, volume_mL: 0.1, role: 'indikator' });
  const id = nextId(PFX);
  const rec = makeRecord({ id, category: CAT, title: '', reactants, conditions: {} });
  rec.equation = { molecular, ionic_full: full, ionic_net: net, electron_balance: null };
  const medium = mediumOf(rec);
  const catIon = Object.keys(sOut.dissociation || sOut.ions || {}).find((k) => db.ions[k]?.charge > 0);
  const cationColor = catIon && db.ions[catIon].color ? db.ions[catIon].color.hex : null;

  let title, level = '8-sinf', topic = 'Kislota va asoslarning o\'zaro ta\'siri (neytrallanish)';
  const steps = [];
  let procedure, explanation, obsText, questions, heat = 'ekzotermik', effects = [], colorChange = null, kinetics = 'bir-zumda';
  const why = medium ? mediumReason(salt, medium) : '';
  void MEDIUM_WHY;
  if (kind === 'kuchli') {
    title = `${cap(acidN)} va ${baseN} eritmalarining neytrallanishi`;
    if (pptSalt) title = `${cap(acidN)} va ${baseN} eritmalarining o'zaro ta'siri (neytrallanish va cho'kma)`;
    procedure = [`Probirkaga ${fmt(reactants[1].volume_mL)} ml ${baseN} eritmasidan quying va 1–2 tomchi fenolftalein qo'shing — eritma to'q pushti rangga kiradi.`, `Tomizgich bilan ${acidN}dan tomchilab qo'shing va probirkani har gal chayqating.`, `Pushti rang yo'qolguncha kislota qo'shishni davom ettiring.`, `Probirka devorini kaft bilan ushlab, isiganini sezing.`];
    steps.push('Kislota eritmada H⁺ ionlarini (aniqrog\'i, H₃O⁺), ishqor esa OH⁻ ionlarini hosil qiladi.', 'H⁺ va OH⁻ ionlari birikib kam dissotsilanadigan suv molekulasini hosil qiladi: proton H₃O⁺ dan OH⁻ ga ko\'chadi.');
    steps.push(pptSalt ? `Ba²⁺ va SO₄²⁻ ionlari bir vaqtda erimaydigan ${saltN} cho'kmasini hosil qiladi.` : `Qolgan ${pretty2(salt)} ionlari eritmada qoladi — tuz eritmasi hosil bo'ladi.`);
    explanation = `Neytrallanish reaksiyasining mohiyati — H⁺ va OH⁻ ionlaridan suv hosil bo'lishi; qisqartirilgan ionli tenglama barcha kuchli kislota va kuchli asoslar uchun bir xil. Reaksiya issiqlik chiqishi bilan boradi. ${pptSalt ? `Bundan tashqari, ${saltN} suvda erimaydi va oq cho'kma tushadi.` : why}`;
    obsText = pptSalt ? "Pushti rang yo'qoladi va oq cho'kma tushadi, probirka biroz isiydi." : "Kislota yetarli qo'shilganda pushti rang yo'qoladi, probirka biroz isiydi.";
    colorChange = { from: '#d81b8c', to: '#ffffff' };
    questions = ['Neytrallanish reaksiyasining qisqartirilgan ionli tenglamasini yozing va izohlang.', 'Indikator sifatida fenolftalein qanday vazifani bajaradi?', `Hosil bo'lgan ${saltN} eritmasi qanday muhitga ega? Nima uchun?`];
    if (pptSalt) { effects.push({ type: 'turbidity' }); }
  } else if (kind === 'nordon') {
    level = '9-sinf';
    topic = "Ko'p negizli kislotalarning neytrallanishi: nordon va o'rta tuzlar";
    title = `${cap(acidN)} va ${baseN}ning ${ratio} mol nisbatdagi reaksiyasi (${saltN} hosil bo'lishi)`;
    procedure = [`Probirkaga ${fmt(reactants[0].volume_mL)} ml ${acidN} eritmasidan o'lchab quying.`, `Unga ${base === 'NH3·H2O' ? 'ammiakli suvdan' : baseN + ' eritmasidan'} kislotaga nisbatan ${ratio} mol nisbatga mos hajmda — ${fmt(reactants[1].volume_mL)} ml qo'shing.`, `Aralashmani shisha tayoqcha bilan aralashtiring va ${base === 'NH3·H2O' ? 'metiloranj' : 'fenolftalein'} tomizib, muhitni tekshiring.`];
    steps.push(`Ko'p negizli kislota bosqichma-bosqich dissotsilanadi va protonlarini birin-ketin beradi.`, `Asos miqdoriga qarab protonlarning bir qismi yoki hammasi OH⁻ ionlari bilan suvga aylanadi.`, `${ratio} nisbatda ${saltN} hosil bo'ladi.`);
    explanation = `Ko'p negizli kislotalar asos bilan bosqichma-bosqich reaksiyaga kirishadi. Kislota va asosning mol nisbati ${ratio} bo'lganda ${saltN} hosil bo'ladi. ${why}`;
    obsText = "Ko'zga ko'rinadigan o'zgarish kam: eritma rangsiz qoladi, muhitni indikator bilan aniqlash mumkin.";
    heat = 'ekzotermik';
    questions = [`${cap(acidN)} ${base === 'NH3·H2O' ? 'ammiak' : 'ishqor'} bilan qanday nisbatlarda qanday tuzlar hosil qiladi?`, `${cap(saltN)} nordon tuzmi yoki o'rta tuzmi? Javobingizni asoslang.`, `Nima uchun ${saltN} eritmasi ${medium || 'shu'} muhitga ega?`];
    effects = [];
  } else if (kind === 'kuchsiz') {
    level = '9-sinf';
    topic = "Kuchsiz elektrolitlar ishtirokidagi neytrallanish";
    title = `${cap(acidN)} va ${baseN}ning o'zaro ta'siri`;
    const weakAcid = ['CH3COOH', 'HCOOH'].includes(acid);
    procedure = [`Probirkaga ${fmt(reactants[0].volume_mL)} ml ${acidN} eritmasidan quying va 1 tomchi metiloranj qo'shing — eritma qizaradi.`, `Tomizgich bilan ${base === 'NH3·H2O' ? 'ammiakli suvni' : baseN + ' eritmasini'} rang sarg'ayguncha tomchilab qo'shing.`, `Kerakli hajm taxminan ${fmt(reactants[1].volume_mL)} ml ekanini qayd eting.`];
    steps.push(weakAcid ? `${cap(acidN)} kuchsiz elektrolit — eritmada asosan molekula holida bo'ladi.` : 'Kuchli kislota eritmada to\'liq dissotsilangan.', base === 'NH3·H2O' ? 'NH₃ molekulasi azotdagi bo\'linmagan elektron jufti hisobiga protonni biriktirib NH₄⁺ ioniga aylanadi.' : 'Ishqorning OH⁻ ioni kislota molekulasidan protonni tortib oladi va suv hosil bo\'ladi.', `Natijada ${saltN} eritmasi hosil bo'ladi.`);
    explanation = `${weakAcid ? `${cap(acidN)} kuchsiz kislota bo'lgani uchun ionli tenglamada molekula holida yoziladi.` : ''} ${base === 'NH3·H2O' ? 'Ammiakli suv kuchsiz asos: unda NH₃ molekulalari ustun turadi va ular H⁺ ionini biriktirib NH₄⁺ ionini hosil qiladi.' : ''} ${why}`.replace(/\s+/g, ' ').trim();
    obsText = "Metiloranj qizil rangdan sariq rangga o'tadi; boshqa o'zgarish kuzatilmaydi.";
    colorChange = { from: '#e0312b', to: '#f2c21b' };
    questions = [`Nima uchun ${weakAcid ? acidN : 'ammiak'} ionli tenglamada molekula holida yoziladi?`, `${cap(saltN)} eritmasi qanday muhitga ega va nima uchun?`, 'Kuchsiz va kuchli elektrolitlarga misollar keltiring.'];
    heat = 'ekzotermik';
  } else if (kind === 'erimaydigan') {
    topic = "Erimaydigan asoslarning kislotalar bilan reaksiyasi";
    title = `${cap(baseN)}ning ${acidN}da erishi`;
    const colorWordCation = { 'Cu^2+': "ko'k", 'Fe^3+': "sariq-qo'ng'ir", 'Fe^2+': 'och yashil', 'Ni^2+': 'yashil', 'Co^2+': 'pushti', 'Mn^2+': 'deyarli rangsiz (och pushti)' }[catIon] || 'rangsiz';
    procedure = [`Probirkaga ozroq (${fmt(reactants[1].mass_g)} g) ${baseN} ${base === 'Ca(OH)2' ? 'kukuni' : "cho'kmasi"} soling.`, `Ustiga ${fmt(reactants[0].volume_mL)} ml ${acidN} eritmasidan qo'shing.`, `Probirkani chayqatib, cho'kmaning erishini va eritma rangini kuzating.`];
    steps.push(`Qattiq ${baseN} tarkibidagi OH⁻ guruhlari kislotaning H⁺ ionlari bilan suv hosil qiladi.`, `Metall kationlari (${pretty2(salt).split(' va ')[0]}) eritmaga o'tadi va ${saltN} eritmasi hosil bo'ladi.`);
    explanation = `Erimaydigan asoslar ham kislotalar bilan neytrallanadi: asos kristall panjarasidagi OH⁻ ionlari H⁺ ionlari bilan suv hosil qiladi va asos eriydi. Eritma rangi ${pretty2(salt).split(' va ')[0]} ionlariga bog'liq — ${colorWordCation}. ${acid === 'CH3COOH' ? 'Sirka kislota kuchsiz bo\'lsa-da, bu asosni eritishga yetarli.' : ''}`.trim();
    obsText = `${cap(baseN)} ${base === 'Ca(OH)2' ? 'kukuni' : "cho'kmasi"} eriydi, eritma ${colorWordCation} rangga kiradi.`;
    if (cationColor) colorChange = { from: '#ffffff', to: cationColor };
    effects = [{ type: 'dissolve' }];
    heat = 'sezilarsiz';
    kinetics = 'tez';
    questions = [`${cap(baseN)} suvda eriydimi? Kislotada-chi?`, 'Erimaydigan asoslar kislotalardan tashqari yana qanday moddalar bilan reaksiyaga kirishadi?', `Qisqartirilgan ionli tenglamada nima uchun ${pretty(base)} molekula holida yoziladi?`];
  } else if (kind === 'gaz') {
    level = '9-sinf';
    topic = 'Gazsimon kislotaning ishqor bilan neytrallanishi';
    title = `Vodorod sulfidning natriy gidroksid eritmasida yutilishi (natriy sulfid hosil bo'lishi)`;
    procedure = ['Probirkaga natriy gidroksid eritmasidan quying va 1 tomchi fenolftalein qo\'shing.', 'Gaz chiqarish naychasi orqali vodorod sulfidni (mo\'rili shkafda!) eritmadan sekin o\'tkazing.', "Indikator rangi o'zgarishini va palag'da tuxum hidining yo'qligini kuzating."];
    steps.push('H₂S kuchsiz ikki negizli kislota sifatida protonlarini OH⁻ ionlariga beradi.', 'Ishqor ortiqcha bo\'lganda o\'rta tuz — Na₂S, ishqor yetishmasa nordon tuz — NaHS hosil bo\'ladi.');
    explanation = "Vodorod sulfid suvda eriganda kuchsiz kislota hosil qiladi va ishqor bilan neytrallanadi. Shu sababli ishqor eritmalari H₂S ni yutish (laboratoriyada zararsizlantirish) uchun ishlatiladi. Natriy sulfid eritmasi gidroliz tufayli ishqoriy muhitga ega.";
    obsText = 'Gaz to\'liq yutiladi; eritma pushtiligicha qoladi (Na₂S gidroliz tufayli ishqoriy).';
    questions = ['Nima uchun H₂S ni ishqor eritmasi orqali o\'tkazib zararsizlantirish mumkin?', 'H₂S ning NaOH bilan 1:1 nisbatdagi reaksiyasi tenglamasini yozing.'];
    effects = [{ type: 'bubbles' }];
  }
  return makeRecord({
    id, category: CAT, title, level, topic, engine: 'rules', reactants, conditions: {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: null },
    mechType: 'neytrallanish', steps,
    obs: { precipitate: pptSalt ? { species: salt, color: sOut.precipitate.color, texture: sOut.precipitate.texture } : null, gas: null, solution_color_change: colorChange, heat, flame: null, effects, text_uz: obsText },
    kinetics, apparatus: kind === 'gaz' ? ['probirka', 'gaz-naycha-egilgan'] : (kind === 'nordon' ? ['probirka', 'darajalangan-pipetka', 'shisha-tayoqcha'] : ['probirka', 'tomizgich']),
    procedure, safety: safetyFor(left.map((t) => t.id), kind === 'gaz' ? "Vodorod sulfid zaharli — tajriba faqat mo'rili shkafda o'tkaziladi." : ''),
    explanation, questions, confidence: kind === 'nordon' && acid === 'H2C2O4' ? "o'rta" : 'yuqori',
  });
}

function pretty2(salt) {
  const s = sub(salt);
  const ions = Object.keys(s.dissociation || s.ions || {}).filter((k) => db.ions[k]);
  return ions.map((k) => db.ions[k].display).join(' va ');
}
function pretty(id) { return db.displayOf(id); }

for (const [a, b, s] of STRONG_PAIRS) out.push(build(a, b, s, 'kuchli'));
for (const [a, b, s, r] of ACID_SALTS) out.push(build(a, b, s, 'nordon', r));
for (const [a, b, s] of WEAK) out.push(build(a, b, s, 'kuchsiz'));
for (const [a, b, s] of INSOLUBLE) out.push(build(a, b, s, 'erimaydigan'));
for (const [a, b, s, r] of GAS_ACID) out.push(build(a, b, s, 'gaz', r));
writeCategory(CAT, out);
