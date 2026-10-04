// 23-toifa: Titrlash (20). Generator: node tools/seed/reactions/titrlash.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt } from './lib.mjs';

const CAT = 'titrlash';
const PFX = 'titr';
const out = [];
const PHPH = 'C20H14O4', MO = 'C14H14N3NaO3S';
const IND_NAME = { [PHPH]: 'fenolftalein', [MO]: 'metiloranj', K2CrO4: 'kaliy xromat', 'C20H12N3NaO7S': 'erioxrom qora T', '(C6H10O5)n': 'kraxmal', 'Fe(NO3)3': 'temir(III) nitrat (temir-ammoniyli achchiqtosh o\'rnida)' };
const IND_REAGENT = (id) => (id === PHPH || id === MO ? { species: id, state: 'aq', conc_M: 0.003, volume_mL: 0.1, role: 'indikator' } : id === 'C20H12N3NaO7S' ? { species: id, state: 'aq', conc_M: 0.002, volume_mL: 0.1, role: 'indikator' } : id === '(C6H10O5)n' ? { species: id, state: 'aq', conc_M: 0.06, volume_mL: 1, role: 'indikator' } : { species: id, state: 'aq', conc_M: 0.1, volume_mL: 0.5, role: 'indikator' });

// kislota-asos titrlashlari
// [aniqlanuvchi, titrant, mahsulot(lar), indikator, pH oralig'i, oxirgi nuqta rangi (from,to), izoh, mol nisbat qo'shimcha]
const AB = [
  ['HCl', 'NaOH', ['NaCl', 'H2O'], PHPH, [6.4, 7.6], ['#ffffff', '#f7b6d8'], "Kuchli kislotani kuchli asos bilan titrlashda ekvivalent nuqtada pH = 7; fenolftalein bitta ortiqcha tomchida rangsizdan pushti rangga o'tadi."],
  ['NaOH', 'HCl', ['NaCl', 'H2O'], MO, [6.4, 7.6], ['#f2c21b', '#f08a1c'], "Ishqorni kislota bilan titrlashda metiloranj sariq rangdan to'q sariq rangga o'tgan payt oxirgi nuqta hisoblanadi; titrlash sakrashi keng bo'lgani uchun xato juda kichik."],
  ['CH3COOH', 'NaOH', ['CH3COONa', 'H2O'], PHPH, [8.2, 9.3], ['#ffffff', '#f7b6d8'], "Kuchsiz kislota titrlanganda ekvivalent nuqtada hosil bo'lgan CH₃COONa gidrolizlanib muhitni ishqoriy qiladi (pH ≈ 8,7) — shuning uchun indikator sifatida fenolftalein tanlanadi, metiloranj yaroqsiz."],
  ['NH3·H2O', 'HCl', ['NH4Cl', 'H2O'], MO, [4.8, 5.8], ['#f2c21b', '#f08a1c'], "Kuchsiz asos titrlanganda ekvivalent nuqtada NH₄Cl gidrolizi tufayli muhit kuchsiz kislotali (pH ≈ 5,3) — metiloranj mos keladi."],
  ['Na2CO3', 'HCl', ['NaCl', 'CO2', 'H2O'], MO, [3.4, 5.6], ['#f2c21b', '#f08a1c'], "Natriy karbonat ikki bosqichda titrlanadi; metiloranj bilan ikkala bosqich birga (CO₂ gacha) aniqlanadi. Oxiriga yaqin eritmani qaynatib CO₂ chiqarib yuborish aniqlikni oshiradi."],
  ['Na2CO3', 'HCl', ['NaHCO3', 'NaCl'], PHPH, [7.9, 8.8], ['#f7b6d8', '#ffffff'], "Fenolftalein bilan titrlashda faqat birinchi bosqich — NaHCO₃ hosil bo'lguncha (pH ≈ 8,3) aniqlanadi."],
  ['H2SO4', 'NaOH', ['Na2SO4', 'H2O'], PHPH, [6.4, 7.6], ['#ffffff', '#f7b6d8'], "Sulfat kislota ikki negizli: 1 mol H₂SO₄ ga 2 mol NaOH sarflanadi."],
  ['H3PO4', 'NaOH', ['NaH2PO4', 'H2O'], MO, [4.0, 5.2], ['#e0312b', '#f2c21b'], "Fosfat kislota metiloranj bilan birinchi bosqichgacha (NaH₂PO₄, pH ≈ 4,7) titrlanadi."],
  ['H2C2O4', 'NaOH', ['Na2C2O4', 'H2O'], PHPH, [7.6, 9.2], ['#ffffff', '#f7b6d8'], "Oksalat kislota (H₂C₂O₄·2H₂O) natriy gidroksid eritmasining aniq konsentratsiyasini aniqlash (standartlash) uchun boshlang'ich modda sifatida ishlatiladi."],
  ['HNO3', 'KOH', ['KNO3', 'H2O'], PHPH, [6.4, 7.6], ['#ffffff', '#f7b6d8'], "Nitrat kislota kuchli kislota: kaliy gidroksid bilan titrlashda ekvivalent nuqtada muhit neytral."],
  ['NaHCO3', 'HCl', ['NaCl', 'CO2', 'H2O'], MO, [3.4, 5.6], ['#f2c21b', '#f08a1c'], "Ichimlik sodasi (NaHCO₃) tarkibini metiloranj bilan titrlab aniqlash mumkin."],
];
for (const [an, ti, prods, ind, range, col, expl] of AB) {
  const left = [term(an, 'aq'), term(ti, 'aq')];
  const right = prods.map((p) => (p === 'CO2' ? term(p, 'g', 1, { mark: '↑' }) : term(p, p === 'H2O' ? 'l' : 'aq')));
  balanced(left, right);
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const cA = 0.1, vA = 10;
  const nA = (cA * vA) / 1000;
  const cT = 0.1;
  const vT = Math.round(((nA * left[1].k) / left[0].k / cT) * 1000 * 100) / 100;
  const aN = shortName(an), tN = shortName(ti);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(aN)}ni ${tN} bilan titrlash (indikator — ${IND_NAME[ind]})`, level: 'litsey', topic: 'Kislota-asos titrlash (neytrallash usuli)', engine: 'rules',
    extra: { expected_pH: { min: range[0], max: range[1] }, titration: { method: 'kislota-asos', analyte: { species: an, conc_M: cA, volume_mL: vA }, titrant: { species: ti, conc_M: cT }, equivalence_mL: vT, indicator: ind } },
    reactants: [{ species: an, state: 'aq', conc_M: cA, volume_mL: vA }, { species: ti, state: 'aq', conc_M: cT, volume_mL: vT }, IND_REAGENT(ind)],
    conditions: {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: null },
    mechType: 'neytrallanish',
    steps: ['Byuretkadan titrant tomchilab qo\'shiladi; har bir tomchi kislota (yoki asos)ning bir qismini neytrallaydi.', 'Ekvivalent nuqta yaqinida pH keskin o\'zgaradi (titrlash sakrashi).', `Indikator rangining o'zgarishi oxirgi nuqtani ko'rsatadi; c(aniqlanuvchi) = c(titrant)·V(titrant)·k / V(aniqlanuvchi).`],
    obs: { solution_color_change: { from: col[0], to: col[1] }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }, ...(prods.includes('CO2') ? [{ type: 'bubbles' }] : [])], text_uz: `Oxirgi nuqtada ${IND_NAME[ind]} rangi o'zgaradi; sarflangan titrant hajmi ≈ ${fmt(vT)} ml.` },
    kinetics: 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi', 'oddiy-voronka'],
    procedure: [`Mor pipetkasi bilan ${fmt(vA)} ml ${aN} eritmasini konussimon kolbaga o'lchab oling.`, `2–3 tomchi ${IND_NAME[ind]} qo'shing.`, `Byuretkani ${tN} eritmasi (${fmt(cT)} M) bilan to'ldirib, nol belgisiga keltiring.`, 'Kolbani doimiy chayqatib, titrantni tomchilab qo\'shing; indikator rangi 30 soniya saqlanib qolganda titrlashni to\'xtating.', 'Sarflangan hajmni yozing va konsentratsiyani hisoblang; titrlashni 3 marta takrorlang.'],
    safety: `${safetyFor([an, ti])} Pipetkani og'iz bilan emas, nok (rezina ballon) bilan to'ldiring.`,
    explanation: expl,
    questions: ['Ekvivalent nuqta va titrlash oxirgi nuqtasi nima?', 'Bu titrlash uchun indikator qanday tanlanadi?', `Agar ${fmt(vT)} ml o'rniga ${fmt(vT * 1.1)} ml titrant sarflansa, ${aN} konsentratsiyasi qanday chiqadi?`],
    confidence: 'yuqori',
  }));
}

