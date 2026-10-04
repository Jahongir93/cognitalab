// 5-toifa: Metall + tuz eritmasi (faollik qatori) (50). Generator: node tools/seed/reactions/metall_tuz.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt } from './lib.mjs';

const CAT = 'metall-tuz';
const PFX = 'mettuz';
const FORM = { Mg: 'lenta', Al: 'plastinka', Zn: 'plastinka', Fe: 'mix', Ni: 'plastinka', Sn: 'granula', Pb: 'plastinka', Cu: 'sim', Ag: 'sim', Mn: 'kukun' };
const FORM_UZ = { lenta: 'lentasi', plastinka: 'plastinkasi', mix: 'mixi', granula: 'granulasi', sim: 'simi', kukun: 'kukuni' };

// [metall, tuz, izoh]
const PAIRS = [
  ['Fe', 'CuSO4', 'klassik'], ['Fe', 'CuCl2'], ['Fe', 'Cu(NO3)2'], ['Fe', 'AgNO3'], ['Fe', 'Pb(NO3)2'], ['Fe', 'NiSO4'], ['Fe', 'SnCl2'], ['Fe', 'FeCl3', 'komproporsiya'], ['Fe', 'Fe2(SO4)3', 'komproporsiya'],
  ['Zn', 'CuSO4'], ['Zn', 'CuCl2'], ['Zn', 'Cu(NO3)2'], ['Zn', 'Pb(NO3)2', 'daraxt'], ['Zn', '(CH3COO)2Pb', 'daraxt'], ['Zn', 'AgNO3'], ['Zn', 'SnCl2', 'daraxt'], ['Zn', 'NiSO4'], ['Zn', 'FeSO4'], ['Zn', 'CoCl2'], ['Zn', 'FeCl3'],
  ['Mg', 'CuSO4'], ['Mg', 'ZnSO4'], ['Mg', 'Pb(NO3)2'], ['Mg', 'AgNO3'], ['Mg', 'FeSO4'], ['Mg', 'NiSO4'], ['Mg', 'CuCl2'],
  ['Al', 'CuCl2', 'xlorid'], ['Al', 'CuSO4', 'parda'], ['Al', 'AgNO3'], ['Al', 'Pb(NO3)2'], ['Al', 'ZnCl2'], ['Al', 'FeCl2'],
  ['Cu', 'AgNO3', 'kumush-daraxt'], ['Cu', 'FeCl3', 'travlenie'], ['Cu', 'Fe2(SO4)3', 'travlenie'], ['Cu', 'Hg(NO3)2'],
  ['Ni', 'CuSO4'], ['Ni', 'AgNO3'], ['Sn', 'CuSO4'], ['Sn', 'AgNO3'], ['Pb', 'Cu(NO3)2'], ['Pb', 'AgNO3'], ['Mn', 'CuSO4'],
];
// reaksiya ketmaydigan juftlar (faollik qatori bo'yicha)
const NONE = [['Cu', 'ZnSO4'], ['Cu', 'FeSO4'], ['Ag', 'CuSO4'], ['Fe', 'ZnSO4'], ['Pb', 'ZnSO4'], ['Cu', 'Pb(NO3)2'], ['Sn', 'ZnSO4']];

const out = [];
const metalOf = (salt) => {
  const s = sub(salt);
  return Object.keys(s.dissociation).find((k) => db.ions[k].charge > 0);
};
const anionOf = (salt) => Object.keys(sub(salt).dissociation).find((k) => db.ions[k].charge < 0);

