// "Karbon kislotalar, murakkab efirlar, yog'lar" toifasi tajribalari generatori.
// Ishga tushirish: node tools/seed/reactions/karbon-kislotalar.mjs
// Natija: frontend/lab/data/reactions/karbon-kislotalar.json (qo'lda tahrirlanishi mumkin; generator qayta yozadi).
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CAT = 'karbon-kislotalar';
const PFX = 'karbon';
const out = [];

function R(o) {
  const id = `${PFX}-${String(out.length + 1).padStart(4, '0')}`;
  const r = { id, category: CAT, title_uz: o.title, level: o.level || '10-sinf', topic_uz: o.topic, engine: o.engine || 'record' };
  if (o.no_reaction) { r.no_reaction = true; r.match = o.match; }
  if (o.equation_free) { r.equation_free = true; r.equation_free_uz = o.equation_free_uz; }
  r.reactants = o.reactants;
  r.conditions = { heating: false, temp_min_C: null, catalyst: null, medium: null, light: false, note_uz: null, ...(o.cond || {}) };
  r.equation = { molecular: null, ionic_full: null, ionic_net: null, electron_balance: null, ...(o.eq || {}) };
  r.mechanism = { type: o.mech || (o.organic ? 'organik' : 'fizik'), steps_uz: o.steps, organic: o.organic || null };
  r.observations = { precipitate: null, gas: null, solution_color_change: null, heat: 'sezilarsiz', flame: null, effects: [], text_uz: '', ...(o.obs || {}) };
  r.kinetics = o.kinetics || 'tez';
  r.apparatus = o.app;
  r.procedure_uz = o.proc;
  r.safety_uz = o.safety;
  r.explanation_uz = o.expl;
  r.questions_uz = o.q;
  r.confidence = o.conf || 'yuqori';
  out.push(r);
}

const H2 = { species: 'H2', color: null, smell_uz: null };
const CO2 = { species: 'CO2', color: null, smell_uz: null };
const TOPIC_ACID = 'Karbon kislotalarning kimyoviy xossalari';
const TOPIC_ESTER = 'Murakkab efirlar: eterifikatsiya va gidroliz';
const TOPIC_FAT = "Yog'lar va sovunlar";
const ATSIL_ESTER = (acyl, alcohol, product) => ({
  template: 'atsil',
  params: { acyl, nucleophile: alcohol, intermediate: 'tetraedrik oraliq birikma', leaving: 'H2O', product },
});
const ESTER_STEPS = [
  "Kislota katalizatori (H⁺) karboksil guruhining karbonil kislorodini protonlaydi — karbonil uglerodning musbat zaryadi ortadi.",
  "Spirt molekulasidagi kislorod atomi (nukleofil) karbonil uglerodga hujum qilib, tetraedrik oraliq birikma hosil qiladi.",
  "Proton ko'chishidan so'ng kislotaning OH guruhi suv molekulasi sifatida ajraladi.",
  "Proton ajralib, murakkab efir hosil bo'ladi; katalizator (H⁺) qayta tiklanadi. Reaksiya qaytar.",
];

// ---------------------------------------------------------------- kislota xossalari (rules)
R({
  title: "Sirka kislotaning natriy gidroksid bilan neytrallanishi (fenolftalein ishtirokida)",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'CH3COOH', state: 'aq', conc_M: 0.1, volume_mL: 2 }, { species: 'NaOH', state: 'aq', conc_M: 0.1, volume_mL: 2 }],
  cond: { note_uz: "Ishqor eritmasiga 1–2 tomchi fenolftalein qo'shiladi, so'ng sirka kislota tomchilab quyiladi." },
  eq: {
    molecular: 'CH3COOH + NaOH → CH3COONa + H2O',
    ionic_full: 'CH3COOH + Na⁺ + OH⁻ → CH3COO⁻ + Na⁺ + H2O',
    ionic_net: 'CH3COOH + OH⁻ → CH3COO⁻ + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Sirka kislota kuchsiz elektrolit, eritmada asosan molekula holida bo'ladi.", "Gidroksid ioni karboksil guruhidan protonni tortib oladi: atsetat ioni va suv hosil bo'ladi.", "Ishqor sarflanib bo'lgach, fenolftaleinning to'q pushti rangi yo'qoladi."],
  obs: { solution_color_change: { from: '#d81b8c', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Fenolftalein qo'shilgan ishqorning to'q pushti (moviy-qizil) rangi sirka kislota qo'shilgan sari ochadi va yo'qoladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml natriy gidroksid eritmasidan quying va 1–2 tomchi fenolftalein qo'shing.", "Tomizgich bilan sirka kislota eritmasini tomchilab qo'shing va probirkani chayqatib turing.", "Eritma rangsizlangan paytni kuzating."],
  safety: "Ishqor va kislota eritmalari ko'zga tushmasligi uchun himoya ko'zoynagi taqing; to'kilgan eritmani ko'p suv bilan yuving.",
  expl: "Sirka kislota karbon kislotalarga xos kislota xossasini namoyon qiladi: ishqor bilan tuz (natriy atsetat) va suv hosil qiladi. Sirka kislota kuchsiz bo'lgani uchun qisqartirilgan ionli tenglamada molekula holida yoziladi. Natriy atsetat gidrolizlanadi, shuning uchun ekvivalent nuqtada eritma kuchsiz ishqoriy bo'ladi va fenolftalein uchun mos indikator hisoblanadi.",
  q: ["Nima uchun ionli tenglamada sirka kislota molekula holida yoziladi?", "Natriy atsetat eritmasi qanday muhitga ega? Nima uchun?"],
});

R({
  title: "Sirka kislotaning magniy bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Mg', state: 's', mass_g: 0.05, form: 'lenta' }, { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  eq: {
    molecular: '2CH3COOH + Mg → (CH3COO)2Mg + H2↑',
    ionic_full: '2CH3COOH + Mg → Mg²⁺ + 2CH3COO⁻ + H2↑',
    ionic_net: '2CH3COOH + Mg → Mg²⁺ + 2CH3COO⁻ + H2↑',
    electron_balance: ['Mg⁰ − 2e⁻ = Mg⁺²', '2H⁺ + 2e⁻ = H2⁰'],
  },
  mech: "o'rin-olish",
  steps: ["Magniy faollik qatorida vodoroddan oldin turadi.", "Magniy atomlari elektron berib Mg²⁺ ionlariga aylanadi; karboksil guruhidagi vodorod atomlari H₂ gacha qaytariladi.", "Sirka kislota kuchsiz bo'lgani uchun reaksiya xlorid kislotadagiga qaraganda sekinroq boradi."],
  obs: { gas: H2, heat: 'ekzotermik', effects: [{ type: 'bubbles' }, { type: 'dissolve' }], text_uz: "Magniy lentasi yuzasidan rangsiz gaz pufakchalari ajraladi, metall asta-sekin eriydi, probirka biroz isiydi." },
  kinetics: "o'rtacha", app: ['probirka', 'pinset', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 3 ml sirka kislota eritmasidan quying.", "Pinset bilan kichik magniy lentasi bo'lagini tushiring.", "Gaz ajralishini kuzating; probirka og'zini teskari tutilgan ikkinchi probirka bilan yopib, gazni yig'ing.", "Yig'ilgan gazni spirt lampasi alangasiga yaqinlashtirib, 'hushtak' ovozini tinglang."],
  safety: "Vodorod havo bilan portlovchi aralashma hosil qiladi — faqat oz miqdordagi gazni sinab ko'ring, alanga yaqinida ko'p gaz to'plamang.",
  expl: "Karbon kislotalar faol metallar bilan reaksiyaga kirishib tuz va vodorod hosil qiladi. Magniy atsetat suvda yaxshi eriydi. Sirka kislota kuchsiz kislota bo'lgani uchun eritmada H⁺ ionlari kam va reaksiya mineral kislotalarga qaraganda sustroq boradi.",
  q: ["Nima uchun bir xil konsentratsiyada magniy xlorid kislotada sirka kislotadagiga qaraganda tezroq eriydi?", "Mis sirka kislota bilan reaksiyaga kirishadimi? Javobingizni asoslang."],
});

R({
  title: "Sirka kislotaning rux bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Zn', state: 's', mass_g: 0.5, form: 'granula' }, { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  cond: { note_uz: "Reaksiya sovuqda sekin boradi; biroz qizdirilsa tezlashadi." },
  eq: {
    molecular: '2CH3COOH + Zn → (CH3COO)2Zn + H2↑',
    ionic_full: '2CH3COOH + Zn → Zn²⁺ + 2CH3COO⁻ + H2↑',
    ionic_net: '2CH3COOH + Zn → Zn²⁺ + 2CH3COO⁻ + H2↑',
    electron_balance: ['Zn⁰ − 2e⁻ = Zn⁺²', '2H⁺ + 2e⁻ = H2⁰'],
  },
  mech: "o'rin-olish",
  steps: ["Rux vodoroddan faolroq metall, lekin magniydan kamroq faol.", "Rux atomlari elektron berib Zn²⁺ ionlariga oksidlanadi, kislota protonlari vodorodgacha qaytariladi.", "Kuchsiz kislotada H⁺ konsentratsiyasi kichik, shuning uchun gaz sekin ajraladi."],
  obs: { gas: H2, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }], text_uz: "Rux granulasi yuzasida mayda gaz pufakchalari sekin hosil bo'ladi; qizdirilganda gaz ajralishi tezlashadi." },
  kinetics: 'sekin', app: ['probirka', 'pinset', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga rux granulasini soling.", "Ustiga 3 ml sirka kislota eritmasidan quying.", "Gaz ajralishini kuzating, so'ng probirkani qisqichga olib biroz qizdiring va o'zgarishni solishtiring."],
  safety: "Qizdirishda probirka og'zini o'zingizga va boshqalarga qaratmang; vodorodni alangaga yaqin to'plamang.",
  expl: "Rux sirka kislotadan vodorodni siqib chiqaradi va rux atsetat hosil bo'ladi. Magniyga qaraganda rux kamroq faol, sirka kislota esa kuchsiz kislota — shuning uchun reaksiya sekin boradi. Harorat ko'tarilganda reaksiya tezligi ortadi.",
  q: ["Rux va magniyning sirka kislota bilan reaksiya tezligini taqqoslang va sababini tushuntiring.", "Bu reaksiyada oksidlovchi va qaytaruvchini ko'rsating."],
});

R({
  title: "Sirka kislotaning natriy karbonat bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Na2CO3', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  eq: {
    molecular: '2CH3COOH + Na2CO3 → 2CH3COONa + H2O + CO2↑',
    ionic_full: '2CH3COOH + 2Na⁺ + CO3²⁻ → 2CH3COO⁻ + 2Na⁺ + H2O + CO2↑',
    ionic_net: '2CH3COOH + CO3²⁻ → 2CH3COO⁻ + H2O + CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Sirka kislota karbonat kislotadan kuchliroq, shuning uchun karbonat ioniga proton beradi.", "Hosil bo'lgan karbonat kislota beqaror — suv va karbonat angidridga parchalanadi.", "CO₂ gazi pufakchalar holida ajraladi."],
  obs: { gas: CO2, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'foam' }], text_uz: "Shiddatli ko'piklanish kuzatiladi — rangsiz, hidsiz gaz ajraladi; gaz ohakli suvni loyqalantiradi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich', 'gaz-naycha-egilgan'],
  proc: ["Probirkaga 2 ml natriy karbonat eritmasidan quying.", "Ustiga sirka kislota eritmasidan qo'shing.", "Ajralayotgan gazni gaz chiqarish naychasi orqali ohakli suvga o'tkazing va loyqalanishni kuzating."],
  safety: "Ko'piklanish kuchli bo'ladi — probirkani yarmidan ortiq to'ldirmang; ko'zoynak taqing.",
  expl: "Sirka kislota karbonat kislotadan kuchliroq, shuning uchun uni tuzlaridan siqib chiqaradi. Bu reaksiya karbon kislotalarning kislota xossasini va kislotalar kuchi qatorini ko'rsatadi: sirka kislota > karbonat kislota.",
  q: ["Ajralgan gazni qanday aniqlash mumkin?", "Sirka kislota natriy sulfatdan sulfat kislotani siqib chiqara oladimi? Nima uchun?"],
});

