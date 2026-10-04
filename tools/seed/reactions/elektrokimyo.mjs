// 14-toifa: Elektroliz va galvanik elementlar (30). Generator: node tools/seed/reactions/elektrokimyo.mjs
import { db, makeRecord, nextId, writeCategory, shortName, cap, safetyFor, sub } from './lib.mjs';

const CAT = 'elektrokimyo';
const PFX = 'elektro';
const out = [];

// [tuz, konts, molekulyar, katod, anod, katod mahsuloti, anod mahsuloti, kuzatuv, qo'shimcha izoh, ishonch, apparat]
const EL = [
  ['CuCl2', 0.5, 'CuCl2 = Cu + Cl2↑', 'Cu²⁺ + 2e⁻ = Cu', '2Cl⁻ − 2e⁻ = Cl2', 'mis', 'xlor', "Katodda qizg'ish mis qatlami o'tiradi, anodda sarg'ish-yashil, bo'g'uvchi hidli gaz (xlor) ajraladi; eritmaning ko'k rangi asta kamayadi.", '', 'yuqori'],
  ['CuSO4', 0.5, '2CuSO4 + 2H2O = 2Cu + O2↑ + 2H2SO4', 'Cu²⁺ + 2e⁻ = Cu', '2H2O − 4e⁻ = O2 + 4H⁺', 'mis', 'kislorod', "Katodda mis o'tiradi, anodda rangsiz gaz (kislorod) pufakchalari ajraladi; eritma kislotali bo'lib boradi.", 'Sulfat ioni suvli eritmada oksidlanmaydi — anodda suv oksidlanadi.', 'yuqori'],
  ['NaCl', 1, '2NaCl + 2H2O = H2↑ + Cl2↑ + 2NaOH', '2H2O + 2e⁻ = H2 + 2OH⁻', '2Cl⁻ − 2e⁻ = Cl2', 'vodorod', 'xlor', "Ikkala elektrodda gaz ajraladi; katod atrofidagi eritma fenolftaleindan pushti rangga kiradi (NaOH), anodda xlor hidi seziladi.", 'Natriy ionlari suvli eritmada qaytarilmaydi — katodda suv qaytariladi. Bu jarayon sanoatda NaOH, Cl₂ va H₂ olishda qo\'llaniladi.', 'yuqori'],
  ['KI', 0.5, '2KI + 2H2O = H2↑ + I2 + 2KOH', '2H2O + 2e⁻ = H2 + 2OH⁻', '2I⁻ − 2e⁻ = I2', 'vodorod', 'yod', "Anod atrofida eritma qo'ng'ir rangga kiradi (yod; kraxmal qo'shilsa ko'karadi), katodda gaz ajraladi va eritma ishqoriy bo'ladi.", '', 'yuqori'],
  ['KBr', 0.5, '2KBr + 2H2O = H2↑ + Br2 + 2KOH', '2H2O + 2e⁻ = H2 + 2OH⁻', '2Br⁻ − 2e⁻ = Br2', 'vodorod', 'brom', "Anod atrofida eritma sarg'ish-to'q sariq rangga kiradi (brom), katodda vodorod ajraladi.", '', 'yuqori'],
  ['Na2SO4', 0.5, '2H2O = 2H2↑ + O2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '2H2O − 4e⁻ = O2 + 4H⁺', 'vodorod', 'kislorod', "Katodda anoddagiga nisbatan ikki marta ko'p gaz ajraladi; universal indikator katod atrofida ko'k, anod atrofida qizil rangga kiradi.", 'Na⁺ va SO₄²⁻ ionlari o\'zgarmaydi — aslida suv parchalanadi, tuz esa elektr o\'tkazuvchanlikni ta\'minlaydi.', 'yuqori'],
  ['H2SO4', 0.5, '2H2O = 2H2↑ + O2↑', '2H⁺ + 2e⁻ = H2', '2H2O − 4e⁻ = O2 + 4H⁺', 'vodorod', 'kislorod', "Gofman apparatida katod tirsagida anoddagiga nisbatan 2 marta ko'p gaz (vodorod) yig'iladi.", 'Suvning hajmiy tarkibi H₂ : O₂ = 2 : 1 ekanini ko\'rsatadi.', 'yuqori', ['gofman-apparati', 'tok-manbai', 'elektrod-platina', 'simlar']],
  ['NaOH', 1, '2H2O = 2H2↑ + O2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '4OH⁻ − 4e⁻ = O2 + 2H2O', 'vodorod', 'kislorod', "Ikkala elektrodda gaz ajraladi, katoddagi gaz hajmi ikki baravar ko'p.", 'Ishqor eritmasida anodda OH⁻ ionlari oksidlanadi.', 'yuqori'],
  ['KOH', 1, '2H2O = 2H2↑ + O2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '4OH⁻ − 4e⁻ = O2 + 2H2O', 'vodorod', 'kislorod', "Gofman apparatida vodorod va kislorod 2 : 1 hajmiy nisbatda yig'iladi.", '', 'yuqori', ['gofman-apparati', 'tok-manbai', 'elektrod-platina', 'simlar']],
  ['AgNO3', 0.2, '4AgNO3 + 2H2O = 4Ag + O2↑ + 4HNO3', 'Ag⁺ + 1e⁻ = Ag', '2H2O − 4e⁻ = O2 + 4H⁺', 'kumush', 'kislorod', "Katodda kulrang-oq kumush kristallari o'tiradi, anodda kislorod ajraladi.", 'Kumush faollik qatorida vodoroddan keyin turadi — katodda faqat metall ajraladi.', 'yuqori'],
  ['ZnSO4', 1, '2ZnSO4 + 2H2O = 2Zn + O2↑ + 2H2SO4', 'Zn²⁺ + 2e⁻ = Zn', '2H2O − 4e⁻ = O2 + 4H⁺', 'rux', 'kislorod', "Katodda kulrang rux qatlami hosil bo'ladi, anodda kislorod ajraladi.", "Rux vodoroddan oldin tursa ham, konsentrlangan eritmada katodda asosan rux ajraladi (vodorod ham qisman ajraladi).", "o'rta"],
  ['ZnCl2', 1, 'ZnCl2 = Zn + Cl2↑', 'Zn²⁺ + 2e⁻ = Zn', '2Cl⁻ − 2e⁻ = Cl2', 'rux', 'xlor', "Katodda rux o'tiradi, anodda xlor ajraladi.", '', "o'rta"],
  ['NiSO4', 1, '2NiSO4 + 2H2O = 2Ni + O2↑ + 2H2SO4', 'Ni²⁺ + 2e⁻ = Ni', '2H2O − 4e⁻ = O2 + 4H⁺', 'nikel', 'kislorod', "Katodda kulrang nikel qatlami hosil bo'ladi (nikellash), anodda kislorod ajraladi.", '', "o'rta"],
  ['Pb(NO3)2', 0.5, '2Pb(NO3)2 + 2H2O = 2Pb + O2↑ + 4HNO3', 'Pb²⁺ + 2e⁻ = Pb', '2H2O − 4e⁻ = O2 + 4H⁺', "qo'rg'oshin", 'kislorod', "Katodda kulrang qo'rg'oshin kristallari \"daraxt\" ko'rinishida o'sadi.", '', "o'rta"],
  ['KNO3', 1, '2H2O = 2H2↑ + O2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '2H2O − 4e⁻ = O2 + 4H⁺', 'vodorod', 'kislorod', "Ikkala elektrodda gaz ajraladi; K⁺ va NO₃⁻ ionlari o'zgarmaydi.", '', 'yuqori'],
  ['HCl', 1, '2HCl = H2↑ + Cl2↑', '2H⁺ + 2e⁻ = H2', '2Cl⁻ − 2e⁻ = Cl2', 'vodorod', 'xlor', "Katodda vodorod, anodda xlor ajraladi.", '', 'yuqori'],
  ['MgCl2', 0.5, 'MgCl2 + 2H2O = Mg(OH)2↓ + H2↑ + Cl2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '2Cl⁻ − 2e⁻ = Cl2', 'vodorod', 'xlor', "Katod atrofida oq Mg(OH)₂ cho'kmasi hosil bo'ladi, ikkala elektrodda gaz ajraladi.", "Katodda hosil bo'lgan OH⁻ ionlari Mg²⁺ bilan erimaydigan gidroksid beradi.", 'yuqori'],
  ['CaCl2', 1, 'CaCl2 + 2H2O = Ca(OH)2 + H2↑ + Cl2↑', '2H2O + 2e⁻ = H2 + 2OH⁻', '2Cl⁻ − 2e⁻ = Cl2', 'vodorod', 'xlor', "Katod atrofida eritma loyqalanadi (kam eriydigan Ca(OH)₂), gazlar ajraladi.", '', "o'rta"],
  ['Na2S', 0.5, 'Na2S + 2H2O = S↓ + H2↑ + 2NaOH', '2H2O + 2e⁻ = H2 + 2OH⁻', 'S²⁻ − 2e⁻ = S', 'vodorod', 'oltingugurt', "Anod atrofida sariq loyqa (oltingugurt) hosil bo'ladi, katodda vodorod ajraladi.", 'Sulfid ioni xlorid ionidan ham oson oksidlanadi.', "o'rta"],
  ['SnCl2', 0.5, 'SnCl2 = Sn + Cl2↑', 'Sn²⁺ + 2e⁻ = Sn', '2Cl⁻ − 2e⁻ = Cl2', 'qalay', 'xlor', "Katodda kulrang ignasimon qalay kristallari o'sadi, anodda xlor ajraladi.", '', "o'rta"],
];
for (const [salt, c, mol, cat, an, cP, aP, obs, note, conf, app] of EL) {
  const sN = shortName(salt);
  const gas = mol.includes('Cl2↑') ? 'Cl2' : mol.includes('H2↑') ? 'H2' : mol.includes('O2↑') ? 'O2' : null;
  const ppt = mol.includes('Mg(OH)2↓') ? 'Mg(OH)2' : mol.includes('S↓') ? 'S' : null;
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(sN)} eritmasining elektrolizi (inert elektrodlar)`, level: '9-sinf', topic: 'Eritmalar elektrolizi', engine: 'rules',
    extra: { electrolysis: { anode: 'C', cathode: 'C', cathode_product_uz: cP, anode_product_uz: aP } },
    reactants: [{ species: salt, state: 'aq', conc_M: c, volume_mL: 25 }],
    conditions: { electricity: true, anode: 'C', cathode: 'C', note_uz: "O'zgarmas tok, grafit (yoki platina) elektrodlar." },
    equation: { molecular: mol, ionic_full: null, ionic_net: null, electron_balance: [`Katod (−): ${cat}`.replace('Katod (−): ', ''), an] },
    mechType: 'elektroliz',
    steps: [`Katod (−): ${cat} — ${cP} ajraladi.`, `Anod (+): ${an} — ${aP} ajraladi.`, note || 'Kationlar katodga, anionlar anodga harakatlanadi.'],
    obs: { precipitate: ppt ? { species: ppt, color: sub(ppt).precipitate?.color || sub(ppt).appearance.color, texture: sub(ppt).precipitate?.texture || 'kolloid' } : null, gas: gas ? { species: gas, color: sub(gas).gas?.color || null } : null, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, ...(['mis', 'kumush', 'rux', 'nikel', "qo'rg'oshin", 'qalay'].includes(cP) ? [{ type: 'deposit' }] : [])], text_uz: obs },
    kinetics: "o'rtacha", apparatus: app || ['elektrolizyor-u', 'tok-manbai', 'elektrod-grafit', 'simlar'],
    procedure: [`U-simon elektrolizyorga 25 ml ${sN} eritmasidan quying.`, 'Ikkala tirsakka grafit elektrodlarni tushiring va ularni tok manbaiga ulang (anod "+", katod "−").', '4–6 V kuchlanish bering va elektrodlardagi o\'zgarishlarni kuzating.', 'Tokni o\'chirib, mahsulotlarni aniqlang.'],
    safety: `${safetyFor([salt])} Elektr manbai bilan ishlashda simlarni ho'l qo'l bilan ushlamang.${gas === 'Cl2' ? " Xlor zaharli — tajribani mo'rili shkafda o'tkazing." : ''}`,
    explanation: `Elektrolizda katodda qaytarilish, anodda oksidlanish boradi. ${note} Katodda: ${cat}; anodda: ${an}.`.replace(/\s+/g, ' '),
    questions: ['Katod va anodda boradigan jarayonlar tenglamasini yozing.', 'Elektroliz mahsulotlari nimaga bog\'liq?', `${cap(sN)} suyuqlanmasi elektroliz qilinsa, mahsulotlar qanday bo'ladi?`],
    confidence: conf,
  }));
}

