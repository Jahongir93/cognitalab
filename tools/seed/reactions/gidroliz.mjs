// 13-toifa: Tuzlar gidrolizi va indikatorlar (30). Generator: node tools/seed/reactions/gidroliz.mjs
import { db, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub } from './lib.mjs';

const CAT = 'gidroliz-indikatorlar';
const PFX = 'gidroliz';
const out = [];
const UI = { species: 'universal-indikator', state: 'aq', volume_mL: 0.1, role: 'indikator' };

// [tuz, molekulyar, to'liq ionli, qisqartirilgan, pH oralig'i, muhit, turi]
const H = [
  ['Na2CO3', 'Na2CO3 + H2O ⇄ NaHCO3 + NaOH', '2Na⁺ + CO3²⁻ + H2O ⇄ Na⁺ + HCO3⁻ + Na⁺ + OH⁻', 'CO3²⁻ + H2O ⇄ HCO3⁻ + OH⁻', [11, 12.2], 'anion'],
  ['K2CO3', 'K2CO3 + H2O ⇄ KHCO3 + KOH', '2K⁺ + CO3²⁻ + H2O ⇄ K⁺ + HCO3⁻ + K⁺ + OH⁻', 'CO3²⁻ + H2O ⇄ HCO3⁻ + OH⁻', [11, 12.2], 'anion'],
  ['NaHCO3', 'NaHCO3 + H2O ⇄ H2CO3 + NaOH', 'Na⁺ + HCO3⁻ + H2O ⇄ H2CO3 + Na⁺ + OH⁻', 'HCO3⁻ + H2O ⇄ H2CO3 + OH⁻', [7.8, 8.8], 'anion-nordon'],
  ['Na2S', 'Na2S + H2O ⇄ NaHS + NaOH', '2Na⁺ + S²⁻ + H2O ⇄ Na⁺ + HS⁻ + Na⁺ + OH⁻', 'S²⁻ + H2O ⇄ HS⁻ + OH⁻', [12, 13.5], 'anion'],
  ['Na3PO4', 'Na3PO4 + H2O ⇄ Na2HPO4 + NaOH', '3Na⁺ + PO4³⁻ + H2O ⇄ 2Na⁺ + HPO4²⁻ + Na⁺ + OH⁻', 'PO4³⁻ + H2O ⇄ HPO4²⁻ + OH⁻', [12, 13], 'anion'],
  ['Na2HPO4', 'Na2HPO4 + H2O ⇄ NaH2PO4 + NaOH', '2Na⁺ + HPO4²⁻ + H2O ⇄ Na⁺ + H2PO4⁻ + Na⁺ + OH⁻', 'HPO4²⁻ + H2O ⇄ H2PO4⁻ + OH⁻', [9, 10.2], 'anion-nordon'],
  ['NaH2PO4', 'NaH2PO4 ⇄ Na⁺ + H⁺ + HPO4²⁻', null, 'H2PO4⁻ ⇄ H⁺ + HPO4²⁻', [4, 5.2], 'nordon-dissotsiatsiya'],
  ['CH3COONa', 'CH3COONa + H2O ⇄ CH3COOH + NaOH', 'CH3COO⁻ + Na⁺ + H2O ⇄ CH3COOH + Na⁺ + OH⁻', 'CH3COO⁻ + H2O ⇄ CH3COOH + OH⁻', [8.4, 9.3], 'anion'],
  ['Na2SiO3', 'Na2SiO3 + 2H2O ⇄ H2SiO3 + 2NaOH', null, 'SiO3²⁻ + H2O ⇄ HSiO3⁻ + OH⁻', [11.3, 13], 'anion'],
  ['Na2SO3', 'Na2SO3 + H2O ⇄ NaHSO3 + NaOH', '2Na⁺ + SO3²⁻ + H2O ⇄ Na⁺ + HSO3⁻ + Na⁺ + OH⁻', 'SO3²⁻ + H2O ⇄ HSO3⁻ + OH⁻', [9.5, 10.6], 'anion'],
  ['NaF', 'NaF + H2O ⇄ HF + NaOH', 'Na⁺ + F⁻ + H2O ⇄ HF + Na⁺ + OH⁻', 'F⁻ + H2O ⇄ HF + OH⁻', [7.8, 8.5], 'anion'],
  ['NH4Cl', 'NH4Cl + H2O ⇄ NH3·H2O + HCl', 'NH4⁺ + Cl⁻ + H2O ⇄ NH3·H2O + H⁺ + Cl⁻', 'NH4⁺ + H2O ⇄ NH3·H2O + H⁺', [4.7, 5.6], 'kation'],
  ['(NH4)2SO4', '(NH4)2SO4 + 2H2O ⇄ 2NH3·H2O + H2SO4', '2NH4⁺ + SO4²⁻ + 2H2O ⇄ 2NH3·H2O + 2H⁺ + SO4²⁻', 'NH4⁺ + H2O ⇄ NH3·H2O + H⁺', [4.6, 5.5], 'kation'],
  ['NH4NO3', 'NH4NO3 + H2O ⇄ NH3·H2O + HNO3', 'NH4⁺ + NO3⁻ + H2O ⇄ NH3·H2O + H⁺ + NO3⁻', 'NH4⁺ + H2O ⇄ NH3·H2O + H⁺', [4.7, 5.6], 'kation'],
  ['AlCl3', 'AlCl3 + H2O ⇄ AlOHCl2 + HCl', 'Al³⁺ + 3Cl⁻ + H2O ⇄ AlOH²⁺ + 2Cl⁻ + H⁺ + Cl⁻', 'Al³⁺ + H2O ⇄ AlOH²⁺ + H⁺', [2.5, 3.6], 'kation'],
  ['Al2(SO4)3', 'Al2(SO4)3 + 2H2O ⇄ 2AlOHSO4 + H2SO4', '2Al³⁺ + 3SO4²⁻ + 2H2O ⇄ 2AlOH²⁺ + 2SO4²⁻ + 2H⁺ + SO4²⁻', 'Al³⁺ + H2O ⇄ AlOH²⁺ + H⁺', [2.4, 3.6], 'kation'],
  ['ZnSO4', '2ZnSO4 + 2H2O ⇄ (ZnOH)2SO4 + H2SO4', '2Zn²⁺ + 2SO4²⁻ + 2H2O ⇄ 2ZnOH⁺ + SO4²⁻ + 2H⁺ + SO4²⁻', 'Zn²⁺ + H2O ⇄ ZnOH⁺ + H⁺', [4.5, 5.6], 'kation'],
  ['CuSO4', '2CuSO4 + 2H2O ⇄ (CuOH)2SO4 + H2SO4', '2Cu²⁺ + 2SO4²⁻ + 2H2O ⇄ 2CuOH⁺ + SO4²⁻ + 2H⁺ + SO4²⁻', 'Cu²⁺ + H2O ⇄ CuOH⁺ + H⁺', [3.7, 4.8], 'kation'],
  ['FeCl3', 'FeCl3 + H2O ⇄ FeOHCl2 + HCl', 'Fe³⁺ + 3Cl⁻ + H2O ⇄ FeOH²⁺ + 2Cl⁻ + H⁺ + Cl⁻', 'Fe³⁺ + H2O ⇄ FeOH²⁺ + H⁺', [1.5, 2.4], 'kation'],
  ['CH3COONH4', 'CH3COONH4 + H2O ⇄ CH3COOH + NH3·H2O', 'CH3COO⁻ + NH4⁺ + H2O ⇄ CH3COOH + NH3·H2O', 'CH3COO⁻ + NH4⁺ + H2O ⇄ CH3COOH + NH3·H2O', [6.5, 7.5], 'ikkalasi'],
  ['NaHSO4', 'NaHSO4 = Na⁺ + H⁺ + SO4²⁻', null, null, [1, 1.8], 'nordon-dissotsiatsiya'],
  ['NaCl', null, null, null, [6.5, 7.5], 'yoq'], ['KNO3', null, null, null, [6.5, 7.5], 'yoq'], ['Na2SO4', null, null, null, [6.5, 7.8], 'yoq'],
];

