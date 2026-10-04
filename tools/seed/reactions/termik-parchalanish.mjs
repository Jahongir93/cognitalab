// Termik parchalanish toifasi (termik-NNNN) yozuvlari generatori.
// Ishga tushirish: node tools/seed/reactions/termik-parchalanish.mjs
// Natija: frontend/lab/data/reactions/termik-parchalanish.json (termik-0001 qo'lda yozilgan, o'zgarishsiz saqlanadi).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, db, makeRecord } from './lib.mjs';

const CAT = 'termik-parchalanish';
const FILE = join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${CAT}.json`);

const gas = (id) => ({ species: id, color: db.substances[id]?.gas?.color ?? null });
const ppt = (id) => {
  const s = db.substances[id];
  return { species: id, color: s.precipitate?.color || s.appearance.color, texture: s.precipitate?.texture || 'mayda-kristall' };
};
const col = (id) => db.substances[id].appearance.color;
const E = (type) => ({ type });

const TUBE = ['probirka', 'probirka-qisqichi', 'spirt-lampasi'];
const TUBE_GAS = ['probirka', 'shtativ', 'qisqich-lapka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'spirt-lampasi'];
const CRUCIBLE = ['tigel', 'tigel-qisqichi', 'chinni-uchburchak', 'uchoyoq', 'bunzen-gorelkasi'];
const FURNACE = ['tigel', 'tigel-qisqichi', 'mufel-pechi'];
const HOOD = "Tajribani mo'rili shkafda o'tkazing";
const TUBE_SAFE = "Probirka og'zini o'zingizga va boshqalarga qaratmang; issiq probirkani shtativga qo'ying.";

let n = 1;
const out = [];
/**
 * @param {object} o
 *  title, level, topic, r (reactants), T (temp_min_C), note, cat (catalyst), heating,
 *  mol, net, full, eb, mech, steps, obs, kin, app, proc, safety, expl, q, conf
 */
function T(o) {
  n++;
  out.push(makeRecord({
    id: `termik-${String(n).padStart(4, '0')}`,
    category: CAT,
    title: o.title,
    level: o.level || '8-sinf',
    topic: o.topic,
    engine: 'record',
    reactants: o.r,
    conditions: {
      heating: o.heating ?? true,
      temp_min_C: o.T ?? null,
      catalyst: o.cat ?? null,
      note_uz: o.note ?? null,
      ...(o.cond || {}),
    },
    equation: { molecular: o.mol, ionic_full: o.full ?? null, ionic_net: o.net ?? null, electron_balance: o.eb ?? null },
    mechType: o.mech || 'termik-parchalanish',
    steps: o.steps,
    obs: { heat: 'endotermik', ...o.obs },
    kinetics: o.kin || 'tez',
    apparatus: o.app || TUBE,
    procedure: o.proc,
    safety: o.safety || TUBE_SAFE,
    explanation: o.expl,
    questions: o.q,
    confidence: o.conf || 'yuqori',
  }));
}

// ===================================================================== erimaydigan asoslar va kislotalar
T({
  title: "Temir(III) gidroksidning qizdirilganda parchalanishi",
  topic: "Asoslarning xossalari: erimaydigan asoslarning parchalanishi",
  r: [{ species: 'Fe(OH)3', state: 's', mass_g: 0.3 }], T: 200,
  note: "Quruq probirkada spirt lampasi alangasida qizdiriladi.",
  mol: '2Fe(OH)3 = Fe2O3 + 3H2O↑',
  steps: ["Qizdirilganda gidroksid ionlari orasidan suv molekulalari ajralib chiqadi.", "Qizil-qo'ng'ir temir(III) oksid qoladi."],
  obs: { solid_color_change: { from: col('Fe(OH)3'), to: col('Fe2O3') }, effects: [E('condensate')], text_uz: "Qo'ng'ir modda qizil-qo'ng'ir kukunga aylanadi, probirkaning sovuq qismida suv tomchilari paydo bo'ladi." },
  proc: ["Quruq probirkaga ozroq temir(III) gidroksid soling (oldindan quritilgan cho'kma).", "Probirkani og'zini biroz pastga qaratib qisqichga mahkamlang.", "Avval butun probirkani, so'ng modda turgan qismini qizdiring.", "Moddaning rangini va probirka devoridagi tomchilarni kuzating."],
  expl: "Temir(III) gidroksid suvda erimaydigan asos bo'lgani uchun qizdirilganda oksid va suvga parchalanadi. Hosil bo'lgan Fe₂O₃ tabiatda gematit minerali sifatida uchraydi va qizil bo'yoq (mumiyo) sifatida ishlatiladi.",
  q: ["Fe(OH)₃ ning parchalanish tenglamasini yozing va koeffitsiyentlarni tushuntiring.", "Nima uchun NaOH qizdirilganda bunday parchalanmaydi?"],
});
T({
  title: "Alyuminiy gidroksidning qizdirilganda parchalanishi",
  topic: "Amfoter gidroksidlarning xossalari",
  r: [{ species: 'Al(OH)3', state: 's', mass_g: 0.3 }], T: 300,
  mol: '2Al(OH)3 = Al2O3 + 3H2O↑',
  steps: ["Qizdirilganda Al(OH)₃ bosqichma-bosqich suv yo'qotadi.", "Oxirida oq alyuminiy oksid (glinozem) qoladi."],
  obs: { solid_color_change: { from: col('Al(OH)3'), to: col('Al2O3') }, effects: [E('condensate')], text_uz: "Oq modda tashqi ko'rinishini deyarli o'zgartirmaydi, lekin probirka devorida suv tomchilari to'planadi; qoldiq massasi kamayadi." },
  proc: ["Quruq probirkaga ozroq alyuminiy gidroksid soling.", "Probirkani og'zini biroz pastga qaratib qisqichga mahkamlang va kuchli qizdiring.", "Probirkaning sovuq qismidagi suv tomchilarini kuzating."],
  expl: "Alyuminiy gidroksid suvda erimaydi, shuning uchun qizdirilganda oksid va suvga parchalanadi. Rang o'zgarmagani uchun reaksiya borganini suv tomchilari va qoldiq massasining kamayishi ko'rsatadi; Al₂O₃ juda qattiq va qiyin suyuqlanadigan modda.",
  q: ["Rang o'zgarmasa, reaksiya ketganini qanday isbotlash mumkin?", "Alyuminiy oksid qayerda ishlatiladi?"],
});
T({
  title: "Rux gidroksidning qizdirilganda parchalanishi",
  topic: "Amfoter gidroksidlarning xossalari",
  r: [{ species: 'Zn(OH)2', state: 's', mass_g: 0.3 }], T: 130,
  mol: 'Zn(OH)2 = ZnO + H2O↑',
  steps: ["Rux gidroksiddan suv ajralib chiqadi.", "Rux oksid hosil bo'ladi; u qizdirilganda sarg'ayadi, sovuganda yana oqaradi."],
  obs: { solid_color_change: { from: col('Zn(OH)2'), to: col('ZnO') }, effects: [E('condensate')], text_uz: "Oq modda qizdirilganda sarg'ayadi, sovutilganda yana oq bo'ladi; probirka devorida suv tomchilari paydo bo'ladi." },
  proc: ["Quruq probirkaga ozroq rux gidroksid soling.", "Probirkani og'zini biroz pastga qaratib qizdiring.", "Issiq holatdagi va sovigandan keyingi qoldiq rangini solishtiring."],
  expl: "Rux gidroksid erimaydigan (amfoter) gidroksid, qizdirilganda rux oksidga aylanadi. ZnO issiq holatda sariq, sovuqda oq rangda bo'ladi — bu kristall panjaradagi o'zgarish bilan bog'liq fizik hodisa (termoxromizm).",
  q: ["ZnO ning qizdirilganda sarg'ayishi kimyoviy o'zgarishmi yoki fizik hodisami?", "Zn(OH)₂ ning amfoterligini isbotlovchi reaksiyalarni yozing."],
});
T({
  title: "Xrom(III) gidroksidning qizdirilganda parchalanishi",
  level: '9-sinf',
  topic: "Amfoter gidroksidlarning xossalari; xrom birikmalari",
  r: [{ species: 'Cr(OH)3', state: 's', mass_g: 0.3 }], T: 300,
  mol: '2Cr(OH)3 = Cr2O3 + 3H2O↑',
  steps: ["Kulrang-yashil gidroksid qizdirilganda suv yo'qotadi.", "To'q yashil xrom(III) oksid hosil bo'ladi."],
  obs: { solid_color_change: { from: col('Cr(OH)3'), to: col('Cr2O3') }, effects: [E('condensate')], text_uz: "Kulrang-yashil modda to'q yashil kukunga aylanadi, probirka devorida suv tomchilari paydo bo'ladi." },
  proc: ["Quruq probirkaga ozroq xrom(III) gidroksid soling.", "Probirkani og'zini biroz pastga qaratib kuchli qizdiring.", "Qoldiq rangini va suv tomchilarini kuzating."],
  safety: "Xrom birikmalari zararli; changini nafas olmang, qo'lqopda ishlang. " + TUBE_SAFE,
  expl: "Xrom(III) gidroksid erimaydigan amfoter gidroksid bo'lib, qizdirilganda Cr₂O₃ va suvga parchalanadi. Cr₂O₃ — barqaror yashil pigment (\"xrom ko'ki\" emas, \"xrom yashili\"), bo'yoq va abraziv sifatida ishlatiladi.",
  q: ["Cr₂O₃ qanday xossali oksid?", "Cr(OH)₃ ni qanday qilib olish mumkin?"],
});
T({
  title: "Magniy gidroksidning qizdirilganda parchalanishi",
  topic: "Asoslarning xossalari: erimaydigan asoslarning parchalanishi",
  r: [{ species: 'Mg(OH)2', state: 's', mass_g: 0.3 }], T: 350,
  mol: 'Mg(OH)2 = MgO + H2O↑',
  steps: ["Qizdirilganda Mg(OH)₂ dan suv molekulasi ajraladi.", "Oq magniy oksid qoladi."],
  obs: { solid_color_change: { from: col('Mg(OH)2'), to: col('MgO') }, effects: [E('condensate')], text_uz: "Oq kukun ko'rinishi o'zgarmaydi, probirkaning sovuq qismida suv tomchilari to'planadi." },
  proc: ["Quruq probirkaga ozroq magniy gidroksid soling.", "Probirkani og'zini biroz pastga qaratib kuchli qizdiring.", "Probirka devoridagi suv tomchilarini kuzating."],
  expl: "Magniy gidroksid kam eriydigan asos va u ishqorlarga qaraganda ancha oson parchalanadi. Hosil bo'lgan MgO o'tga chidamli material sifatida ishlatiladi.",
  q: ["Mg(OH)₂ va NaOH ning qizdirilgandagi xatti-harakatini solishtiring.", "MgO suv bilan qanday reaksiyaga kirishadi?"],
});
T({
  title: "Kalsiy gidroksidning kuchli qizdirilganda parchalanishi",
  level: '9-sinf',
  topic: "Ishqoriy-yer metallarining birikmalari",
  r: [{ species: 'Ca(OH)2', state: 's', mass_g: 0.5 }], T: 520,
  note: "Spirt lampasi alangasi yetarli emas — tigelda gorelka bilan kuchli qizdiriladi.",
  mol: 'Ca(OH)2 = CaO + H2O↑',
  steps: ["So'ndirilgan ohak ancha yuqori haroratda suv yo'qotadi.", "So'ndirilmagan ohak (CaO) hosil bo'ladi."],
  obs: { solid_color_change: { from: col('Ca(OH)2'), to: col('CaO') }, effects: [E('heat-haze')], text_uz: "Oq kukun tashqi ko'rinishini o'zgartirmaydi; sovigan qoldiqqa bir tomchi suv tomizilsa, u qiziydi (CaO so'nadi)." },
  app: CRUCIBLE,
  proc: ["Tigelga ozroq kalsiy gidroksid soling va uni chinni uchburchakka o'rnating.", "Gorelka alangasida 10–15 daqiqa kuchli qizdiring.", "Tigelni qisqich bilan olib, sovushini kuting.", "Qoldiqqa bir-ikki tomchi suv tomizib, qizishini kuzating."],
  safety: "CaO va Ca(OH)₂ ko'z va terini kuydiradi; ko'zoynak taqing. Issiq tigelni faqat qisqich bilan ushlang.",
  expl: "Kalsiy gidroksid ishqor bo'lsa-da, NaOH va KOH dan farqli ravishda yuqori haroratda oksid va suvga parchalanadi. Hosil bo'lgan CaO suv bilan qizib, yana Ca(OH)₂ ga aylanadi (ohakni so'ndirish).",
  q: ["Nima uchun bu tajribada spirt lampasi yetarli emas?", "CaO ga suv qo'shilganda nima uchun issiqlik ajraladi?"],
});
T({
  title: "Silikat kislotaning qizdirilganda parchalanishi",
  level: '9-sinf',
  topic: "Kremniy va uning birikmalari",
  r: [{ species: 'H2SiO3', state: 's', mass_g: 0.3 }], T: 200,
  note: "Silikat kislota iviq cho'kmasi oldindan quritiladi.",
  mol: 'H2SiO3 = SiO2 + H2O↑',
  steps: ["Silikat kislota beqaror, qizdirilganda suv yo'qotadi.", "Kremniy(IV) oksid qoladi."],
  obs: { solid_color_change: { from: col('H2SiO3'), to: col('SiO2') }, effects: [E('condensate')], text_uz: "Oq modda qizdirilganda suv ajratadi (probirka devorida tomchilar), qoldiq oq kukun — kremniy(IV) oksid." },
  proc: ["Quritilgan silikat kislotani quruq probirkaga soling.", "Probirkani og'zini biroz pastga qaratib qizdiring.", "Suv tomchilarini kuzating."],
  expl: "Silikat kislota suvda erimaydigan, beqaror kislota bo'lib, qizdirilganda kislotali oksid (SiO₂) va suvga parchalanadi. Shu jarayonda g'ovak silikagel olinadi — u yaxshi adsorbent va quritgich.",
  q: ["Silikat kislotani qanday qilib olish mumkin?", "Silikagel nima uchun quritgich sifatida ishlatiladi?"],
});

// ===================================================================== karbonatlar
T({
  title: "Kalsiy karbonatning (ohaktosh, marmar) termik parchalanishi",
  level: '9-sinf',
  topic: "Uglerod birikmalari: karbonatlar; ohak olish",
  r: [{ species: 'CaCO3', state: 's', mass_g: 1, form: "bo'lak" }], T: 900,
  note: "Marmar bo'lagi gorelkaning eng issiq alangasida yoki mufel pechida qizdiriladi.",
  mol: 'CaCO3 = CaO + CO2↑',
  steps: ["Yuqori haroratda karbonat ioni CO₂ va O²⁻ ga parchalanadi.", "Kalsiy oksid (so'ndirilmagan ohak) qoladi, CO₂ gaz holida chiqadi."],
  obs: { gas: gas('CO2'), heat: 'kuchli-endotermik', effects: [E('glow')], text_uz: "Qattiq qizdirilgan marmar bo'lagi yorqin oq nur sochadi; sovutilgandan keyin unga suv tomizilsa qiziydi va fenolftalein qo'shilsa eritma to'q pushti rangga bo'yaladi." },
  app: [...CRUCIBLE, 'tomizgich'],
  proc: ["Marmar bo'lagini tigelga qo'yib, chinni uchburchakka o'rnating.", "Gorelka alangasida 15–20 daqiqa kuchli qizdiring.", "Sovigan bo'lakni probirkaga olib, ustiga ozroq suv tomizing va qizishini kuzating.", "Hosil bo'lgan aralashmaga fenolftalein tomizing."],
  safety: "Gorelka bilan ehtiyot bo'ling; CaO terini va ko'zni kuydiradi — ko'zoynak taqing, qo'l bilan ushlamang.",
  expl: "Kalsiy karbonat faqat yuqori haroratda (taxminan 900 °C atrofida) parchalanadi; sanoatda ohak shu usulda ohak pechlarida kuydiriladi. Qizdirilgan CaO yorqin nur sochadi (\"ohak nuri\"), hosil bo'lgan oksid suv bilan ishqor beradi.",
  q: ["Ohak kuydirish reaksiyasi ekzotermikmi yoki endotermikmi?", "Qoldiqda CaO borligini qanday isbotlash mumkin?", "Ohaktosh qayerlarda ishlatiladi?"],
});
T({
  title: "Magniy karbonatning termik parchalanishi",
  level: '9-sinf',
  topic: "Karbonatlarning xossalari",
  r: [{ species: 'MgCO3', state: 's', mass_g: 0.5 }], T: 450,
  mol: 'MgCO3 = MgO + CO2↑',
  steps: ["Qizdirilganda MgCO₃ karbonat aniondan CO₂ ajraladi.", "Oq magniy oksid qoladi."],
  obs: { gas: gas('CO2'), effects: [E('bubbles')], text_uz: "Oq kukun o'zgarmaydi; gaz o'tkazuvchi naycha ohakli suvga tushirilsa, ohakli suv loyqalanadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga magniy karbonat soling va gaz chiqarish naychali tiqin bilan berkiting.", "Naycha uchini ohakli suvli probirkaga tushiring.", "Probirkani kuchli qizdiring va ohakli suvni kuzating.", "Qizdirishni to'xtatishdan oldin naychani ohakli suvdan chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini suyuqlikdan chiqaring, aks holda suyuqlik issiq probirkaga so'rilib, uni yorib yuboradi.",
  expl: "Magniy karbonat kalsiy karbonatga qaraganda pastroq haroratda parchalanadi: kationning zaryad zichligi qanchalik katta bo'lsa, karbonat shuncha oson parchalanadi. Ajralgan CO₂ ohakli suvni loyqalatishi bilan aniqlanadi.",
  q: ["CO₂ ni qanday aniqlash mumkin?", "MgCO₃ va CaCO₃ ning parchalanish haroratini solishtiring."],
});
T({
  title: "Rux karbonatning termik parchalanishi",
  level: '9-sinf',
  topic: "Karbonatlarning xossalari",
  r: [{ species: 'ZnCO3', state: 's', mass_g: 0.5 }], T: 300,
  mol: 'ZnCO3 = ZnO + CO2↑',
  steps: ["Qizdirilganda ZnCO₃ dan CO₂ ajraladi.", "Rux oksid qoladi; u issiqda sariq, sovuqda oq."],
  obs: { gas: gas('CO2'), solid_color_change: { from: col('ZnCO3'), to: col('ZnO') }, effects: [E('bubbles')], text_uz: "Oq kukun qizdirilganda sarg'ayadi va sovuganda yana oqaradi; ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga rux karbonat soling, gaz chiqarish naychali tiqin bilan berkiting.", "Naycha uchini ohakli suvga tushiring va probirkani qizdiring.", "Qoldiqning issiq va sovuq holatdagi rangini solishtiring.", "Qizdirishni to'xtatishdan oldin naychani ohakli suvdan chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini suyuqlikdan chiqaring. " + TUBE_SAFE,
  expl: "Og'ir metallarning karbonatlari ishqoriy metallar karbonatlariga qaraganda ancha oson parchalanadi. ZnO ning issiqda sarg'ayishi — uning sifat belgisi.",
  q: ["Qoldiq ZnO ekanini qanday belgi bilan aniqlash mumkin?", "Nima uchun Na₂CO₃ qizdirilganda parchalanmaydi?"],
});
T({
  title: "Malaxitning (mis(II) gidroksokarbonat) termik parchalanishi",
  topic: "Murakkab moddalarning parchalanishi; tuzlarning xossalari",
  r: [{ species: '(CuOH)2CO3', state: 's', mass_g: 0.5 }], T: 250,
  mol: '(CuOH)2CO3 = 2CuO + CO2↑ + H2O↑',
  steps: ["Qizdirilganda asosli tuz parchalanadi: gidroksid guruhlaridan suv, karbonatdan CO₂ ajraladi.", "Qora mis(II) oksid qoladi."],
  obs: { gas: gas('CO2'), solid_color_change: { from: col('(CuOH)2CO3'), to: col('CuO') }, effects: [E('condensate'), E('bubbles')], text_uz: "Yashil kukun qorayadi, probirka devorida suv tomchilari paydo bo'ladi, ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga malaxit kukunini soling va uni og'zini biroz pastga qaratib shtativga mahkamlang.", "Gaz chiqarish naychasini ohakli suvli probirkaga tushiring.", "Probirkani avval butunlay, so'ng modda turgan joyidan qizdiring.", "Rang o'zgarishi, suv tomchilari va ohakli suvni kuzating; oxirida avval naychani chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini ohakli suvdan chiqaring. " + TUBE_SAFE,
  expl: "Malaxit — asosli tuz, uning tarkibida ham gidroksid, ham karbonat guruhi bor, shuning uchun parchalanganda uch xil modda: oksid, suv va karbonat angidrid hosil bo'ladi. Bu tajriba parchalanish reaksiyasining klassik namunasi.",
  q: ["Mahsulotlarning har birini qanday aniqlash mumkin?", "Malaxit tarkibidagi elementlarni ayting.", "Bu reaksiya qaysi turga kiradi?"],
});
T({
  title: "Qo'rg'oshin(II) karbonatning termik parchalanishi",
  level: '9-sinf',
  topic: "Karbonatlarning xossalari",
  r: [{ species: 'PbCO3', state: 's', mass_g: 0.5 }], T: 350,
  mol: 'PbCO3 = PbO + CO2↑',
  steps: ["Qizdirilganda PbCO₃ dan CO₂ ajraladi.", "Sariq qo'rg'oshin(II) oksid (glyot) qoladi."],
  obs: { gas: gas('CO2'), solid_color_change: { from: col('PbCO3'), to: col('PbO') }, effects: [E('bubbles')], text_uz: "Oq kukun sarg'ayadi, ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga oz miqdorda qo'rg'oshin karbonat soling, gaz chiqarish naychali tiqin bilan berkiting.", "Naycha uchini ohakli suvga tushiring va probirkani qizdiring.", "Qoldiq rangini kuzating; oxirida avval naychani chiqaring."],
  safety: "Qo'rg'oshin birikmalari zaharli: changini nafas olmang, qo'lqopda ishlang, " + "qoldiqni maxsus idishga yig'ing. Qizdirish to'xtatilishidan oldin naychani suyuqlikdan chiqaring.",
  expl: "Qo'rg'oshin karbonat nisbatan past haroratda parchalanib, sariq PbO hosil qiladi. Rangning oqdan sariqqa o'zgarishi va CO₂ ning ajralishi reaksiya borganini ko'rsatadi.",
  q: ["PbO qanday rangda?", "Karbonatlarning parchalanish harorati kationga qanday bog'liq?"],
});
T({
  title: "Bariy karbonatning juda yuqori haroratda parchalanishi",
  level: 'litsey',
  topic: "Karbonatlarning termik barqarorligi",
  r: [{ species: 'BaCO3', state: 's', mass_g: 0.5 }], T: 1050,
  note: "Gorelka alangasi yetarli emas — faqat yuqori haroratli mufel pechida; 1050 °C — taxminiy modellash chegarasi, amalda parchalanish yanada yuqori haroratda tez boradi.",
  mol: 'BaCO3 = BaO + CO2↑',
  steps: ["Ba²⁺ ioni katta va zaryad zichligi kichik, shuning uchun karbonat ionini kam qutblaydi.", "Shu sababli BaCO₃ juda yuqori haroratdagina BaO va CO₂ ga parchalanadi."],
  obs: { gas: gas('CO2'), heat: 'kuchli-endotermik', effects: [E('glow')], text_uz: "Spirt lampasi va gorelkada qizdirilganda o'zgarish kuzatilmaydi; faqat juda yuqori haroratda massa kamayadi va CO₂ ajraladi." },
  app: FURNACE,
  proc: ["Tigelga bariy karbonat soling va massasini o'lchang.", "Tigelni mufel pechiga qo'yib, juda yuqori haroratda uzoq qizdiring.", "Sovigandan keyin qoldiq massasini qayta o'lchang va solishtiring."],
  safety: "Bariy birikmalari zaharli; changini nafas olmang. Mufel pechidan tigelni faqat uzun qisqich va himoya qo'lqopi bilan oling.",
  expl: "Ishqoriy-yer metallari karbonatlarining termik barqarorligi guruh bo'ylab pastga qarab ortadi: MgCO₃ < CaCO₃ < SrCO₃ < BaCO₃. Bariy karbonat eng barqaror, u maktab sharoitidagi qizdirishda parchalanmaydi.",
  q: ["MgCO₃, CaCO₃ va BaCO₃ ni termik barqarorligi bo'yicha tartiblang.", "Nima uchun kation radiusi ortishi bilan karbonat barqarorroq bo'ladi?"],
  conf: "o'rta",
});
T({
  title: "Temir(II) karbonatning havosiz qizdirilganda parchalanishi",
  level: 'litsey',
  topic: "Karbonatlarning xossalari; temir birikmalari",
  r: [{ species: 'FeCO3', state: 's', mass_g: 0.5 }], T: 450,
  note: "Havo kirmasligi uchun probirka gaz chiqarish naychali tiqin bilan berkitiladi; havoda qizdirilsa FeO oksidlanib Fe₂O₃ hosil bo'ladi.",
  mol: 'FeCO3 = FeO + CO2↑',
  steps: ["Qizdirilganda FeCO₃ dan CO₂ ajraladi.", "Havo kirmasa qora temir(II) oksid qoladi; havoda u tezda Fe₂O₃ gacha oksidlanadi."],
  obs: { gas: gas('CO2'), solid_color_change: { from: col('FeCO3'), to: col('FeO') }, effects: [E('bubbles')], text_uz: "Kulrang-oq kukun qorayadi, ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga temir(II) karbonat soling va gaz chiqarish naychali tiqin bilan zich berkiting.", "Naycha uchini ohakli suvga tushiring va probirkani qizdiring.", "Qoldiq rangini kuzating; oxirida avval naychani chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini suyuqlikdan chiqaring. " + TUBE_SAFE,
  expl: "Siderit (FeCO₃) qizdirilganda CO₂ yo'qotadi. Mahsulot tarkibi sharoitga bog'liq: havosiz FeO, havo ishtirokida esa temir(II) oksidlanib Fe₂O₃ hosil bo'ladi — temir rudalarini kuydirish shunga asoslangan.",
  q: ["Havo ishtirokida FeCO₃ parchalanganda qanday mahsulot hosil bo'ladi? Tenglamasini yozing.", "Bu reaksiyada temirning oksidlanish darajasi o'zgaradimi?"],
  conf: "o'rta",
});

// ===================================================================== gidrokarbonatlar
T({
  title: "Natriy gidrokarbonatning (ichimlik sodasi) termik parchalanishi",
  topic: "Tuzlarning xossalari: nordon tuzlar",
  r: [{ species: 'NaHCO3', state: 's', mass_g: 1 }], T: 120,
  mol: '2NaHCO3 = Na2CO3 + CO2↑ + H2O↑',
  steps: ["Qizdirilganda ikki HCO₃⁻ ionidan CO₂ va suv ajraladi.", "Qattiq natriy karbonat qoladi."],
  obs: { gas: gas('CO2'), effects: [E('condensate'), E('bubbles')], text_uz: "Oq kukun tashqi ko'rinishini saqlaydi, probirka devorida suv tomchilari paydo bo'ladi, ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga 1 g ichimlik sodasi soling, probirkani og'zini biroz pastga qaratib mahkamlang.", "Gaz chiqarish naychasini ohakli suvga tushiring.", "Probirkani qizdiring, ohakli suv va probirka devorini kuzating.", "Qizdirishni to'xtatishdan oldin naychani ohakli suvdan chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini suyuqlikdan chiqaring. " + TUBE_SAFE,
  expl: "Nordon tuzlar o'rta tuzlarga qaraganda beqaror: NaHCO₃ nisbatan past haroratda parchalanadi, Na₂CO₃ esa bunday sharoitda parchalanmaydi. Novvoychilikda xamirning ko'pchishi ham shu reaksiyada ajraladigan CO₂ hisobiga.",
  q: ["Nima uchun ichimlik sodasi xamirni ko'pchitadi?", "Qoldiq Na₂CO₃ ekanini qanday isbotlash mumkin?"],
});
T({
  title: "Kaliy gidrokarbonatning termik parchalanishi",
  topic: "Tuzlarning xossalari: nordon tuzlar",
  r: [{ species: 'KHCO3', state: 's', mass_g: 1 }], T: 150,
  mol: '2KHCO3 = K2CO3 + CO2↑ + H2O↑',
  steps: ["Qizdirilganda gidrokarbonat ionlaridan CO₂ va suv ajraladi.", "Kaliy karbonat (potash) qoladi."],
  obs: { gas: gas('CO2'), effects: [E('condensate'), E('bubbles')], text_uz: "Oq kristallar kukunga aylanadi, probirka devorida suv tomchilari to'planadi, ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga kaliy gidrokarbonat soling.", "Gaz chiqarish naychasini ohakli suvga tushiring va probirkani qizdiring.", "Ohakli suv va probirka devoridagi o'zgarishlarni kuzating; oxirida avval naychani chiqaring."],
  safety: "Qizdirish to'xtatilishidan oldin gaz naychasini suyuqlikdan chiqaring. " + TUBE_SAFE,
  expl: "Kaliy gidrokarbonat ham natriy gidrokarbonat kabi qizdirilganda o'rta tuz, CO₂ va suvga parchalanadi. Hosil bo'lgan K₂CO₃ (potash) esa termik barqaror.",
  q: ["KHCO₃ va K₂CO₃ ning termik barqarorligini solishtiring.", "Potash qayerda ishlatiladi?"],
});
T({
  title: "Ammoniy gidrokarbonatning qizdirilganda to'liq parchalanishi",
  topic: "Ammoniy tuzlari",
  r: [{ species: 'NH4HCO3', state: 's', mass_g: 0.5 }], T: 60,
  mol: 'NH4HCO3 = NH3↑ + CO2↑ + H2O↑',
  steps: ["Ammoniy ionidan proton gidrokarbonat ioniga o'tadi.", "Hosil bo'lgan NH₃, CO₂ va suv gaz holida chiqib ketadi — probirkada qoldiq qolmaydi."],
  obs: { gas: gas('NH3'), effects: [E('condensate')], text_uz: "Oq kristallar qoldiqsiz yo'qoladi, ammiak hidi seziladi, probirka og'ziga tutilgan ho'l qizil lakmus qog'ozi ko'karadi." },
  app: [...TUBE, 'indikator-qogozi'],
  proc: ["Quruq probirkaga ozroq ammoniy gidrokarbonat soling.", "Probirkani sekin qizdiring.", "Probirka og'ziga ho'llangan qizil lakmus qog'ozini tuting.", "Probirkada qoldiq qolganini tekshiring."],
  safety: "Ammiakni to'g'ridan-to'g'ri hidlamang — havoni qo'l bilan o'zingizga yelpib hidlang. Tajribani yaxshi shamollatiladigan joyda o'tkazing.",
  expl: "Ammoniy gidrokarbonat past haroratda ham parchalanadi va barcha mahsulotlari uchuvchan bo'lgani uchun qoldiq qolmaydi. Shuning uchun u qandolatchilikda yumshatgich (\"ammoniy\") sifatida ishlatiladi.",
  q: ["Nima uchun probirkada qoldiq qolmaydi?", "Ajralgan ammiakni qanday aniqlash mumkin?"],
});
T({
  title: "Ammoniy karbonatning qizdirilganda parchalanishi",
  topic: "Ammoniy tuzlari",
  r: [{ species: '(NH4)2CO3', state: 's', mass_g: 0.5 }], T: 60,
  mol: '(NH4)2CO3 = 2NH3↑ + CO2↑ + H2O↑',
  steps: ["Ammoniy ionlari karbonat ioniga proton beradi.", "NH₃, CO₂ va suv bug'i ajralib chiqadi, qoldiq qolmaydi."],
  obs: { gas: gas('NH3'), effects: [E('condensate')], text_uz: "Oq modda qoldiqsiz yo'qoladi, kuchli ammiak hidi seziladi, ho'l qizil lakmus qog'ozi ko'karadi." },
  app: [...TUBE, 'indikator-qogozi'],
  proc: ["Quruq probirkaga ozroq ammoniy karbonat soling.", "Probirkani ehtiyotkorlik bilan qizdiring.", "Probirka og'ziga ho'l qizil lakmus qog'ozini tuting."],
  safety: "Ammiakni to'g'ridan-to'g'ri hidlamang; yaxshi shamollatiladigan joyda ishlang. " + TUBE_SAFE,
  expl: "Kuchsiz asos (NH₃) va kuchsiz kislota (H₂CO₃) dan hosil bo'lgan tuz termik beqaror. Qizdirilganda u o'zini tashkil etgan uchuvchan moddalarga to'liq parchalanadi.",
  q: ["Ammoniy karbonat va natriy karbonatning qizdirilgandagi farqini tushuntiring.", "\"Novshadil spirti\" hidi qaysi moddaga tegishli?"],
});
T({
  title: "Kalsiy gidrokarbonat eritmasini qaynatish (suvning vaqtinchalik qattiqligini yo'qotish)",
  level: '9-sinf',
  topic: "Suvning qattiqligi va uni yumshatish",
  r: [{ species: 'Ca(HCO3)2', state: 'aq', conc_M: 0.05, volume_mL: 5 }], T: 70,
  note: "Eritma qaynaguncha qizdiriladi.",
  mol: 'Ca(HCO3)2 = CaCO3↓ + CO2↑ + H2O',
  full: 'Ca²⁺ + 2HCO3⁻ = CaCO3↓ + CO2↑ + H2O',
  net: 'Ca²⁺ + 2HCO3⁻ = CaCO3↓ + CO2↑ + H2O',
  steps: ["Qizdirilganda gidrokarbonat ionlari CO₃²⁻, CO₂ va suvga aylanadi.", "Hosil bo'lgan CO₃²⁻ ionlari Ca²⁺ bilan erimaydigan CaCO₃ ni cho'ktiradi."],
  obs: { precipitate: ppt('CaCO3'), gas: gas('CO2'), heat: 'sezilarsiz', effects: [E('boil'), E('turbidity')], text_uz: "Tiniq eritma qaynatilganda loyqalanadi va oq cho'kma tushadi, mayda gaz pufakchalari ajraladi." },
  kin: "o'rtacha",
  app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 5 ml kalsiy gidrokarbonat eritmasini (yoki qattiq suvni) quying.", "Eritmani qaynaguncha qizdiring va bir necha daqiqa qaynating.", "Hosil bo'lgan loyqalik va cho'kmani kuzating."],
  safety: "Qaynayotgan eritma sachrashi mumkin: probirkani qiya ushlang va og'zini odamlarga qaratmang.",
  expl: "Kalsiy va magniy gidrokarbonatlari suvga vaqtinchalik qattiqlik beradi. Qaynatilganda ular parchalanib erimaydigan karbonatga aylanadi — choynak va qozonlarda quyqa (nakip) shu tarzda hosil bo'ladi.",
  q: ["Vaqtinchalik va doimiy qattiqlik nima bilan farq qiladi?", "Choynakdagi quyqani qanday moddalar bilan tozalash mumkin?"],
});

// ===================================================================== ammoniy tuzlari
T({
  title: "Ammoniy xloridning qizdirilganda parchalanishi va qayta birikishi (\"sublimatsiya\")",
  level: '9-sinf',
  topic: "Ammoniy tuzlari; qaytar reaksiyalar",
  r: [{ species: 'NH4Cl', state: 's', mass_g: 0.5 }], T: 340,
  note: "Probirkaning faqat tubi qizdiriladi; yuqori sovuq qismida NH₃ va HCl qayta birikadi.",
  mol: 'NH4Cl = NH3↑ + HCl↑',
  steps: ["Qizdirilganda NH₄⁺ ionidan proton Cl⁻ ioniga o'tadi va ikki gaz — NH₃ va HCl hosil bo'ladi.", "Gazlar probirkaning sovuq qismiga ko'tariladi va u yerda qayta birikib, yana NH₄Cl kristallarini hosil qiladi."],
  obs: { gas: gas('NH3'), effects: [E('smoke'), E('deposit')], text_uz: "Probirka tubidagi oq kristallar yo'qoladi, yuqori sovuq devorda esa yana oq g'ubor (NH₄Cl) yig'iladi; og'ziga tutilgan ho'l lakmus qog'ozi avval ko'karadi, so'ng qizaradi." },
  app: [...TUBE, 'indikator-qogozi'],
  proc: ["Quruq probirkaga ozroq ammoniy xlorid soling.", "Probirkani qiya ushlab, faqat tubini qizdiring.", "Probirkaning yuqori sovuq qismida oq g'ubor paydo bo'lishini kuzating.", "Probirka og'ziga ho'l lakmus qog'ozini tutib, rang o'zgarishini kuzating."],
  safety: "Ajraladigan HCl va NH₃ nafas yo'llarini qitiqlaydi — yaxshi shamollatiladigan joyda yoki mo'rili shkafda ishlang. " + TUBE_SAFE,
  expl: "Bu hodisa tashqi tomondan sublimatsiyaga o'xshaydi, lekin aslida kimyoviy jarayon: NH₄Cl issiqda NH₃ va HCl ga parchalanadi, sovuqda ular qayta birikadi (NH₃ + HCl = NH₄Cl). Yengilroq NH₃ tezroq tarqalgani uchun lakmus avval ko'karadi.",
  q: ["Nima uchun bu jarayon haqiqiy sublimatsiya emas?", "Lakmus qog'ozi rangining ketma-ket o'zgarishini tushuntiring.", "Bu xossa NH₄Cl ni NaCl dan ajratishda qanday qo'llaniladi?"],
});
T({
  title: "Ammoniy dixromatning parchalanishi (\"vulqon\" tajribasi)",
  level: '9-sinf',
  topic: "Ichki molekulyar oksidlanish-qaytarilish reaksiyalari",
  r: [{ species: '(NH4)2Cr2O7', state: 's', mass_g: 2 }], T: 180,
  note: "Kristallar uyumi cho'g'langan shisha tayoqcha yoki gugurt alangasi bilan bir joyidan qizdiriladi; reaksiya o'z-o'zidan davom etadi.",
  mol: '(NH4)2Cr2O7 = Cr2O3 + N2↑ + 4H2O↑',
  eb: ['2N⁻³ − 6e⁻ = N2⁰', '2Cr⁺⁶ + 6e⁻ = 2Cr⁺³'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Bir modda tarkibida ham oksidlovchi (Cr⁺⁶), ham qaytaruvchi (N⁻³) bor — ichki molekulyar oksidlanish-qaytarilish.", "Reaksiya ekzotermik: boshlangandan keyin ajralgan issiqlik keyingi qatlamlarni qizdiradi.", "Ajralgan azot va suv bug'i yengil Cr₂O₃ zarrachalarini otib chiqaradi — \"vulqon\" hosil bo'ladi."],
  obs: { gas: gas('N2'), heat: 'ekzotermik', solid_color_change: { from: col('(NH4)2Cr2O7'), to: col('Cr2O3') }, effects: [E('volcano'), E('sparks'), E('glow')], text_uz: "To'q sariq kristallar uchqun sochib \"otiladi\", hajmi ancha katta bo'lgan yengil to'q yashil kukun (Cr₂O₃) qoladi." },
  kin: 'tez',
  app: ['chinni-kosacha', 'shisha-tayoqcha', 'spirt-lampasi', 'gugurt'],
  proc: ["Chinni kosachaga yoki o'tga chidamli taglikka 2 g ammoniy dixromatni uyum shaklida to'king.", "Uyum uchiga spirt lampasida qizdirilgan shisha tayoqcha yoki yonib turgan gugurtni tekkizing.", "Reaksiya boshlangach, olovni olib qo'ying va jarayonni xavfsiz masofadan kuzating.", "Hosil bo'lgan yashil kukunning hajmini boshlang'ich moddaniki bilan solishtiring."],
  safety: "Ammoniy dixromat zaharli va kanserogen (Cr⁺⁶): qo'lqopda ishlang, changini nafas olmang. " + HOOD + "; uchayotgan Cr₂O₃ zarrachalari stolga sochiladi — atrofni tozalab, chiqindini maxsus idishga yig'ing.",
  expl: "Ammoniy dixromatda xrom(VI) oksidlovchi, ammoniy azoti (N⁻³) esa qaytaruvchi vazifasini bajaradi, shuning uchun modda tashqi reagentsiz parchalanadi. Reaksiya ekzotermik bo'lgani uchun bir marta boshlansa o'zi davom etadi.",
  q: ["Reaksiyada oksidlovchi va qaytaruvchini ko'rsating.", "Nima uchun reaksiya boshlanganidan keyin qizdirish shart emas?", "Ichki molekulyar oksidlanish-qaytarilish reaksiyalariga yana misollar keltiring."],
});
T({
  title: "Ammoniy nitrit eritmasining qizdirilganda parchalanishi (azot olish)",
  level: '9-sinf',
  topic: "Azot va uning olinishi; ichki molekulyar oksidlanish-qaytarilish",
  r: [{ species: 'NH4NO2', state: 'aq', conc_M: 2, volume_mL: 3 }], T: 70,
  note: "Konsentrlangan eritma ehtiyotkorlik bilan qizdiriladi; amalda ko'pincha NH₄Cl va NaNO₂ eritmalari aralashmasi ishlatiladi.",
  mol: 'NH4NO2 = N2↑ + 2H2O',
  full: 'NH4⁺ + NO2⁻ = N2↑ + 2H2O',
  net: 'NH4⁺ + NO2⁻ = N2↑ + 2H2O',
  eb: ['N⁻³ − 3e⁻ = N⁰', 'N⁺³ + 3e⁻ = N⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Ammoniy ionidagi azot (N⁻³) qaytaruvchi, nitrit ionidagi azot (N⁺³) oksidlovchi.", "Ikkala azot atomi ham N⁰ gacha o'tadi — erkin azot hosil bo'ladi (konproporsiyalanish)."],
  obs: { gas: gas('N2'), heat: 'ekzotermik', effects: [E('bubbles')], text_uz: "Qizdirilganda eritmadan rangsiz, hidsiz gaz pufakchalari ajraladi; gaz yig'ilgan probirkaga tushirilgan yonib turgan cho'p o'chadi." },
  kin: "o'rtacha",
  app: ['probirka', 'shtativ', 'qisqich-lapka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'spirt-lampasi', 'pnevmatik-vanna', 'chop-yonib-turgan'],
  proc: ["Probirkaga 3 ml ammoniy nitrit eritmasini quying va gaz chiqarish naychali tiqin bilan berkiting.", "Probirkani shtativga mahkamlab, ehtiyotkorlik bilan qizdiring.", "Ajralayotgan gazni suv ostida (pnevmatik vannada) probirkaga yig'ing.", "Gaz to'ldirilgan probirkaga yonib turgan cho'pni tushirib, alanga o'chishini kuzating."],
  safety: "Reaksiya ekzotermik — qizdirishni sekin olib boring, eritma qaynab ketsa alangani olib qo'ying. Qattiq ammoniy nitritni qizdirmang: u beqaror. Qizdirish to'xtatilishidan oldin naychani suvdan chiqaring.",
  expl: "Ammoniy nitritda bir xil element (azot) ham oksidlovchi, ham qaytaruvchi vazifasida bo'ladi, shuning uchun parchalanganda faqat N₂ va suv hosil bo'ladi. Laboratoriyada sof azot shu usulda olinadi; azot yonishni quvvatlamaydi.",
  q: ["Bu reaksiyada azotning oksidlanish darajalari qanday o'zgaradi?", "Azotni qanday usulda yig'ish mumkin va nima uchun?"],
});

// ===================================================================== nitratlar
T({
  title: "Natriy nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'NaNO3', state: 's', mass_g: 1 }], T: 400,
  note: "Tuz avval suyuqlanadi, so'ng parchalanadi.",
  mol: '2NaNO3 = 2NaNO2 + O2↑',
  eb: ['N⁺⁵ + 2e⁻ = N⁺³', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Faol metallarning nitratlari qizdirilganda nitrit va kislorodga parchalanadi.", "N⁺⁵ ikki elektron qabul qilib N⁺³ ga, kislorod O⁻² dan O₂⁰ ga o'tadi."],
  obs: { gas: gas('O2'), effects: [E('bubbles')], text_uz: "Oq tuz suyuqlanadi, suyuqlanmadan gaz pufakchalari ajraladi; probirkaga tushirilgan cho'g'langan cho'p alangalanib ketadi." },
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga natriy nitrat soling va uni qisqichga mahkamlang.", "Tuz suyuqlanib, gaz ajrala boshlaguncha kuchli qizdiring.", "Probirka og'ziga cho'g'langan cho'pni tushiring va alangalanishini kuzating."],
  safety: "Nitrat suyuqlanmasi kuchli oksidlovchi: unga yog'och, qog'oz, oltingugurt va boshqa yonuvchan moddalar tushmasin. Cho'pni suyuqlanmaga tekkizmang.",
  expl: "Ishqoriy metallar nitratlari (litiydan tashqari) qizdirilganda nitrit va kislorodga parchalanadi. Ajralgan kislorod cho'g'langan cho'pni alangalatishi bilan aniqlanadi.",
  q: ["Nitratlarning parchalanishi metallning faollik qatoridagi o'rniga qanday bog'liq?", "Bu reaksiyada oksidlovchi va qaytaruvchini ko'rsating."],
});
T({
  title: "Kaliy nitratning (selitra) termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'KNO3', state: 's', mass_g: 1 }], T: 400,
  mol: '2KNO3 = 2KNO2 + O2↑',
  eb: ['N⁺⁵ + 2e⁻ = N⁺³', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kaliy nitrat suyuqlangandan keyin parchalana boshlaydi.", "Kaliy nitrit qoladi, kislorod ajraladi."],
  obs: { gas: gas('O2'), effects: [E('bubbles')], text_uz: "Kristallar suyuqlanadi, suyuqlanmadan gaz pufakchalari chiqadi; cho'g'langan cho'p alangalanadi." },
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga 1 g kaliy nitrat soling.", "Probirkani kuchli qizdiring — tuz suyuqlanib, gaz ajrala boshlaydi.", "Probirka og'ziga cho'g'langan cho'pni tushiring."],
  safety: "Kaliy nitrat suyuqlanmasi kuchli oksidlovchi; unga yonuvchan moddalar (ko'mir, oltingugurt, qog'oz) tushsa shiddatli yonish yuz beradi. Cho'pni suyuqlanmaga tekkizmang.",
  expl: "Kaliy nitrat ham boshqa ishqoriy metallar nitratlari kabi nitrit va kislorodga parchalanadi. Ajralgan kislorod tufayli selitra yonish jarayonlarini kuchaytiradi.",
  q: ["KNO₃ va Cu(NO₃)₂ ning parchalanish mahsulotlarini solishtiring.", "Nima uchun selitra yonuvchan moddalar bilan birga saqlanmaydi?"],
});
T({
  title: "Mis(II) nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'Cu(NO3)2', state: 's', mass_g: 0.5 }], T: 200,
  mol: '2Cu(NO3)2 = 2CuO + 4NO2↑ + O2↑',
  eb: ['N⁺⁵ + 1e⁻ = N⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Magniydan misgacha bo'lgan metallar nitratlari oksid, NO₂ va O₂ ga parchalanadi.", "N⁺⁵ bir elektron qabul qilib N⁺⁴ (NO₂) ga, kislorod O⁻² dan O₂ ga o'tadi."],
  obs: { gas: gas('NO2'), solid_color_change: { from: col('Cu(NO3)2'), to: col('CuO') }, effects: [E('color-gas')], text_uz: "Ko'k kristallar avval o'z kristallanish suvida eriydi, so'ng qorayadi; probirkadan qo'ng'ir gaz (NO₂) chiqadi." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq mis(II) nitrat soling.", "Probirkani mo'rili shkafda qizdiring.", "Qo'ng'ir gaz ajralishini va qoldiq rangining o'zgarishini kuzating."],
  safety: "NO₂ juda zaharli! " + HOOD + ", gazni hidlamang. " + TUBE_SAFE,
  expl: "Mis nitrati qizdirilganda qora mis(II) oksid, qo'ng'ir NO₂ va kislorod hosil bo'ladi. Bu faollik qatorining o'rta qismidagi metallar nitratlariga xos parchalanish turi.",
  q: ["Qo'ng'ir gaz qaysi modda?", "NaNO₃, Cu(NO₃)₂ va AgNO₃ ning parchalanishini solishtiring."],
});
T({
  title: "Qo'rg'oshin(II) nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'Pb(NO3)2', state: 's', mass_g: 0.5 }], T: 470,
  mol: '2Pb(NO3)2 = 2PbO + 4NO2↑ + O2↑',
  eb: ['N⁺⁵ + 1e⁻ = N⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda kristallar chirsillab yoriladi (dekrepitatsiya).", "Sariq qo'rg'oshin(II) oksid, qo'ng'ir NO₂ va kislorod hosil bo'ladi."],
  obs: { gas: gas('NO2'), solid_color_change: { from: col('Pb(NO3)2'), to: col('PbO') }, effects: [E('crack'), E('color-gas')], text_uz: "Oq kristallar chirsillab yoriladi, qo'ng'ir gaz ajraladi, qoldiq sariq rangga kiradi." },
  app: TUBE,
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga ozroq qo'rg'oshin nitrat soling.", "Probirkani mo'rili shkafda kuchli qizdiring.", "Kristallarning chirsillashini, qo'ng'ir gazni va qoldiq rangini kuzating."],
  safety: "NO₂ va qo'rg'oshin birikmalari zaharli! " + HOOD + ", qo'lqopda ishlang, qoldiqni maxsus idishga yig'ing.",
  expl: "Qo'rg'oshin nitrat — NO₂ ni laboratoriyada olishning klassik manbai. Kristallar ichidagi qoldiq namlik va gazlarning keskin kengayishi ularning chirsillab yorilishiga sabab bo'ladi.",
  q: ["Nima uchun kristallar chirsillaydi?", "Pb(NO₃)₂ ning parchalanish tenglamasini elektron balans usulida tenglashtiring."],
});
T({
  title: "Kumush nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'AgNO3', state: 's', mass_g: 0.3 }], T: 440,
  mol: '2AgNO3 = 2Ag + 2NO2↑ + O2↑',
  eb: ['Ag⁺¹ + 1e⁻ = Ag⁰', 'N⁺⁵ + 1e⁻ = N⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Vodoroddan keyin turadigan kam faol metallar nitratlari erkin metallgacha parchalanadi.", "Ag⁺ va N⁺⁵ qaytariladi, kislorod oksidlanadi."],
  obs: { gas: gas('NO2'), solid_color_change: { from: col('AgNO3'), to: col('Ag') }, effects: [E('color-gas'), E('deposit')], text_uz: "Tuz suyuqlanadi, qo'ng'ir gaz chiqadi, probirka tubida kulrang-oq kumush qoladi." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq kumush nitrat soling.", "Probirkani mo'rili shkafda kuchli qizdiring.", "Qo'ng'ir gaz ajralishini va qoldiqni kuzating."],
  safety: "NO₂ zaharli — " + HOOD.toLowerCase() + ". Kumush nitrat teriga tegsa qora dog' qoldiradi va kuydiradi; qo'lqopda ishlang.",
  expl: "Kumush oksidi ham beqaror bo'lgani uchun kumush nitrat parchalanganda oksid emas, balki erkin metall hosil bo'ladi. Shunday qilib nitratlarning parchalanish mahsuloti metallning faolligiga bog'liq.",
  q: ["Nima uchun mahsulot Ag₂O emas, balki Ag bo'ladi?", "Ikkita qaytaruvchi va bitta oksidlovchi bor bu reaksiyada elektronlar qanday taqsimlangan?"],
});
T({
  title: "Magniy nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'Mg(NO3)2', state: 's', mass_g: 0.5 }], T: 350,
  mol: '2Mg(NO3)2 = 2MgO + 4NO2↑ + O2↑',
  eb: ['N⁺⁵ + 1e⁻ = N⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Magniy nitrati ishqoriy metallar nitratlaridan farqli ravishda nitrit emas, oksid hosil qiladi.", "Qo'ng'ir NO₂ va kislorod ajraladi, oq MgO qoladi."],
  obs: { gas: gas('NO2'), effects: [E('color-gas')], text_uz: "Oq tuz qizdirilganda qo'ng'ir gaz ajratadi, probirkada oq kukun (MgO) qoladi." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq magniy nitrat soling.", "Probirkani mo'rili shkafda kuchli qizdiring.", "Qo'ng'ir gazni va qoldiqni kuzating."],
  safety: "NO₂ zaharli — " + HOOD.toLowerCase() + ". " + TUBE_SAFE,
  expl: "Magniy faollik qatorida ishqoriy metallardan keyin turadi, uning nitrati qizdirilganda oksid, NO₂ va O₂ hosil qiladi. Bu qoidaning chegarasini ko'rsatuvchi misol.",
  q: ["NaNO₃ va Mg(NO₃)₂ parchalanishining farqi nimada?", "Bu reaksiyada qaysi elementlar oksidlanish darajasini o'zgartiradi?"],
});
T({
  title: "Marganes(II) nitratning termik parchalanishi (MnO₂ olish)",
  level: 'litsey',
  topic: "Nitratlarning termik parchalanishi; marganes birikmalari",
  r: [{ species: 'Mn(NO3)2', state: 's', mass_g: 0.5 }], T: 200,
  mol: 'Mn(NO3)2 = MnO2 + 2NO2↑',
  eb: ['Mn⁺² − 2e⁻ = Mn⁺⁴', '2N⁺⁵ + 2e⁻ = 2N⁺⁴'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda nitrat ioni oksidlovchi vazifasini bajaradi va Mn²⁺ ni Mn⁺⁴ gacha oksidlaydi.", "Qora marganes(IV) oksid qoladi, qo'ng'ir NO₂ ajraladi; kislorod ajralmaydi."],
  obs: { gas: gas('NO2'), solid_color_change: { from: col('Mn(NO3)2'), to: col('MnO2') }, effects: [E('color-gas')], text_uz: "Och pushti tuz qizdirilganda suyuqlanadi, qo'ng'ir gaz chiqadi va qora kukun (MnO₂) qoladi." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq marganes(II) nitrat soling.", "Probirkani mo'rili shkafda qizdiring.", "Qo'ng'ir gazni va qoldiq rangini kuzating."],
  safety: "NO₂ zaharli — " + HOOD.toLowerCase() + ". " + TUBE_SAFE,
  expl: "Ko'pchilik nitratlardan farqli ravishda Mn(NO₃)₂ parchalanganda metall o'zi ham oksidlanadi: Mn⁺² → Mn⁺⁴, shuning uchun kislorod ajralmaydi. Shu usul bilan yupqa MnO₂ qatlamlari olinadi.",
  q: ["Bu reaksiyada nima uchun O₂ ajralmaydi?", "Elektron balansni tuzing va koeffitsiyentlarni tekshiring."],
  conf: "o'rta",
});

// ===================================================================== kislorodli tuzlar va oksidlar (O2 olish)
T({
  title: "Kaliy xloratning katalizatorsiz qizdirilishi (disproporsiyalanish)",
  level: 'litsey',
  topic: "Disproporsiyalanish reaksiyalari; katalizatorning roli",
  r: [{ species: 'KClO3', state: 's', mass_g: 1 }], T: 400,
  note: "Katalizatorsiz KClO₃ avval suyuqlanadi; 400 °C atrofida asosan perxlorat va xloridga aylanadi, kislorod kam ajraladi. Haroratni ancha oshirilsa KClO₄ ham KCl va O₂ ga parchalanadi.",
  mol: '4KClO3 = 3KClO4 + KCl',
  eb: ['Cl⁺⁵ − 2e⁻ = Cl⁺⁷', 'Cl⁺⁵ + 6e⁻ = Cl⁻¹'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Katalizator bo'lmasa, suyuqlangan KClO₃ da xlor atomlari o'zaro elektron almashadi.", "Uchta Cl⁺⁵ oksidlanib Cl⁺⁷ (perxlorat) ga, bittasi qaytarilib Cl⁻ ga o'tadi — disproporsiyalanish."],
  obs: { heat: 'ekzotermik', effects: [E('heat-haze')], text_uz: "Oq kristallar suyuqlanadi; gaz deyarli ajralmaydi, cho'g'langan cho'p alangalanmaydi. Suyuqlanma sovuganda yana qotadi." },
  kin: "o'rtacha",
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga ozroq toza kaliy xlorat soling.", "Probirkani ehtiyotkorlik bilan qizdiring, tuz suyuqlanishini kuzating.", "Probirka og'ziga cho'g'langan cho'pni tuting va MnO₂ ishtirokidagi tajriba bilan solishtiring."],
  safety: "KClO₃ suyuqlanmasi juda kuchli oksidlovchi: unga hech qanday yonuvchan modda (cho'p, qog'oz) tushmasin. Faqat o'qituvchi nazoratida, oz miqdorda, himoya ekrani ortida ishlang.",
  expl: "Katalizator nafaqat tezlikni, balki reaksiya yo'nalishini ham o'zgartirishi mumkin: MnO₂ bilan KClO₃ to'g'ridan-to'g'ri KCl va O₂ ga parchalanadi, usiz esa disproporsiyalanib KClO₄ va KCl hosil qiladi. Perxlorat ancha yuqori haroratdagina kislorod ajratadi.",
  q: ["Disproporsiyalanish nima? Misol keltiring.", "MnO₂ bilan va usiz o'tkazilgan tajribalar natijasini solishtiring."],
  conf: "o'rta",
});
T({
  title: "Simob(II) oksidning termik parchalanishi",
  level: '8-sinf',
  topic: "Kislorodning ochilishi tarixi; parchalanish reaksiyalari",
  r: [{ species: 'HgO', state: 's', mass_g: 0.5 }], T: 450,
  mol: '2HgO = 2Hg + O2↑',
  eb: ['Hg⁺² + 2e⁻ = Hg⁰', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda HgO dagi Hg⁺² qaytarilib metall simobga, O⁻² oksidlanib kislorodga aylanadi.", "Simob bug'i probirkaning sovuq qismida mayda yaltiroq tomchilar holida kondensatlanadi."],
  obs: { gas: gas('O2'), solid_color_change: { from: col('HgO'), to: col('Hg') }, effects: [E('mirror'), E('condensate')], text_uz: "To'q sariq-qizil kukun qorayib kamayadi, probirkaning sovuq devorida kumushrang simob tomchilari paydo bo'ladi; cho'g'langan cho'p alangalanadi." },
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga juda oz miqdorda simob(II) oksid soling.", "Mo'rili shkafda probirkani kuchli qizdiring.", "Probirka og'ziga cho'g'langan cho'pni tushiring.", "Probirkaning sovuq qismidagi metall tomchilarini kuzating."],
  safety: "Simob va uning bug'lari o'ta zaharli! Tajribani faqat mo'rili shkafda, juda oz miqdorda, o'qituvchi o'tkazadi; simob tomchilarini yig'ib, demerkurizatsiya qiling (oltingugurt kukuni sepiladi).",
  expl: "1774 yilda J. Pristli kislorodni aynan shu reaksiya bilan olgan. Kam faol metallarning oksidlari qizdirilganda metall va kislorodga parchalanadi; bu reaksiya oddiy moddalardan murakkab modda hosil bo'lishining teskarisi.",
  q: ["Kislorod kim tomonidan va qanday ochilgan?", "Nima uchun bu tajriba mo'rili shkafda o'tkaziladi?"],
});

// ===================================================================== kristallogidratlar
T({
  title: "Mis kuporosining suvsizlanishi (ko'k → oq)",
  topic: "Kristallogidratlar",
  r: [{ species: 'CuSO4·5H2O', state: 's', mass_g: 1 }], T: 150,
  mol: 'CuSO4·5H2O = CuSO4 + 5H2O↑',
  mech: 'termik-parchalanish',
  steps: ["Qizdirilganda kristall panjaradagi suv molekulalari ajralib chiqadi.", "Ko'k rang mis ioniga birikkan suv molekulalari bilan bog'liq, shuning uchun suvsiz CuSO₄ oq bo'ladi."],
  obs: { solid_color_change: { from: col('CuSO4·5H2O'), to: col('CuSO4') }, effects: [E('condensate')], text_uz: "Ko'k kristallar asta-sekin oq kukunga aylanadi, probirka devorida suv tomchilari to'planadi. Sovigan oq kukunga suv tomizilsa, u yana ko'karadi va qiziydi." },
  app: [...TUBE, 'tomizgich'],
  proc: ["Quruq probirkaga 1 g mis kuporosi kristallarini soling.", "Probirkani og'zini biroz pastga qaratib, ehtiyotkorlik bilan qizdiring.", "Rang o'zgarishini va suv tomchilarini kuzating.", "Sovigan oq kukunga bir necha tomchi suv tomizing."],
  safety: "Mis birikmalari zararli: kukunni og'izga va ko'zga tushirmang. " + TUBE_SAFE,
  expl: "Kristallogidratlar tarkibida ma'lum miqdorda kristallanish suvi bo'ladi; qizdirilganda u ajraladi. Suvsiz CuSO₄ suvni qayta biriktirib ko'karadi, shuning uchun u suvni (masalan, spirtdagi namlikni) aniqlashda ishlatiladi.",
  q: ["Kristallogidrat nima?", "Suvsiz mis sulfat qanday maqsadda ishlatiladi?", "1 mol CuSO₄·5H₂O dan necha gramm suv ajraladi?"],
});
T({
  title: "Kobalt(II) xlorid geksagidratining suvsizlanishi (pushti → ko'k)",
  level: '9-sinf',
  topic: "Kristallogidratlar; namlik indikatorlari",
  r: [{ species: 'CoCl2·6H2O', state: 's', mass_g: 0.5 }], T: 130,
  mol: 'CoCl2·6H2O = CoCl2 + 6H2O↑',
  steps: ["Qizdirilganda Co²⁺ ioni atrofidagi suv molekulalari ajraladi.", "Kobalt ionining koordinatsion muhiti o'zgaradi va rang pushtidan ko'kka o'tadi."],
  obs: { solid_color_change: { from: col('CoCl2·6H2O'), to: '#2f55c8' }, effects: [E('condensate')], text_uz: "Pushti-qizil kristallar ko'k kukunga aylanadi, probirka devorida suv tomchilari paydo bo'ladi; havoda turganda kukun asta-sekin yana pushti rangga kiradi." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq kobalt(II) xlorid kristallarini soling.", "Probirkani ehtiyotkorlik bilan qizdiring.", "Rang o'zgarishini kuzating, so'ng sovigan kukunni havoda qoldirib, rangini qayta kuzating."],
  safety: "Kobalt birikmalari zaharli va kanserogen: qo'lqopda ishlang, changini nafas olmang.",
  expl: "Gidratlangan kobalt(II) tuzlari pushti, suvsizlari ko'k rangda bo'ladi. Bu xossadan namlik indikatorlarida (masalan, silikagel donachalarida) foydalaniladi: ko'k rang quruqlikni, pushti rang namlikni bildiradi.",
  q: ["Silikageldagi kobalt indikatori nima uchun rangini o'zgartiradi?", "Bu jarayon qaytarmi?"],
});
T({
  title: "Temir kuporosining suvsizlanishi",
  level: '9-sinf',
  topic: "Kristallogidratlar; temir birikmalari",
  r: [{ species: 'FeSO4·7H2O', state: 's', mass_g: 1 }], T: 250,
  mol: 'FeSO4·7H2O = FeSO4 + 7H2O↑',
  steps: ["Qizdirilganda kristallanish suvi bosqichma-bosqich ajraladi.", "Och yashil kristallar oq-kulrang suvsiz FeSO₄ ga aylanadi."],
  obs: { solid_color_change: { from: col('FeSO4·7H2O'), to: '#e6e6dc' }, effects: [E('condensate')], text_uz: "Och yashil kristallar oq-kulrang kukunga aylanadi, probirka devorida suv tomchilari to'planadi." },
  app: TUBE,
  proc: ["Quruq probirkaga 1 g temir kuporosi soling.", "Probirkani og'zini biroz pastga qaratib, mo'tadil qizdiring.", "Rang o'zgarishini va suv tomchilarini kuzating."],
  expl: "Temir kuporosi ham mis kuporosi kabi kristallogidrat. Suvsizlangan FeSO₄ ni yanada kuchli qizdirilsa, u Fe₂O₃, SO₂ va SO₃ ga parchalanadi.",
  q: ["FeSO₄·7H₂O dagi suvning massa ulushini hisoblang.", "Suvsiz FeSO₄ havoda uzoq tursa nima bo'ladi?"],
});
T({
  title: "Temir(II) sulfatning kuchli qizdirilganda parchalanishi",
  level: 'litsey',
  topic: "Sulfatlarning termik parchalanishi; oksidlanish-qaytarilish",
  r: [{ species: 'FeSO4', state: 's', mass_g: 1 }], T: 550,
  note: "Oldindan suvsizlantirilgan FeSO₄ qiyin suyuqlanuvchan probirkada yoki tigelda kuchli qizdiriladi.",
  mol: '2FeSO4 = Fe2O3 + SO2↑ + SO3↑',
  eb: ['2Fe⁺² − 2e⁻ = 2Fe⁺³', 'S⁺⁶ + 2e⁻ = S⁺⁴'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Yuqori haroratda Fe²⁺ oksidlanib Fe³⁺ ga, bitta sulfat ionidagi S⁺⁶ esa qaytarilib S⁺⁴ (SO₂) ga o'tadi.", "Ikkinchi sulfat ioni SO₃ holida ajraladi; qizil-qo'ng'ir Fe₂O₃ qoladi."],
  obs: { gas: gas('SO2'), solid_color_change: { from: '#e6e6dc', to: col('Fe2O3') }, effects: [E('smoke')], text_uz: "Oq-kulrang kukun qizil-qo'ng'ir rangga kiradi, probirkadan o'tkir hidli oq tutun (SO₃ va SO₂) chiqadi." },
  app: [...TUBE, 'indikator-qogozi'],
  proc: ["Suvsiz temir(II) sulfatni qiyin suyuqlanuvchan probirkaga soling.", "Mo'rili shkafda probirkani kuchli qizdiring.", "Probirka og'ziga ho'l ko'k lakmus qog'ozini tuting va qoldiq rangini kuzating."],
  safety: "SO₂ va SO₃ zaharli va bo'g'uvchi! " + HOOD + ". " + TUBE_SAFE,
  expl: "O'rta asrlarda sulfat kislota (\"kuporos moyi\") aynan temir kuporosini quruq haydash bilan olingan: ajralgan SO₃ suvda yutilib H₂SO₄ hosil qiladi. Qoldiq Fe₂O₃ qizil bo'yoq sifatida ishlatilgan.",
  q: ["Bu reaksiyada qaysi element oksidlanadi, qaysi biri qaytariladi?", "Ajralgan gazlar suvda eritilsa qanday kislotalar hosil bo'ladi?"],
});
T({
  title: "Kristall sodaning suvsizlanishi",
  topic: "Kristallogidratlar",
  r: [{ species: 'Na2CO3·10H2O', state: 's', mass_g: 1 }], T: 110,
  mol: 'Na2CO3·10H2O = Na2CO3 + 10H2O↑',
  steps: ["Qizdirilganda kristallar avval o'z kristallanish suvida eriydi.", "Suv bug'lanib chiqib ketgach, oq suvsiz soda (kalsinatsiyalangan soda) qoladi."],
  obs: { effects: [E('condensate'), E('boil')], text_uz: "Shaffof kristallar o'z suvida suyuqlanadi va \"qaynaydi\", so'ng oq quruq kukun qoladi; probirka devorida suv tomchilari to'planadi." },
  app: TUBE,
  proc: ["Quruq probirkaga 1 g kristall soda soling.", "Probirkani og'zini biroz pastga qaratib qizdiring.", "Kristallarning suyuqlanishini, suv ajralishini va qoldiqni kuzating."],
  expl: "Kristall sodaning massasining yarmidan ko'pi kristallanish suvi. Qizdirilganda u suvni yo'qotib, suvsiz Na₂CO₃ ga aylanadi; karbonatning o'zi esa bu sharoitda parchalanmaydi.",
  q: ["Na₂CO₃·10H₂O dagi suvning massa ulushini hisoblang.", "Nima uchun kristall soda havoda ochiq qoldirilsa \"nuraydi\"?"],
});

// ===================================================================== boshqa oksidlar va tuzlar
T({
  title: "Kumush(I) oksidning termik parchalanishi",
  level: '9-sinf',
  topic: "Oksidlarning xossalari; kam faol metallar",
  r: [{ species: 'Ag2O', state: 's', mass_g: 0.3 }], T: 350,
  mol: '2Ag2O = 4Ag + O2↑',
  eb: ['Ag⁺¹ + 1e⁻ = Ag⁰', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kumush oksid beqaror: qizdirilganda Ag⁺ qaytarilib kumushga, O⁻² oksidlanib kislorodga aylanadi."],
  obs: { gas: gas('O2'), solid_color_change: { from: col('Ag2O'), to: col('Ag') }, effects: [E('deposit')], text_uz: "To'q qo'ng'ir kukun oqish-kulrang metall kumushga aylanadi; cho'g'langan cho'p alangalanadi." },
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq probirkaga ozroq kumush(I) oksid soling.", "Probirkani kuchli qizdiring.", "Probirka og'ziga cho'g'langan cho'pni tushiring va qoldiq rangini kuzating."],
  safety: "Kumush birikmalari terini qoraytiradi; qo'lqopda ishlang. " + TUBE_SAFE,
  expl: "Kam faol metallarning (Ag, Hg, Au) oksidlari nisbatan past haroratda metall va kislorodga parchalanadi. Shu sababli AgNO₃ parchalanganda ham oksid emas, metall kumush hosil bo'ladi.",
  q: ["Ag₂O va CuO ning termik barqarorligini solishtiring.", "Qoldiqning kumush ekanini qanday tekshirish mumkin?"],
});
T({
  title: "Kalsiy oksalatning termik parchalanishi",
  level: 'universitet',
  topic: "Termogravimetrik tahlil; oksalatlarning parchalanishi",
  r: [{ species: 'CaC2O4', state: 's', mass_g: 0.5 }], T: 480,
  note: "Taxminan 500 °C atrofida CaCO₃ gacha; harorat 800 °C dan oshirilsa CaCO₃ ham CaO ga parchalanadi.",
  mol: 'CaC2O4 = CaCO3 + CO↑',
  eb: ['C⁺³ − 1e⁻ = C⁺⁴', 'C⁺³ + 1e⁻ = C⁺²'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Oksalat ionidagi ikki uglerod atomi (C⁺³) orasidagi bog' uziladi.", "Bitta uglerod C⁺⁴ ga oksidlanib karbonatda qoladi, ikkinchisi C⁺² ga qaytarilib CO holida ajraladi."],
  obs: { gas: gas('CO'), effects: [E('flame')], flame: { color: '#4a6cff', desc_uz: "probirka og'zida ajralayotgan CO ko'k alanga bilan yonadi" }, text_uz: "Oq kukun tashqi ko'rinishini o'zgartirmaydi; probirka og'ziga olov tutilsa, ajralayotgan gaz ko'kimtir alanga bilan yonadi." },
  app: [...TUBE, 'gugurt'],
  proc: ["Quruq qiyin suyuqlanuvchan probirkaga kalsiy oksalat soling.", "Mo'rili shkafda probirkani kuchli qizdiring.", "Probirka og'ziga yonib turgan gugurt tutib, gazning yonishini kuzating."],
  safety: "Uglerod(II) oksid (is gazi) juda zaharli, hidsiz! " + HOOD + ".",
  expl: "Kalsiy oksalat qizdirilganda bosqichma-bosqich parchalanadi: avval kristallanish suvi, so'ng CO ajralib CaCO₃, yanada yuqori haroratda CO₂ ajralib CaO hosil bo'ladi. Bu bosqichlar termogravimetrik tahlilda massa kamayishining aniq pog'onalari sifatida ko'rinadi.",
  q: ["Oksalat ionidagi uglerodning oksidlanish darajasi qancha?", "CaC₂O₄ ni bosqichma-bosqich qizdirishda qaysi mahsulotlar hosil bo'ladi?"],
  conf: "o'rta",
});
T({
  title: "Mis(II) oksidning juda yuqori haroratda mis(I) oksidga aylanishi",
  level: 'litsey',
  topic: "Oksidlarning termik barqarorligi; mis birikmalari",
  r: [{ species: 'CuO', state: 's', mass_g: 0.5 }], T: 1050,
  note: "Faqat mufel pechida, 1000 °C dan yuqori haroratda; modellash chegarasi taxminiy.",
  mol: '4CuO = 2Cu2O + O2↑',
  eb: ['Cu⁺² + 1e⁻ = Cu⁺¹', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Juda yuqori haroratda Cu⁺² qaytarilib Cu⁺¹ ga o'tadi, kislorodning bir qismi O₂ holida ajraladi.", "Qizil mis(I) oksid hosil bo'ladi."],
  obs: { gas: gas('O2'), solid_color_change: { from: col('CuO'), to: col('Cu2O') }, effects: [E('glow')], text_uz: "Qora kukun juda yuqori haroratda qizil-g'isht rangli Cu₂O ga aylanadi." },
  app: FURNACE,
  proc: ["Tigelga qora mis(II) oksid soling.", "Tigelni mufel pechida juda yuqori haroratda qizdiring.", "Sovigandan keyin qoldiq rangini dastlabki modda bilan solishtiring."],
  safety: "Mufel pechidan tigelni uzun qisqich va himoya qo'lqopi bilan oling; issiq tigelni o'tga chidamli taglikka qo'ying.",
  expl: "Yuqori haroratda bir xil metallning quyi oksidlanish darajali oksidi barqarorroq bo'ladi: CuO 1000 °C dan yuqorida Cu₂O ga aylanadi. Shu sababli mis eritish jarayonlarida Cu₂O hosil bo'ladi.",
  q: ["Bu reaksiyada misning oksidlanish darajasi qanday o'zgaradi?", "Spirt lampasida qizdirilganda CuO nima uchun parchalanmaydi?"],
  conf: "o'rta",
});
T({
  title: "Xrom(VI) oksidning termik parchalanishi",
  level: 'litsey',
  topic: "Xrom birikmalari; oksidlarning xossalari",
  r: [{ species: 'CrO3', state: 's', mass_g: 0.3 }], T: 250,
  mol: '4CrO3 = 2Cr2O3 + 3O2↑',
  eb: ['Cr⁺⁶ + 3e⁻ = Cr⁺³', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda Cr⁺⁶ qaytarilib barqaror Cr⁺³ ga o'tadi.", "Kislorod O⁻² dan O₂ gacha oksidlanib ajraladi."],
  obs: { gas: gas('O2'), solid_color_change: { from: col('CrO3'), to: col('Cr2O3') }, effects: [], text_uz: "To'q qizil kristallar qizdirilganda yashil kukunga aylanadi, kislorod ajraladi (cho'g'langan cho'p alangalanadi)." },
  app: [...TUBE, 'chop-chogllangan'],
  proc: ["Quruq probirkaga juda oz miqdorda xrom(VI) oksid soling.", "Mo'rili shkafda probirkani qizdiring.", "Rang o'zgarishini kuzating va cho'g'langan cho'p bilan gazni sinang."],
  safety: "CrO₃ o'ta zaharli, kanserogen va kuchli oksidlovchi: organik moddalar bilan tegsa yonib ketishi mumkin. Qo'lqop va ko'zoynakda, mo'rili shkafda ishlang.",
  expl: "Xrom(VI) birikmalari kuchli oksidlovchilar va qizdirilganda barqarorroq xrom(III) birikmalariga o'tadi. Rangning qizildan yashilga o'zgarishi Cr⁺⁶ → Cr⁺³ o'tishining belgisi.",
  q: ["Xromning qaysi oksidlanish darajalari barqaror?", "CrO₃ qanday xossali oksid?"],
  conf: "o'rta",
});
T({
  title: "Bariy peroksidning yuqori haroratda parchalanishi",
  level: 'universitet',
  topic: "Peroksidlar; qaytar reaksiyalar va harorat",
  r: [{ species: 'BaO2', state: 's', mass_g: 0.5 }], T: 800,
  note: "Mufel pechida 800 °C dan yuqorida; 500–600 °C da esa teskari jarayon — BaO ning kislorod biriktirishi boradi (taxminiy chegaralar).",
  mol: '2BaO2 = 2BaO + O2↑',
  eb: ['2O⁻¹ − 2e⁻ = O2⁰', 'O⁻¹ + 1e⁻ = O⁻²'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Peroksid ionidagi kislorod (O⁻¹) qisman oksidlanib O₂ ga, qisman qaytarilib O⁻² ga o'tadi.", "Bariy oksid qoladi; bu jarayon qaytar va haroratga bog'liq."],
  obs: { gas: gas('O2'), heat: 'endotermik', effects: [E('glow')], text_uz: "Oq kukun tashqi ko'rinishini deyarli o'zgartirmaydi; ajralgan gaz cho'g'langan cho'pni alangalatadi." },
  app: [...FURNACE, 'chop-chogllangan'],
  proc: ["Tigelga bariy peroksid soling va massasini o'lchang.", "Tigelni mufel pechida yuqori haroratda qizdiring.", "Sovigandan keyin massani qayta o'lchab, ajralgan kislorod miqdorini hisoblang."],
  safety: "Bariy birikmalari zaharli; BaO₂ kuchli oksidlovchi — yonuvchan moddalardan uzoqda saqlang. Mufel pechi bilan himoya qo'lqopida ishlang.",
  expl: "XIX asrda havodan kislorod olishning Brin usuli shu qaytar reaksiyaga asoslangan: 500–600 °C da BaO havodagi kislorodni biriktirib BaO₂ hosil qiladi, 800 °C dan yuqorida esa BaO₂ kislorodni qaytarib beradi.",
  q: ["Harorat bu qaytar reaksiyaning yo'nalishiga qanday ta'sir qiladi?", "BaO₂ dagi kislorodning oksidlanish darajasi qancha?"],
  conf: "o'rta",
});

T({
  title: "Rux nitratning termik parchalanishi",
  level: '9-sinf',
  topic: "Nitratlarning termik parchalanishi",
  r: [{ species: 'Zn(NO3)2', state: 's', mass_g: 0.5 }], T: 300,
  mol: '2Zn(NO3)2 = 2ZnO + 4NO2↑ + O2↑',
  eb: ['N⁺⁵ + 1e⁻ = N⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Rux faollik qatorida magniy va mis orasida joylashgan, uning nitrati oksidgacha parchalanadi.", "Qo'ng'ir NO₂ va kislorod ajraladi, rux oksid qoladi."],
  obs: { gas: gas('NO2'), solid_color_change: { from: col('Zn(NO3)2'), to: col('ZnO') }, effects: [E('color-gas')], text_uz: "Oq tuz suyuqlanadi, qo'ng'ir gaz ajraladi; qoldiq issiqda sarg'ish, sovuganda oq (ZnO)." },
  app: TUBE,
  proc: ["Quruq probirkaga ozroq rux nitrat soling.", "Probirkani mo'rili shkafda kuchli qizdiring.", "Qo'ng'ir gazni va qoldiqning issiq hamda sovuq holatdagi rangini kuzating."],
  safety: "NO₂ zaharli — " + HOOD.toLowerCase() + ". " + TUBE_SAFE,
  expl: "Rux nitrat Mg(NO₃)₂ va Cu(NO₃)₂ kabi oksid, NO₂ va O₂ ga parchalanadi. Qoldiqning qizdirilganda sarg'ayib, sovuganda oqarishi uning ZnO ekanini ko'rsatadi.",
  q: ["Faollik qatoriga ko'ra nitratlar parchalanishining uch turini ayting.", "Qoldiq ZnO ekanini qanday tekshirasiz?"],
});
T({
  title: "Kumush karbonatning qizdirilganda parchalanishi",
  level: 'litsey',
  topic: "Karbonatlarning termik barqarorligi; kumush birikmalari",
  r: [{ species: 'Ag2CO3', state: 's', mass_g: 0.3 }], T: 200,
  note: "Mo'tadil qizdirishda Ag₂O hosil bo'ladi; kuchliroq qizdirilsa Ag₂O ham kumush va kislorodga parchalanadi.",
  mol: 'Ag2CO3 = Ag2O + CO2↑',
  steps: ["Kumush karbonat termik jihatdan beqaror: nisbatan past haroratda CO₂ yo'qotadi.", "To'q qo'ng'ir kumush(I) oksid qoladi."],
  obs: { gas: gas('CO2'), solid_color_change: { from: col('Ag2CO3'), to: col('Ag2O') }, effects: [E('bubbles')], text_uz: "Och sarg'ish kukun qorayib, to'q qo'ng'ir rangga kiradi; ajralgan gaz ohakli suvni loyqalatadi." },
  app: [...TUBE_GAS, 'probirka-qisqichi'],
  proc: ["Quruq probirkaga ozroq kumush karbonat soling va gaz chiqarish naychali tiqin bilan berkiting.", "Naycha uchini ohakli suvga tushiring va probirkani mo'tadil qizdiring.", "Qoldiq rangini kuzating; oxirida avval naychani ohakli suvdan chiqaring."],
  safety: "Kumush birikmalari terini qoraytiradi; qo'lqopda ishlang. Qizdirish to'xtatilishidan oldin naychani suyuqlikdan chiqaring.",
  expl: "Kam faol metallarning karbonatlari past haroratda parchalanadi. Kumush karbonat avval Ag₂O ga, yanada qizdirilganda esa metall kumushga aylanadi — kumush birikmalari termik beqarorligining namunasi.",
  q: ["Ag₂CO₃ ni kuchli qizdirganda yakuniy mahsulot nima bo'ladi? Umumiy tenglamani yozing.", "Ag₂CO₃ va CaCO₃ ning parchalanish haroratini solishtiring."],
  conf: "o'rta",
});
T({
  title: "Qo'rg'oshin(IV) oksidning qizdirilganda parchalanishi",
  level: 'litsey',
  topic: "Qo'rg'oshin birikmalari; oksidlarning termik barqarorligi",
  r: [{ species: 'PbO2', state: 's', mass_g: 0.5 }], T: 600,
  note: "Parchalanish oraliq oksidlar (jumladan surik Pb₃O₄) orqali boradi; 600 °C — yakuniy PbO uchun taxminiy modellash chegarasi.",
  mol: '2PbO2 = 2PbO + O2↑',
  eb: ['Pb⁺⁴ + 2e⁻ = Pb⁺²', '2O⁻² − 4e⁻ = O2⁰'],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda Pb⁺⁴ barqarorroq Pb⁺² holatiga qaytariladi.", "Kislorod O⁻² dan O₂ ga oksidlanib ajraladi; avval qizil surik, so'ng sariq PbO hosil bo'ladi."],
  obs: { gas: gas('O2'), solid_color_change: { from: col('PbO2'), to: col('PbO') }, effects: [], text_uz: "To'q qo'ng'ir kukun qizdirilganda avval qizil-to'q sariq (surik), so'ng sariq rangga (PbO) kiradi; cho'g'langan cho'p alangalanadi." },
  app: [...CRUCIBLE, 'chop-chogllangan'],
  proc: ["Tigelga ozroq qo'rg'oshin(IV) oksid soling va chinni uchburchakka o'rnating.", "Gorelka alangasida kuchli qizdiring, rang o'zgarishlarini kuzating.", "Tigel ustida cho'g'langan cho'pni tutib, kislorod ajralishini tekshiring."],
  safety: "Qo'rg'oshin birikmalari zaharli: changini nafas olmang, qo'lqopda ishlang, mo'rili shkafda qizdiring va qoldiqni maxsus idishga yig'ing.",
  expl: "Qo'rg'oshin uchun +2 oksidlanish darajasi +4 ga qaraganda barqarorroq (inert juftlik effekti), shuning uchun PbO₂ kuchli oksidlovchi va qizdirilganda kislorod ajratib PbO ga aylanadi.",
  q: ["Nima uchun qo'rg'oshin uchun +2 oksidlanish darajasi barqarorroq?", "PbO₂ akkumulyatorlarda qanday vazifani bajaradi?"],
  conf: "o'rta",
});

// ===================================================================== yozish
const prev = JSON.parse(readFileSync(FILE, 'utf8'));
const first = prev.reactions.find((r) => r.id === 'termik-0001');
if (!first) throw new Error("termik-0001 topilmadi");
const reactions = [first, ...out];
writeFileSync(FILE, JSON.stringify({ category: CAT, reactions }, null, 1) + '\n');
console.log(`${CAT}: ${reactions.length}`);