// faol anod (eruvchan anod)
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: 'Mis(II) sulfat eritmasining mis anod bilan elektrolizi (misni tozalash)', level: '10-sinf', topic: 'Eruvchan anod bilan elektroliz', engine: 'rules',
  extra: { electrolysis: { anode: 'Cu', cathode: 'C' }, equation_free: true, equation_free_uz: "Anodda mis eriydi, katodda xuddi shuncha mis o'tiradi: umumiy kimyoviy tenglama yo'q — mis anoddan katodga ko'chadi." },
  reactants: [{ species: 'CuSO4', state: 'aq', conc_M: 0.5, volume_mL: 25 }],
  conditions: { electricity: true, anode: 'Cu', cathode: 'C', note_uz: 'Anod — mis plastinka, katod — grafit.' },
  equation: { electron_balance: ['Cu²⁺ + 2e⁻ = Cu', 'Cu − 2e⁻ = Cu²⁺'] },
  mechType: 'elektroliz', steps: ['Anod (+): mis atomlari oksidlanib eritmaga Cu²⁺ ionlari ko\'rinishida o\'tadi.', 'Katod (−): Cu²⁺ ionlari qaytarilib, toza mis ko\'rinishida o\'tiradi.', 'Eritmadagi Cu²⁺ konsentratsiyasi deyarli o\'zgarmaydi.'],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'deposit' }], text_uz: "Mis anod asta yupqalashadi, katodda qizg'ish mis qatlami o'sadi; gaz ajralmaydi." },
  kinetics: 'sekin', apparatus: ['kimyoviy-stakan', 'tok-manbai', 'elektrod-mis', 'elektrod-grafit', 'simlar'],
  procedure: ['Stakanga mis(II) sulfat eritmasidan quying.', 'Mis plastinkani tok manbaining "+" qutbiga, grafit elektrodni "−" qutbiga ulang.', 'Past kuchlanish (2–3 V) bering va 10–15 daqiqa kuzating.'],
  safety: safetyFor(['CuSO4']),
  explanation: "Anod material sifatida mis olinsa, anodda suv yoki sulfat ioni emas, misning o'zi oksidlanadi (u osonroq oksidlanadi). Sanoatda xom mis shu usulda tozalanadi (elektroliz bilan rafinatsiya).",
  questions: ['Nima uchun anodda kislorod ajralmaydi?', 'Misni elektrolitik tozalashda aralashmalar qayerda to\'planadi?'],
  confidence: 'yuqori',
}));
out.push(makeRecord({
  id: nextId(PFX), category: CAT, title: 'Temir buyumni mis bilan qoplash (galvanostegiya)', level: '10-sinf', topic: 'Galvanotexnika', engine: 'rules',
  extra: { electrolysis: { anode: 'Cu', cathode: 'Fe' }, equation_free: true, equation_free_uz: "Mis anoddan katoddagi temir buyum sirtiga ko'chadi; umumiy kimyoviy tenglama yo'q." },
  reactants: [{ species: 'CuSO4', state: 'aq', conc_M: 0.5, volume_mL: 25 }],
  conditions: { electricity: true, anode: 'Cu', cathode: 'Fe', note_uz: 'Katod — tozalangan temir plastinka (buyum), anod — mis.' },
  equation: { electron_balance: ['Cu²⁺ + 2e⁻ = Cu', 'Cu − 2e⁻ = Cu²⁺'] },
  mechType: 'elektroliz', steps: ['Katod — qoplanadigan temir buyum: unda Cu²⁺ ionlari qaytariladi.', 'Anod — mis: u eriydi va eritmadagi Cu²⁺ ni to\'ldirib turadi.'],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'deposit' }], text_uz: "Temir plastinka bir tekis qizg'ish mis qatlami bilan qoplanadi." },
  kinetics: 'sekin', apparatus: ['kimyoviy-stakan', 'tok-manbai', 'elektrod-mis', 'elektrod-temir', 'simlar'],
  procedure: ['Temir plastinkani qum qog\'oz bilan tozalab, yog\'sizlantiring.', 'Uni tok manbaining "−" qutbiga, mis plastinkani "+" qutbiga ulab, mis(II) sulfat eritmasiga tushiring.', 'Past kuchlanishda 5–10 daqiqa elektroliz qiling.'],
  safety: safetyFor(['CuSO4']),
  explanation: "Galvanostegiyada qoplanadigan buyum katod bo'ladi: unda qoplovchi metall ionlari qaytariladi. Anod sifatida qoplovchi metallning o'zi olinadi.",
  questions: ['Nima uchun qoplanadigan buyum katodga ulanadi?', 'Galvanostegiya qanday maqsadlarda qo\'llaniladi?'],
  confidence: 'yuqori',
}));

