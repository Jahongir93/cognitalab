// 3-toifa: Ion almashinish — gaz ajralishi (50). Generator: node tools/seed/reactions/gaz.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt } from './lib.mjs';

const CAT = 'ion-almashinish-gaz';
const PFX = 'gaz';

// [tuz, kislota/ishqor, gaz, mahsulotlar (tuz), qizdirish?]
const LIST = [
  // karbonatlar va gidrokarbonatlar
  ['Na2CO3', 'HCl'], ['Na2CO3', 'HNO3'], ['Na2CO3', 'H2SO4'], ['Na2CO3', 'CH3COOH'], ['Na2CO3', 'H3PO4', { ratio: 'NaH2PO4' }],
  ['K2CO3', 'HCl'], ['K2CO3', 'H2SO4'], ['K2CO3', 'HNO3'],
  ['NaHCO3', 'HCl'], ['NaHCO3', 'H2SO4'], ['NaHCO3', 'CH3COOH'], ['NaHCO3', 'C3H5O(COOH)3'], ['NaHCO3', 'H3PO4', { ratio: 'NaH2PO4' }], ['NaHCO3', 'HCOOH'],
  ['KHCO3', 'HCl'], ['KHCO3', 'H2SO4'],
  ['CaCO3', 'HCl'], ['CaCO3', 'HNO3'], ['CaCO3', 'CH3COOH'], ['CaCO3', 'HCOOH'],
  ['MgCO3', 'HCl'], ['MgCO3', 'HNO3'], ['BaCO3', 'HCl'], ['BaCO3', 'HNO3'], ['ZnCO3', 'HCl'], ['PbCO3', 'HNO3'], ['(CuOH)2CO3', 'HCl'], ['Li2CO3', 'HCl'],
  // sulfitlar
  ['Na2SO3', 'HCl'], ['Na2SO3', 'H2SO4'], ['K2SO3', 'HCl'], ['NaHSO3', 'HCl'], ['NaHSO3', 'H2SO4'], ['BaSO3', 'HCl'], ['CaSO3', 'HCl'],
  // sulfidlar
  ['Na2S', 'HCl'], ['Na2S', 'H2SO4'], ['K2S', 'HCl'], ['Na2S', 'CH3COOH'], ['FeS', 'HCl'], ['FeS', 'H2SO4'], ['ZnS', 'HCl'], ['MnS', 'HCl'],
  // ammoniy tuzlari + ishqor (qizdirish)
  ['NH4Cl', 'NaOH'], ['NH4Cl', 'KOH'], ['(NH4)2SO4', 'NaOH'], ['NH4NO3', 'NaOH'], ['(NH4)2SO4', 'KOH'], ['CH3COONH4', 'NaOH'], ['NH4Br', 'KOH'],
];

const GAS_OF = (salt) => {
  const s = sub(salt);
  const ions = Object.keys(s.dissociation || s.ions || {});
  if (ions.includes('CO3^2-') || ions.includes('HCO3^-') || salt === '(CuOH)2CO3') return 'CO2';
  if (ions.includes('SO3^2-') || ions.includes('HSO3^-')) return 'SO2';
  if (ions.includes('S^2-')) return 'H2S';
  if (ions.includes('NH4^+')) return 'NH3';
  return null;
};
const ACID_ANION = { HCl: 'Cl^-', HNO3: 'NO3^-', H2SO4: 'SO4^2-', CH3COOH: 'CH3COO^-', HCOOH: 'HCOO^-', H3PO4: 'H2PO4^-', 'C3H5O(COOH)3': 'C3H5O(COO)3^3-' };
const GAS_TXT = {
  CO2: { obs: 'Rangsiz, hidsiz gaz pufakchalari jadal ajraladi (eritma "qaynayotgandek" ko\'piradi).', test: 'Ajralgan gazni ohakli suv orqali o\'tkazing — u loyqalanadi; yonib turgan cho\'p gazda o\'chadi.', weak: 'karbonat kislota', unstable: 'H₂CO₃ beqaror bo\'lib, darhol CO₂ va H₂O ga parchalanadi' },
  SO2: { obs: 'Yongan oltingugurtning o\'tkir hidli rangsiz gazi ajraladi.', test: 'Gazni kaliy permanganatning suyultirilgan eritmasi orqali o\'tkazing — u rangsizlanadi.', weak: 'sulfit kislota', unstable: 'H₂SO₃ beqaror bo\'lib, SO₂ va H₂O ga parchalanadi' },
  H2S: { obs: 'Palag\'da tuxum hidli rangsiz gaz ajraladi.', test: 'Probirka og\'ziga qo\'rg\'oshin(II) atsetat eritmasi shimdirilgan qog\'ozni tuting — u qorayadi (PbS).', weak: 'vodorod sulfid kislota', unstable: 'H₂S kuchsiz kislota bo\'lib, eritmadan gaz holida chiqadi' },
  NH3: { obs: 'Qizdirilganda o\'tkir (novshadil spirti) hidli gaz ajraladi.', test: 'Probirka og\'ziga ho\'llangan qizil lakmus qog\'ozini tuting — u ko\'karadi; konsentrlangan HCl ho\'llangan tayoqcha yaqinlashtirilsa oq "tutun" (NH₄Cl) hosil bo\'ladi.', weak: 'ammiakli suv', unstable: 'NH₃·H₂O beqaror bo\'lib, qizdirilganda NH₃ va H₂O ga parchalanadi' },
};