for (const [m, salt, tag] of PAIRS) {
  const M = sub(m).metal;
  const ion = metalOf(salt);
  const red = db.reducible.find((r) => r.ion === ion);
  if (!red || !(red.E > M.E0 + 0.1)) { console.log('  faollik bo\'yicha bormaydi:', m, salt); continue; }
  if (!db.substances[salt]) { console.log('  tuz yo\'q', salt); continue; }
  const an = anionOf(salt);
  const newSalt = db.saltOf(M.ion, an);
  if (!newSalt) { console.log('  yangi tuz yo\'q', M.ion, an); continue; }
  const toMetal = !!db.substances[red.to]?.metal;
  const toSalt = toMetal ? null : db.saltOf(red.to, an);
  const left = [term(m, 's'), term(salt, 'aq')];
  const right = [term(newSalt, 'aq'), toMetal ? term(red.to, 's') : term(toSalt, 'aq')];
  if (m === 'Fe' && tag === 'komproporsiya') right.splice(0, 2, term(toSalt, 'aq'));
  try { balanced(left, right); } catch (e) { console.log('  balans', m, salt, e.message); continue; }
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const nIon = 0.0005;
  const saltK = left[1].k;
  const reactants = [
    { species: m, state: 's', mass_g: Math.round(sub(m).M * nIon * (left[0].k / saltK) * 1.5 * 1000) / 1000, form: FORM[m] },
    { species: salt, state: 'aq', conc_M: 0.5, volume_mL: Math.round((nIon / 0.5) * 1000 * 100) / 100 },
  ];
  if (m === 'Fe' || m === 'Zn' || m === 'Mg' || m === 'Ni' || m === 'Sn' || m === 'Mn' || m === 'Al' || m === 'Pb' || m === 'Cu') reactants[0].mass_g = Math.max(reactants[0].mass_g, 0.05);
  const mN = shortName(m), sN = shortName(salt), nN = shortName(newSalt), toN = toMetal ? shortName(red.to) : shortName(toSalt);
  const ionD = db.ions[ion].display, mIonD = db.ions[M.ion].display;
  const colorFrom = db.ions[ion].color?.hex || '#ffffff';
  const colorTo = db.ions[M.ion].color?.hex || '#ffffff';
  let title = `${cap(mN)}ning ${sN} eritmasi bilan reaksiyasi`;
  let obs = toMetal ? `${cap(mN)} sirtida ${toN} qatlami (${{ Cu: 'qizg\'ish', Ag: 'kumushrang-kulrang kristallar', Pb: 'kulrang yaltiroq tangachalar', Sn: 'kulrang ignasimon kristallar', Ni: 'kulrang', Fe: 'qoramtir-kulrang', Zn: 'kulrang', Co: 'kulrang', Hg: 'kumushrang' }[red.to] || 'kulrang'}) hosil bo'ladi` : `${cap(mN)} eriydi`;
  if (colorFrom !== colorTo) obs += `, eritma rangi o'zgaradi`;
  obs += '.';
  const effects = toMetal ? [{ type: 'deposit' }] : [{ type: 'dissolve' }];
  if (colorFrom !== colorTo) effects.push({ type: 'swirl' });
  let explanation = `${cap(mN)} faollik qatorida ${toMetal ? toN : 'temir(III) ionini'} ${toMetal ? 'dan oldin turadi' : 'qaytarishga yetarli darajada faol'}: ${mN} atomlari elektron berib ${mIonD} ionlariga aylanadi, ${ionD} ionlari esa elektron qabul qilib ${toMetal ? `metall ${toN}ga` : `${db.ions[red.to]?.display} ionlariga`} qaytariladi.`;
  if (tag === 'xlorid') explanation += " Xlorid ionlari alyuminiy sirtidagi oksid pardani buzadi, shuning uchun reaksiya tez boradi (sulfat eritmasida esa juda sekin).";
  if (tag === 'parda') explanation += " Alyuminiy sirtidagi zich oksid parda tufayli sulfat eritmasida reaksiya juda sekin boradi; eritmaga ozgina NaCl qo'shilsa, tezlashadi.";
  if (tag === 'daraxt') explanation += ` Ajralayotgan ${toN} kristallari plastinkada shoxlanib o'sadi — "${toN} daraxti" hosil bo'ladi.`;
  if (tag === 'kumush-daraxt') explanation += ' Mis sim atrofida yaltiroq kumush kristallari "daraxt" bo\'lib o\'sadi, eritma esa mis ionlaridan ko\'karadi.';
  if (tag === 'travlenie') explanation = `Mis faollik qatorida temirdan keyin tursa ham, Fe³⁺ ioni kuchli oksidlovchi bo'lib, misni oksidlaydi va o'zi Fe²⁺ gacha qaytariladi (metall temir hosil bo'lmaydi). Bu reaksiya bosma platalarni "kesish" (travlenie)da qo'llaniladi.`;
  if (tag === 'komproporsiya') explanation = `Temir Fe³⁺ ionlarini Fe²⁺ gacha qaytaradi, o'zi ham Fe²⁺ ga oksidlanadi (komproporsiya). Shuning uchun temir(II) tuzlari eritmalarini saqlashda ichiga temir mix solib qo'yiladi.`;
  if (m === 'Zn' && salt === 'FeCl3') explanation = 'Rux Fe³⁺ ionlarini avval Fe²⁺ gacha qaytaradi; rux ortiqcha bo\'lsa, keyinchalik metall temir ham ajralishi mumkin. Bu yerda birinchi bosqich ko\'rsatilgan.';
  const kin = m === 'Mg' ? 'tez' : (tag === 'parda' || m === 'Ni' || m === 'Sn' || m === 'Pb' ? 'sekin' : "o'rtacha");
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title, level: tag === 'travlenie' || tag === 'komproporsiya' ? '9-sinf' : '8-sinf',
    topic: 'Metallarning tuz eritmalari bilan reaksiyasi (faollik qatori)', engine: 'rules', reactants, conditions: {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: [`${m}⁰ − ${M.n}e⁻ = ${m}⁺${'⁰¹²³⁴⁵⁶⁷⁸⁹'[M.n]}`, toMetal ? `${red.to}⁺${'⁰¹²³⁴⁵⁶⁷⁸⁹'[red.e]} + ${red.e}e⁻ = ${red.to}⁰` : 'Fe⁺³ + 1e⁻ = Fe⁺²'] },
    mechType: "o'rin-olish",
    steps: [`Qaytaruvchi — ${mN} atomlari, oksidlovchi — ${ionD} ionlari.`, `${m} atomlari eritmaga ${mIonD} ionlari ko'rinishida o'tadi.`, toMetal ? `${ionD} ionlari metall sirtida elektron qabul qilib, ${toN} atomlari ko'rinishida o'tiradi.` : `${ionD} ionlari ${db.ions[red.to]?.display} ga qaytariladi.`],
    obs: { solution_color_change: colorFrom !== colorTo ? { from: colorFrom, to: colorTo } : null, heat: m === 'Mg' ? 'ekzotermik' : 'sezilarsiz', effects, text_uz: obs },
    kinetics: kin, apparatus: ['probirka', 'pinset', ...(FORM[m] === 'plastinka' ? ['kimyoviy-stakan'] : [])],
    procedure: [`Probirkaga ${fmt(reactants[1].volume_mL)} ml ${sN} eritmasidan quying.`, `${cap(mN)} ${FORM_UZ[FORM[m]]}ni ${m === 'Fe' ? 'qum qog\'oz bilan tozalab, ' : ''}eritmaga tushiring.`, `Bir necha daqiqadan so'ng metall sirti va eritma rangini kuzating.`],
    safety: safetyFor([salt, m]),
    explanation,
    questions: ['Elektron balans tuzing: oksidlovchi va qaytaruvchini ko\'rsating.', `${cap(mN)} o'rniga qanday metallarni olish mumkin, qaysilarini olib bo'lmaydi?`, 'Nima uchun natriy kabi ishqoriy metallar tuz eritmasidan metallni siqib chiqarmaydi?'],
    confidence: ['Mn', 'Sn'].includes(m) || salt === 'Hg(NO3)2' || (m === 'Al' && salt === 'FeCl2') || (m === 'Zn' && salt === 'FeCl3') ? "o'rta" : 'yuqori',
  }));
}

