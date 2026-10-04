// 6-toifa: Metall + suv, metall + ishqor (25). Generator: node tools/seed/reactions/metall_suv.mjs
import { db, term, balanced, eqString, ionicEqs, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub, fmt } from './lib.mjs';

const CAT = 'metall-suv-ishqor';
const PFX = 'metsuv';
const out = [];
const SUPN = (n) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[n];

// 1) faol metallar + suv
const WATER = [
  { m: 'Li', obs: "Litiy suv yuzasida suzib, nisbatan sokin reaksiyaga kirishadi; gaz ajraladi, fenolftalein pushti rangga kiradi.", kin: 'tez', heat: 'ekzotermik' },
  { m: 'Na', obs: "Natriy suv yuzasida eriyotgan sharcha bo'lib aylanib yuguradi, vishillaydi; fenolftalein to'q pushti rangga kiradi.", kin: 'tez', heat: 'kuchli-ekzotermik', eff: ['heat-haze'] },
  { m: 'K', obs: "Kaliy shiddat bilan reaksiyaga kirishadi, ajralayotgan vodorod binafsha alanga bilan yonib ketadi; eritma pushti tusga kiradi.", kin: 'bir-zumda', heat: 'kuchli-ekzotermik', flame: { color: '#b07ee0', desc_uz: 'binafsha (kaliy ionlari bo\'yagan) alanga' } },
  { m: 'Ca', obs: "Kalsiy suv tubida gaz pufakchalari ajratib eriydi; eritma loyqalanadi (kam eriydigan Ca(OH)₂), fenolftalein pushti rangga kiradi.", kin: "o'rtacha", heat: 'ekzotermik' },
];
for (const w of WATER) {
  const M = sub(w.m).metal;
  const base = db.saltOf(M.ion, 'OH^-');
  const left = [term(w.m, 's'), term('H2O', 'l')];
  const right = [term(base, w.m === 'Ca' ? 's' : 'aq', 1, w.m === 'Ca' ? {} : {}), term('H2', 'g', 1, { mark: '↑' })];
  balanced(left, right);
  const molecular = eqString(left, right);
  const ionic = w.m === 'Ca' ? { full: null, net: null } : ionicEqs([left[0], { ...left[1] }], [{ ...right[0], ph: 'aq' }, right[1]]);
  const mN = shortName(w.m);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning suv bilan reaksiyasi`, level: '8-sinf', topic: 'Ishqoriy va ishqoriy-yer metallarning suv bilan reaksiyasi', engine: 'rules',
    reactants: [{ species: w.m, state: 's', mass_g: w.m === 'Ca' ? 0.1 : 0.05, form: "bo'lak" }, { species: 'H2O', state: 'l', volume_mL: 50 }, { species: 'C20H14O4', state: 'aq', conc_M: 0.003, volume_mL: 0.2, role: 'indikator' }],
    conditions: {},
    equation: { molecular, ionic_full: ionic.full, ionic_net: ionic.net, electron_balance: [`${w.m}⁰ − ${M.n}e⁻ = ${w.m}⁺${SUPN(M.n)}`, '2H⁺¹ + 2e⁻ = H2⁰'] },
    mechType: "o'rin-olish",
    steps: [`${cap(mN)} atomlari tashqi elektronini oson beradi (kuchli qaytaruvchi).`, 'Suv molekulasidagi vodorod (H⁺¹) elektron qabul qilib H₂ ga qaytariladi.', `Hosil bo'lgan ${db.ions[M.ion].display} va OH⁻ ionlari ishqor eritmasini beradi.`],
    obs: { gas: { species: 'H2', color: null }, solution_color_change: { from: '#ffffff', to: '#d81b8c' }, heat: w.heat, flame: w.flame || null, effects: [{ type: 'bubbles' }, { type: 'dissolve' }, ...(w.flame ? [{ type: 'flame' }] : []), ...((w.eff || []).map((t) => ({ type: t })))], text_uz: w.obs },
    kinetics: w.kin, apparatus: w.m === 'Ca' ? ['kimyoviy-stakan', 'pinset', 'probirka'] : ['kristallizator', 'pinset'],
    procedure: [`Kristallizatorga (yoki stakanga) suv quying va 2–3 tomchi fenolftalein qo'shing.`, `Pinset bilan kerosindan olingan ${mN}${w.m === 'Ca' ? '' : 'ning no\'xatdan kichik bo\'lagini filtr qog\'ozda quriting va'} ${w.m === 'Ca' ? 'bo\'lagini' : ''} suvga tashlang.`, 'Uzoqroqdan, himoya ekrani ortidan kuzating.'],
    safety: `${cap(mN)} faqat pinset bilan olinadi, qo'l bilan ushlanmaydi; juda kichik bo'lak oling, ko'zoynak taqing va idishga engashmang. Reaksiya o'qituvchi ishtirokida o'tkaziladi.`,
    explanation: `${cap(mN)} faollik qatorining boshida turadi va suvni oddiy sharoitda qaytaradi: ishqor (${db.displayOf(base)}) va vodorod hosil bo'ladi. Ishqoriy metallarning faolligi guruhda yuqoridan pastga ortadi (Li < Na < K).${w.m === 'Ca' ? ' Ca(OH)₂ suvda kam eriydi, shuning uchun eritma loyqalanadi.' : ''}`,
    questions: ['Reaksiyada qaysi modda oksidlovchi, qaysi biri qaytaruvchi?', 'Nima uchun eritma fenolftaleinni pushti rangga bo\'yaydi?', 'Ishqoriy metallar nima uchun kerosin ostida saqlanadi?'],
    confidence: 'yuqori',
  }));
}