// oksidlanish-qaytarilish titrlashlari (aniq yozuvlar)
const RED = [
  {
    title: "Temir(II) ni kaliy permanganat bilan titrlash (permanganatometriya)", an: '(NH4)2Fe(SO4)2·6H2O', anN: 'Mor tuzi', ti: 'KMnO4', aux: [{ species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 10 }],
    mol: '10(NH4)2Fe(SO4)2·6H2O + 2KMnO4 + 8H2SO4 = 5Fe2(SO4)3 + 2MnSO4 + K2SO4 + 10(NH4)2SO4 + 68H2O', net: 'MnO4⁻ + 5Fe²⁺ + 8H⁺ = Mn²⁺ + 5Fe³⁺ + 4H2O',
    eb: ['Mn⁺⁷ + 5e⁻ = Mn⁺²', 'Fe⁺² − 1e⁻ = Fe⁺³'], kRatio: 1 / 5, cA: 0.05, cT: 0.01, ind: null, col: ['#ffffff', '#f7c8e8'],
    expl: "Permanganat o'zi indikator vazifasini bajaradi: ekvivalent nuqtagacha qo'shilgan MnO₄⁻ darhol rangsizlanadi, bitta ortiqcha tomchi eritmani och pushti rangga bo'yaydi. Titrlash sulfat kislotali muhitda olib boriladi.", tmin: null, conf: 'yuqori',
  },
  {
    title: "Oksalat kislotani kaliy permanganat bilan titrlash (qizdirib)", an: 'H2C2O4', anN: 'oksalat kislota', ti: 'KMnO4', aux: [{ species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 10 }],
    mol: '5H2C2O4 + 2KMnO4 + 3H2SO4 = 10CO2↑ + 2MnSO4 + K2SO4 + 8H2O', net: '2MnO4⁻ + 5H2C2O4 + 6H⁺ = 2Mn²⁺ + 10CO2↑ + 8H2O',
    eb: ['Mn⁺⁷ + 5e⁻ = Mn⁺²', 'C⁺³ − 1e⁻ = C⁺⁴'], kRatio: 2 / 5, cA: 0.05, cT: 0.02, ind: null, col: ['#ffffff', '#f7c8e8'],
    expl: "Reaksiya sovuqda sekin boradi, shuning uchun eritma 70–80 °C gacha isitiladi. Hosil bo'lgan Mn²⁺ ionlari reaksiyani tezlashtiradi (avtokataliz) — dastlabki tomchilar sekin, keyingilari tez rangsizlanadi. Bu usul KMnO₄ eritmasini standartlash uchun qo'llaniladi.", tmin: 60, conf: 'yuqori',
  },
  {
    title: 'Vodorod peroksidni kaliy permanganat bilan titrlash', an: 'H2O2', anN: 'vodorod peroksid', ti: 'KMnO4', aux: [{ species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 10 }],
    mol: '5H2O2 + 2KMnO4 + 3H2SO4 = 5O2↑ + 2MnSO4 + K2SO4 + 8H2O', net: '2MnO4⁻ + 5H2O2 + 6H⁺ = 2Mn²⁺ + 5O2↑ + 8H2O',
    eb: ['Mn⁺⁷ + 5e⁻ = Mn⁺²', '2O⁻¹ − 2e⁻ = O2⁰'], kRatio: 2 / 5, cA: 0.05, cT: 0.02, ind: null, col: ['#ffffff', '#f7c8e8'],
    expl: "Vodorod peroksid bu reaksiyada qaytaruvchi: undagi O⁻¹ kislorod molekulasigacha oksidlanadi. Oxirgi nuqtani permanganatning o'z rangi ko'rsatadi.", tmin: null, conf: 'yuqori',
  },
  {
    title: 'Yodni natriy tiosulfat bilan titrlash (yodometriya, indikator — kraxmal)', an: 'Lugol', anN: 'yod eritmasi (Lugol)', ti: 'Na2S2O3', aux: [], useMixture: true,
    mol: 'I2 + 2Na2S2O3 = 2NaI + Na2S4O6', net: 'I2 + 2S2O3²⁻ = 2I⁻ + S4O6²⁻',
    eb: ['I2⁰ + 2e⁻ = 2I⁻¹', '2S⁺² − 2e⁻ = 2S⁺²·⁵'], kRatio: 2, cA: 0.05, cT: 0.1, ind: '(C6H10O5)n', col: ['#1a1a6a', '#ffffff'],
    expl: "Tiosulfat yodni yodid ionlarigacha qaytaradi, o'zi tetrationat ioniga oksidlanadi. Kraxmal titrlash oxiriga yaqin (eritma och sariq bo'lganda) qo'shiladi; to'q ko'k rangning yo'qolishi oxirgi nuqtani ko'rsatadi.", tmin: null, conf: 'yuqori', ebFix: true,
  },
];
for (const r of RED) {
  const nA = (r.cA * 10) / 1000;
  const vT = Math.round(((nA * r.kRatio) / r.cT) * 1000 * 100) / 100;
  const ionic = { full: null };
  const reactants = [r.useMixture ? { species: r.an, state: 'aq', volume_mL: 10 } : { species: r.an, state: 'aq', conc_M: r.cA, volume_mL: 10 }, { species: r.ti, state: 'aq', conc_M: r.cT, volume_mL: vT }, ...r.aux, ...(r.ind ? [IND_REAGENT(r.ind)] : [])];
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: r.title, level: 'litsey', topic: 'Oksidlanish-qaytarilish titrlash', engine: 'record',
    extra: { titration: { method: 'oksidimetriya', analyte: { species: r.an, conc_M: r.useMixture ? 0.05 : r.cA, volume_mL: 10 }, titrant: { species: r.ti, conc_M: r.cT }, equivalence_mL: vT, indicator: r.ind } },
    reactants, conditions: { heating: !!r.tmin, temp_min_C: r.tmin, medium: 'kislotali', note_uz: r.tmin ? 'Eritma 70–80 °C gacha isitiladi.' : null },
    equation: { molecular: r.mol, ionic_full: ionic.full, ionic_net: r.net, electron_balance: r.ebFix ? ['I2 + 2e⁻ = 2I⁻', '2S2O3²⁻ − 2e⁻ = S4O6²⁻'] : r.eb },
    mechType: 'oksidlanish-qaytarilish',
    steps: [`Oksidlovchi va qaytaruvchi: ${r.eb[0]}; ${r.ebFix ? '2S₂O₃²⁻ − 2e⁻ = S₄O₆²⁻' : r.eb[1]}.`, 'Ekvivalent nuqtada oksidlovchi va qaytaruvchining ekvivalentlar soni teng bo\'ladi.', r.ind ? "Indikator yod bilan rangli kompleks hosil qiladi; yod tugashi bilan rang yo'qoladi." : "Titrantning ortiqcha tomchisi eritmani bo'yaydi — titrant o'zi indikator."],
    obs: { gas: r.mol.includes('CO2↑') ? { species: 'CO2', color: null } : r.mol.includes('O2↑') ? { species: 'O2', color: null } : null, solution_color_change: { from: r.col[0], to: r.col[1] }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: `Oxirgi nuqtada eritma rangi o'zgaradi; titrant hajmi ≈ ${fmt(vT)} ml.` },
    kinetics: r.tmin ? "o'rtacha" : 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi', ...(r.tmin ? ['elektr-plitka', 'termometr'] : [])],
    procedure: [`Konussimon kolbaga pipetka bilan 10 ml ${r.anN} eritmasini o'lchab oling.`, ...(r.aux.length ? ['10 ml suyultirilgan sulfat kislota qo\'shing.'] : []), ...(r.tmin ? ['Eritmani 70–80 °C gacha isiting.'] : []), `Byuretkadan ${shortName(r.ti)} eritmasini (${fmt(r.cT)} M) tomchilab qo'shing.`, r.ind ? 'Eritma och sariq rangga kirganda 1 ml kraxmal eritmasi qo\'shing va ko\'k rang yo\'qolguncha titrlang.' : "Och pushti rang 30 soniya yo'qolmay qolganda titrlashni to'xtating.", 'Hajmni yozib, konsentratsiyani hisoblang.'],
    safety: `${safetyFor([r.ti, 'H2SO4'])}`,
    explanation: r.expl,
    questions: ['Oksidlanish-qaytarilish titrlashda ekvivalentlar qonuni qanday qo\'llaniladi?', 'Nima uchun titrlash kislotali muhitda olib boriladi?'],
    confidence: r.conf,
  }));
}