for (const [m, salt] of NONE) {
  const mN = shortName(m), sN = shortName(salt);
  const ion = metalOf(salt);
  const ionMetal = db.reducible.find((r) => r.ion === ion)?.to;
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning ${sN} eritmasi bilan reaksiyaga kirishmasligi`, level: '8-sinf',
    topic: 'Metallarning faollik qatori', engine: 'rules', no_reaction: true,
    reactants: [{ species: m, state: 's', mass_g: 0.3, form: FORM[m] }, { species: salt, state: 'aq', conc_M: 0.5, volume_mL: 2 }],
    conditions: {}, equation: {},
    mechType: "o'rin-olish",
    steps: [`${cap(mN)} faollik qatorida ${shortName(ionMetal)}dan keyin turadi.`, `${m} atomlari ${db.ions[ion].display} ionlariga elektron bera olmaydi.`],
    obs: { heat: 'sezilarsiz', effects: [], text_uz: "Hech qanday o'zgarish kuzatilmaydi." },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'pinset'],
    procedure: [`Probirkaga 2 ml ${sN} eritmasidan quying.`, `Unga ${mN} ${FORM_UZ[FORM[m]]}ni tushiring.`, "10–15 daqiqa davomida kuzating."],
    safety: safetyFor([salt, m]),
    explanation: `Har bir metall faollik qatorida o'zidan keyin turgan metallarnigina ularning tuzlari eritmasidan siqib chiqaradi. ${cap(mN)} ${shortName(ionMetal)}dan keyin turgani uchun reaksiya bormaydi.`,
    questions: ['Faollik qatori yordamida reaksiya borish-bormasligini qanday aniqlaysiz?', `${shortName(ionMetal)} tuzidan metallni siqib chiqarish uchun qaysi metallni olish kerak?`],
    confidence: 'yuqori',
  }));
}
writeCategory(CAT, out);