// 2) magniy issiq suv bilan
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: "Magniyning issiq suv bilan reaksiyasi", level: '8-sinf', topic: 'Metallarning suv bilan reaksiyasi', engine: 'rules',
  reactants: [{ species: 'Mg', state: 's', mass_g: 0.05, form: 'kukun' }, { species: 'H2O', state: 'l', volume_mL: 5 }, { species: 'C20H14O4', state: 'aq', conc_M: 0.003, volume_mL: 0.1, role: 'indikator' }],
  conditions: { heating: true, temp_min_C: 70, note_uz: 'Sovuq suvda magniy deyarli reaksiyaga kirishmaydi.' },
  equation: { molecular: 'Mg + 2H2O = Mg(OH)2 + H2↑', ionic_full: null, ionic_net: null, electron_balance: ['Mg⁰ − 2e⁻ = Mg⁺²', '2H⁺¹ + 2e⁻ = H2⁰'] },
  mechType: "o'rin-olish", steps: ['Qizdirilganda magniy sirtidagi parda yemiriladi.', 'Magniy suvni qaytaradi, kam eriydigan Mg(OH)₂ hosil bo\'ladi.'],
  obs: { gas: { species: 'H2', color: null }, solution_color_change: { from: '#ffffff', to: '#f7b6d8' }, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'boil' }], text_uz: "Qizdirilganda magniy kukuni sirtida gaz pufakchalari ajraladi, fenolftalein och pushti rangga kiradi." },
  kinetics: 'sekin', apparatus: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  procedure: ['Probirkaga 5 ml suv va 1–2 tomchi fenolftalein quying.', 'Ozroq magniy kukuni soling — sovuqda o\'zgarish yo\'q.', 'Probirkani qaynaguncha qizdiring va kuzating.'],
  safety: 'Probirka og\'zini o\'zingizga qaratmang; qaynayotgan suyuqlik sachrashi mumkin.',
  explanation: 'Magniy natriyga qaraganda kam faol: sovuq suv bilan sirtidagi gidroksid parda tufayli deyarli reaksiyaga kirishmaydi, issiq suv bilan esa vodorod ajratib Mg(OH)₂ hosil qiladi. Mg(OH)₂ kam eriydi, shuning uchun indikator och pushti tusga kiradi.',
  questions: ['Magniy va natriyning suv bilan reaksiyasini solishtiring.', 'Nima uchun reaksiya qizdirilganda tezlashadi?'],
  confidence: 'yuqori',
}));