// mis(II) ni yodometrik aniqlash (ikki bosqich: Cu2+ + I- -> CuI + I2; I2 + tiosulfat)
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: "Mis(II) ionlarini yodometrik aniqlash", level: 'universitet', topic: 'Yodometriya (o\'rinbosarli titrlash)', engine: 'rules',
  extra: { titration: { method: 'yodometriya', analyte: { species: 'CuSO4', conc_M: 0.05, volume_mL: 10 }, titrant: { species: 'Na2S2O3', conc_M: 0.05 }, equivalence_mL: 10, indicator: '(C6H10O5)n' } },
  reactants: [{ species: 'CuSO4', state: 'aq', conc_M: 0.05, volume_mL: 10 }, { species: 'KI', state: 'aq', conc_M: 0.5, volume_mL: 4, excess: true }, { species: 'Na2S2O3', state: 'aq', conc_M: 0.05, volume_mL: 10 }, IND_REAGENT('(C6H10O5)n')],
  conditions: { note_uz: 'KI ortiqcha olinadi.' },
  equation: { molecular: '2CuSO4 + 4KI + 2Na2S2O3 = 2CuI↓ + 2K2SO4 + Na2S4O6 + 2NaI', ionic_full: null, ionic_net: '2Cu²⁺ + 2I⁻ + 2S2O3²⁻ = 2CuI↓ + S4O6²⁻', electron_balance: ['Cu⁺² + 1e⁻ = Cu⁺¹', '2S2O3²⁻ − 2e⁻ = S4O6²⁻'] },
  mechType: 'oksidlanish-qaytarilish',
  steps: ["1-bosqich: 2Cu²⁺ + 4I⁻ → 2CuI↓ + I₂ (Cu²⁺ yodidni oksidlaydi).", "2-bosqich: ajralgan yod tiosulfat bilan titrlanadi: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻.", "Sarflangan tiosulfat miqdori mis(II) miqdoriga ekvivalent."],
  obs: { precipitate: { species: 'CuI', color: sub('CuI').precipitate.color, texture: sub('CuI').precipitate.texture }, solution_color_change: { from: '#1a1a6a', to: '#f2eee0' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }, { type: 'swirl' }], text_uz: "KI qo'shilganda oq cho'kma va qo'ng'ir yod hosil bo'ladi; titrlash oxirida kraxmalning ko'k rangi yo'qoladi, oq CuI cho'kmasi qoladi." },
  kinetics: 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi'],
  procedure: ['Kolbaga 10 ml mis(II) sulfat eritmasini o\'lchab oling.', 'Ortiqcha miqdorda (4 ml) kaliy yodid eritmasi qo\'shing — qo\'ng\'ir rang va oq cho\'kma paydo bo\'ladi.', 'Ajralgan yodni natriy tiosulfat bilan och sariq rangga qadar titrlang, so\'ng kraxmal qo\'shib, ko\'k rang yo\'qolguncha titrlashni davom ettiring.'],
  safety: safetyFor(['CuSO4', 'KI']),
  explanation: "Bu o'rinbosarli titrlash: mis(II) to'g'ridan-to'g'ri titrlanmaydi, balki unga ekvivalent miqdorda ajralgan yod titrlanadi. Mis(II) yodid beqaror bo'lgani uchun Cu²⁺ yodidni oksidlaydi va CuI cho'kmasi hosil bo'ladi.",
  questions: ['Nima uchun KI ortiqcha olinadi?', 'O\'rinbosarli titrlash nima?'],
  confidence: "o'rta",
}));