const MEDIUM_WORD = (r) => (r[1] < 6.4 ? 'kislotali' : r[0] > 7.6 ? 'ishqoriy' : 'neytral');
const UI_COLOR = (r) => { const p = (r[0] + r[1]) / 2; return p < 3 ? ['qizil', '#e63a1f'] : p < 5.5 ? ["to'q sariq", '#f39a1d'] : p < 6.6 ? ['sariq', '#f5d324'] : p < 7.6 ? ['yashil', '#7cc23a'] : p < 9.5 ? ["ko'k-yashil", '#2e7fb8'] : p < 11.5 ? ["ko'k", '#3349a8'] : ['binafsha', '#4d2f91']; };

for (const [salt, mol, full, net, range, kind] of H) {
  const s = sub(salt);
  const sN = shortName(salt);
  const med = MEDIUM_WORD(range);
  const [cw, chex] = UI_COLOR(range);
  const ions = Object.keys(s.dissociation || {}).filter((k) => db.ions[k]);
  const cat = ions.find((k) => db.ions[k].charge > 0), an = ions.find((k) => db.ions[k].charge < 0);
  let expl, steps, title;
  if (kind === 'anion' || kind === 'anion-nordon') {
    title = `${cap(sN)} eritmasining gidrolizi (muhitni indikator bilan aniqlash)`;
    expl = `${cap(sN)} kuchli asos va kuchsiz kislotadan hosil bo'lgan tuz. Kuchsiz kislota qoldig'i — ${db.ions[an].display} ioni suv molekulasidan proton tortib oladi, eritmada OH⁻ ionlari ortiqcha bo'lib qoladi — muhit ${med}. Gidroliz qaytar va asosan birinchi bosqichda boradi.${kind === 'anion-nordon' ? ` ${db.ions[an].display} ionining dissotsilanishi gidrolizidan kuchsizroq, shuning uchun muhit kuchsiz ishqoriy.` : ''}`;
    steps = ['Tuz eritmada ionlarga to\'liq dissotsilanadi.', `${db.ions[an].display} ioni suv molekulasidan H⁺ ni biriktiradi (proton ko'chishi).`, 'Eritmada OH⁻ ionlari to\'planadi — muhit ishqoriy bo\'ladi.'];
  } else if (kind === 'kation') {
    title = `${cap(sN)} eritmasining gidrolizi (muhitni indikator bilan aniqlash)`;
    expl = `${cap(sN)} kuchsiz asos va kuchli kislotadan hosil bo'lgan tuz. ${db.ions[cat].display} kationi suv molekulalarini qutblab, ulardan OH⁻ guruhini biriktiradi, eritmada H⁺ ionlari ortiqcha qoladi — muhit kislotali. Gidroliz qaytar va asosan birinchi bosqichda boradi.`;
    steps = ['Tuz eritmada ionlarga to\'liq dissotsilanadi.', `${db.ions[cat].display} kationi suv molekulasidan OH⁻ ni biriktiradi (gidrokso-kation hosil bo'ladi).`, "Ajralgan H⁺ ionlari muhitni kislotali qiladi."];
  } else if (kind === 'ikkalasi') {
    title = `${cap(sN)} eritmasining gidrolizi (kation va anion bo'yicha)`;
    expl = `${cap(sN)} kuchsiz asos va kuchsiz kislotadan hosil bo'lgan: ham kation, ham anion gidrolizlanadi. Sirka kislota va ammiakning kuchi deyarli bir xil bo'lgani uchun muhit neytralga yaqin.`;
    steps = ['NH₄⁺ ioni protonni beradi, CH₃COO⁻ ioni protonni oladi.', 'Hosil bo\'lgan H⁺ va OH⁻ bir-birini neytrallaydi — gidroliz chuqurroq boradi, muhit esa neytralga yaqin qoladi.'];
  } else if (kind === 'nordon-dissotsiatsiya') {
    title = `${cap(sN)} — nordon tuz eritmasining muhiti`;
    expl = salt === 'NaHSO4' ? `${cap(sN)} kuchli kislotaning nordon tuzi: eritmada HSO₄⁻ ioni deyarli to'liq dissotsilanib H⁺ ionlarini hosil qiladi, shuning uchun eritma kuchli kislotali (gidroliz emas, dissotsilanish).` : `${cap(sN)} eritmasida H₂PO₄⁻ ionining dissotsilanishi (H⁺ ajralishi) uning gidrolizidan kuchli, shuning uchun muhit kuchsiz kislotali.`;
    steps = ['Nordon tuz anioni tarkibida almashinadigan vodorod bor.', 'Anion H⁺ ajratadi — muhit kislotali bo\'ladi.'];
  } else {
    title = `${cap(sN)} eritmasining muhiti (gidrolizlanmaydigan tuz)`;
    expl = `${cap(sN)} kuchli asos va kuchli kislotadan hosil bo'lgan: uning ionlari suv bilan kuchsiz elektrolit hosil qilmaydi, shuning uchun gidroliz bormaydi va eritma neytral (pH ≈ 7).`;
    steps = ['Tuz ionlarga dissotsilanadi.', 'Na⁺/K⁺ va kuchli kislota anionlari suv bilan kuchsiz elektrolit hosil qilmaydi — H⁺ va OH⁻ muvozanati o\'zgarmaydi.'];
  }
  const equation = mol ? { molecular: mol, ionic_full: full, ionic_net: net, electron_balance: null } : {};
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title, level: '9-sinf', topic: 'Tuzlarning gidrolizi', engine: 'rules',
    extra: { equilibrium: !!mol, expected_pH: { min: range[0], max: range[1] }, ...(mol ? {} : { equation_free: true, equation_free_uz: `${cap(sN)} gidrolizlanmaydi — eritmada faqat dissotsilanish ro'y beradi, shuning uchun gidroliz tenglamasi yozilmaydi.` }) },
    reactants: [{ species: salt, state: 'aq', conc_M: 0.1, volume_mL: 3 }, UI], conditions: {},
    equation, mechType: 'gidroliz', steps,
    obs: { solution_color_change: { from: '#7cc23a', to: chex }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: `Universal indikator ${cw} rangga kiradi — muhit ${med}.` },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'tomizgich', 'indikator-qogozi'],
    procedure: [`Probirkaga 3 ml ${sN} eritmasidan (0,1 M) quying.`, '1–2 tomchi universal indikator qo\'shing (yoki shisha tayoqcha bilan eritmani indikator qog\'oziga tomizing).', 'Rangni shkala bilan solishtirib, pH ni aniqlang.'],
    safety: safetyFor([salt]),
    explanation: expl,
    questions: ['Tuz gidrolizining qisqartirilgan ionli tenglamasini yozing.', `${cap(sN)} eritmasining muhiti qanday va nima uchun?`, 'Gidrolizni kuchaytirish yoki susaytirish uchun nima qilish mumkin?'],
    confidence: ['Na2SiO3', 'Al2(SO4)3', 'ZnSO4', 'NaF'].includes(salt) ? "o'rta" : 'yuqori',
  }));
}