const out = [];
for (const [salt, reag, opt = {}] of LIST) {
  const gas = GAS_OF(salt);
  const s = sub(salt);
  const solidSalt = s.solubility === 'N' || s.solubility === 'M';
  const isAmmonium = gas === 'NH3';
  const left = [term(salt, solidSalt ? 's' : 'aq'), term(reag, 'aq')];
  const right = [];
  // tuz mahsuloti
  const catIon = Object.keys(s.dissociation || s.ions || {}).find((k) => db.ions[k]?.charge > 0);
  let prodSalt;
  if (isAmmonium) {
    const an = Object.keys(s.dissociation).find((k) => db.ions[k].charge < 0);
    const base = Object.keys(sub(reag).dissociation).find((k) => db.ions[k].charge > 0);
    prodSalt = db.saltOf(base, an);
  } else if (opt.ratio) prodSalt = opt.ratio;
  else if (salt === '(CuOH)2CO3') prodSalt = 'CuCl2';
  else prodSalt = db.saltOf(catIon, ACID_ANION[reag]) || (reag === 'C3H5O(COOH)3' ? 'C3H5O(COONa)3' : null);
  if (!prodSalt) { console.log('  tuz topilmadi', salt, reag); continue; }
  const prodSub = sub(prodSalt);
  const prodPpt = prodSub.solubility === 'N';
  right.push(term(prodSalt, prodPpt ? 's' : 'aq', 1, prodPpt ? { mark: '↓' } : {}));
  right.push(term(gas, 'g', 1, { mark: '↑' }));
  if (gas !== 'H2S') right.push(term('H2O', 'l'));
  try { balanced(left, right); } catch (e) { console.log('  balans:', salt, reag, e.message); continue; }
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const n0 = 0.0005;
  const reactants = left.map((t) => {
    const ss = sub(t.id);
    const n = n0 * t.k;
    if (t.ph === 's') return { species: t.id, state: 's', mass_g: Math.round(n * ss.M * 1000) / 1000, form: 'kukun' };
    const c = ['NaOH', 'KOH'].includes(t.id) ? 2 : (['HCl', 'HNO3', 'H2SO4', 'CH3COOH', 'HCOOH', 'H3PO4'].includes(t.id) ? 2 : (t.id === 'C3H5O(COOH)3' ? 0.5 : 1));
    const cc = (ss.solutions && !ss.solutions.some((x) => x.conc_M >= c)) ? ss.solutions[ss.solutions.length - 1].conc_M : c;
    return { species: t.id, state: 'aq', conc_M: cc, volume_mL: Math.round((n / cc) * 1000 * 100) / 100 };
  });
  const G = GAS_TXT[gas];
  const saltN = shortName(salt), reagN = shortName(reag), prodN = shortName(prodSalt);
  const weakAcidReag = ['CH3COOH', 'HCOOH', 'C3H5O(COOH)3', 'H3PO4'].includes(reag);
  let title, procedure, explanation, steps;
  if (isAmmonium) {
    title = `${cap(saltN)}ning ${reagN} bilan qizdirilganda ammiak ajralishi`;
    procedure = [`Probirkaga ${fmt(reactants[0].volume_mL)} ml ${saltN} eritmasidan quying.`, `Ustiga ${fmt(reactants[1].volume_mL)} ml ${reagN} eritmasini qo'shing.`, 'Probirkani qisqichga olib, spirt lampasida ehtiyotkorlik bilan qizdiring.', G.test];
    explanation = `Ammoniy ioni kuchsiz asos (NH₃) ning kislotasi: kuchli ishqorning OH⁻ ionlari NH₄⁺ dan protonni tortib oladi va NH₃·H₂O hosil bo'ladi. ${G.unstable}. Bu reaksiya ammoniy tuzlarini aniqlashda (NH₄⁺ ioniga sifat reaksiyasi) qo'llaniladi.`;
    steps = ['NH₄⁺ ioni protonni OH⁻ ioniga beradi: NH₄⁺ + OH⁻ → NH₃·H₂O.', 'Qizdirilganda ammiakning suvda eruvchanligi kamayadi va u gaz holida ajraladi.'];
  } else {
    title = `${cap(saltN)}ning ${reagN} bilan reaksiyasi (${db.displayOf(gas)} ajralishi)`;
    procedure = [
      solidSalt ? `Probirkaga ozroq (${fmt(reactants[0].mass_g)} g) ${saltN} kukunidan soling.` : `Probirkaga ${fmt(reactants[0].volume_mL)} ml ${saltN} eritmasidan quying.`,
      `Ustiga ${fmt(reactants[1].volume_mL)} ml ${reagN} ${reag === 'C3H5O(COOH)3' ? 'eritmasini' : 'eritmasidan'} qo'shing.`,
      'Gaz ajralishini kuzating.', G.test,
    ];
    explanation = `${weakAcidReag ? `${cap(reagN)} kuchsiz bo'lsa-da, ${G.weak}dan kuchliroq, shuning uchun uni tuzidan siqib chiqaradi.` : `Kuchli kislota kuchsiz ${G.weak}ni uning tuzidan siqib chiqaradi.`} ${G.unstable}, shuning uchun gaz ajralib chiqadi va reaksiya oxirigacha boradi.${solidSalt ? ` Erimaydigan ${saltN} ham kislotada eriydi.` : ''}${prodPpt ? ` Bundan tashqari, ${prodN} cho'kmaga tushadi.` : ''}`;
    steps = [`Kislotaning H⁺ ionlari ${gas === 'CO2' ? 'karbonat (gidrokarbonat)' : gas === 'SO2' ? 'sulfit' : 'sulfid'} ionlarini protonlaydi.`, `Kuchsiz va beqaror ${G.weak} hosil bo'ladi.`, `${G.unstable}.`];
  }
  const level = isAmmonium ? '9-sinf' : (weakAcidReag || solidSalt ? '9-sinf' : '8-sinf');
  const gasSub = sub(gas);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title, level,
    topic: isAmmonium ? 'Ammoniy tuzlari; ammiak olish' : 'Ion almashinish reaksiyalari: gaz ajralishi',
    engine: 'rules', reactants,
    conditions: isAmmonium ? { heating: true, temp_min_C: 60, note_uz: 'Ammiak qizdirilganda jadal ajraladi.' } : {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: null },
    mechType: 'ion-almashinish', steps,
    obs: { precipitate: prodPpt ? { species: prodSalt, color: prodSub.precipitate.color, texture: prodSub.precipitate.texture } : null, gas: { species: gas, color: gasSub.gas?.color || null, smell_uz: gasSub.gas?.smell_uz || null }, solution_color_change: null, heat: 'sezilarsiz', flame: null, effects: [{ type: 'bubbles' }, ...(gas === 'CO2' && !weakAcidReag ? [{ type: 'foam' }] : []), ...(solidSalt ? [{ type: 'dissolve' }] : [])], text_uz: G.obs },
    kinetics: solidSalt || weakAcidReag ? 'tez' : 'bir-zumda',
    apparatus: isAmmonium ? ['probirka', 'probirka-qisqichi', 'spirt-lampasi', 'indikator-qogozi'] : ['probirka', 'tomizgich', 'gaz-naycha-egilgan'],
    procedure,
    safety: safetyFor([salt, reag, gas], gas === 'H2S' || gas === 'SO2' ? "Gaz zaharli — tajribani mo'rili shkafda, oz miqdorda o'tkazing; hidini qo'l harakati bilan o'zingizga yo'naltirib sezing." : gas === 'NH3' ? "Ammiakni bevosita hidlamang, probirka og'zini o'zingizga qaratmang." : ''),
    explanation,
    questions: [
      'Reaksiyaning qisqartirilgan ionli tenglamasini yozing va nima uchun reaksiya oxirigacha borishini tushuntiring.',
      `Ajralgan ${db.displayOf(gas)} gazini qanday aniqlash mumkin?`,
      gas === 'NH3' ? 'Ammoniy tuzlarini boshqa tuzlardan qanday farqlash mumkin?' : 'Qaysi kislotalar bu tuzdan gazni siqib chiqara oladi, qaysilari chiqara olmaydi?',
    ],
    confidence: ['MnS', '(CuOH)2CO3', 'CaSO3', 'BaSO3', 'PbCO3'].includes(salt) || reag === 'H3PO4' ? "o'rta" : 'yuqori',
  }));
}
writeCategory(CAT, out);