// 3) suv bilan reaksiyaga kirishmaydigan metallar (oddiy sharoitda)
const NOWATER = [
  ['Mg', "Sovuq suvda magniy sirti Mg(OH)₂ ning yupqa pardasi bilan qoplanadi va reaksiya deyarli bormaydi; qizdirilganda esa boradi."],
  ['Al', "Alyuminiy faol metall bo'lsa ham, sirtidagi zich Al₂O₃ parda uni suvdan himoya qiladi — reaksiya ketmaydi."],
  ['Fe', "Temir xona haroratida suv bilan reaksiyaga kirishmaydi (faqat cho'g'langan temir suv bug'i bilan ta'sirlashadi). Suv va havo birgalikda esa asta zanglash jarayonini keltirib chiqaradi."],
  ['Zn', "Rux suv bilan oddiy sharoitda reaksiyaga kirishmaydi: sirtidagi oksid-gidroksid parda himoya qiladi."],
];
for (const [m, why] of NOWATER) {
  const mN = shortName(m);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning sovuq suv bilan reaksiyaga kirishmasligi`, level: '8-sinf', topic: 'Metallarning suv bilan reaksiyasi', engine: 'rules', no_reaction: true,
    reactants: [{ species: m, state: 's', mass_g: 0.2, form: m === 'Fe' ? 'mix' : (m === 'Mg' ? 'lenta' : (m === 'Al' ? 'plastinka' : 'granula')) }, { species: 'H2O', state: 'l', volume_mL: 5 }, { species: 'C20H14O4', state: 'aq', conc_M: 0.003, volume_mL: 0.1, role: 'indikator' }],
    conditions: { temp_max_C: 30 }, equation: {},
    mechType: "o'rin-olish", steps: ['Metall sirtidagi himoya pardasi suvning metallga yetishiga to\'sqinlik qiladi.'],
    obs: { heat: 'sezilarsiz', effects: [], text_uz: "Hech qanday o'zgarish kuzatilmaydi, indikator rangsizligicha qoladi." },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'pinset'],
    procedure: ['Probirkaga 5 ml suv va 1 tomchi fenolftalein quying.', `${cap(mN)} bo'lagini soling.`, 'Bir necha daqiqa kuzating.'],
    safety: "Reaktivlarni tatib ko'rmang; ishdan so'ng qo'lni yuving.",
    explanation: why,
    questions: ['Qaysi metallar suv bilan oddiy sharoitda reaksiyaga kirishadi?', 'Himoya oksid pardasi nima?'],
    confidence: 'yuqori',
  }));
}

// 4) amfoter metallar + ishqor
const ALK = [
  ['Al', 'NaOH', 'Na[Al(OH)4]'], ['Al', 'KOH', 'K[Al(OH)4]'], ['Zn', 'NaOH', 'Na2[Zn(OH)4]'], ['Zn', 'KOH', 'K2[Zn(OH)4]'], ['Sn', 'NaOH', 'Na2[Sn(OH)4]'],
];
for (const [m, alk, prod] of ALK) {
  const left = [term(m, 's'), term(alk, 'aq'), term('H2O', 'l')];
  const right = [term(prod, 'aq', 1, { forceIonic: true }), term('H2', 'g', 1, { mark: '↑' })];
  balanced(left, right);
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const mN = shortName(m), aN = shortName(alk), pN = shortName(prod);
  const M = sub(m).metal;
  const heat = m === 'Sn';
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning ${aN} eritmasi bilan reaksiyasi`, level: '9-sinf', topic: 'Amfoter metallarning ishqorlar bilan reaksiyasi', engine: 'rules',
    reactants: [{ species: m, state: 's', mass_g: 0.1, form: m === 'Al' ? 'qirindi' : 'granula' }, { species: alk, state: 'aq', conc_M: 2, volume_mL: 4 }],
    conditions: heat ? { heating: true, temp_min_C: 60, note_uz: 'Qalay ishqor bilan qizdirilganda reaksiyaga kirishadi.' } : {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: [`${m}⁰ − ${M.n}e⁻ = ${m}⁺${SUPN(M.n)}`, '2H⁺¹ + 2e⁻ = H2⁰'] },
    mechType: 'oksidlanish-qaytarilish',
    steps: [`Ishqor ${mN} sirtidagi amfoter oksid pardani eritadi.`, `${cap(mN)} suvni qaytaradi: vodorod ajraladi, hosil bo'lgan amfoter gidroksid darhol ishqor bilan gidroksokompleks hosil qiladi.`],
    obs: { gas: { species: 'H2', color: null }, heat: m === 'Al' ? 'ekzotermik' : 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'dissolve' }], text_uz: `${cap(mN)} ${heat ? 'qizdirilganda ' : ''}ishqor eritmasida gaz (vodorod) ajratib eriydi${m === 'Al' ? '; reaksiya biroz kechikib boshlanib, so\'ng jadallashadi' : ''}.` },
    kinetics: m === 'Al' ? "o'rtacha" : 'sekin', apparatus: ['probirka', 'pinset', ...(heat ? ['spirt-lampasi', 'probirka-qisqichi'] : []), 'chop-yonib-turgan'],
    procedure: [`Probirkaga 4 ml ${aN} eritmasidan quying.`, `${cap(mN)} ${m === 'Al' ? 'qirindisidan' : 'granulasidan'} soling.`, ...(heat ? ['Probirkani ehtiyotkorlik bilan qizdiring.'] : []), "Gaz ajralishini kuzating, so'ng gazni yonib turgan cho'p bilan sinang."],
    safety: `Ishqor eritmasi terini va ko'zni kuydiradi — ko'zoynak va qo'lqopdan foydalaning. Vodorodni ochiq alangadan uzoqda tuting.`,
    explanation: `${cap(mN)} amfoter metall: u nafaqat kislotalar, balki ishqorlar bilan ham reaksiyaga kirishib vodorod ajratadi. Bunda kompleks tuz — ${pN} hosil bo'ladi. Shu sababli alyuminiy va rux idishlarda ishqoriy eritmalarni saqlab bo'lmaydi.`,
    questions: ['Amfoter metallarga misollar keltiring.', 'Bu reaksiyada oksidlovchi qaysi modda?', `${cap(pN)} qanday turdagi birikma?`],
    confidence: m === 'Sn' ? "o'rta" : 'yuqori',
  }));
}