R({
  title: "Osh sirkasining ichimlik sodasi bilan reaksiyasi",
  level: '9-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'NaHCO3', state: 's', mass_g: 0.5 }, { species: 'CH3COOH', state: 'aq', conc_M: 1.5, volume_mL: 5 }],
  eq: {
    molecular: 'CH3COOH + NaHCO3 → CH3COONa + H2O + CO2↑',
    ionic_full: 'CH3COOH + Na⁺ + HCO3⁻ → CH3COO⁻ + Na⁺ + H2O + CO2↑',
    ionic_net: 'CH3COOH + HCO3⁻ → CH3COO⁻ + H2O + CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Gidrokarbonat ioni sirka kislotadan proton qabul qiladi.", "Hosil bo'lgan H₂CO₃ darhol CO₂ va H₂O ga parchalanadi.", "Gaz pufakchalari suyuqlikni ko'pirtiradi."],
  obs: { gas: CO2, heat: 'endotermik', effects: [{ type: 'bubbles' }, { type: 'foam' }], text_uz: "Soda ustiga sirka quyilganda kuchli ko'pik hosil bo'ladi, rangsiz gaz ajraladi; aralashma biroz soviydi." },
  kinetics: 'bir-zumda', app: ['kimyoviy-stakan', 'shisha-tayoqcha'],
  proc: ["Kimyoviy stakanga choy qoshig'ining uchida ichimlik sodasi (NaHCO₃) soling.", "Ustiga 5 ml osh sirkasi (9% li sirka kislota) quying.", "Ko'piklanishni kuzating, stakan devorini ushlab haroratni seziib ko'ring."],
  safety: "Sirka ko'zga tushsa ko'p suv bilan yuving; reaksiya xavfsiz, lekin aralashmani tatib ko'rmang.",
  expl: "Sirka kislota karbonat kislotadan kuchliroq bo'lgani uchun gidrokarbonatdan CO₂ ni siqib chiqaradi. Uy sharoitida xamirni ko'pirtirishda soda va sirka (yoki boshqa oziq kislotasi) ishlatilishi shu reaksiyaga asoslangan.",
  q: ["Pishiriqlarda soda nima uchun kislotali mahsulot (qatiq, sirka) bilan birga ishlatiladi?", "Bu reaksiyada ajralgan gaz qanday sharoitda yonishni o'chiradi?"],
});

R({
  title: "Sirka kislotada kalsiy karbonatning (tuxum po'chog'ining) erishi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'CaCO3', state: 's', mass_g: 0.5, form: "bo'lak" }, { species: 'CH3COOH', state: 'aq', conc_M: 1.5, volume_mL: 5 }],
  eq: {
    molecular: '2CH3COOH + CaCO3 → (CH3COO)2Ca + H2O + CO2↑',
    ionic_full: '2CH3COOH + CaCO3 → Ca²⁺ + 2CH3COO⁻ + H2O + CO2↑',
    ionic_net: '2CH3COOH + CaCO3 → Ca²⁺ + 2CH3COO⁻ + H2O + CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Sirka kislota molekulalari CaCO₃ yuzasidagi karbonat ionlariga proton beradi.", "Karbonat kislota parchalanib CO₂ ajraladi.", "Kalsiy atsetat suvda eriydi, qattiq modda asta-sekin yo'qoladi."],
  obs: { gas: CO2, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'dissolve' }], text_uz: "Bo'lak yuzasidan gaz pufakchalari uzluksiz ajraladi, qattiq modda asta-sekin eriydi." },
  kinetics: "o'rtacha", app: ['probirka', 'pinset'],
  proc: ["Probirkaga kichik marmar bo'lagi yoki tuxum po'chog'i bo'lagini soling.", "Ustiga 5 ml osh sirkasidan quying.", "Gaz ajralishini va bo'lakning asta-sekin erishini kuzating."],
  safety: "Sirka kislota bug'ini hidlamang; ko'zoynak taqing.",
  expl: "Kalsiy karbonat suvda erimaydi, lekin sirka kislota kabi kuchsiz kislotalarda ham eriydi, chunki karbonat kislota sirka kislotadan kuchsiz. Choynakdagi qasmoqni (CaCO₃) sirka yoki limon kislota bilan tozalash shu reaksiyaga asoslangan.",
  q: ["Choynak qasmog'ini tozalash uchun nima sababdan sirka ishlatiladi?", "Kalsiy atsetat suvda eriydimi?"],
});

R({
  title: "Sirka kislotaning mis(II) gidroksidni eritishi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Cu(OH)2', state: 's', mass_g: 0.1 }, { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  cond: { note_uz: "Cu(OH)₂ oldindan CuSO₄ va NaOH eritmalaridan yangi cho'ktirib olinadi." },
  eq: {
    molecular: '2CH3COOH + Cu(OH)2 → (CH3COO)2Cu + 2H2O',
    ionic_full: '2CH3COOH + Cu(OH)2 → Cu²⁺ + 2CH3COO⁻ + 2H2O',
    ionic_net: '2CH3COOH + Cu(OH)2 → Cu²⁺ + 2CH3COO⁻ + 2H2O',
  },
  mech: 'neytrallanish',
  steps: ["Erimaydigan asos Cu(OH)₂ kislota bilan neytrallanadi.", "Gidroksid ionlari kislota protonlari bilan suv hosil qiladi.", "Mis(II) ionlari eritmaga o'tib, uni ko'k rangga bo'yaydi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#4aa3dc' }, heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Havorang iviqsimon cho'kma eriydi, eritma ko'k rangga kiradi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkada 1 ml CuSO₄ eritmasiga NaOH eritmasidan qo'shib, havorang Cu(OH)₂ cho'kmasini oling.", "Cho'kma ustiga tomchilab sirka kislota eritmasini qo'shing va chayqating.", "Cho'kmaning erishini va eritma rangini kuzating."],
  safety: "Mis birikmalari zaharli — qo'lga tekkan bo'lsa yuving, chiqindini idishga yig'ing.",
  expl: "Karbon kislotalar erimaydigan asoslar bilan ham neytrallanish reaksiyasiga kirishadi. Hosil bo'lgan mis(II) atsetat suvda eriydi va Cu²⁺ ionlari eritmaga ko'k rang beradi.",
  q: ["Mis(II) gidroksid sirka kislotada erishining sababi nima?", "Bu reaksiya qaysi turdagi reaksiyalarga kiradi?"],
});

