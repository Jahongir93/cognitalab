// 4-toifa: Metall + kislota (40). Generator: node tools/seed/reactions/metall_kislota.mjs
// Oksidlovchi bo'lmagan kislotalar bilan — umumiy qoida (faollik qatori); HNO3 va kons. H2SO4 bilan — aniq yozuvlar.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { db, term, balanced, eqString, ionicEqs, makeRecord, writeCategory, shortName, cap, safetyFor, sub, fmt, ROOT } from './lib.mjs';

const CAT = 'metall-kislota';
const PFX = 'metkis';
let num = 1; // metkis-0001 — qo'lda yozilgan namunaviy yozuv (Cu + suyult. H2SO4), saqlanadi
const nid = () => `${PFX}-${String(++num).padStart(4, '0')}`;

const existing = JSON.parse(readFileSync(join(ROOT, 'frontend/lab/data/reactions/metall-kislota.json'), 'utf8')).reactions.find((r) => r.id === 'metkis-0001');

const FORM = { Mg: 'lenta', Al: 'qirindi', Zn: 'granula', Fe: 'qirindi', Mn: 'kukun', Ni: 'kukun', Sn: 'granula', Ca: "bo'lak", Cu: 'sim', Ag: 'sim', Pb: 'plastinka', Cr: 'kukun' };
const KIN = { Mg: 'tez', Ca: 'tez', Al: "o'rtacha", Zn: "o'rtacha", Mn: "o'rtacha", Fe: 'sekin', Ni: 'sekin', Sn: 'sekin', Cr: 'sekin' };
const ION_COLOR_WORD = { 'Fe^2+': 'och yashil', 'Ni^2+': 'yashil', 'Mn^2+': 'deyarli rangsiz', 'Cr^2+': "ko'k" };

const out = [existing];