// galvanik elementlar
const GALV = [
  ['Zn', 'ZnSO4', 'Cu', 'CuSO4', 1, 1, 'Zn + CuSO4 = ZnSO4 + Cu', 'Zn²⁺', 'Cu²⁺', 'Daniel–Yakobi galvanik elementi (Zn–Cu)', 'elektrod-rux', 'elektrod-mis'],
  ['Fe', 'FeSO4', 'Cu', 'CuSO4', 1, 1, 'Fe + CuSO4 = FeSO4 + Cu', 'Fe²⁺', 'Cu²⁺', 'Temir–mis galvanik elementi', 'elektrod-temir', 'elektrod-mis'],
  ['Zn', 'ZnSO4', 'Fe', 'FeSO4', 1, 1, 'Zn + FeSO4 = ZnSO4 + Fe', 'Zn²⁺', 'Fe²⁺', 'Rux–temir galvanik elementi', 'elektrod-rux', 'elektrod-temir'],
  ['Zn', 'ZnSO4', 'Cu', 'CuSO4', 0.01, 1, 'Zn + CuSO4 = ZnSO4 + Cu', 'Zn²⁺', 'Cu²⁺', "Daniel–Yakobi elementi EYuK ning konsentratsiyaga bog'liqligi", 'elektrod-rux', 'elektrod-mis'],
];
const chemEMF = (an, ca, cA, cC) => {
  const a = db.metals.get(an), c = db.metals.get(ca);
  return Math.round(((c.E + 0.0592 / c.n * Math.log10(cC)) - (a.E + 0.0592 / a.n * Math.log10(cA))) * 100) / 100;
};
for (const [an, anS, ca, caS, cA, cC, mol, aI, cI, title, eA, eC] of GALV) {
  const emf = chemEMF(an, ca, cA, cC);
  const aN = shortName(an), cN = shortName(ca);
  const conc = cA !== 1 || cC !== 1;
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title, level: conc ? 'litsey' : '10-sinf', topic: 'Galvanik elementlar', engine: 'rules',
    extra: { galvanic: { anode: an, cathode: ca, anodeConc: cA, cathodeConc: cC, anode_solution: anS, cathode_solution: caS, emf_V: emf } },
    reactants: [{ species: an, state: 's', mass_g: 2, form: 'plastinka' }, { species: anS, state: 'aq', conc_M: cA, volume_mL: 50 }, { species: caS, state: 'aq', conc_M: cC, volume_mL: 50 }],
    conditions: { note_uz: 'Ikki yarim element tuz ko\'prigi bilan tutashtiriladi, elektrodlar voltmetrga ulanadi.' },
    equation: { molecular: mol, ionic_full: null, ionic_net: `${an} + ${cI} = ${aI} + ${ca}`, electron_balance: [`${an} − 2e⁻ = ${aI}`, `${cI} + 2e⁻ = ${ca}`] },
    mechType: 'galvanik',
    steps: [`Anod (−): ${aN} oksidlanadi — ${an} − 2e⁻ → ${aI}.`, `Katod (+): ${cI} ionlari qaytariladi — ${ca} ajraladi.`, 'Elektronlar tashqi zanjir (sim) orqali anoddan katodga, ionlar esa tuz ko\'prigi orqali harakatlanadi.'],
    obs: { heat: 'sezilarsiz', effects: [{ type: 'deposit' }], text_uz: `Voltmetr taxminan ${String(emf).replace('.', ',')} V ko'rsatadi; vaqt o'tishi bilan ${cN} elektrod sirtida metall o'tiradi.` },
    kinetics: 'sekin', apparatus: ['kimyoviy-stakan', eA, eC, 'tuz-koprigi', 'voltmetr', 'simlar'],
    procedure: [`Bir stakanga ${anS === 'ZnSO4' ? 'rux sulfat' : 'temir(II) sulfat'} eritmasini quyib, ${aN} elektrodni tushiring.`, `Ikkinchi stakanga ${shortName(caS)} eritmasini (${String(cC).replace('.', ',')} M) quyib, ${cN} elektrodni tushiring.`, 'Stakanlarni tuz ko\'prigi bilan tutashtiring, elektrodlarni voltmetrga ulang.', 'Kuchlanishni yozib oling.'],
    safety: safetyFor([anS, caS]),
    explanation: `Faolroq metall (${aN}) anod bo'lib oksidlanadi, kam faol metall ionlari katodda qaytariladi. Standart sharoitda EYuK standart elektrod potensiallari farqiga teng; konsentratsiya o'zgarsa, Nernst tenglamasiga ko'ra EYuK ham o'zgaradi. Bu holda hisoblangan EYuK ≈ ${String(emf).replace('.', ',')} V.`,
    questions: ['Galvanik elementda anod va katod qaysi elektrod?', 'Tuz ko\'prigining vazifasi nima?', 'EYuK qanday hisoblanadi?'],
    confidence: conc ? "o'rta" : 'yuqori',
  }));
}