// kompleksonometriya
for (const [ion, salt, nm] of [['Ca^2+', 'CaCl2', 'kalsiy'], ['Mg^2+', 'MgSO4', 'magniy']]) {
  const cplx = ion === 'Ca^2+' ? '[CaC10H12N2O8]²⁻' : '[MgC10H12N2O8]²⁻';
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(nm)} ionlarini Trilon B bilan titrlash (suvning qattiqligi)`, level: 'universitet', topic: 'Kompleksonometrik titrlash', engine: 'record',
    extra: { titration: { method: 'kompleksonometriya', analyte: { species: salt, conc_M: 0.01, volume_mL: 10 }, titrant: { species: 'C10H14N2Na2O8·2H2O', conc_M: 0.01 }, equivalence_mL: 10, indicator: 'C20H12N3NaO7S' } },
    reactants: [{ species: salt, state: 'aq', conc_M: 0.01, volume_mL: 10 }, { species: 'C10H14N2Na2O8·2H2O', state: 'aq', conc_M: 0.01, volume_mL: 10 }, { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 2, role: 'bufer' }, { species: 'NH4Cl', state: 'aq', conc_M: 1, volume_mL: 2, role: 'bufer' }, IND_REAGENT('C20H12N3NaO7S')],
    conditions: { note_uz: 'Ammiakli bufer (pH ≈ 10) muhitida.' },
    equation: { molecular: salt === 'CaCl2' ? 'CaCl2 + C10H14N2Na2O8·2H2O + 2NH3·H2O = Na2[CaC10H12N2O8] + 2NH4Cl + 4H2O' : 'MgSO4 + C10H14N2Na2O8·2H2O + 2NH3·H2O = Na2[MgC10H12N2O8] + (NH4)2SO4 + 4H2O', ionic_full: null, ionic_net: `${db.ions[ion].display} + C10H14N2O8²⁻ + 2NH3 = ${cplx} + 2NH4⁺`, electron_balance: null },
    mechType: 'kompleks',
    steps: ['Trilon B anioni (H₂Y²⁻) metall ioni bilan 1:1 nisbatda barqaror ichki kompleks (xelat) hosil qiladi.', 'Ajralgan H⁺ ionlari buferdagi ammiak tomonidan bog\'lanadi (NH₄⁺ hosil bo\'ladi).', 'Oxirgi nuqtada indikator metall bilan bog\'langan qizil-binafsha shakldan erkin ko\'k shaklga o\'tadi.'],
    obs: { solution_color_change: { from: '#b3263a', to: '#3043b0' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Oxirgi nuqtada eritma vino-qizil rangdan ko'k rangga o'tadi." },
    kinetics: 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi', 'olchov-silindri'],
    procedure: [`Kolbaga 10 ml ${nm} tuzi eritmasi (yoki tekshiriladigan suv) o'lchab oling.`, '2 ml ammiakli bufer va ozgina erioxrom qora T qo\'shing — eritma vino-qizil tusga kiradi.', 'Trilon B eritmasi bilan rang ko\'k bo\'lguncha titrlang.', 'Sarflangan hajm bo\'yicha qattiqlikni hisoblang.'],
    safety: safetyFor(['NH3·H2O']),
    explanation: "Kompleksonometriyada EDTA (Trilon B) metall ionlari bilan barqaror 1:1 komplekslar hosil qiladi. Bu usulda suvning umumiy qattiqligi (Ca²⁺ va Mg²⁺ yig'indisi) aniqlanadi.",
    questions: ['Suvning qattiqligi nima va u qanday ifodalanadi?', 'Nima uchun titrlash ammiakli bufer muhitida olib boriladi?'],
    confidence: "o'rta",
  }));
}