// 1) umumiy qoida: metall + oksidlovchi bo'lmagan kislota -> tuz + H2
const RULES = [
  ['Mg', 'HCl'], ['Mg', 'H2SO4'], ['Mg', 'CH3COOH'], ['Fe', 'CH3COOH'], ['Ca', 'HCl'],
  ['Al', 'HCl'], ['Al', 'H2SO4'], ['Zn', 'HCl'], ['Zn', 'H2SO4'], ['Zn', 'CH3COOH'], ['Zn', 'HBr'],
  ['Fe', 'HCl'], ['Fe', 'H2SO4'], ['Mn', 'HCl'], ['Ni', 'HCl'], ['Sn', 'HCl'],
];
const ACID_AN = { HCl: 'Cl^-', H2SO4: 'SO4^2-', CH3COOH: 'CH3COO^-', HCOOH: 'HCOO^-', HBr: 'Br^-' };
for (const [m, acid] of RULES) {
  const M = sub(m);
  const salt = db.saltOf(M.metal.ion, ACID_AN[acid]);
  const left = [term(m, 's'), term(acid, 'aq')];
  const right = [term(salt, 'aq'), term('H2', 'g', 1, { mark: '↑' })];
  balanced(left, right);
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const weak = ['CH3COOH', 'HCOOH'].includes(acid);
  const c = weak ? 2 : (acid === 'H2SO4' ? 1 : 2);
  const nM = 0.002;
  const reactants = [
    { species: m, state: 's', mass_g: Math.round(nM * M.M * 1000) / 1000, form: FORM[m] },
    { species: acid, state: 'aq', conc_M: c, volume_mL: Math.round(((nM * left[1].k) / left[0].k / c) * 1000 * 10) / 10 },
  ];
  const mN = shortName(m), aN = shortName(acid), sN = shortName(salt);
  const ionW = ION_COLOR_WORD[M.metal.ion];
  const slow = ['sekin'].includes(KIN[m]) || weak;
  out.push(makeRecord({
    id: nid(), category: CAT,
    title: `${cap(mN)}ning ${aN} bilan reaksiyasi`,
    level: weak ? '9-sinf' : '8-sinf', topic: 'Metallarning kislotalar bilan reaksiyasi; faollik qatori',
    engine: 'rules', reactants,
    conditions: slow && !weak && m !== 'Fe' ? { note_uz: 'Reaksiya sekin boradi; ozgina qizdirilganda tezlashadi.' } : {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: [`${m}⁰ − ${M.metal.n}e⁻ = ${m}⁺${'⁰¹²³⁴⁵⁶⁷⁸⁹'[M.metal.n]}`, '2H⁺ + 2e⁻ = H2'] },
    mechType: "o'rin-olish",
    steps: [`${cap(mN)} faollik qatorida vodoroddan oldin turadi — u H⁺ ionlariga elektron bera oladi.`, `${m} atomlari elektron berib ${db.ions[M.metal.ion].display} ionlariga aylanadi (oksidlanadi).`, 'H⁺ ionlari elektron qabul qilib H₂ molekulalarini hosil qiladi (qaytariladi).'],
    obs: { precipitate: null, gas: { species: 'H2', color: null }, solution_color_change: ionW ? { from: '#ffffff', to: db.ions[M.metal.ion].color?.hex || '#ffffff' } : null, heat: m === 'Mg' || m === 'Ca' ? 'ekzotermik' : 'sezilarsiz', flame: null, effects: [{ type: 'bubbles' }, { type: 'dissolve' }], text_uz: `Metall sirtida rangsiz gaz (vodorod) pufakchalari ajraladi, metall asta eriydi${ionW ? `, eritma ${ionW} tusga kiradi` : ''}.${m === 'Al' ? ' Avvaliga reaksiya sust boradi — oksid parda eriguncha.' : ''}` },
    kinetics: KIN[m] || "o'rtacha",
    apparatus: ['probirka', 'pinset', 'chop-yonib-turgan'],
    procedure: [`Probirkaga ${fmt(reactants[1].volume_mL)} ml ${aN} eritmasidan quying.`, `Pinset bilan ${mN} ${FORM[m] === 'lenta' ? 'lentasidan bir bo\'lak' : FORM[m] === 'granula' ? 'granulasi' : FORM[m] === 'kukun' ? 'kukunidan ozroq' : FORM[m]} soling.`, 'Gaz ajralishini kuzating.', "Probirka og'ziga yonib turgan cho'pni yaqinlashtiring — vodorod \"paq\" etgan tovush bilan yonadi."],
    safety: safetyFor([acid, m], "Vodorod havo bilan portlovchi aralashma hosil qiladi — gazni yondirishdan oldin oz miqdorda ekaniga ishonch hosil qiling."),
    explanation: `${cap(mN)} faollik qatorida vodoroddan oldin turgani uchun ${weak ? 'kuchsiz' : 'suyultirilgan'} kislotadan vodorodni siqib chiqaradi va ${sN} hosil bo'ladi.${m === 'Fe' ? ' Temir bunda +2 oksidlanish darajasini namoyon qiladi (FeCl₃ emas, FeCl₂ hosil bo\'ladi).' : ''}${m === 'Al' ? " Alyuminiy sirtidagi zich oksid parda reaksiyani boshida sekinlashtiradi; xlorid ionlari pardani buzadi." : ''}${weak ? ' Kuchsiz kislota eritmasida H⁺ ionlari kam, shuning uchun reaksiya sekinroq boradi.' : ''}`,
    questions: ['Bu reaksiyada oksidlovchi va qaytaruvchini aniqlang.', `${cap(mN)} o'rniga mis olinsa, reaksiya boradimi? Nima uchun?`, 'Vodorodni qanday aniqlash mumkin?'],
    confidence: m === 'Sn' || m === 'Mn' ? "o'rta" : 'yuqori',
  }));
}