// elektr o'tkazuvchanlik
const COND = [
  ['NaCl', 'aq', 0.1, 'kuchli', "Lampochka yorqin yonadi.", "Natriy xlorid kuchli elektrolit: eritmada ionlarga to'liq dissotsilanadi, ionlar elektr tokini o'tkazadi."],
  ['C12H22O11', 'aq', 0.3, "yo'q", "Lampochka yonmaydi.", "Saxaroza noelektrolit: eritmada molekula holida bo'ladi, ion hosil qilmaydi — tok o'tmaydi."],
  ['CH3COOH', 'aq', 0.1, 'kuchsiz', "Lampochka xira yonadi.", "Sirka kislota kuchsiz elektrolit: molekulalarning ozgina qismigina ionlarga dissotsilanadi, shuning uchun eritma tokni yomon o'tkazadi."],
  ['H2O', 'l', null, "yo'q", "Lampochka yonmaydi.", "Distillangan suv juda kuchsiz elektrolit — undagi H⁺ va OH⁻ ionlari juda kam, lampochka yonishi uchun yetarli tok o'tmaydi."],
];
for (const [sp, st, c, lvl, obs, expl] of COND) {
  const sN = shortName(sp);
  out.push(makeRecord({
    id: nextId(PFX), category: CAT, title: `${cap(sN)}${sp === 'H2O' ? ' (distillangan)' : ' eritmasi'}ning elektr o'tkazuvchanligi`, level: '9-sinf', topic: 'Elektrolitik dissotsilanish', engine: 'rules',
    extra: { conductivity: { expected: lvl }, equation_free: sp !== 'NaCl', ...(sp !== 'NaCl' ? { equation_free_uz: lvl === "yo'q" ? 'Modda ionlarga dissotsilanmaydi — dissotsilanish tenglamasi yo\'q.' : "Kuchsiz elektrolit qisman dissotsilanadi: CH₃COOH ⇄ CH₃COO⁻ + H⁺." } : {}) },
    reactants: [st === 'aq' ? { species: sp, state: 'aq', conc_M: c, volume_mL: 50 } : { species: sp, state: 'l', volume_mL: 50 }],
    conditions: {}, equation: sp === 'NaCl' ? { molecular: 'NaCl = Na⁺ + Cl⁻' } : {},
    mechType: 'fizik', steps: [expl],
    obs: { heat: 'sezilarsiz', effects: lvl === 'kuchli' ? [{ type: 'light' }] : [], text_uz: obs },
    kinetics: 'bir-zumda', apparatus: ['kimyoviy-stakan', 'otkazuvchanlik-lampochkasi'],
    procedure: [`Stakanga 50 ml ${sp === 'H2O' ? 'distillangan suv' : sN + ' eritmasi'} quying.`, "O'tkazuvchanlik asbobining elektrodlarini suyuqlikka tushiring.", 'Asbobni tarmoqqa ulang va lampochkani kuzating; so\'ng elektrodlarni chayib qo\'ying.'],
    safety: "Asbobni tarmoqqa ulaganda elektrodlarga tegmang; o'lchashlar orasida elektrodlarni distillangan suv bilan chaying.",
    explanation: expl,
    questions: ['Elektrolit va noelektrolitlarga misollar keltiring.', 'Kuchli va kuchsiz elektrolitlar qanday farqlanadi?'],
    confidence: 'yuqori',
  }));
}
writeCategory(CAT, out);