// argentometriya
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: "Xlorid ionlarini kumush nitrat bilan titrlash (Mor usuli)", level: 'universitet', topic: 'Cho\'ktirish usulida titrlash (argentometriya)', engine: 'rules',
  extra: { titration: { method: 'argentometriya', analyte: { species: 'NaCl', conc_M: 0.05, volume_mL: 10 }, titrant: { species: 'AgNO3', conc_M: 0.05 }, equivalence_mL: 10, indicator: 'K2CrO4' } },
  reactants: [{ species: 'NaCl', state: 'aq', conc_M: 0.05, volume_mL: 10 }, { species: 'AgNO3', state: 'aq', conc_M: 0.05, volume_mL: 10 }, IND_REAGENT('K2CrO4')],
  conditions: { note_uz: 'Neytral yoki kuchsiz ishqoriy muhitda.' },
  equation: { molecular: 'NaCl + AgNO3 = AgCl↓ + NaNO3', ionic_full: 'Na⁺ + Cl⁻ + Ag⁺ + NO3⁻ = AgCl↓ + Na⁺ + NO3⁻', ionic_net: 'Ag⁺ + Cl⁻ = AgCl↓', electron_balance: null },
  mechType: 'ion-almashinish',
  steps: ['Avval kamroq eriydigan AgCl cho\'kadi.', 'Xlorid ionlari tugagach, ortiqcha Ag⁺ ionlari xromat bilan g\'isht-qizil Ag₂CrO₄ hosil qiladi — bu oxirgi nuqta.'],
  obs: { precipitate: { species: 'AgCl', color: sub('AgCl').precipitate.color, texture: sub('AgCl').precipitate.texture }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Titrlash davomida oq suzmasimon cho'kma tushadi; oxirgi nuqtada g'isht-qizil tus paydo bo'ladi." },
  kinetics: 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi'],
  procedure: ['Kolbaga 10 ml natriy xlorid eritmasini oling va 0,5 ml kaliy xromat qo\'shing (sariq rang).', 'Byuretkadan kumush nitrat eritmasini chayqatib turib qo\'shing.', "G'isht-qizil tus yo'qolmay qolganda titrlashni to'xtating."],
  safety: safetyFor(['AgNO3', 'K2CrO4']),
  explanation: "Mor usuli cho'kmalarning eruvchanligi farqiga asoslangan: AgCl Ag₂CrO₄ ga qaraganda kamroq eriydi va birinchi cho'kadi. Xlorid tugashi bilan g'isht-qizil kumush xromat hosil bo'lib, oxirgi nuqtani ko'rsatadi.",
  questions: ['Nima uchun avval AgCl cho\'kadi?', 'Mor usulida titrlashni kislotali muhitda olib borish mumkinmi?'],
  confidence: 'yuqori',
}));
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: "Kumush ionlarini tiotsianat bilan titrlash (Folgard usuli)", level: 'universitet', topic: 'Argentometriya', engine: 'rules',
  extra: { titration: { method: 'argentometriya', analyte: { species: 'AgNO3', conc_M: 0.05, volume_mL: 10 }, titrant: { species: 'KSCN', conc_M: 0.05 }, equivalence_mL: 10, indicator: 'Fe(NO3)3' } },
  reactants: [{ species: 'AgNO3', state: 'aq', conc_M: 0.05, volume_mL: 10 }, { species: 'KSCN', state: 'aq', conc_M: 0.05, volume_mL: 10 }, { species: 'HNO3', state: 'aq', conc_M: 2, volume_mL: 1, role: 'muhit' }, IND_REAGENT('Fe(NO3)3')],
  conditions: { medium: 'kislotali', note_uz: 'Nitrat kislotali muhitda.' },
  equation: { molecular: 'AgNO3 + KSCN = AgSCN↓ + KNO3', ionic_full: 'Ag⁺ + NO3⁻ + K⁺ + SCN⁻ = AgSCN↓ + K⁺ + NO3⁻', ionic_net: 'Ag⁺ + SCN⁻ = AgSCN↓', electron_balance: null },
  mechType: 'ion-almashinish',
  steps: ['Tiotsianat ionlari kumush bilan oq AgSCN cho\'kmasini hosil qiladi.', 'Kumush tugagach, ortiqcha SCN⁻ ionlari Fe³⁺ bilan qizil kompleks hosil qiladi — oxirgi nuqta.'],
  obs: { precipitate: { species: 'AgSCN', color: sub('AgSCN').precipitate.color, texture: sub('AgSCN').precipitate.texture }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oq cho'kma tushadi; oxirgi nuqtada eritma och qizil-qo'ng'ir tusga kiradi." },
  kinetics: 'bir-zumda', apparatus: ['byuretka', 'shtativ', 'qisqich-lapka', 'konussimon-kolba', 'mor-pipetkasi'],
  procedure: ['Kolbaga 10 ml kumush nitrat eritmasini oling, 1 ml nitrat kislota va indikator (Fe³⁺ tuzi) qo\'shing.', 'Kaliy tiotsianat eritmasi bilan titrlang.', 'Barqaror qizg\'ish tus paydo bo\'lganda to\'xtating.'],
  safety: safetyFor(['AgNO3', 'HNO3']),
  explanation: "Folgard usulida indikator — temir(III) ionlari: ekvivalent nuqtadan keyingi birinchi ortiqcha SCN⁻ ionlari qizil [Fe(SCN)]²⁺ kompleksini hosil qiladi. Usul kislotali muhitda ishlaydi.",
  questions: ['Folgard usuli Mor usulidan qanday farq qiladi?', 'Nima uchun titrlash nitrat kislotali muhitda olib boriladi?'],
  confidence: "o'rta",
}));
writeCategory(CAT, out);