// indikatorlar
const IND = [
  ['lakmus', 'HCl', 'Lakmusning kislotali muhitdagi rangi', [0, 2], 'qizil', '#d42a3a', "Lakmus kislotali muhitda qizil, neytral muhitda binafsha, ishqoriy muhitda ko'k rangda bo'ladi."],
  ['lakmus', 'NaOH', "Lakmusning ishqoriy muhitdagi rangi", [12, 14], "ko'k", '#3a55c7', "Lakmus ishqoriy muhitda ko'karadi."],
  ['C14H14N3NaO3S', 'HCl', 'Metiloranjning kislotali muhitdagi rangi', [0, 2], 'qizil (pushti-qizil)', '#e0312b', 'Metiloranj pH < 3,1 da qizil, pH > 4,4 da sariq.'],
  ['C14H14N3NaO3S', 'NaOH', 'Metiloranjning ishqoriy muhitdagi rangi', [12, 14], 'sariq', '#f2c21b', 'Metiloranj ishqoriy muhitda sariq rangda.'],
  ['C20H14O4', 'NaOH', "Fenolftaleinning ishqoriy muhitdagi rangi", [12, 14], "to'q pushti (malina rang)", '#d81b8c', 'Fenolftalein kislotali va neytral muhitda rangsiz, pH > 8,2 da pushti-malina rangga kiradi.'],
  ['C27H28Br2O5S', 'NaOH', "Bromtimol ko'kining ishqoriy muhitdagi rangi", [12, 14], "ko'k", '#2a5fc0', "Bromtimol ko'ki kislotali muhitda sariq, neytralda yashil, ishqoriyda ko'k."],
];
for (const [ind, med, title, range, cw, hex, expl] of IND) {
  const iN = shortName(ind), mN = shortName(med);
  const indConc = db.substances[ind].solutions?.[0]?.conc_M;
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title, level: '8-sinf', topic: 'Indikatorlar', engine: 'rules',
    extra: { expected_pH: { min: range[0], max: range[1] }, equation_free: true, equation_free_uz: `Indikator — kuchsiz organik kislota yoki asos; uning molekulyar va ion shakllari turli rangga ega. Muhitga qarab muvozanat siljiydi va rang o'zgaradi.` },
    reactants: [{ species: med, state: 'aq', conc_M: 0.1, volume_mL: 3 }, { species: ind, state: 'aq', ...(indConc ? { conc_M: indConc } : {}), volume_mL: 0.1, role: 'indikator' }],
    conditions: {}, equation: {}, mechType: 'sifat-reaksiya',
    steps: ['Indikator molekulasi muhitdagi H⁺ yoki OH⁻ ionlari bilan protonlanadi yoki protonsizlanadi.', 'Ikki shakl yorug\'likni turlicha yutadi — rang o\'zgaradi.'],
    obs: { solution_color_change: { from: '#ffffff', to: hex }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: `Eritma ${cw} rangga kiradi.` },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'tomizgich'],
    procedure: [`Probirkaga 3 ml ${mN} eritmasidan quying.`, `1–2 tomchi ${iN} qo'shing.`, 'Rangni kuzating va jadvalga yozing.'],
    safety: safetyFor([med]),
    explanation: expl,
    questions: ['Indikatorlar nima uchun rangini o\'zgartiradi?', `${cap(iN)} qaysi pH oralig'ida rangini o'zgartiradi?`],
    confidence: 'yuqori',
  }));
}
writeCategory(CAT, out);