R({
  title: "Sirka kislotaning mis(II) oksid bilan qizdirilgandagi reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'record',
  reactants: [{ species: 'CuO', state: 's', mass_g: 0.1, form: 'kukun' }, { species: 'CH3COOH', state: 'aq', conc_M: 1.5, volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 70, note_uz: "Aralashma spirt lampasida qaynaguncha qizdiriladi." },
  eq: {
    molecular: '2CH3COOH + CuO → (CH3COO)2Cu + H2O',
    ionic_full: '2CH3COOH + CuO → Cu²⁺ + 2CH3COO⁻ + H2O',
    ionic_net: '2CH3COOH + CuO → Cu²⁺ + 2CH3COO⁻ + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Asosli oksid CuO kislota bilan tuz va suv hosil qiladi.", "Sirka kislota kuchsiz bo'lgani uchun sovuqda reaksiya juda sekin boradi; qizdirish uni tezlashtiradi.", "Eritmaga o'tgan Cu²⁺ ionlari ko'k-yashil rang beradi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#4aa3dc' }, solid_color_change: { from: '#1a1a1a', to: null }, heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Qizdirilganda qora kukun asta-sekin eriydi, eritma ko'k-yashil rangga bo'yaladi." },
  kinetics: 'sekin', app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga ozgina mis(II) oksid kukunini soling.", "Ustiga 3 ml sirka kislota eritmasidan quying — sovuqda o'zgarish deyarli sezilmaydi.", "Probirkani qisqichga olib, spirt lampasida ehtiyotlik bilan qizdiring.", "Eritma rangining o'zgarishini kuzating."],
  safety: "Qizdirishda probirka og'zini odamlarga qaratmang; sirka kislota bug'i ko'z va nafas yo'llarini achishtiradi.",
  expl: "Karbon kislotalar asosli oksidlar bilan tuz va suv hosil qiladi. Sirka kislota kuchsiz bo'lgani uchun mis(II) oksid bilan reaksiya qizdirilganda sezilarli tezlikda boradi. Hosil bo'lgan mis(II) atsetat eritmasi ko'k-yashil rangli.",
  q: ["Nima uchun reaksiya sovuqda juda sekin boradi?", "Mis(II) atsetatni yana qanday usullar bilan olish mumkin?"],
});

R({
  title: "Natriy atsetatdan sulfat kislota ta'sirida sirka kislotaning siqib chiqarilishi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'CH3COONa', state: 'aq', conc_M: 1, volume_mL: 2 }, { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 }],
  cond: { note_uz: "Hidni sezish uchun aralashma biroz iliqlanadi." },
  eq: {
    molecular: '2CH3COONa + H2SO4 → 2CH3COOH + Na2SO4',
    ionic_full: '2CH3COO⁻ + 2Na⁺ + 2H⁺ + SO4²⁻ → 2CH3COOH + 2Na⁺ + SO4²⁻',
    ionic_net: 'CH3COO⁻ + H⁺ → CH3COOH',
  },
  mech: 'ion-almashinish',
  steps: ["Sulfat kislota kuchli kislota — eritmada H⁺ ionlari ko'p.", "Atsetat ionlari protonlarni biriktirib, kam dissotsilanadigan sirka kislota molekulalarini hosil qiladi.", "Uchuvchan sirka kislota hidi seziladi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Tashqi o'zgarish ko'rinmaydi, lekin iliqlangan aralashmadan o'tkir sirka hidi keladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml natriy atsetat eritmasidan quying.", "Unga 1 ml suyultirilgan sulfat kislota qo'shing.", "Probirkani biroz iliqlang va hidni qo'l harakati bilan o'zingiz tomonga yelpib, ehtiyotlik bilan hidlang."],
  safety: "Hidni bevosita probirka og'zidan hidlamang — qo'l bilan yelpib hidlang; sulfat kislota terini kuydiradi.",
  expl: "Kuchli kislota kuchsiz kislotani uning tuzidan siqib chiqaradi. Sirka kislota kuchsiz va uchuvchan bo'lgani uchun uning o'ziga xos hidi paydo bo'ladi. Bu usul atsetat ionini aniqlashda ham qo'llaniladi.",
  q: ["Nima uchun sirka kislota natriy sulfat eritmasidan sulfat kislotani siqib chiqara olmaydi?", "Laboratoriyada sirka kislotani qanday olish mumkin?"],
});

R({
  title: "Sirka kislotaning natriy silikatdan silikat kislotani siqib chiqarishi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Na2SiO3', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  eq: {
    molecular: '2CH3COOH + Na2SiO3 → H2SiO3↓ + 2CH3COONa',
    ionic_full: '2CH3COOH + 2Na⁺ + SiO3²⁻ → H2SiO3↓ + 2CH3COO⁻ + 2Na⁺',
    ionic_net: '2CH3COOH + SiO3²⁻ → H2SiO3↓ + 2CH3COO⁻',
  },
  mech: 'ion-almashinish',
  steps: ["Silikat kislota juda kuchsiz kislota, sirka kislota undan kuchli.", "Silikat ionlari sirka kislotadan proton olib, suvda erimaydigan H₂SiO₃ hosil qiladi.", "Silikat kislota iviqsimon (gel) cho'kma holida ajraladi."],
  obs: { precipitate: { species: 'H2SiO3', color: '#f2f2ee', texture: 'iviqsimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oq, shaffofroq iviqsimon (gel) cho'kma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml natriy silikat eritmasidan quying.", "Tomizgich bilan sirka kislota eritmasini qo'shing va chayqating.", "Iviqsimon cho'kma hosil bo'lishini kuzating."],
  safety: "Natriy silikat eritmasi ishqoriy — teriga tegsa suv bilan yuving; ko'zoynak taqing.",
  expl: "Sirka kislota silikat kislotadan kuchliroq, shuning uchun uni tuzidan siqib chiqaradi. Bu tajriba kislotalar kuchi qatorini tushunishga yordam beradi: sirka kislota karbonat va silikat kislotalardan kuchli, lekin mineral kislotalardan kuchsiz.",
  q: ["Kislotalarni kuchi bo'yicha qatorga joylashtiring: sirka, silikat, xlorid, karbonat.", "Hosil bo'lgan cho'kma qanday ko'rinishga ega?"],
});

R({
  title: "Chumoli kislotaning natriy karbonat bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'Na2CO3', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'HCOOH', state: 'aq', conc_M: 1, volume_mL: 2 }],
  eq: {
    molecular: '2HCOOH + Na2CO3 → 2HCOONa + H2O + CO2↑',
    ionic_full: '2HCOOH + 2Na⁺ + CO3²⁻ → 2HCOO⁻ + 2Na⁺ + H2O + CO2↑',
    ionic_net: '2HCOOH + CO3²⁻ → 2HCOO⁻ + H2O + CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Chumoli kislota karbon kislotalar ichida eng kuchlilaridan biri (sirka kislotadan kuchliroq).", "Karbonat ioni protonlarni qabul qilib, H₂CO₃ hosil qiladi.", "H₂CO₃ parchalanib CO₂ ajraladi."],
  obs: { gas: CO2, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'foam' }], text_uz: "Rangsiz, hidsiz gaz shiddatli ajraladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml natriy karbonat eritmasidan quying.", "Ustiga chumoli kislota eritmasidan qo'shing.", "Gaz ajralishini kuzating."],
  safety: "Chumoli kislota terini kuydiradi — qo'lqop va ko'zoynak taqing; bug'ini hidlamang.",
  expl: "Chumoli kislota umumiy kislota xossalarini namoyon qiladi: karbonatlardan CO₂ ni siqib chiqaradi va formiatlar hosil qiladi. Formiat ionidagi vodorod atomi bilan bog'langan C atomi aldegid guruhi tutganligi sababli chumoli kislota qaytaruvchilik xossasiga ham ega.",
  q: ["Chumoli kislota tuzlari qanday ataladi?", "Chumoli kislota va sirka kislotadan qaysi biri kuchliroq?"],
});

// ---------------------------------------------------------------- chumoli kislota — qaytaruvchi
R({
  title: "Chumoli kislotaning kaliy permanganat bilan oksidlanishi",
  level: '10-sinf', topic: "Chumoli kislotaning qaytaruvchilik xossalari", engine: 'record',
  reactants: [
    { species: 'KMnO4', state: 'aq', conc_M: 0.02, volume_mL: 2 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 },
    { species: 'HCOOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  cond: { heating: true, temp_min_C: 40, medium: 'kislotali', note_uz: "Kislotalangan permanganat eritmasiga chumoli kislota qo'shilib, biroz iliqlanadi." },
  eq: {
    molecular: '5HCOOH + 2KMnO4 + 3H2SO4 → 2MnSO4 + K2SO4 + 5CO2↑ + 8H2O',
    ionic_full: '5HCOOH + 2K⁺ + 2MnO4⁻ + 6H⁺ + 3SO4²⁻ → 2Mn²⁺ + 2SO4²⁻ + 2K⁺ + SO4²⁻ + 5CO2↑ + 8H2O',
    ionic_net: '5HCOOH + 2MnO4⁻ + 6H⁺ → 2Mn²⁺ + 5CO2↑ + 8H2O',
    electron_balance: ['C⁺² − 2e⁻ = C⁺⁴', 'Mn⁺⁷ + 5e⁻ = Mn⁺²'],
  },
  mech: 'organik',
  steps: ["Chumoli kislota molekulasida karboksil guruhi bilan birga aldegid guruhi (H–C=O) ham bor.", "Kislotali muhitda MnO₄⁻ ioni kuchli oksidlovchi: C⁺² atomini C⁺⁴ gacha (CO₂) oksidlaydi.", "Mn⁺⁷ beshta elektron qabul qilib rangsiz Mn²⁺ ga qaytariladi."],
  organic: { template: 'oksidlanish', params: { substrate: 'H–COOH', oxidant: 'KMnO4 (H⁺)', product: 'CO2 + H2O' } },
  obs: { gas: CO2, solution_color_change: { from: '#8e1a8e', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }, { type: 'swirl' }], text_uz: "Binafsha rangli eritma rangsizlanadi, mayda gaz pufakchalari ajraladi." },
  kinetics: "o'rtacha", app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml kaliy permanganat eritmasidan va 1 ml suyultirilgan sulfat kislotadan quying.", "Ustiga 1 ml chumoli kislota eritmasidan qo'shing.", "Probirkani qisqichga olib, spirt lampasida biroz iliqlang.", "Eritma rangining o'zgarishini va gaz ajralishini kuzating."],
  safety: "Chumoli kislota va sulfat kislota terini kuydiradi; kaliy permanganat kuchli oksidlovchi. Ko'zoynak va qo'lqopdan foydalaning.",
  expl: "Chumoli kislota karbon kislotalar ichida yagona bo'lib, molekulasida aldegid guruhi saqlaydi, shuning uchun oson oksidlanadi va permanganatni rangsizlantiradi. Sirka kislota bunday sharoitda permanganatni rangsizlantirmaydi — bu ikki kislotani farqlash usuli.",
  q: ["Chumoli kislota tuzilishining qanday xususiyati uning qaytaruvchilik xossasiga sabab bo'ladi?", "Elektron balans usulida koeffitsiyentlarni tushuntiring.", "Sirka kislota va chumoli kislotani qanday farqlash mumkin?"],
});

R({
  title: "Chumoli kislotaning \"kumush ko'zgu\" reaksiyasi",
  level: '10-sinf', topic: "Chumoli kislotaning qaytaruvchilik xossalari", engine: 'record',
  reactants: [{ species: 'Tollens', state: 'aq', volume_mL: 4 }, { species: 'HCOOH', state: 'aq', conc_M: 1, volume_mL: 0.5 }],
  cond: { heating: true, temp_min_C: 50, note_uz: "Probirka issiq suv hammomida (60–70 °C) qizdiriladi; chayqatilmaydi." },
  eq: {
    molecular: 'HCOOH + 2[Ag(NH3)2]OH → 2Ag↓ + (NH4)2CO3 + 2NH3 + H2O',
    ionic_net: 'HCOO⁻ + 2[Ag(NH3)2]⁺ + H2O → 2Ag↓ + HCO3⁻ + 2NH4⁺ + 2NH3',
    electron_balance: ['C⁺² − 2e⁻ = C⁺⁴', 'Ag⁺ + 1e⁻ = Ag⁰'],
  },
  mech: 'organik',
  steps: ["Ammiakli eritmada chumoli kislota formiat ioniga aylanadi; uning H–C=O qismi aldegid guruhi kabi qaytaruvchi.", "Diamminkumush(I) ionlari formiatdan elektron olib, metall kumushgacha qaytariladi.", "Formiat karbonatgacha (C⁺⁴) oksidlanadi; kumush probirka devoriga yupqa ko'zgu qatlami bo'lib o'tiradi."],
  organic: { template: 'oksidlanish', params: { substrate: 'H–COOH', oxidant: '[Ag(NH3)2]⁺', product: '(NH4)2CO3' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'mirror' }, { type: 'deposit' }], text_uz: "Probirka devorlarida yaltiroq kumush ko'zgu qatlami (ba'zan qora-kulrang cho'kma) hosil bo'ladi." },
  kinetics: "o'rtacha", app: ['probirka', 'suv-hammomi', 'tomizgich', 'termometr'],
  proc: ["Yaxshilab yuvilgan (ishqor bilan yog'sizlantirilgan) probirkaga 2–4 ml yangi tayyorlangan Tollens reaktivi quying.", "Unga 3–5 tomchi chumoli kislota eritmasi qo'shing.", "Probirkani 60–70 °C li suv hammomiga qo'ying va chayqatmasdan bir necha daqiqa kuzating."],
  safety: "Tollens reaktivini faqat tajriba oldidan tayyorlang va saqlamang — eskirganda portlovchi birikmalar hosil bo'lishi mumkin. Tajribadan so'ng qoldiqni darhol nitrat kislota bilan zararsizlantirib to'king.",
  expl: "Chumoli kislota molekulasida aldegid guruhi bo'lgani uchun u aldegidlar kabi \"kumush ko'zgu\" reaksiyasini beradi. Bu reaksiya chumoli kislotani boshqa to'yingan monokarbon kislotalardan farqlashga imkon beradi: sirka kislota bu reaksiyani bermaydi.",
  q: ["Nima uchun chumoli kislota \"kumush ko'zgu\" reaksiyasini beradi, sirka kislota esa bermaydi?", "Bu reaksiyada oksidlovchi va qaytaruvchini ko'rsating.", "Kumush ko'zgu yaxshi chiqishi uchun probirka qanday tayyorlanadi?"],
});

R({
  title: "Chumoli kislotaning mis(II) gidroksid bilan qizdirilgandagi reaksiyasi",
  level: '10-sinf', topic: "Chumoli kislotaning qaytaruvchilik xossalari", engine: 'record',
  reactants: [{ species: 'Cu(OH)2', state: 's', mass_g: 0.1 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 2, excess: true }, { species: 'HCOOH', state: 'aq', conc_M: 1, volume_mL: 1 }],
  cond: { heating: true, temp_min_C: 60, medium: null, note_uz: "Cu(OH)₂ ortiqcha ishqor ishtirokida yangi cho'ktirib olinadi, so'ng chumoli kislota qo'shilib qizdiriladi." },
  eq: {
    molecular: 'HCOOH + 2Cu(OH)2 + 2NaOH → Cu2O↓ + Na2CO3 + 4H2O',
    ionic_full: 'HCOOH + 2Cu(OH)2 + 2Na⁺ + 2OH⁻ → Cu2O↓ + 2Na⁺ + CO3²⁻ + 4H2O',
    ionic_net: 'HCOOH + 2Cu(OH)2 + 2OH⁻ → Cu2O↓ + CO3²⁻ + 4H2O',
    electron_balance: ['C⁺² − 2e⁻ = C⁺⁴', 'Cu⁺² + 1e⁻ = Cu⁺¹'],
  },
  mech: 'organik',
  steps: ["Ishqoriy muhitda chumoli kislota formiat ioniga aylanadi.", "Qizdirilganda formiatning aldegid guruhi Cu(OH)₂ ni mis(I) oksidgacha qaytaradi.", "Formiat karbonatgacha oksidlanadi, qizil Cu₂O cho'kmaga tushadi."],
  organic: { template: 'oksidlanish', params: { substrate: 'H–COOH', oxidant: 'Cu(OH)2', product: 'Na2CO3' } },
  obs: { precipitate: { species: 'Cu2O', color: '#b8321e', texture: 'kukunsimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Qizdirilganda havorang cho'kma avval sarg'ayadi, so'ng g'isht-qizil Cu₂O cho'kmasiga aylanadi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml NaOH eritmasidan quyib, unga 3–4 tomchi CuSO₄ eritmasi qo'shing — havorang Cu(OH)₂ cho'kmasi hosil bo'ladi.", "Aralashmaga 1 ml chumoli kislota eritmasi qo'shing (muhit ishqoriy qolishi kerak).", "Probirkani qisqichga olib, aralashmaning yuqori qismini spirt lampasida qizdiring.", "Cho'kma rangining o'zgarishini kuzating."],
  safety: "Ishqor eritmasi qizdirilganda sachrashi mumkin — probirka og'zini odamlarga qaratmang, ko'zoynak taqing.",
  expl: "Chumoli kislota aldegid guruhi tutgani uchun aldegidlar kabi mis(II) gidroksidni qizdirilganda Cu₂O gacha qaytaradi. Ishqoriy muhitda oksidlanish mahsuloti karbonat ioni bo'ladi. Bu reaksiya ham chumoli kislotaning boshqa karbon kislotalardan farqini ko'rsatadi.",
  q: ["Bu reaksiya qaysi sinf organik birikmalariga xos sifat reaksiyasi?", "Nima uchun reaksiya ishqoriy muhitda olib boriladi?"],
});

R({
  title: "Sirka kislotaning kaliy permanganatni rangsizlantirmasligi",
  level: '10-sinf', topic: "Chumoli va sirka kislotalarni farqlash", engine: 'record',
  no_reaction: true, match: ['CH3COOH', 'MnO4⁻'],
  reactants: [
    { species: 'KMnO4', state: 'aq', conc_M: 0.02, volume_mL: 2 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 },
    { species: 'CH3COOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  cond: { note_uz: "Taqqoslash uchun parallel ravishda chumoli kislota bilan ham tajriba qilinadi." },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Sirka kislotadagi karboksil uglerodi allaqachon C⁺³ holatida, metil guruhi esa C–H bog'lari mustahkam to'yingan guruh.", "Molekulada aldegid guruhi yo'q, shuning uchun permanganat bu sharoitda uni oksidlay olmaydi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Binafsha rang saqlanib qoladi — reaksiya kuzatilmaydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Ikki probirkaga 2 ml dan kaliy permanganat eritmasi va 1 ml dan suyultirilgan sulfat kislota quying.", "Birinchisiga 1 ml sirka kislota, ikkinchisiga 1 ml chumoli kislota eritmasi qo'shing.", "Ikkala probirkani biroz iliqlang va ranglarni solishtiring."],
  safety: "Kaliy permanganat terini bo'yaydi; kislotalar bilan ehtiyot bo'ling, ko'zoynak taqing.",
  expl: "Sirka kislota oksidlovchilarga nisbatan barqaror: uning molekulasida chumoli kislotadagidek aldegid guruhi yo'q. Shu sababli kislotali permanganat eritmasi rangsizlanmaydi. Chumoli kislota esa bu sharoitda CO₂ gacha oksidlanadi va eritmani rangsizlantiradi.",
  q: ["Sirka kislota va chumoli kislotani bitta reaktiv yordamida qanday farqlash mumkin?", "Nima uchun sirka kislota oksidlanishga barqaror?"],
});

// ---------------------------------------------------------------- eterifikatsiya
R({
  title: "Etilatsetat olish (eterifikatsiya reaksiyasi)",
  level: '10-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'CH3COOH', state: 'l', volume_mL: 2 }, { species: 'C2H5OH', state: 'l', volume_mL: 2 }],
  cond: { heating: true, temp_min_C: 60, catalyst: 'H2SO4', note_uz: "Katalizator — 0,5 ml konsentrlangan sulfat kislota; aralashma suv hammomida 5–7 daqiqa qizdiriladi." },
  eq: { molecular: 'CH3COOH + C2H5OH ⇄ CH3COOC2H5 + H2O' },
  mech: 'organik',
  steps: ESTER_STEPS,
  organic: ATSIL_ESTER('CH3–CO–OH', 'C2H5–OH', 'CH3–CO–O–C2H5'),
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }, { type: 'condensate' }], text_uz: "Aralashma sovuq to'yingan NaCl eritmasiga quyilganda yuzaga meva (nashvati) hidli rangsiz moysimon qatlam — etilatsetat ajraladi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'probirka-qisqichi', 'tomizgich', 'kimyoviy-stakan'],
  proc: ["Quruq probirkaga 2 ml muz sirka kislota va 2 ml etil spirti quying.", "Ehtiyotlik bilan 0,5 ml konsentrlangan sulfat kislota qo'shing va aralashtiring.", "Probirkani 5–7 daqiqa issiq suv hammomida qizdiring (qaynatmang).", "Sovigan aralashmani sovuq to'yingan osh tuzi eritmasi solingan stakanga quying va yuzadagi qatlamni hamda hidni kuzating."],
  safety: "Konsentrlangan sulfat kislota terini kuydiradi — qo'lqop va ko'zoynak taqing. Etanol va etilatsetat yonuvchan: ochiq alangadan uzoqda, suv hammomida qizdiring.",
  expl: "Karbon kislotalar spirtlar bilan kislota katalizatori ishtirokida murakkab efir va suv hosil qiladi — bu eterifikatsiya reaksiyasi. Reaksiya qaytar; konsentrlangan sulfat kislota katalizator va suvni bog'lovchi modda bo'lib, muvozanatni efir hosil bo'lishi tomon siljitadi. Nishonli atomlar usuli suv molekulasidagi kislorod kislotaning OH guruhidan ajralishini ko'rsatgan.",
  q: ["Nima uchun eterifikatsiya reaksiyasi qaytar? Muvozanatni efir tomon qanday siljitish mumkin?", "Reaksiyada hosil bo'ladigan suvdagi kislorod atomi qaysi moddadan keladi?", "Nima uchun reaksiya aralashmasi osh tuzi eritmasiga quyiladi?"],
});

R({
  title: "Izoamilatsetat (\"nok essensiyasi\") olish",
  level: '10-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'CH3COOH', state: 'l', volume_mL: 1 }, { species: 'C5H11OH', state: 'l', volume_mL: 1 }],
  cond: { heating: true, temp_min_C: 70, catalyst: 'H2SO4', note_uz: "Katalizator — bir necha tomchi konsentrlangan sulfat kislota; aralashma qaynoq suv hammomida 10 daqiqa qizdiriladi." },
  eq: { molecular: 'CH3COOH + C5H11OH ⇄ CH3COOC5H11 + H2O' },
  mech: 'organik',
  steps: ESTER_STEPS,
  organic: ATSIL_ESTER('CH3–CO–OH', 'C5H11–OH', 'CH3–CO–O–C5H11'),
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Suv bilan suyultirilganda yuzaga nok (banan) hidli moysimon qatlam ajraladi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'probirka-qisqichi', 'tomizgich'],
  proc: ["Quruq probirkaga 1 ml muz sirka kislota va 1 ml izoamil spirti quying.", "3–4 tomchi konsentrlangan sulfat kislota qo'shing.", "Probirkani qaynoq suv hammomida 10 daqiqa qizdiring.", "Sovigach, 3–4 ml sovuq suv qo'shing va hidni yelpib hidlang."],
  safety: "Izoamil spirti bug'i nafas yo'llarini qitiqlaydi va zararli; tajribani mo'rili shkafda o'tkazing. Konsentrlangan sulfat kislotadan ehtiyot bo'ling.",
  expl: "Izoamil spirti sirka kislota bilan sulfat kislota katalizatorligida izoamilatsetat hosil qiladi. Ko'plab murakkab efirlar meva va gullarga xos yoqimli hidga ega bo'lib, oziq-ovqat sanoatida xushbo'y essensiyalar sifatida ishlatiladi.",
  q: ["Murakkab efirlar tabiatda qayerlarda uchraydi?", "Izoamilatsetatning hosil bo'lish tenglamasini tuzilish formulalari bilan yozing."],
});

R({
  title: "Etilformiat olish (\"rom essensiyasi\")",
  level: '10-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'HCOOH', state: 'l', volume_mL: 1 }, { species: 'C2H5OH', state: 'l', volume_mL: 1 }],
  cond: { heating: true, temp_min_C: 50, catalyst: 'H2SO4', note_uz: "Katalizator — bir necha tomchi konsentrlangan sulfat kislota; iliq suv hammomida (50–60 °C) qizdiriladi." },
  eq: { molecular: 'HCOOH + C2H5OH ⇄ HCOOC2H5 + H2O' },
  mech: 'organik',
  steps: ESTER_STEPS,
  organic: ATSIL_ESTER('H–CO–OH', 'C2H5–OH', 'H–CO–O–C2H5'),
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Sovuq suvga quyilganda o'ziga xos rom hidli uchuvchan efir hidi seziladi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'probirka-qisqichi', 'tomizgich'],
  proc: ["Quruq probirkaga 1 ml chumoli kislota va 1 ml etil spirti quying.", "2–3 tomchi konsentrlangan sulfat kislota qo'shing.", "Probirkani iliq suv hammomida 5 daqiqa qizdiring.", "Aralashmani sovuq suvga quyib, hidni yelpib hidlang."],
  safety: "Chumoli va sulfat kislotalar terini kuydiradi; etilformiat juda uchuvchan va yonuvchan — alangadan uzoq tuting.",
  expl: "Chumoli kislota ham boshqa karbon kislotalar kabi spirtlar bilan murakkab efir hosil qiladi. Etilformiat past haroratda qaynaydigan uchuvchan suyuqlik bo'lib, rom hidiga ega; oziq-ovqat xushbo'ylovchisi sifatida qo'llaniladi.",
  q: ["Etilformiatning izomeri bo'lgan karbon kislotani ayting.", "Etilformiat \"kumush ko'zgu\" reaksiyasini beradimi? Nima uchun?"],
});

R({
  title: "Metilsalitsilat olish",
  level: '11-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'C6H4(OH)COOH', state: 's', mass_g: 0.3 }, { species: 'CH3OH', state: 'l', volume_mL: 1 }],
  cond: { heating: true, temp_min_C: 60, catalyst: 'H2SO4', note_uz: "Katalizator — 3–4 tomchi konsentrlangan sulfat kislota; suv hammomida 5–10 daqiqa qizdiriladi." },
  eq: { molecular: 'C6H4(OH)COOH + CH3OH ⇄ C6H4(OH)COOCH3 + H2O' },
  mech: 'organik',
  steps: ESTER_STEPS,
  organic: ATSIL_ESTER('HO–C6H4–CO–OH', 'CH3–OH', 'HO–C6H4–CO–O–CH3'),
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Sovuq suvga quyilganda o'tkir \"dorivor\" (qishyashil moyi) hidli og'ir moysimon tomchilar paydo bo'ladi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'probirka-qisqichi', 'tomizgich', 'kimyoviy-stakan'],
  proc: ["Quruq probirkaga 0,3 g salitsil kislota va 1 ml metanol soling.", "3–4 tomchi konsentrlangan sulfat kislota qo'shing.", "Probirkani suv hammomida 5–10 daqiqa qizdiring.", "Aralashmani sovuq suvli stakanga quyib, hidni yelpib hidlang."],
  safety: "Metanol zaharli — ichish, bug'ini hidlash va teriga tekkazish mumkin emas; tajriba mo'rili shkafda o'tkaziladi. Konsentrlangan sulfat kislota bilan ehtiyot bo'ling.",
  expl: "Salitsil kislotaning karboksil guruhi metanol bilan eterifikatsiyaga kirishib metilsalitsilat hosil qiladi; fenol gidroksili bu sharoitda o'zgarmaydi. Metilsalitsilat og'riq qoldiruvchi surtmalar tarkibiga kiradi.",
  q: ["Salitsil kislota molekulasida qaysi funksional guruhlar bor?", "Nima uchun bu reaksiyada fenol gidroksili efir hosil qilmaydi?"],
});

R({
  title: "Etilatsetatning kislotali muhitda gidrolizi",
  level: '10-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'CH3COOC2H5', state: 'l', volume_mL: 1 }, { species: 'H2O', state: 'l', volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 60, catalyst: 'H2SO4', note_uz: "Katalizator — 1 ml suyultirilgan sulfat kislota; aralashma qaytar sovutgich bilan suv hammomida qizdiriladi." },
  eq: { molecular: 'CH3COOC2H5 + H2O ⇄ CH3COOH + C2H5OH' },
  mech: 'organik',
  steps: ["H⁺ ioni efirning karbonil kislorodini protonlaydi.", "Suv molekulasi karbonil uglerodga hujum qilib tetraedrik oraliq birikma hosil qiladi.", "Etanol molekulasi ajralib chiqadi, proton yo'qotilib sirka kislota hosil bo'ladi.", "Reaksiya qaytar: muvozanat aralashmasida efir, suv, kislota va spirt bo'ladi."],
  organic: { template: 'atsil', params: { acyl: 'CH3–CO–O–C2H5', nucleophile: 'H2O', intermediate: 'tetraedrik oraliq birikma', leaving: 'C2H5–OH', product: 'CH3–COOH' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Uzoq qizdirilganda efir qatlami sekin kamayadi, aralashmadan sirka kislota hidi seziladi; ko'k lakmus qizaradi." },
  kinetics: 'sekin', app: ['dumaloq-tubli-kolba', 'sharikli-sovutgich', 'suv-hammomi', 'tomizgich'],
  proc: ["Kolbaga 1 ml etilatsetat, 3 ml suv va 1 ml suyultirilgan sulfat kislota quying.", "Kolbaga qaytar sovutgich o'rnatib, aralashmani suv hammomida 15–20 daqiqa qizdiring.", "Efir qatlamining kamayishini va hidning o'zgarishini kuzating."],
  safety: "Etilatsetat yonuvchan — faqat suv hammomida qizdiring; sulfat kislota bilan ehtiyot bo'ling.",
  expl: "Murakkab efirlar kislotali muhitda suv bilan gidrolizlanib, karbon kislota va spirt hosil qiladi. Bu jarayon eterifikatsiyaga teskari va qaytar; kislota faqat katalizator vazifasini bajaradi, shuning uchun gidroliz oxirigacha bormaydi.",
  q: ["Nima uchun kislotali gidroliz oxirigacha bormaydi?", "Murakkab efir gidrolizini oxirigacha olib borish uchun nima qilish kerak?"],
});

R({
  title: "Etilatsetatning ishqoriy gidrolizi (sovunlanishi)",
  level: '10-sinf', topic: TOPIC_ESTER, engine: 'record',
  reactants: [{ species: 'CH3COOC2H5', state: 'l', volume_mL: 1 }, { species: 'NaOH', state: 'aq', conc_M: 2, volume_mL: 4 }],
  cond: { heating: true, temp_min_C: 50, note_uz: "Eritmaga 1–2 tomchi fenolftalein qo'shiladi; aralashma iliq suv hammomida chayqatib turiladi." },
  eq: {
    molecular: 'CH3COOC2H5 + NaOH → CH3COONa + C2H5OH',
    ionic_full: 'CH3COOC2H5 + Na⁺ + OH⁻ → CH3COO⁻ + Na⁺ + C2H5OH',
    ionic_net: 'CH3COOC2H5 + OH⁻ → CH3COO⁻ + C2H5OH',
  },
  mech: 'organik',
  steps: ["Gidroksid ioni (kuchli nukleofil) efirning karbonil uglerodiga hujum qiladi va tetraedrik oraliq birikma hosil bo'ladi.", "Etoksid ioni ajralib, sirka kislota molekulasi hosil bo'ladi.", "Sirka kislota darhol ishqor bilan atsetat ioniga aylanadi — shuning uchun reaksiya qaytmas."],
  organic: { template: 'atsil', params: { acyl: 'CH3–CO–O–C2H5', nucleophile: 'OH⁻', intermediate: 'tetraedrik oraliq birikma', leaving: 'C2H5–O⁻', product: 'CH3–COO⁻' } },
  obs: { solution_color_change: { from: '#d81b8c', to: '#f7b6d8' }, heat: 'sezilarsiz', effects: [{ type: 'layers' }, { type: 'dissolve' }], text_uz: "Chayqatib iliqlanganda efir qatlami yo'qolib, aralashma bir jinsli bo'ladi; fenolftaleinning to'q pushti rangi ishqor sarflangan sari ochadi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'tomizgich', 'probirka-qisqichi'],
  proc: ["Probirkaga 4 ml natriy gidroksid eritmasidan quyib, 1–2 tomchi fenolftalein qo'shing.", "Ustiga 1 ml etilatsetat quying — ikki qatlam hosil bo'ladi.", "Probirkani iliq suv hammomida chayqatib turing.", "Qatlamlar yo'qolishini va rang o'zgarishini kuzating."],
  safety: "Ishqor eritmasi ko'zga xavfli — ko'zoynak taqing; etilatsetatni alangadan uzoq tuting.",
  expl: "Ishqoriy muhitda murakkab efir gidrolizi qaytmas bo'ladi, chunki hosil bo'lgan karbon kislota tuzga aylanib reaksiyadan chiqadi. Murakkab efirlarning ishqoriy gidrolizi sovunlanish deb ataladi — yog'lardan sovun olish ham shunday reaksiya.",
  q: ["Nima uchun ishqoriy gidroliz qaytmas?", "Fenolftalein rangining o'zgarishi nimani ko'rsatadi?"],
});

// ---------------------------------------------------------------- yog'lar va sovunlar
R({
  title: "Tristearinning natriy gidroksid bilan sovunlanishi (sovun olish)",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'record',
  reactants: [{ species: '(C17H35COO)3C3H5', state: 's', mass_g: 1 }, { species: 'NaOH', state: 'aq', conc_M: 6, volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 80, note_uz: "Yog' yaxshi erishi uchun 2–3 ml etanol qo'shiladi; aralashma 10–15 daqiqa qaynatiladi, keyin to'yingan NaCl eritmasi bilan sovun ajratiladi (tuzlash)." },
  eq: {
    molecular: '(C17H35COO)3C3H5 + 3NaOH → 3C17H35COONa + C3H5(OH)3',
    ionic_full: '(C17H35COO)3C3H5 + 3Na⁺ + 3OH⁻ → 3C17H35COO⁻ + 3Na⁺ + C3H5(OH)3',
    ionic_net: '(C17H35COO)3C3H5 + 3OH⁻ → 3C17H35COO⁻ + C3H5(OH)3',
  },
  mech: 'organik',
  steps: ["Gidroksid ionlari triglitseridning har bir murakkab efir guruhidagi karbonil uglerodga hujum qiladi.", "Tetraedrik oraliq birikmadan glitserin qoldig'i (alkoksid) ajraladi.", "Stearin kislota ishqor bilan natriy stearatga (sovunga) aylanadi; uch bosqichdan so'ng glitserin ajraladi."],
  organic: { template: 'atsil', params: { acyl: 'C17H35–CO–O–CH2 (triglitserid)', nucleophile: 'OH⁻', intermediate: 'tetraedrik oraliq birikma', leaving: 'C3H5(OH)3', product: 'C17H35–COONa' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'dissolve' }, { type: 'foam' }], text_uz: "Qaynatilganda yog' bo'laklari yo'qolib, bir jinsli suyuqlik hosil bo'ladi; bir tomchisini suvga tushirib chayqatilsa ko'pik paydo bo'ladi. NaCl qo'shilganda yuzaga sovun qatlami ajraladi." },
  kinetics: 'sekin', app: ['chinni-kosacha', 'shisha-tayoqcha', 'spirt-lampasi', 'kimyoviy-stakan'],
  proc: ["Chinni kosachaga 1 g qattiq yog' (tristearin), 3 ml konsentrlangan NaOH eritmasi va 2–3 ml etanol soling.", "Aralashmani shisha tayoqcha bilan aralashtirib, 10–15 daqiqa ehtiyotlik bilan qaynating (bug'langan suvni to'ldirib turing).", "Bir tomchi aralashmani issiq suvga tomizing — yog' tomchilari hosil bo'lmasa, sovunlanish tugagan.", "Aralashmaga to'yingan osh tuzi eritmasini qo'shing va yuzaga ajralgan sovunni kuzating."],
  safety: "Konsentrlangan ishqor eritmasi qaynatilganda sachraydi va ko'zni shikastlaydi — ko'zoynak va qo'lqop majburiy. Etanol bug'i yonuvchan: aralashmani to'g'ridan-to'g'ri alangaga yaqin qizdirmang, iloji bo'lsa suv hammomidan foydalaning.",
  expl: "Yog'lar — glitserin va yuqori karbon kislotalarning murakkab efirlari (triglitseridlar). Ishqor ta'sirida ular gidrolizlanib (sovunlanib) glitserin va yuqori karbon kislotalarning natriy tuzlari — qattiq sovun hosil qiladi. Kaliy gidroksid ishlatilsa suyuq sovun olinadi.",
  q: ["Nima uchun bu reaksiya sovunlanish deb ataladi?", "Qattiq va suyuq sovunlarning tarkibi nimasi bilan farq qiladi?", "Sovunni eritmadan ajratib olish uchun nima sababdan osh tuzi qo'shiladi?"],
});

R({
  title: "O'simlik moyining (trioleinning) ishqoriy gidrolizi",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'record',
  reactants: [{ species: '(C17H33COO)3C3H5', state: 'l', volume_mL: 1 }, { species: 'NaOH', state: 'aq', conc_M: 6, volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 80, note_uz: "Erituvchi sifatida 3 ml etanol qo'shiladi; aralashma qaytar sovutgich bilan 15 daqiqa qaynatiladi." },
  eq: {
    molecular: '(C17H33COO)3C3H5 + 3NaOH → 3C17H33COONa + C3H5(OH)3',
    ionic_full: '(C17H33COO)3C3H5 + 3Na⁺ + 3OH⁻ → 3C17H33COO⁻ + 3Na⁺ + C3H5(OH)3',
    ionic_net: '(C17H33COO)3C3H5 + 3OH⁻ → 3C17H33COO⁻ + C3H5(OH)3',
  },
  mech: 'organik',
  steps: ["OH⁻ ionlari trioleindagi murakkab efir guruhlarining karbonil uglerodiga nukleofil hujum qiladi.", "Glitserin qoldig'i ajraladi, olein kislota qoldiqlari oleat ionlariga aylanadi.", "Reaksiya mahsulotlari — natriy oleat (yumshoq sovun) va glitserin."],
  organic: { template: 'atsil', params: { acyl: 'C17H33–CO–O–CH2 (triglitserid)', nucleophile: 'OH⁻', intermediate: 'tetraedrik oraliq birikma', leaving: 'C3H5(OH)3', product: 'C17H33–COONa' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }, { type: 'dissolve' }, { type: 'foam' }], text_uz: "Boshida moy alohida qatlam hosil qiladi; qaynatish davomida qatlam yo'qolib, sarg'ish bir jinsli eritma hosil bo'ladi, chayqatilganda ko'piklanadi." },
  kinetics: 'sekin', app: ['dumaloq-tubli-kolba', 'sharikli-sovutgich', 'suv-hammomi', 'tomizgich'],
  proc: ["Kolbaga 1 ml o'simlik moyi, 3 ml konsentrlangan NaOH eritmasi va 3 ml etanol quying.", "Kolbaga qaytar sovutgich o'rnatib, aralashmani qaynoq suv hammomida 15 daqiqa qizdiring.", "Moy qatlamining yo'qolishini kuzating; bir tomchi aralashmani suvda chayqatib ko'pik hosil bo'lishini tekshiring."],
  safety: "Konsentrlangan ishqor ko'zga tushsa ko'r qilishi mumkin — ko'zoynak majburiy. Etanol yonuvchan, faqat suv hammomida qizdiring.",
  expl: "Suyuq yog'lar (moylar) ham ishqor ta'sirida sovunlanadi. Trioleindan natriy oleat va glitserin hosil bo'ladi. To'yinmagan kislotalarning tuzlari yumshoqroq sovun beradi.",
  q: ["Suyuq va qattiq yog'larning tarkibidagi farq nimada?", "Moylarning sovunlanish mahsulotlaridan glitserinni qanday aniqlash mumkin?"],
});

R({
  title: "Sovun eritmasining kalsiy tuzlari bilan reaksiyasi (qattiq suvda sovun)",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'rules',
  reactants: [{ species: 'C17H35COONa', state: 'aq', conc_M: 0.05, volume_mL: 3 }, { species: 'CaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 }],
  eq: {
    molecular: '2C17H35COONa + CaCl2 → (C17H35COO)2Ca↓ + 2NaCl',
    ionic_full: '2C17H35COO⁻ + 2Na⁺ + Ca²⁺ + 2Cl⁻ → (C17H35COO)2Ca↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: '2C17H35COO⁻ + Ca²⁺ → (C17H35COO)2Ca↓',
  },
  mech: 'ion-almashinish',
  steps: ["Sovun eritmasida stearat ionlari, qattiq suvda esa Ca²⁺ ionlari bo'ladi.", "Ular suvda erimaydigan kalsiy stearat hosil qiladi.", "Stearat ionlari cho'kmaga o'tgani uchun sovun ko'piklanmaydi va yuvish xossasini yo'qotadi."],
  obs: { precipitate: { species: '(C17H35COO)2Ca', color: '#f6f6f2', texture: 'suzmasimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oq parcha-parcha cho'kma hosil bo'ladi; chayqatilganda ko'pik deyarli hosil bo'lmaydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Ikki probirkaga 3 ml dan sovun eritmasi quying.", "Birinchisiga 1 ml distillangan suv, ikkinchisiga 1 ml kalsiy xlorid eritmasi qo'shing.", "Ikkala probirkani bir xil chayqatib, ko'pik va cho'kmani solishtiring."],
  safety: "Tajriba xavfsiz; eritmalar ko'zga tushsa suv bilan yuving.",
  expl: "Suvning qattiqligi undagi Ca²⁺ va Mg²⁺ ionlari bilan bog'liq. Bu ionlar sovundagi stearat ionlari bilan erimaydigan tuzlar hosil qiladi, natijada sovun behuda sarflanadi va ko'piklanmaydi. Sintetik yuvuvchi vositalar kalsiy bilan cho'kma hosil qilmagani uchun qattiq suvda ham yaxshi ishlaydi.",
  q: ["Qattiq suvda kir yuvilganda sovun sarfi nima uchun ortadi?", "Suvning qattiqligini qanday kamaytirish mumkin?"],
});

R({
  title: "Sovun eritmasining magniy tuzlari bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'rules',
  reactants: [{ species: 'C17H35COONa', state: 'aq', conc_M: 0.05, volume_mL: 3 }, { species: 'MgSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 }],
  eq: {
    molecular: '2C17H35COONa + MgSO4 → (C17H35COO)2Mg↓ + Na2SO4',
    ionic_full: '2C17H35COO⁻ + 2Na⁺ + Mg²⁺ + SO4²⁻ → (C17H35COO)2Mg↓ + 2Na⁺ + SO4²⁻',
    ionic_net: '2C17H35COO⁻ + Mg²⁺ → (C17H35COO)2Mg↓',
  },
  mech: 'ion-almashinish',
  steps: ["Magniy sulfat suvning doimiy qattiqligini hosil qiluvchi tuzlardan biri.", "Mg²⁺ ionlari stearat ionlari bilan erimaydigan magniy stearat hosil qiladi.", "Sovun cho'kmaga o'tib, ko'pik hosil bo'lmaydi."],
  obs: { precipitate: { species: '(C17H35COO)2Mg', color: '#f6f6f2', texture: 'suzmasimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oq parcha-parcha cho'kma hosil bo'ladi, eritma loyqalanadi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3 ml sovun eritmasi quying.", "Unga tomchilab magniy sulfat eritmasidan qo'shing.", "Cho'kma hosil bo'lishini kuzating, so'ng probirkani chayqatib ko'pikni tekshiring."],
  safety: "Tajriba xavfsiz; reaktivlarni tatib ko'rmang.",
  expl: "Suv qattiqligining doimiy turi Ca²⁺ va Mg²⁺ ionlarining sulfat va xloridlari bilan bog'liq va qaynatish bilan yo'qolmaydi. Magniy ionlari ham stearat bilan erimaydigan tuz hosil qilib, sovunni cho'ktiradi.",
  q: ["Doimiy va vaqtinchalik qattiqlik qanday farqlanadi?", "Doimiy qattiqlikni qaysi modda yordamida yo'qotish mumkin?"],
});

R({
  title: "Sovun eritmasidan kislota ta'sirida stearin kislotaning ajralishi",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'rules',
  reactants: [{ species: 'C17H35COONa', state: 'aq', conc_M: 0.05, volume_mL: 3 }, { species: 'HCl', state: 'aq', conc_M: 1, volume_mL: 1 }],
  eq: {
    molecular: 'C17H35COONa + HCl → C17H35COOH↓ + NaCl',
    ionic_full: 'C17H35COO⁻ + Na⁺ + H⁺ + Cl⁻ → C17H35COOH↓ + Na⁺ + Cl⁻',
    ionic_net: 'C17H35COO⁻ + H⁺ → C17H35COOH↓',
  },
  mech: 'ion-almashinish',
  steps: ["Xlorid kislota stearin kislotadan kuchli.", "Stearat ionlari H⁺ ionlarini biriktirib, suvda erimaydigan stearin kislota molekulalarini hosil qiladi.", "Stearin kislota oq parchalar holida ajralib, eritma yuzasiga qalqib chiqadi."],
  obs: { precipitate: { species: 'C17H35COOH', color: '#f8f8f4', texture: 'suzmasimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Sovun eritmasi loyqalanadi, oq yog'simon parchalar ajralib, yuzaga ko'tariladi; ko'pik hosil bo'lmaydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3 ml sovun eritmasi quying.", "Tomchilab xlorid kislota eritmasidan qo'shing.", "Hosil bo'lgan oq parchalarni kuzating; probirkani chayqatib ko'pik bor-yo'qligini tekshiring."],
  safety: "Xlorid kislota terini kuydiradi — ko'zoynak va qo'lqop taqing.",
  expl: "Kuchli kislota kuchsiz stearin kislotani uning tuzidan siqib chiqaradi. Stearin kislota suvda erimaydi, shuning uchun cho'kma hosil bo'ladi. Shu sababli sovun kislotali muhitda yuvish xossasini yo'qotadi.",
  q: ["Nima uchun sovun kislotali suvda ko'piklanmaydi?", "Stearin kislotadan qayta sovun olish uchun nima qilish kerak?"],
});

R({
  title: "Stearin kislotaning natriy gidroksid bilan reaksiyasi (sovun olish)",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'record',
  reactants: [{ species: 'C17H35COOH', state: 's', mass_g: 0.5 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 70, note_uz: "Stearin kislota suyuqlanguncha qizdiriladi." },
  eq: {
    molecular: 'C17H35COOH + NaOH → C17H35COONa + H2O',
    ionic_full: 'C17H35COOH + Na⁺ + OH⁻ → C17H35COO⁻ + Na⁺ + H2O',
    ionic_net: 'C17H35COOH + OH⁻ → C17H35COO⁻ + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Stearin kislota suvda erimaydi, qizdirilganda suyuqlanadi.", "Suyuqlangan kislota ishqor bilan neytrallanib, suvda eriydigan natriy stearat hosil qiladi.", "Hosil bo'lgan eritma chayqatilganda ko'piklanadi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'dissolve' }, { type: 'foam' }], text_uz: "Qizdirilganda stearin kislota bo'laklari suyuqlanib eriydi; eritma chayqatilganda ko'piklanadi (sovun hosil bo'ldi)." },
  kinetics: "o'rtacha", app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga ozgina stearin kislota (sham parchasi) soling.", "Ustiga 3 ml NaOH eritmasidan quying.", "Probirkani qisqichga olib, stearin suyuqlanib eriguncha qizdiring.", "Sovigach, probirkani chayqatib ko'pik hosil bo'lishini kuzating."],
  safety: "Ishqor qizdirilganda sachrashi mumkin — ko'zoynak taqing, probirka og'zini odamlarga qaratmang.",
  expl: "Yuqori karbon kislotalar ham ishqorlar bilan tuz hosil qiladi; bu tuzlar sovun deyiladi. Stearin kislota suvda erimasa-da, uning natriy tuzi eriydi va yuvish xossasiga ega.",
  q: ["Sovunlar qaysi moddalarning tuzlari?", "Kaliy gidroksid ishlatilsa qanday sovun hosil bo'ladi?"],
});

R({
  title: "Olein kislotaning bromli suvni rangsizlantirishi",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'record',
  reactants: [{ species: 'C17H33COOH', state: 'l', volume_mL: 0.5 }, { species: 'bromli-suv', state: 'aq', volume_mL: 3 }],
  eq: { molecular: 'C17H33COOH + Br2 → C17H33Br2COOH' },
  mech: 'organik',
  steps: ["Olein kislota molekulasida bitta C=C qo'shbog' bor (to'yinmagan kislota).", "Brom molekulasi π-bog'ga yaqinlashib qutblanadi va bromoniy ioni hosil bo'ladi.", "Bromid ioni bromoniy ioniga hujum qilib, 9,10-dibromstearin kislota hosil bo'ladi."],
  organic: { template: 'AdE', params: { alkene: 'CH3(CH2)7CH=CH(CH2)7COOH', reagent: 'Br–Br', electrophile: 'Br⁺', nucleophile: 'Br⁻', intermediate: 'bromoniy ioni', product: 'CH3(CH2)7CHBr–CHBr(CH2)7COOH' } },
  obs: { solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Chayqatilganda bromli suvning sariq-qo'ng'ir rangi yo'qoladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3 ml bromli suv quying.", "Unga bir necha tomchi olein kislota qo'shing.", "Probirkani tiqin bilan yopib, yaxshilab chayqating va rang o'zgarishini kuzating."],
  safety: "Brom zaharli va terini kuydiradi — tajribani mo'rili shkafda o'tkazing, bug'ini hidlamang.",
  expl: "Olein kislota to'yinmagan karbon kislota: uning uglevodorod radikalida qo'shbog' bor. Brom qo'shbog'ga birikadi va bromli suv rangsizlanadi. Stearin kislota (to'yingan) bu reaksiyani bermaydi.",
  q: ["Olein va stearin kislotalarni qanday farqlash mumkin?", "Olein kislotaga vodorod birikkanda qanday modda hosil bo'ladi?"],
});

R({
  title: "O'simlik moyining to'yinmaganligini bromli suv bilan aniqlash",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'record',
  reactants: [{ species: '(C17H33COO)3C3H5', state: 'l', volume_mL: 0.5 }, { species: 'bromli-suv', state: 'aq', volume_mL: 3 }],
  eq: { molecular: '(C17H33COO)3C3H5 + 3Br2 → (C17H33Br2COO)3C3H5' },
  mech: 'organik',
  steps: ["Triolein molekulasidagi har bir olein kislota qoldig'ida bitta C=C qo'shbog' bor.", "Brom har bir qo'shbog'ga elektrofil birikadi (bromoniy ioni orqali).", "Bitta triolein molekulasi uchta brom molekulasini biriktiradi."],
  organic: { template: 'AdE', params: { alkene: '–CH=CH– (triolein)', reagent: 'Br–Br', electrophile: 'Br⁺', nucleophile: 'Br⁻', intermediate: 'bromoniy ioni', product: '–CHBr–CHBr–' } },
  obs: { solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Moy bilan chayqatilgan bromli suv rangsizlanadi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3 ml bromli suv quying.", "Ustiga 0,5 ml o'simlik (kungaboqar yoki paxta) moyi qo'shing.", "Probirkani tiqin bilan yopib, kuchli chayqating va bromli suv rangini kuzating.", "Taqqoslash uchun qattiq hayvon yog'i bilan ham tajriba o'tkazing."],
  safety: "Brom zaharli — mo'rili shkafda ishlang, bug'ini hidlamang, teriga tekkazmang.",
  expl: "O'simlik moylari tarkibida to'yinmagan karbon kislotalar qoldiqlari ko'p bo'lgani uchun ular bromli suvni rangsizlantiradi. Qattiq hayvon yog'larida asosan to'yingan kislota qoldiqlari bo'ladi va ular bromli suvni deyarli rangsizlantirmaydi.",
  q: ["Nima uchun o'simlik moylari odatda suyuq, hayvon yog'lari esa qattiq?", "Suyuq yog'larni qattiq yog'larga qanday aylantirish mumkin?"],
});

R({
  title: "Benzoy kislotaning natriy gidroksid eritmasida erishi",
  level: '10-sinf', topic: "Aromatik karbon kislotalar", engine: 'record',
  reactants: [{ species: 'C6H5COOH', state: 's', mass_g: 0.2 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 3 }],
  eq: {
    molecular: 'C6H5COOH + NaOH → C6H5COONa + H2O',
    ionic_full: 'C6H5COOH + Na⁺ + OH⁻ → C6H5COO⁻ + Na⁺ + H2O',
    ionic_net: 'C6H5COOH + OH⁻ → C6H5COO⁻ + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Benzoy kislota sovuq suvda kam eriydi.", "Gidroksid ionlari karboksil guruhidan protonni tortib oladi.", "Hosil bo'lgan natriy benzoat suvda yaxshi eriydi — kristallar yo'qoladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Suvda erimay turgan oq kristallar ishqor qo'shilib chayqatilganda tez eriydi, rangsiz eritma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'shpatel', 'tomizgich'],
  proc: ["Probirkaga shpatel uchida benzoy kislota soling va 2 ml suv qo'shib chayqating — kristallar deyarli erimaydi.", "Tomchilab natriy gidroksid eritmasidan qo'shing va chayqating.", "Kristallarning erishini kuzating."],
  safety: "Ishqor eritmasi bilan ishlaganda ko'zoynak taqing; benzoy kislota changini hidlamang.",
  expl: "Benzoy kislota — eng oddiy aromatik karbon kislota; suvda kam eriydi, lekin ishqorlarda tuz hosil qilib yaxshi eriydi. Natriy benzoat (E211) oziq-ovqat konservanti sifatida ishlatiladi.",
  q: ["Nima uchun benzoy kislota ishqorda eriydi, suvda esa yomon eriydi?", "Natriy benzoat qayerda ishlatiladi?"],
});

R({
  title: "Natriy benzoat eritmasidan benzoy kislotaning cho'ktirilishi",
  level: '10-sinf', topic: "Aromatik karbon kislotalar", engine: 'record',
  reactants: [{ species: 'C6H5COONa', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 1, excess: true }],
  eq: {
    molecular: 'C6H5COONa + HCl → C6H5COOH↓ + NaCl',
    ionic_full: 'C6H5COO⁻ + Na⁺ + H⁺ + Cl⁻ → C6H5COOH↓ + Na⁺ + Cl⁻',
    ionic_net: 'C6H5COO⁻ + H⁺ → C6H5COOH↓',
  },
  mech: 'ion-almashinish',
  steps: ["Xlorid kislota benzoy kislotadan kuchli.", "Benzoat ionlari protonlanib benzoy kislota molekulalariga aylanadi.", "Benzoy kislota sovuq suvda kam erigani uchun oq kristall cho'kma tushadi."],
  obs: { precipitate: { species: 'C6H5COOH', color: '#f8f8f6', texture: 'kristall' }, heat: 'sezilarsiz', effects: [{ type: 'crystals' }, { type: 'turbidity' }], text_uz: "Eritmada oq kristall cho'kma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml natriy benzoat eritmasi quying.", "Tomchilab xlorid kislota eritmasidan qo'shing.", "Oq kristall cho'kma hosil bo'lishini kuzating; probirkani sovuq suvda sovuting."],
  safety: "Xlorid kislota bilan ehtiyot bo'ling, ko'zoynak taqing.",
  expl: "Kuchli kislota kuchsiz benzoy kislotani tuzidan siqib chiqaradi. Benzoy kislota sovuq suvda kam eriydi, shuning uchun cho'kmaga tushadi. Bu usul benzoy kislotani tuzidan ajratib olish va tozalashda qo'llaniladi.",
  q: ["Bu reaksiya kislotalarning qaysi umumiy xossasini ko'rsatadi?", "Cho'kmani qanday ajratib olish mumkin?"],
});

R({
  title: "Benzoy kislotaning issiq va sovuq suvda eruvchanligi (qayta kristallash)",
  level: '10-sinf', topic: "Aromatik karbon kislotalar", engine: 'rules',
  equation_free: true, equation_free_uz: "Bu fizik jarayon: modda erib, so'ng kristallanadi; kimyoviy o'zgarish yo'q, shuning uchun tenglama yozilmaydi.",
  reactants: [{ species: 'C6H5COOH', state: 's', mass_g: 0.3 }, { species: 'H2O', state: 'l', volume_mL: 5 }],
  cond: { heating: true, temp_min_C: null, note_uz: "Aralashma qaynaguncha qizdiriladi, so'ng sekin sovutiladi." },
  mech: 'fizik',
  steps: ["Benzoy kislotaning suvda eruvchanligi harorat ortishi bilan keskin ortadi.", "Qaynoq suvda erigan kislota sovutilganda eritma o'ta to'yingan bo'lib qoladi.", "Ortiqcha modda yaltiroq ignasimon kristallar holida ajraladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'dissolve' }, { type: 'crystals' }], text_uz: "Sovuq suvda kristallar deyarli erimaydi; qaynatilganda to'liq eriydi, sovutilganda esa yaltiroq oq ignasimon kristallar ajraladi." },
  kinetics: 'sekin', app: ['kimyoviy-stakan', 'shisha-tayoqcha', 'spirt-lampasi', 'termometr'],
  proc: ["Stakanga 0,3 g benzoy kislota va 5 ml sovuq suv soling, aralashtiring — kristallar deyarli erimaydi.", "Aralashmani qaynaguncha qizdiring va kristallarning erishini kuzating.", "Issiq eritmani sekin sovushga qo'ying.", "Hosil bo'lgan ignasimon kristallarni kuzating."],
  safety: "Qaynoq suv va issiq idishni qisqich yoki sochiq bilan ushlang; benzoy kislota bug'i nafas yo'llarini qitiqlaydi.",
  expl: "Benzoy kislota sovuq suvda kam, qaynoq suvda esa ancha ko'p eriydi. Shu xossa asosida qayta kristallash usuli bilan uni aralashmalardan tozalash mumkin: issiqda eritiladi, erimaydigan aralashmalar filtrlanadi, sovutilganda toza kristallar ajraladi.",
  q: ["Qayta kristallash usuli moddaning qaysi xossasiga asoslangan?", "Nima uchun eritma sekin sovutilganda kristallar yirikroq bo'ladi?"],
});

R({
  title: "Benzoy kislotaning sublimatlanishi",
  level: '10-sinf', topic: "Aromatik karbon kislotalar", engine: 'rules',
  equation_free: true, equation_free_uz: "Sublimatlanish — qattiq moddaning suyuqlanmasdan bug'ga, so'ng yana kristallga o'tishi; fizik hodisa bo'lgani uchun tenglama yo'q.",
  reactants: [{ species: 'C6H5COOH', state: 's', mass_g: 0.2 }],
  cond: { heating: true, temp_min_C: 100, note_uz: "Chinni kosacha teshikchalar ochilgan filtr qog'ozi va ustidan voronka bilan yopilib, sekin qizdiriladi." },
  mech: 'fizik',
  steps: ["Qizdirilganda benzoy kislota bug'lanadi (sublimatlanadi).", "Bug' sovuq sirtga (voronka devoriga) tegib, to'g'ridan-to'g'ri kristallarga aylanadi.", "Uchuvchan bo'lmagan aralashmalar kosachada qoladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'fog' }, { type: 'crystals' }], text_uz: "Voronka devorlari va filtr qog'oz ustida oq yaltiroq ignasimon kristallar o'sadi." },
  kinetics: 'sekin', app: ['chinni-kosacha', 'oddiy-voronka', 'filtr-qogoz', 'spirt-lampasi'],
  proc: ["Chinni kosachaga ozgina benzoy kislota soling.", "Kosachani bir necha teshik ochilgan filtr qog'oz bilan yopib, ustidan teskari qilib voronka qo'ying.", "Kosachani spirt lampasining kichik alangasida sekin qizdiring.", "Voronka devorida hosil bo'lgan kristallarni kuzating."],
  safety: "Benzoy kislota bug'i ko'z va nafas yo'llarini qitiqlaydi — mo'rili shkafda ishlang, kuchli qizdirmang.",
  expl: "Benzoy kislota oson sublimatlanadigan moddalardan biri. Bu xossadan uni uchuvchan bo'lmagan aralashmalardan tozalashda foydalaniladi.",
  q: ["Sublimatlanish bilan bug'lanishning farqi nimada?", "Yana qaysi moddalar oson sublimatlanadi?"],
});

R({
  title: "Salitsil kislotaning temir(III) xlorid bilan rangli reaksiyasi",
  level: '11-sinf', topic: "Aromatik oksikislotalar", engine: 'rules',
  equation_free: true, equation_free_uz: "Fenol gidroksili va karboksil guruhi Fe³⁺ bilan tarkibi pH ga bog'liq bo'lgan rangli kompleks (salitsilatlar) hosil qiladi; maktab darajasida yagona tenglama bilan ifodalanmaydi.",
  reactants: [{ species: 'C6H4(OH)COOH', state: 's', mass_g: 0.05 }, { species: 'FeCl3', state: 'aq', conc_M: 0.1, volume_mL: 0.2 }],
  mech: 'sifat-reaksiya',
  steps: ["Salitsil kislota molekulasida benzol halqasiga bog'langan OH guruhi (fenol gidroksili) bor.", "Fe³⁺ ioni fenol gidroksili va qo'shni karboksil guruh bilan kompleks hosil qiladi.", "Kompleks binafsha rangga ega — bu fenol guruhining sifat reaksiyasi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#7a2a8a' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Eritma darhol to'q binafsha rangga bo'yaladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga ozgina salitsil kislota soling va 2–3 ml suvda chayqatib eriting.", "Unga 1–2 tomchi temir(III) xlorid eritmasi qo'shing.", "Rang o'zgarishini kuzating."],
  safety: "Temir(III) xlorid eritmasi terini bo'yaydi va qitiqlaydi; qo'lqop taqing.",
  expl: "Fenol gidroksili tutgan birikmalar temir(III) xlorid bilan rangli komplekslar hosil qiladi. Salitsil kislota binafsha rang beradi. Bu reaksiya aspirin namunasida gidrolizlangan (buzilgan) salitsil kislotani aniqlashda ham qo'llaniladi.",
  q: ["Nima uchun benzoy kislota FeCl₃ bilan binafsha rang bermaydi?", "Bu reaksiyadan dori sifatini tekshirishda qanday foydalanish mumkin?"],
  conf: "o'rta",
});

R({
  title: "Aspirinning (atsetilsalitsil kislotaning) gidrolizi",
  level: '11-sinf', topic: "Aromatik oksikislotalar", engine: 'record',
  reactants: [{ species: 'C6H4(OCOCH3)COOH', state: 's', mass_g: 0.1 }, { species: 'H2O', state: 'l', volume_mL: 5 }],
  cond: { heating: true, temp_min_C: 90, note_uz: "Aspirin tabletkasi suvda 3–5 daqiqa qaynatiladi; keyin FeCl₃ bilan salitsil kislota aniqlanadi." },
  eq: { molecular: 'C6H4(OCOCH3)COOH + H2O → C6H4(OH)COOH + CH3COOH' },
  mech: 'organik',
  steps: ["Aspirin — salitsil kislota fenol gidroksilining sirka kislota bilan hosil qilgan murakkab efiri.", "Qizdirilganda suv molekulasi efir guruhining karbonil uglerodiga hujum qiladi (tetraedrik oraliq birikma).", "Efir bog'i uzilib, salitsil kislota va sirka kislota hosil bo'ladi."],
  organic: { template: 'atsil', params: { acyl: 'CH3–CO–O–C6H4–COOH', nucleophile: 'H2O', intermediate: 'tetraedrik oraliq birikma', leaving: 'HO–C6H4–COOH', product: 'CH3–COOH' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'boil' }], text_uz: "Tashqi o'zgarish deyarli ko'rinmaydi; qaynatilgan eritmaga FeCl₃ qo'shilganda binafsha rang paydo bo'ladi, qaynatilmagan yangi aspirin eritmasida esa rang deyarli o'zgarmaydi." },
  kinetics: 'sekin', app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi', 'tomizgich'],
  proc: ["Ikkita probirkaga aspirin tabletkasining ozgina kukunidan soling va 5 ml dan suv qo'shing.", "Birinchi probirkani 3–5 daqiqa qaynating, ikkinchisini qizdirmang.", "Ikkala probirka sovigach, har biriga 1–2 tomchi FeCl₃ eritmasi qo'shing.", "Rangni taqqoslang."],
  safety: "Qaynayotgan suyuqlik sachrashi mumkin — probirkani qisqichda ushlang va og'zini odamlarga qaratmang. Dori moddalarini tatib ko'rmang.",
  expl: "Aspirin murakkab efir bo'lgani uchun suv bilan qizdirilganda gidrolizlanadi. Hosil bo'lgan salitsil kislota erkin fenol gidroksili tutadi va FeCl₃ bilan binafsha rang beradi. Aspirinni nam joyda saqlash uning asta-sekin buzilishiga olib keladi.",
  q: ["Aspirin molekulasida qaysi funksional guruhlar bor?", "Nima uchun aspirinni quruq joyda saqlash kerak?"],
  conf: "o'rta",
});

R({
  title: "Sut kislotaning natriy gidrokarbonat bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'CH3CH(OH)COOH', state: 'aq', conc_M: 1, volume_mL: 2 }, { species: 'NaHCO3', state: 'aq', conc_M: 0.5, volume_mL: 3 }],
  eq: {
    molecular: 'CH3CH(OH)COOH + NaHCO3 → CH3CH(OH)COONa + H2O + CO2↑',
    ionic_full: 'CH3CH(OH)COOH + Na⁺ + HCO3⁻ → CH3CH(OH)COO⁻ + Na⁺ + H2O + CO2↑',
    ionic_net: 'CH3CH(OH)COOH + HCO3⁻ → CH3CH(OH)COO⁻ + H2O + CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Sut kislota (2-gidroksipropan kislota) karbonat kislotadan kuchli.", "Gidrokarbonat ioni sut kislotadan proton qabul qiladi.", "H₂CO₃ parchalanib CO₂ ajraladi."],
  obs: { gas: CO2, heat: 'sezilarsiz', effects: [{ type: 'bubbles' }], text_uz: "Rangsiz, hidsiz gaz pufakchalari ajraladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3 ml natriy gidrokarbonat eritmasi quying.", "Ustiga 2 ml sut kislota eritmasidan qo'shing.", "Gaz ajralishini kuzating."],
  safety: "Sut kislota konsentrlangan holda terini qitiqlaydi; ko'zoynak taqing.",
  expl: "Sut kislota gidroksikislota bo'lib, karboksil guruhi hisobiga odatdagi kislota xossalarini namoyon qiladi. U sut achiganda va mushaklarda glyukozaning kislorodsiz parchalanishida hosil bo'ladi; xamir oshirishda soda bilan reaksiyasi CO₂ ajratadi.",
  q: ["Sut kislota molekulasida qaysi funksional guruhlar bor?", "Qatiqqa soda qo'shilganda nima uchun ko'pik hosil bo'ladi?"],
});

R({
  title: "Limon kislotaning natriy gidrokarbonat bilan reaksiyasi",
  level: '10-sinf', topic: TOPIC_ACID, engine: 'rules',
  reactants: [{ species: 'C3H5O(COOH)3', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'NaHCO3', state: 'aq', conc_M: 0.5, volume_mL: 6 }],
  eq: {
    molecular: 'C3H5O(COOH)3 + 3NaHCO3 → C3H5O(COONa)3 + 3H2O + 3CO2↑',
    ionic_full: 'C3H5O(COOH)3 + 3Na⁺ + 3HCO3⁻ → C3H5O(COO)3³⁻ + 3Na⁺ + 3H2O + 3CO2↑',
    ionic_net: 'C3H5O(COOH)3 + 3HCO3⁻ → C3H5O(COO)3³⁻ + 3H2O + 3CO2↑',
  },
  mech: 'ion-almashinish',
  steps: ["Limon kislota uch asosli karbon kislota — molekulasida uchta karboksil guruh bor.", "Har bir karboksil guruh gidrokarbonat ioniga proton beradi.", "Hosil bo'lgan H₂CO₃ parchalanib CO₂ ajraladi."],
  obs: { gas: CO2, heat: 'endotermik', effects: [{ type: 'bubbles' }, { type: 'foam' }], text_uz: "Kuchli ko'piklanish, rangsiz gaz ajraladi; aralashma biroz soviydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml limon kislota eritmasidan quying.", "Ustiga natriy gidrokarbonat eritmasidan qo'shing.", "Ko'piklanishni kuzating."],
  safety: "Tajriba xavfsiz; reaktivlar ko'zga tushsa suv bilan yuving.",
  expl: "Limon kislota uch asosli kislota bo'lib, bir molekulasi uchta gidrokarbonat ioni bilan reaksiyaga kirishadi. Gazlangan (\"shipuchiy\") tabletkalar va qandolatchilikdagi yumshatuvchi kukunlar limon kislota bilan sodaning shu reaksiyasiga asoslangan.",
  q: ["Limon kislotaning asosligi nechaga teng?", "Shipuchiy tabletka suvga tashlanganda qanday gaz ajraladi?"],
});

R({
  title: "Yog'larning suvda va organik erituvchilarda eruvchanligi",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'rules',
  equation_free: true, equation_free_uz: "Erish — fizik jarayon: yog' molekulalari qutbsiz erituvchi molekulalari orasiga taqsimlanadi, kimyoviy bog'lar o'zgarmaydi.",
  reactants: [{ species: '(C17H33COO)3C3H5', state: 'l', volume_mL: 0.5 }, { species: 'H2O', state: 'l', volume_mL: 3 }, { species: 'C6H14', state: 'l', volume_mL: 3 }],
  cond: { note_uz: "Moy ikki probirkada — suv va geksan (benzin) bilan alohida chayqatiladi." },
  mech: 'fizik',
  steps: ["Yog' molekulalari uzun qutbsiz uglevodorod radikallaridan iborat.", "Qutbli suv molekulalari ular bilan vodorod bog' hosil qila olmaydi — yog' erimaydi va suvdan yengil qatlam hosil qiladi.", "Qutbsiz erituvchilarda (geksan, benzin) yog' yaxshi eriydi — \"o'xshash o'xshashda eriydi\"."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }, { type: 'dissolve' }], text_uz: "Suvli probirkada moy yuzada alohida qatlam hosil qiladi; geksanli probirkada moy to'liq erib, bir jinsli eritma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'filtr-qogoz'],
  proc: ["Ikki probirkaga 0,5 ml dan o'simlik moyi quying.", "Birinchisiga 3 ml suv, ikkinchisiga 3 ml geksan (yoki benzin) qo'shing.", "Ikkala probirkani chayqatib, tindiring va natijani solishtiring.", "Geksanli eritmadan bir tomchini filtr qog'ozga tomizing va erituvchi uchgach yog' dog'ini kuzating."],
  safety: "Geksan va benzin juda yonuvchan va bug'i zararli — alangadan uzoqda, shamollatiladigan joyda ishlang.",
  expl: "Yog'lar suvda erimaydi va suvdan yengil bo'lgani uchun uning yuzasida qatlam hosil qiladi. Ular organik erituvchilarda yaxshi eriydi; kiyimdagi yog' dog'larini benzin bilan tozalash shunga asoslangan.",
  q: ["Nima uchun yog' suvda erimaydi?", "Yog' dog'ini qanday moddalar bilan tozalash mumkin?"],
});

R({
  title: "Sovunning emulsiyalovchi (yuvuvchi) ta'siri",
  level: '10-sinf', topic: TOPIC_FAT, engine: 'rules',
  equation_free: true, equation_free_uz: "Emulsiya hosil bo'lishi fizik-kimyoviy hodisa: sovun ionlari yog' tomchilari sirtiga adsorbsiyalanadi, yangi modda hosil bo'lmaydi.",
  reactants: [{ species: '(C17H33COO)3C3H5', state: 'l', volume_mL: 0.5 }, { species: 'C17H35COONa', state: 'aq', conc_M: 0.05, volume_mL: 3 }],
  mech: 'fizik',
  steps: ["Stearat ionining uzun uglevodorod \"dumi\" gidrofob, karboksilat \"boshi\" esa gidrofil.", "Chayqatilganda gidrofob qismlar yog' tomchisiga botadi, gidrofil qismlar suv tomonga qaraydi (mitsella).", "Sirti manfiy zaryadlangan tomchilar o'zaro birlashmaydi — barqaror emulsiya hosil bo'ladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }, { type: 'foam' }], text_uz: "Sovunli suvda chayqatilgan moy sutsimon loyqa emulsiya hosil qiladi va uzoq vaqt qatlamlarga ajralmaydi; toza suvda esa moy tezda yuzaga qalqib chiqadi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Ikki probirkaga 0,5 ml dan o'simlik moyi quying.", "Birinchisiga 3 ml suv, ikkinchisiga 3 ml sovun eritmasi qo'shing.", "Ikkala probirkani bir xil kuchli chayqating va bir necha daqiqa tindiring.", "Qatlamlarga ajralish tezligini solishtiring."],
  safety: "Tajriba xavfsiz; sovun ko'zga tushsa ko'p suv bilan yuving.",
  expl: "Sovun molekulasi (ioni) bir uchi suvni yoqtiradigan, ikkinchi uchi yog'ni yoqtiradigan zarracha. Shu sababli u yog' tomchilarini o'rab, suvda barqaror emulsiya hosil qiladi va kirni yuvib ketishga yordam beradi.",
  q: ["Sovun molekulasining qaysi qismi gidrofil, qaysi qismi gidrofob?", "Mitsella nima?"],
});

writeFileSync(join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${CAT}.json`), JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n');
console.log(`${CAT}: ${out.length} ta yozuv`);