// 2) reaksiya ketmaydigan holatlar
const NONE = [
  ['Cu', 'HCl', 'Mis faollik qatorida vodoroddan keyin turadi, shuning uchun xlorid kislotadan vodorodni siqib chiqara olmaydi.'],
  ['Ag', 'HCl', 'Kumush faollik qatorida vodoroddan ancha keyin turadi — xlorid kislota bilan reaksiyaga kirishmaydi.'],
  ['Ag', 'H2SO4', 'Kumush vodoroddan keyin turadi; suyultirilgan sulfat kislota oksidlovchi xossaga ega emas, shuning uchun reaksiya ketmaydi.'],
  ['Pb', 'HCl', "Qo'rg'oshin vodoroddan oldin tursa ham, uning sirtida suvda kam eriydigan PbCl₂ pardasi hosil bo'lib, reaksiyani deyarli darhol to'xtatadi."],
  ['Pb', 'H2SO4', "Qo'rg'oshin sirtida erimaydigan PbSO₄ pardasi hosil bo'ladi va metallni kislotadan himoya qiladi — reaksiya amalda bormaydi (shuning uchun akkumulyatorlarda qo'rg'oshin ishlatiladi)."],
];
for (const [m, acid, why] of NONE) {
  const mN = shortName(m), aN = shortName(acid);
  const match = acid === 'H2SO4' && m === 'Pb' ? ['Pb', 'H⁺', 'HSO4⁻'] : (m === 'Pb' ? ['Pb', 'H⁺', 'Cl⁻'] : [m, 'H⁺']);
  out.push(makeRecord({
    id: nid(), category: CAT,
    title: `${cap(mN)}ning ${aN} bilan reaksiyaga ${m === 'Pb' ? 'deyarli ' : ''}kirishmasligi`,
    level: '8-sinf', topic: 'Metallarning faollik qatori', engine: 'record', no_reaction: true, match,
    reactants: [{ species: m, state: 's', mass_g: 0.5, form: FORM[m] }, { species: acid, state: 'aq', conc_M: acid === 'H2SO4' ? 1 : 2, volume_mL: 3, conc_max_M: acid === 'H2SO4' ? 10 : 6 }],
    conditions: {}, equation: {},
    mechType: "o'rin-olish",
    steps: m === 'Pb' ? ["Qo'rg'oshin H⁺ ionlari bilan reaksiyani boshlaydi.", "Hosil bo'lgan tuz suvda kam eriydi va metall sirtini qoplaydi.", "Parda kislotaning metallga kirishiga to'sqinlik qiladi — reaksiya to'xtaydi."] : [`${cap(mN)} faollik qatorida vodoroddan keyin turadi (E° > 0).`, `${m} atomlari H⁺ ionlariga elektron bera olmaydi.`],
    obs: { heat: 'sezilarsiz', effects: [], text_uz: m === 'Pb' ? "Bir necha pufakcha paydo bo'lib, reaksiya tez to'xtaydi." : "Hech qanday o'zgarish kuzatilmaydi." },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'pinset'],
    procedure: [`Probirkaga ${mN} ${FORM[m]}ini soling.`, `Ustiga 3 ml ${aN} quying.`, 'Bir necha daqiqa kuzating.'],
    safety: safetyFor([acid, m]),
    explanation: why,
    questions: ['Metallarning faollik qatori nimani ko\'rsatadi?', `${cap(mN)} qanday kislotalar bilan reaksiyaga kirishadi?`],
    confidence: 'yuqori',
  }));
}