// ishqor bilan reaksiyaga kirishmaydigan metallar
for (const [m, why] of [['Mg', "Magniy amfoter emas — uning gidroksidi asosli, shuning uchun magniy ishqor eritmalari bilan reaksiyaga kirishmaydi (Al va Zn dan farqli)."], ['Fe', "Temir ishqorlarning suyultirilgan eritmalari bilan reaksiyaga kirishmaydi — u amfoter xossa namoyon qilmaydi."]]) {
  const mN = shortName(m);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning ishqor eritmasi bilan reaksiyaga kirishmasligi`, level: '9-sinf', topic: 'Amfoter va amfoter bo\'lmagan metallar', engine: 'rules', no_reaction: true,
    reactants: [{ species: m, state: 's', mass_g: 0.1, form: m === 'Mg' ? 'lenta' : 'qirindi' }, { species: 'NaOH', state: 'aq', conc_M: 2, volume_mL: 4 }],
    conditions: {}, equation: {}, mechType: "o'rin-olish", steps: [`${cap(mN)} gidroksidi asosli xossaga ega — ishqor bilan kompleks hosil qilmaydi.`],
    obs: { heat: 'sezilarsiz', effects: [], text_uz: "Gaz ajralmaydi, metall o'zgarmaydi." },
    kinetics: 'bir-zumda', apparatus: ['probirka', 'pinset'],
    procedure: ['Probirkaga 4 ml natriy gidroksid eritmasidan quying.', `${cap(mN)} bo'lagini soling.`, 'Kuzating va natijani alyuminiy bilan solishtiring.'],
    safety: "Ishqor eritmasi bilan ko'zoynak va qo'lqopda ishlang.",
    explanation: why,
    questions: ['Qaysi metallar ishqor eritmalaridan vodorod siqib chiqaradi?', 'Bu tajriba yordamida magniy va alyuminiyni qanday farqlash mumkin?'],
    confidence: 'yuqori',
  }));
}