// 3) oksidlovchi kislotalar bilan aniq yozuvlar
// [metall, molekulyar tenglama, ionli to'liq, qisqartirilgan, elektron balans, sharoit, kislota konsentratsiyasi, kuzatuv, tushuntirish, ishonch]
const REC = [
  { m: 'Cu', acid: 'HNO3', c: 14.4, cmin: 10, mol: 'Cu + 4HNO3 = Cu(NO3)2 + 2NO2↑ + 2H2O', net: 'Cu + 4H⁺ + 2NO3⁻ = Cu²⁺ + 2NO2↑ + 2H2O', eb: ['Cu⁰ − 2e⁻ = Cu⁺²', 'N⁺⁵ + 1e⁻ = N⁺⁴'], gas: 'NO2', obs: "Mis tez eriydi, qo'ng'ir gaz (NO₂, \"tulki dumi\") ajraladi, eritma ko'k-yashil tusga kiradi.", expl: "Konsentrlangan nitrat kislotada oksidlovchi — NO₃⁻ ioni (N⁺⁵); u vodoroddan keyin turgan misni ham oksidlaydi. Konsentrlangan kislota asosan NO₂ gacha qaytariladi.", kin: 'tez', heat: 'ekzotermik', conf: 'yuqori', col: ['#ffffff', '#3aa88a'] },
  { m: 'Cu', acid: 'HNO3', c: 6, cmax: 10, mol: '3Cu + 8HNO3 = 3Cu(NO3)2 + 2NO↑ + 4H2O', net: '3Cu + 8H⁺ + 2NO3⁻ = 3Cu²⁺ + 2NO↑ + 4H2O', eb: ['Cu⁰ − 2e⁻ = Cu⁺²', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Rangsiz gaz (NO) ajraladi, u probirka og'zida havo kislorodi bilan qo'ng'ir NO₂ ga aylanadi; eritma ko'karadi.", expl: "Suyultirilgan nitrat kislota misni oksidlaydi, o'zi esa asosan NO gacha qaytariladi. Vodorod ajralmaydi, chunki oksidlovchi H⁺ emas, NO₃⁻ ioni.", kin: "o'rtacha", heat: 'ekzotermik', conf: 'yuqori', col: ['#ffffff', '#4aa3dc'] },
  { m: 'Ag', acid: 'HNO3', c: 14.4, cmin: 10, mol: 'Ag + 2HNO3 = AgNO3 + NO2↑ + H2O', net: 'Ag + 2H⁺ + NO3⁻ = Ag⁺ + NO2↑ + H2O', eb: ['Ag⁰ − 1e⁻ = Ag⁺¹', 'N⁺⁵ + 1e⁻ = N⁺⁴'], gas: 'NO2', obs: "Kumush eriydi, qo'ng'ir NO₂ gazi ajraladi; eritma rangsiz.", expl: 'Konsentrlangan nitrat kislota kumushni ham eritadi (oltin va platina erimaydi). Kumush nitrat eritmasi rangsiz.', kin: "o'rtacha", heat: 'ekzotermik', conf: 'yuqori' },
  { m: 'Ag', acid: 'HNO3', c: 6, cmax: 10, mol: '3Ag + 4HNO3 = 3AgNO3 + NO↑ + 2H2O', net: '3Ag + 4H⁺ + NO3⁻ = 3Ag⁺ + NO↑ + 2H2O', eb: ['Ag⁰ − 1e⁻ = Ag⁺¹', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Qizdirilganda kumush asta eriydi, rangsiz gaz ajraladi (havoda qo'ng'irlashadi).", expl: 'Suyultirilgan nitrat kislota kumushni sekin, qizdirilganda tezroq eritadi va NO gacha qaytariladi.', kin: 'sekin', heat: 'sezilarsiz', conf: 'yuqori', tmin: 50 },
  { m: 'Zn', acid: 'HNO3', c: 14.4, cmin: 10, mol: 'Zn + 4HNO3 = Zn(NO3)2 + 2NO2↑ + 2H2O', net: 'Zn + 4H⁺ + 2NO3⁻ = Zn²⁺ + 2NO2↑ + 2H2O', eb: ['Zn⁰ − 2e⁻ = Zn⁺²', 'N⁺⁵ + 1e⁻ = N⁺⁴'], gas: 'NO2', obs: "Rux jadal eriydi, qo'ng'ir gaz ajraladi.", expl: 'Konsentrlangan nitrat kislota faol metallar bilan ham asosan NO₂ beradi; vodorod ajralmaydi.', kin: 'tez', heat: 'ekzotermik', conf: "o'rta" },
  { m: 'Zn', acid: 'HNO3', c: 4, cmin: 2.5, cmax: 10, mol: '3Zn + 8HNO3 = 3Zn(NO3)2 + 2NO↑ + 4H2O', net: '3Zn + 8H⁺ + 2NO3⁻ = 3Zn²⁺ + 2NO↑ + 4H2O', eb: ['Zn⁰ − 2e⁻ = Zn⁺²', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Rangsiz gaz ajraladi, probirka og'zida qo'ng'irlashadi.", expl: "Nitrat kislotaning qaytarilish mahsuloti konsentratsiyaga va metall faolligiga bog'liq; o'rtacha suyultirilgan kislota bilan rux asosan NO beradi (amalda N₂O va N₂ aralashmasi ham hosil bo'ladi).", kin: "o'rtacha", heat: 'ekzotermik', conf: "o'rta" },
  { m: 'Zn', acid: 'HNO3', c: 0.5, cmax: 2.5, mol: '4Zn + 10HNO3 = 4Zn(NO3)2 + NH4NO3 + 3H2O', net: '4Zn + 10H⁺ + NO3⁻ = 4Zn²⁺ + NH4⁺ + 3H2O', eb: ['Zn⁰ − 2e⁻ = Zn⁺²', 'N⁺⁵ + 8e⁻ = N⁻³'], gas: null, obs: 'Rux gaz ajratmasdan asta eriydi; eritmaga ishqor qo\'shib qizdirilsa, ammiak hidi seziladi.', expl: "Juda suyultirilgan nitrat kislota faol metallar bilan eng chuqur qaytarilib, ammoniy ionini (N⁻³) hosil qiladi — shuning uchun gaz ajralmaydi.", kin: 'sekin', heat: 'sezilarsiz', conf: "o'rta" },
  { m: 'Mg', acid: 'HNO3', c: 0.5, cmax: 2.5, mol: '4Mg + 10HNO3 = 4Mg(NO3)2 + NH4NO3 + 3H2O', net: '4Mg + 10H⁺ + NO3⁻ = 4Mg²⁺ + NH4⁺ + 3H2O', eb: ['Mg⁰ − 2e⁻ = Mg⁺²', 'N⁺⁵ + 8e⁻ = N⁻³'], gas: null, obs: 'Magniy eriydi, gaz deyarli ajralmaydi.', expl: 'Juda suyultirilgan nitrat kislota magniy kabi faol metallar bilan ammoniy nitratgacha qaytariladi.', kin: "o'rtacha", heat: 'ekzotermik', conf: "o'rta" },
  { m: 'Fe', acid: 'HNO3', c: 4, cmax: 10, mol: 'Fe + 4HNO3 = Fe(NO3)3 + NO↑ + 2H2O', net: 'Fe + 4H⁺ + NO3⁻ = Fe³⁺ + NO↑ + 2H2O', eb: ['Fe⁰ − 3e⁻ = Fe⁺³', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Temir eriydi, rangsiz gaz ajralib havoda qo'ng'irlashadi, eritma sarg'ish-qo'ng'ir tusga kiradi.", expl: 'Suyultirilgan nitrat kislota temirni +3 oksidlanish darajasigacha oksidlaydi (xlorid kislotadan farqli ravishda).', kin: "o'rtacha", heat: 'ekzotermik', conf: 'yuqori', col: ['#ffffff', '#d39a2a'] },
  { m: 'Fe', acid: 'HNO3', c: 14.4, cmin: 10, tmin: 60, mol: 'Fe + 6HNO3 = Fe(NO3)3 + 3NO2↑ + 3H2O', net: 'Fe + 6H⁺ + 3NO3⁻ = Fe³⁺ + 3NO2↑ + 3H2O', eb: ['Fe⁰ − 3e⁻ = Fe⁺³', 'N⁺⁵ + 1e⁻ = N⁺⁴'], gas: 'NO2', obs: "Qizdirilganda temir eriydi, qo'ng'ir gaz ajraladi.", expl: "Sovuqda konsentrlangan nitrat kislota temirni passivlaydi, qizdirilganda esa parda buziladi va temir eriydi.", kin: "o'rtacha", heat: 'ekzotermik', conf: 'yuqori', col: ['#ffffff', '#d39a2a'] },
  { m: 'Pb', acid: 'HNO3', c: 4, cmax: 10, mol: '3Pb + 8HNO3 = 3Pb(NO3)2 + 2NO↑ + 4H2O', net: '3Pb + 8H⁺ + 2NO3⁻ = 3Pb²⁺ + 2NO↑ + 4H2O', eb: ['Pb⁰ − 2e⁻ = Pb⁺²', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Qo'rg'oshin eriydi, rangsiz gaz ajralib havoda qo'ng'irlashadi.", expl: "Qo'rg'oshin nitrati suvda yaxshi eriydi, shuning uchun parda hosil bo'lmaydi va qo'rg'oshin suyultirilgan nitrat kislotada yaxshi eriydi.", kin: 'sekin', heat: 'sezilarsiz', conf: 'yuqori' },
  { m: 'Al', acid: 'HNO3', c: 4, cmax: 10, tmin: 50, mol: 'Al + 4HNO3 = Al(NO3)3 + NO↑ + 2H2O', net: 'Al + 4H⁺ + NO3⁻ = Al³⁺ + NO↑ + 2H2O', eb: ['Al⁰ − 3e⁻ = Al⁺³', 'N⁺⁵ + 3e⁻ = N⁺²'], gas: 'NO', obs: "Qizdirilganda alyuminiy asta eriydi, gaz ajralib havoda qo'ng'irlashadi.", expl: "Alyuminiy suyultirilgan nitrat kislotada oksid parda tufayli sekin, qizdirilganda tezroq eriydi; mahsulot tarkibi sharoitga bog'liq.", kin: 'sekin', heat: 'sezilarsiz', conf: "o'rta" },
  { m: 'Cu', acid: 'H2SO4', c: 18, cmin: 12, tmin: 100, mol: 'Cu + 2H2SO4 = CuSO4 + SO2↑ + 2H2O', net: null, eb: ['Cu⁰ − 2e⁻ = Cu⁺²', 'S⁺⁶ + 2e⁻ = S⁺⁴'], gas: 'SO2', obs: "Qizdirilganda mis eriydi, o'tkir hidli SO₂ gazi ajraladi; sovitib suvga quyilganda eritma ko'karadi.", expl: "Konsentrlangan sulfat kislotada oksidlovchi S⁺⁶ atomi; u vodoroddan keyin turgan misni qizdirilganda oksidlaydi va o'zi SO₂ gacha qaytariladi. Suyultirilgan sulfat kislota mis bilan reaksiyaga kirishmaydi.", kin: "o'rtacha", heat: 'sezilarsiz', conf: 'yuqori' },
  { m: 'Zn', acid: 'H2SO4', c: 18, cmin: 12, tmin: 60, mol: 'Zn + 2H2SO4 = ZnSO4 + SO2↑ + 2H2O', net: null, eb: ['Zn⁰ − 2e⁻ = Zn⁺²', 'S⁺⁶ + 2e⁻ = S⁺⁴'], gas: 'SO2', obs: "O'tkir hidli gaz ajraladi.", expl: "Konsentrlangan sulfat kislota rux bilan vodorod emas, oltingugurtning qaytarilish mahsulotlarini beradi; sharoitga qarab SO₂, S yoki H₂S hosil bo'lishi mumkin (bu yerda soddalashtirilgan holda SO₂).", kin: "o'rtacha", heat: 'ekzotermik', conf: "o'rta" },
  { m: 'Fe', acid: 'H2SO4', c: 18, cmin: 12, tmin: 100, mol: '2Fe + 6H2SO4 = Fe2(SO4)3 + 3SO2↑ + 6H2O', net: null, eb: ['Fe⁰ − 3e⁻ = Fe⁺³', 'S⁺⁶ + 2e⁻ = S⁺⁴'], gas: 'SO2', obs: "Qizdirilganda temir eriydi, o'tkir hidli SO₂ ajraladi.", expl: "Sovuqda konsentrlangan sulfat kislota temirni passivlaydi; qizdirilganda temir(III) sulfat va SO₂ hosil bo'ladi.", kin: 'sekin', heat: 'sezilarsiz', conf: 'yuqori' },
  { m: 'Ag', acid: 'H2SO4', c: 18, cmin: 12, tmin: 150, mol: '2Ag + 2H2SO4 = Ag2SO4 + SO2↑ + 2H2O', net: null, eb: ['Ag⁰ − 1e⁻ = Ag⁺¹', 'S⁺⁶ + 2e⁻ = S⁺⁴'], gas: 'SO2', obs: "Kuchli qizdirilganda kumush asta eriydi, SO₂ hidi seziladi.", expl: 'Kumush konsentrlangan sulfat kislotada faqat kuchli qizdirilganda eriydi.', kin: 'sekin', heat: 'sezilarsiz', conf: "o'rta" },
  { m: 'Mg', acid: 'H2SO4', c: 18, cmin: 12, tmin: 40, mol: '4Mg + 5H2SO4 = 4MgSO4 + H2S↑ + 4H2O', net: null, eb: ['Mg⁰ − 2e⁻ = Mg⁺²', 'S⁺⁶ + 8e⁻ = S⁻²'], gas: 'H2S', obs: 'Jadal reaksiya, palag\'da tuxum hidi seziladi.', expl: "Faol metallar konsentrlangan sulfat kislotani chuqurroq — H₂S (yoki S) gacha qaytaradi.", kin: 'tez', heat: 'ekzotermik', conf: "o'rta" },
];
for (const r of REC) {
  const mN = shortName(r.m), aN = shortName(r.acid);
  const parsed = db.parseEq(r.mol);
  const L = parsed.left.map((t) => ({ id: t.id, k: t.coef, ph: t.id === r.m ? 's' : 'aq' }));
  const R = parsed.right.map((t) => ({ id: t.id, k: t.coef, ph: t.mark === '↑' ? 'g' : 'aq', mark: t.mark }));
  const ionic = r.net ? ionicEqs(L, R) : { full: null, net: null };
  const conc = r.acid === 'H2SO4' && r.cmin ? '(kons.)' : '';
  const molecular = conc ? r.mol.replace(/(\d*)H2SO4 =/, '$1H2SO4(kons.) =') : r.mol;
  const nM = 0.001;
  const acidK = parsed.left.find((t) => t.id === r.acid).coef / parsed.left.find((t) => t.id === r.m).coef;
  const reactants = [
    { species: r.m, state: 's', mass_g: Math.round(nM * sub(r.m).M * 1000) / 1000, form: FORM[r.m] },
    { species: r.acid, state: 'aq', conc_M: r.c, volume_mL: Math.max(Math.round((nM * acidK / r.c) * 1000 * 10) / 10, 0.5), ...(r.cmin ? { conc_min_M: r.cmin } : {}), ...(r.cmax ? { conc_max_M: r.cmax } : {}) },
  ];
  const grade = r.cmin ? 'konsentrlangan' : (r.c < 1 ? 'juda suyultirilgan' : 'suyultirilgan');
  out.push(makeRecord({
    id: nid(), category: CAT,
    title: `${cap(mN)}ning ${grade} ${aN} bilan reaksiyasi`,
    level: r.conf === "o'rta" ? 'litsey' : '9-sinf', topic: 'Oksidlovchi kislotalarning metallar bilan reaksiyasi',
    engine: 'record', reactants,
    conditions: { heating: !!r.tmin, temp_min_C: r.tmin ?? null, note_uz: r.tmin ? 'Reaksiya qizdirilganda boradi.' : null },
    equation: { molecular, ionic_full: r.net ? ionic.full : null, ionic_net: r.net, electron_balance: r.eb },
    mechType: 'oksidlanish-qaytarilish',
    steps: [`Qaytaruvchi — ${mN} (${r.eb[0].split(' ')[0]}), oksidlovchi — ${r.acid === 'HNO3' ? 'nitrat ioni (N⁺⁵)' : 'sulfat kislotadagi S⁺⁶'}.`, `${r.eb[0]}; ${r.eb[1]}.`, 'Berilgan va qabul qilingan elektronlar soni tenglashtiriladi, so\'ng kislota qoldiqlari va suv hisobga olinadi.'],
    obs: { gas: r.gas ? { species: r.gas, color: db.substances[r.gas].gas?.color || null } : null, solution_color_change: r.col ? { from: r.col[0], to: r.col[1] } : null, heat: r.heat, effects: [{ type: 'bubbles' }, { type: 'dissolve' }, ...(r.gas === 'NO2' || r.gas === 'NO' ? [{ type: 'color-gas' }] : [])], text_uz: r.obs },
    kinetics: r.kin, apparatus: ['probirka', 'pinset', ...(r.tmin ? ['probirka-qisqichi', 'spirt-lampasi'] : [])],
    procedure: [`Probirkaga ${mN} ${FORM[r.m] === 'sim' ? 'simidan bo\'lak' : FORM[r.m] === 'granula' ? 'granulasi' : FORM[r.m]} soling (mo'rili shkafda ishlang).`, `Ehtiyotkorlik bilan ${fmt(reactants[1].volume_mL)} ml ${grade} ${aN} quying.`, ...(r.tmin ? ['Probirkani qisqichga olib, spirt lampasida asta qizdiring.'] : []), 'Gaz rangi va eritma rangini kuzating.'],
    safety: `${safetyFor([r.acid, r.m])} ${r.gas ? `Ajraladigan ${db.displayOf(r.gas)} zaharli — tajribani faqat mo'rili shkafda o'tkazing.` : ''}`.trim(),
    explanation: r.expl,
    questions: ['Elektron balans usulida koeffitsiyentlarni tushuntiring.', `Nima uchun bu reaksiyada vodorod ajralmaydi?`, r.acid === 'HNO3' ? 'Nitrat kislotaning qaytarilish mahsuloti nimalarga bog\'liq?' : 'Suyultirilgan va konsentrlangan sulfat kislotaning metallar bilan reaksiyalari qanday farq qiladi?'],
    confidence: r.conf,
  }));
}

// 4) passivlanish (sovuqda reaksiya ketmaydi)
const PASS = [
  ['Fe', 'HNO3', 14.4, 10, ['Fe', 'H⁺', 'NO3⁻']], ['Al', 'HNO3', 14.4, 10, ['Al', 'H⁺', 'NO3⁻']], ['Fe', 'H2SO4', 18, 12, ['Fe', 'H2SO4']], ['Cr', 'HNO3', 14.4, 10, ['Cr', 'H⁺', 'NO3⁻']],
];
for (const [m, acid, c, cmin, match] of PASS) {
  const mN = shortName(m), aN = shortName(acid);
  out.push(makeRecord({
    id: nid(), category: CAT,
    title: `${cap(mN)}ning sovuq konsentrlangan ${aN}da passivlanishi`,
    level: '9-sinf', topic: 'Metallarning passivlanishi', engine: 'record', no_reaction: true, match,
    reactants: [{ species: m, state: 's', mass_g: 0.5, form: FORM[m] }, { species: acid, state: 'aq', conc_M: c, volume_mL: 2, conc_min_M: cmin }],
    conditions: { temp_max_C: 40, note_uz: 'Sovuqda (xona haroratida).' }, equation: {},
    mechType: 'oksidlanish-qaytarilish',
    steps: [`Kislota ${mN} sirtini juda yupqa, zich oksid parda bilan qoplaydi.`, 'Parda kislotaning metallga kirishiga yo\'l qo\'ymaydi — metall passiv holatga o\'tadi.'],
    obs: { heat: 'sezilarsiz', effects: [], text_uz: "Hech qanday o'zgarish kuzatilmaydi." },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'pinset'],
    procedure: [`Probirkaga ${mN} bo'lagini soling.`, `Ustiga mo'rili shkafda 2 ml konsentrlangan ${aN} quying.`, 'Kuzating, so\'ng metallni chiqarib, suv bilan yuving.'],
    safety: safetyFor([acid]) + " Konsentrlangan kislotalar bilan faqat mo'rili shkafda ishlang.",
    explanation: `Sovuq konsentrlangan ${aN} ${mN}ni passivlaydi: sirtda hosil bo'lgan zich oksid parda metallni himoya qiladi, shuning uchun reaksiya bormaydi. Shu sababli konsentrlangan ${aN} ${m === 'Al' ? 'alyuminiy' : "temir (po'lat)"} idishlarda tashiladi. Qizdirilganda parda buziladi va reaksiya boshlanadi.`,
    questions: ['Passivlanish nima?', `Nima uchun konsentrlangan ${aN}ni ${m === 'Al' ? 'alyuminiy' : "po'lat"} sisternalarda tashish mumkin?`],
    confidence: m === 'Cr' ? "o'rta" : 'yuqori',
  }));
}
writeCategory(CAT, out);