// 5) faol metall + tuz eritmasi (avval suv bilan reaksiya)
const SALT = [
  ['Na', 'CuSO4', 'Cu(OH)2', "ko'k"], ['K', 'FeCl3', 'Fe(OH)3', "qizil-qo'ng'ir"], ['Na', 'MgCl2', 'Mg(OH)2', 'oq'], ['Li', 'NiSO4', 'Ni(OH)2', 'och yashil'], ['Ca', 'CuCl2', 'Cu(OH)2', "ko'k"], ['Na', 'ZnSO4', 'Zn(OH)2', 'oq'],
];
for (const [m, salt, ppt, col] of SALT) {
  const M = sub(m).metal;
  const an = Object.keys(sub(salt).dissociation).find((k) => db.ions[k].charge < 0);
  const newSalt = db.saltOf(M.ion, an);
  const left = [term(m, 's'), term(salt, 'aq'), term('H2O', 'l')];
  const right = [term(ppt, 's', 1, { mark: '↓' }), term(newSalt, 'aq'), term('H2', 'g', 1, { mark: '↑' })];
  balanced(left, right);
  const molecular = eqString(left, right);
  const { full, net } = ionicEqs(left, right);
  const mN = shortName(m), sN = shortName(salt), pN = shortName(ppt);
  const pS = sub(ppt);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(mN)}ning ${sN} eritmasi bilan reaksiyasi`, level: '9-sinf', topic: 'Faol metallarning tuz eritmalari bilan reaksiyasi', engine: 'rules',
    reactants: [{ species: m, state: 's', mass_g: m === 'Ca' ? 0.04 : 0.03, form: "bo'lak" }, { species: salt, state: 'aq', conc_M: 0.5, volume_mL: 5 }],
    conditions: {},
    equation: { molecular, ionic_full: full, ionic_net: net, electron_balance: [`${m}⁰ − ${M.n}e⁻ = ${m}⁺${SUPN(M.n)}`, '2H⁺¹ + 2e⁻ = H2⁰'] },
    mechType: "o'rin-olish",
    steps: [`${cap(mN)} avval suv bilan reaksiyaga kirishadi: ishqor va vodorod hosil bo'ladi.`, `Hosil bo'lgan OH⁻ ionlari eritmadagi tuz kationlari bilan ${pN} cho'kmasini beradi.`],
    obs: { precipitate: { species: ppt, color: pS.precipitate.color, texture: pS.precipitate.texture }, gas: { species: 'H2', color: null }, heat: 'ekzotermik', effects: [{ type: 'bubbles' }, { type: 'turbidity' }], text_uz: `Gaz ajraladi va ${col} ${pN} cho'kmasi tushadi; metall ajralmaydi.` },
    kinetics: 'tez', apparatus: ['kimyoviy-stakan', 'pinset'],
    procedure: [`Stakanga 5 ml ${sN} eritmasidan quying.`, `Pinset bilan ${mN}ning kichik bo'lagini tashlang.`, 'Gaz ajralishi va cho\'kma rangini kuzating.'],
    safety: `${cap(mN)} juda faol — faqat kichik bo'lak, pinset bilan; ko'zoynak taqing.`,
    explanation: `${cap(mN)} faollik qatorida ${shortName(db.reducible.find((r) => r.ion === Object.keys(sub(salt).dissociation).find((k) => db.ions[k].charge > 0))?.to || 'Cu')}dan oldin tursa ham, uni tuz eritmasidan siqib chiqarmaydi: u birinchi navbatda suv bilan reaksiyaga kirishadi. Hosil bo'lgan ishqor esa tuz bilan almashinib, ${pN} cho'kmasini beradi.`,
    questions: ['Nima uchun ishqoriy metallar tuz eritmalaridan metallni siqib chiqara olmaydi?', 'Reaksiya bosqichlarining tenglamalarini alohida yozing.'],
    confidence: m === 'Li' || m === 'Ca' || salt === 'ZnSO4' ? "o'rta" : 'yuqori',
  }));
}

// 6) qizdirilgan metallarning suv bug'i bilan reaksiyasi (aniq yozuvlar)
const STEAM = [
  { m: 'Fe', eq: '3Fe + 4H2O = Fe3O4 + 4H2↑', t: 500, prod: 'Fe3O4', eb: ['3Fe⁰ − 8e⁻ = 3Fe⁺⁸/³', '2H⁺¹ + 2e⁻ = H2⁰'], txt: "Cho'g'langan temir qirindisi ustidan suv bug'i o'tkazilganda vodorod ajraladi, temir qora temir kuyindisiga (Fe₃O₄) aylanadi.", conf: 'yuqori' },
  { m: 'Mg', eq: 'Mg + H2O = MgO + H2↑', t: 400, prod: 'MgO', eb: ['Mg⁰ − 2e⁻ = Mg⁺²', '2H⁺¹ + 2e⁻ = H2⁰'], txt: "Qizdirilgan magniy suv bug'ida yorqin yonadi, oq MgO hosil bo'ladi va vodorod ajraladi.", conf: 'yuqori' },
  { m: 'Zn', eq: 'Zn + H2O = ZnO + H2↑', t: 500, prod: 'ZnO', eb: ['Zn⁰ − 2e⁻ = Zn⁺²', '2H⁺¹ + 2e⁻ = H2⁰'], txt: "Qizdirilgan rux suv bug'i bilan oksidga aylanadi va vodorod ajraladi.", conf: "o'rta" },
];
for (const s of STEAM) {
  const mN = shortName(s.m);
  const eb = s.m === 'Fe' ? ['Fe⁰ − 2e⁻ = Fe⁺²', 'Fe⁰ − 3e⁻ = Fe⁺³', '2H⁺¹ + 2e⁻ = H2⁰'] : s.eb;
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `Qizdirilgan ${mN}ning suv bug'i bilan reaksiyasi`, level: s.m === 'Fe' ? '9-sinf' : 'litsey', topic: "Metallarning suv bug'i bilan reaksiyasi", engine: 'record',
    reactants: [{ species: s.m, state: 's', mass_g: 0.5, form: s.m === 'Fe' ? 'qirindi' : 'kukun' }, { species: 'H2O', state: 'g' }],
    conditions: { heating: true, temp_min_C: s.t, note_uz: "Metall qizdirilgan naycha ichida bo'ladi, ustidan suv bug'i o'tkaziladi (harorat chegarasi taxminiy)." },
    equation: { molecular: s.eq, ionic_full: null, ionic_net: null, electron_balance: eb },
    mechType: 'oksidlanish-qaytarilish',
    steps: [`Yuqori haroratda ${mN} suv bug'idagi vodorodni qaytaradi.`, `${cap(mN)} oksidlanib ${db.displayOf(s.prod)} ga aylanadi.`],
    obs: { gas: { species: 'H2', color: null }, solid_color_change: s.m === 'Fe' ? { from: '#8a8d90', to: '#222220' } : null, heat: s.m === 'Mg' ? 'kuchli-ekzotermik' : 'ekzotermik', flame: s.m === 'Mg' ? { color: '#f8f8ff', desc_uz: 'ko\'zni qamashtiruvchi oq alanga' } : null, effects: [{ type: 'glow' }, ...(s.m === 'Mg' ? [{ type: 'light' }] : [])], text_uz: s.txt },
    kinetics: "o'rtacha", apparatus: ['probirka', 'shtativ', 'qisqich-lapka', 'bunzen-gorelkasi', 'gaz-naycha-egilgan', 'pnevmatik-vanna'],
    procedure: [`Qiyin eriydigan shishadan yasalgan probirkaning o'rta qismiga ${mN} ${s.m === 'Fe' ? 'qirindisi' : 'kukuni'} joylashtiring, tubiga ho'llangan paxta (suv manbai) qo'ying.`, 'Avval metallni kuchli qizdiring, so\'ng paxtani ham qizdirib, bug\' hosil qiling.', 'Ajralgan gazni suv ostida yig\'ing va yonib turgan cho\'p bilan sinang.'],
    safety: "Issiq shisha va bug' kuydiradi; gaz chiqarish naychasini suvdan olib, keyin qizdirishni to'xtating (suv so'rilib ketmasligi uchun).",
    explanation: `${cap(mN)} oddiy sharoitda suv bilan deyarli reaksiyaga kirishmaydi, lekin yuqori haroratda suv bug'ini qaytarib, vodorod ajratadi.${s.m === 'Fe' ? " Bu usul tarixan vodorod olish uchun qo'llanilgan (temir-bug' usuli)." : ''}`,
    questions: ['Nima uchun reaksiya faqat yuqori haroratda boradi?', 'Ajralgan gazni qanday aniqlash mumkin?'],
    confidence: s.conf,
  }));
}
writeCategory(CAT, out);
