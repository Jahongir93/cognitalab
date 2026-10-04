// "gazlar" toifasi (Gazlarni olish va xossalarini o'rganish) yozuvlari generatori.
// Ishga tushirish: node tools/seed/reactions/gazlar.mjs  ->  frontend/lab/data/reactions/gazlar.json
// Cho'kma rangi/tuzilishi va gaz ma'lumotlari substances.json dan olinadi (qo'lda ko'chirilmaydi).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DATA = join(ROOT, 'frontend', 'lab', 'data');
const SUBS = JSON.parse(readFileSync(join(DATA, 'substances.json'), 'utf8'));
const CAT = 'gazlar';
const PREFIX = 'gazolish';

function sub(id) {
  const s = SUBS[id];
  if (!s) throw new Error(`modda yo'q: ${id}`);
  return s;
}
/** Cho'kma kuzatuvi bazadagi rang/tuzilish bilan */
function ppt(id) {
  const s = sub(id);
  const p = s.precipitate || { color: s.appearance?.color, texture: 'mayda-kristall' };
  return { species: id, color: p.color, texture: p.texture };
}
/** Gaz kuzatuvi bazadagi rang/hid bilan */
function gas(id) {
  const s = sub(id);
  return { species: id, color: s.gas?.color ?? (s.state === 'g' ? s.appearance?.color ?? null : null), smell_uz: s.gas?.smell_uz ?? null };
}

let seq = 0;
const out = [];
function R(o) {
  seq += 1;
  const r = {
    id: `${PREFIX}-${String(seq).padStart(4, '0')}`,
    category: CAT,
    title_uz: o.title,
    level: o.level,
    topic_uz: o.topic,
    engine: o.engine,
  };
  if (o.no_reaction) { r.no_reaction = true; r.match = o.match; }
  if (o.equation_free) { r.equation_free = true; r.equation_free_uz = o.equation_free_uz; }
  r.reactants = o.reactants;
  r.conditions = { heating: false, temp_min_C: null, catalyst: null, medium: null, light: false, note_uz: null, ...(o.cond || {}) };
  r.equation = { molecular: null, ionic_full: null, ionic_net: null, electron_balance: null, ...(o.eq || {}) };
  r.mechanism = { type: o.mech, steps_uz: o.steps, organic: null };
  r.observations = { precipitate: null, gas: null, solution_color_change: null, heat: 'sezilarsiz', flame: null, effects: [], text_uz: '', ...(o.obs || {}) };
  if (o.collection) r.collection = o.collection;
  r.kinetics = o.kinetics;
  r.apparatus = o.apparatus;
  r.procedure_uz = o.procedure;
  r.safety_uz = o.safety;
  r.explanation_uz = o.explanation;
  r.questions_uz = o.questions;
  r.confidence = o.confidence || 'yuqori';
  out.push(r);
  return r;
}
const fx = (...t) => t.map((type) => ({ type }));
const COLL = {
  water: (reason) => ({ method: 'suv-ostida', reason_uz: reason }),
  up: (reason) => ({ method: 'havo-siqib-yuqoriga', reason_uz: reason }),
  down: (reason) => ({ method: 'havo-siqib-pastga', reason_uz: reason }),
};
const HOOD = "Tajriba mo'rili shkafda o'tkaziladi";

// ======================================================================================= VODOROD
R({
  title: "Vodorodni Kipp apparatida olish va suv ostida yig'ish",
  level: '8-sinf', topic: "Vodorod: laboratoriyada olinishi va yig'ilishi", engine: 'rules',
  reactants: [
    { species: 'Zn', state: 's', mass_g: 20, form: 'granula' },
    { species: 'HCl', state: 'aq', conc_M: 5, volume_mL: 50 },
  ],
  cond: { note_uz: "Rux granulalari Kipp apparatining o'rta sharida, xlorid kislota (taxminan 17% li) yuqori voronkada bo'ladi." },
  eq: {
    molecular: 'Zn + 2HCl = ZnCl2 + H2↑',
    ionic_full: 'Zn + 2H⁺ + 2Cl⁻ = Zn²⁺ + 2Cl⁻ + H2↑',
    ionic_net: 'Zn + 2H⁺ = Zn²⁺ + H2↑',
    electron_balance: ['Zn⁰ − 2e⁻ = Zn⁺²', '2H⁺¹ + 2e⁻ = H2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ['Rux faollik qatorida vodoroddan oldin turadi va H⁺ ionlariga elektron beradi.', "H⁺ ionlari qaytarilib H₂ molekulalarini hosil qiladi, rux Zn²⁺ ionlariga o'tadi.", "Gaz chiqish jo'mragi yopilganda gaz bosimi kislotani rux turgan shardan siqib chiqaradi va reaksiya to'xtaydi."],
  obs: { gas: gas('H2'), heat: 'ekzotermik', effects: fx('bubbles'), text_uz: "Rux granulalari sirtida jadal pufakchalar ajraladi; suv bilan to'ldirilgan probirkadan suvni siqib chiqarib, rangsiz gaz to'planadi." },
  collection: COLL.water("Vodorod suvda juda kam eriydi va suv bilan reaksiyaga kirishmaydi, shuning uchun suvni siqib chiqarish usulida havo aralashmasidan toza holda yig'iladi."),
  kinetics: 'tez',
  apparatus: ['kipp-apparati', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'probirka', 'shtativ'],
  procedure: [
    "Kipp apparatining o'rta shariga rux granulalarini soling, yuqori voronka orqali xlorid kislota quying.",
    "Pnevmatik vannaga suv quying, probirkani suv bilan to'ldirib, og'zini barmoq bilan yopgan holda vannaga to'ntaring.",
    "Jo'mrakni ochib, gaz chiqarish naychasini 10–15 soniya davomida bo'sh qo'yib, apparatdagi havoni chiqarib yuboring.",
    "Naycha uchini suv ostida probirka og'ziga kiriting va suv to'liq siqib chiqarilguncha gazni yig'ing.",
    "Probirkani suv ostida tiqin bilan yoping yoki og'zini pastga qaratgan holda olib, tozaligini tekshirishga o'ting.",
  ],
  safety: "Vodorod havo bilan portlovchi aralashma hosil qiladi: apparat yaqinida olov yoqmang, gaz tozaligi tekshirilmaguncha uni yondirmang. Xlorid kislota bilan ko'zoynak va qo'lqopda ishlang.",
  explanation: "Rux vodoroddan faol metall bo'lgani uchun oksidlovchi bo'lmagan kislotalardan vodorodni siqib chiqaradi. Kipp apparati gazni kerak paytda olish va jo'mrakni yopib reaksiyani to'xtatish imkonini beradi. Vodorod suvda deyarli erimagani uchun suv ostida yig'iladi.",
  questions: ["Nima uchun vodorodni suv ostida yig'ish mumkin?", "Kipp apparatida jo'mrak yopilganda reaksiya nima uchun to'xtaydi?", "Vodorodni havoni siqib chiqarish usulida yig'ganda idish og'zi qanday holatda turishi kerak?"],
});

R({
  title: "Vodorodning tozaligini tekshirish (qarsillash sinovi)",
  level: '8-sinf', topic: 'Vodorodning xossalari: yonishi', engine: 'record',
  reactants: [
    { species: 'H2', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Og'zi pastga qaratilgan, vodorod to'ldirilgan probirka spirt lampasi alangasiga yaqinlashtiriladi; kislorod — havodagi kislorod." },
  eq: {
    molecular: '2H2 + O2 = 2H2O',
    electron_balance: ['H2⁰ − 2e⁻ = 2H⁺¹', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ['Alanga issiqligi H–H va O=O bog\'larini uzib, zanjir reaksiyani boshlaydi.', "Vodorod atomlari kislorodga elektron berib, suv molekulalari hosil bo'ladi.", "Toza vodorod probirka og'zida sekin yonadi; havo bilan aralashgan vodorod esa bir zumda butun hajmda yonib, qattiq qarsillaydi."],
  obs: { heat: 'kuchli-ekzotermik', flame: { color: '#9ec8ff', desc_uz: "deyarli ko'rinmas och havorang alanga" }, effects: fx('pop', 'flame', 'condensate'), text_uz: "Toza vodorod bo'g'iq \"puq\" tovushi bilan yonadi; havo aralashgan bo'lsa qattiq qarsillaydi. Probirka devorida suv tomchilari paydo bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: [
    "Vodorod to'ldirilgan probirkani og'zini pastga qaratgan holda qisqich bilan oling.",
    "Probirka og'zini spirt lampasi alangasiga yaqinlashtiring.",
    "Tovushni tinglang: bo'g'iq \"puq\" — vodorod toza, qattiq qarsillash — havo aralashgan.",
    "Probirka devoridagi suv tomchilarini kuzating.",
  ],
  safety: "Sinovni faqat bitta probirkadagi oz miqdordagi gaz bilan o'tkazing; gaz olinayotgan apparat yonida yoki uning naychasi uchida yondirmang. Ko'zoynak taqing.",
  explanation: "Vodorod kislorod bilan birikib suv hosil qiladi va ko'p issiqlik ajraladi. Havo bilan aralashgan vodorod butun hajmda bir zumda yonib qarsillaydi, shuning uchun vodorodni yondirishdan oldin har doim uning tozaligi shu usulda tekshiriladi.",
  questions: ["Nima uchun vodorodni yondirishdan oldin uning tozaligi tekshiriladi?", "Probirka devorida qanday modda hosil bo'ladi?", "Reaksiyada oksidlovchi va qaytaruvchini ko'rsating."],
});

R({
  title: "Vodorodning qizdirilgan mis(II) oksidni qaytarishi",
  level: '8-sinf', topic: "Vodorodning xossalari: qaytaruvchilik", engine: 'record',
  reactants: [
    { species: 'CuO', state: 's', mass_g: 1 },
    { species: 'H2', state: 'g' },
  ],
  cond: { heating: true, temp_min_C: 200, note_uz: "Quruq vodorod qizdirilgan mis(II) oksid ustidan o'tkaziladi; avval apparatdagi havo vodorod bilan siqib chiqariladi." },
  eq: {
    molecular: 'CuO + H2 = Cu + H2O↑',
    electron_balance: ['Cu⁺² + 2e⁻ = Cu⁰', 'H2⁰ − 2e⁻ = 2H⁺¹'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda vodorod molekulalari CuO sirtida kislorod atomlari bilan birikadi.", "Mis(II) ionlari ikki elektron qabul qilib metall misgacha qaytariladi.", "Hosil bo'lgan suv bug'i probirkaning sovuq qismida kondensatlanadi."],
  obs: { solid_color_change: { from: '#1a1a1a', to: '#c27a4a' }, heat: 'ekzotermik', effects: fx('condensate'), text_uz: "Qora mis(II) oksid qizil-mis rangga kiradi, probirka devorida suv tomchilari to'planadi." },
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'gaz-naycha-togri', 'kipp-apparati', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Qiyshaytirib mahkamlangan probirka tubiga ozroq mis(II) oksid kukunini soling.",
    "Kipp apparatidan vodorod beruvchi naychani probirka tubigacha kiriting va 1–2 daqiqa vodorod o'tkazib, havoni siqib chiqaring (tozalikni tekshiring).",
    "Vodorod oqimini to'xtatmasdan mis(II) oksidni spirt lampasida qizdiring.",
    "Rang o'zgargach qizdirishni to'xtating, mis sovuguncha vodorod o'tkazishni davom ettiring.",
  ],
  safety: "Qizdirishni faqat havo to'liq siqib chiqarilgandan va vodorod tozaligi tekshirilgandan keyin boshlang — aks holda portlash xavfi bor. Issiq mis havoda qayta oksidlanmasligi uchun u sovuguncha vodorod o'tkazing.",
  explanation: "Vodorod qizdirilganda metallarni oksidlaridan qaytaradi, o'zi esa suvgacha oksidlanadi. Mis(II) oksid qora, hosil bo'lgan mis esa qizil rangli bo'lgani uchun reaksiya yaqqol ko'rinadi. Bu usul ba'zi metallarni oksidlaridan olishda qo'llaniladi.",
  questions: ["Bu reaksiyada vodorod qanday xossani namoyon qiladi?", "Nima uchun qizdirishdan oldin probirkadagi havo vodorod bilan siqib chiqariladi?", "Nima uchun mis sovuguncha vodorod o'tkazish davom ettiriladi?"],
});

// ======================================================================================= KISLOROD
R({
  title: 'Kislorodni kaliy permanganatni qizdirib olish',
  level: '8-sinf', topic: "Kislorod: laboratoriyada olinishi va yig'ilishi", engine: 'record',
  reactants: [{ species: 'KMnO4', state: 's', mass_g: 5, form: 'kristall' }],
  cond: { heating: true, temp_min_C: 200, note_uz: "Quruq probirkada qizdiriladi; og'ziga paxta tiqiladi." },
  eq: {
    molecular: '2KMnO4 = K2MnO4 + MnO2 + O2↑',
    electron_balance: ['Mn⁺⁷ + 1e⁻ = Mn⁺⁶', 'Mn⁺⁷ + 3e⁻ = Mn⁺⁴', '2O⁻² − 4e⁻ = O2⁰'],
  },
  mech: 'termik-parchalanish',
  steps: ["Qizdirilganda permanganat ionidagi kislorod atomlari (O⁻²) elektron berib, O₂ molekulasini hosil qiladi.", "Bir Mn⁺⁷ atomi bitta elektron olib manganatgacha (Mn⁺⁶), ikkinchisi uchta elektron olib MnO₂ gacha (Mn⁺⁴) qaytariladi.", "Ajralgan kislorod gaz chiqarish naychasi orqali yig'gich idishga o'tadi."],
  obs: { gas: gas('O2'), solid_color_change: { from: '#3a0a3a', to: '#1f2a1c' }, heat: 'endotermik', effects: fx('bubbles', 'crack'), text_uz: "Binafsha kristallar chirsillab qorayadi; naycha uchidan suv ostidagi probirkaga rangsiz gaz pufakchalari o'tadi. Cho'g'langan cho'p gazda alangalanadi." },
  collection: COLL.water("Kislorod suvda kam eriydi, shuning uchun suvni siqib chiqarish usulida toza yig'iladi. Havodan biroz og'ir bo'lgani uchun uni og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib ham yig'ish mumkin."),
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'spirt-lampasi', 'shtativ', 'qisqich-lapka', 'chop-chogllangan'],
  procedure: [
    "Quruq probirkaga 4–5 g kaliy permanganat soling, og'ziga bir bo'lak paxta qo'ying va gaz chiqarish naychali tiqin bilan yoping.",
    "Probirkani shtativga og'zini biroz pastga qaratib mahkamlang, naycha uchini suv to'ldirilib vannaga to'ntarilgan probirka ostiga yo'naltiring.",
    "Avval probirkani butunlay isiting, so'ng moddani qizdiring; dastlabki havo pufakchalarini yig'mang.",
    "Gaz yig'ilgach, avval naychani suvdan chiqaring, keyin qizdirishni to'xtating.",
    "Yig'ilgan gazga cho'g'langan cho'p tushirib, kislorod ekanligini tekshiring.",
  ],
  safety: "Qizdirishni to'xtatishdan oldin naychani suvdan chiqaring, aks holda suv issiq probirkaga so'rilib, uni yorib yuboradi. Kaliy permanganat oksidlovchi — yonuvchi moddalardan uzoq saqlang.",
  explanation: "Kaliy permanganat qizdirilganda parchalanib kislorod ajratadi; bu ichki molekulyar oksidlanish-qaytarilish reaksiyasi. Kislorod suvda kam erigani uchun suv ostida yig'iladi va uni cho'g'langan cho'pning alangalanishidan bilib olinadi.",
  questions: ["Probirka og'ziga paxta nima uchun qo'yiladi?", "Nima uchun qizdirishni to'xtatishdan oldin naycha suvdan chiqariladi?", "Kislorodni havoni siqib chiqarish usulida yig'ganda idish og'zi qanday turadi va nima uchun?"],
});

R({
  title: "Vodorod peroksidning marganes(IV) oksid ishtirokida parchalanishi — kislorod olish",
  level: '8-sinf', topic: "Kislorod olish; katalizator", engine: 'record',
  reactants: [{ species: 'H2O2', state: 'aq', conc_M: 0.88, volume_mL: 10 }],
  cond: { catalyst: 'MnO2', note_uz: "3% li vodorod peroksid eritmasiga bir chimdim marganes(IV) oksid kukuni solinadi." },
  eq: {
    molecular: '2H2O2 = 2H2O + O2↑',
    electron_balance: ['2O⁻¹ − 2e⁻ = O2⁰', '2O⁻¹ + 2e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["H₂O₂ dagi kislorod oksidlanish darajasi −1: u ham oksidlovchi, ham qaytaruvchi bo'la oladi (disproporsiyalanish).", "MnO₂ sirti O–O bog'ining uzilishini tezlashtiradi, o'zi esa sarflanmaydi.", "Bir qism kislorod atomlari −2 gacha qaytariladi (suv), qolganlari 0 gacha oksidlanadi (O₂)."],
  obs: { gas: gas('O2'), heat: 'ekzotermik', effects: fx('bubbles', 'foam'), text_uz: "Qora kukun qo'shilishi bilan eritma \"qaynab\" ketgandek ko'piklanadi; idish og'ziga tutilgan cho'g'langan cho'p alangalanadi. Qora kukun reaksiyadan keyin o'zgarmay qoladi." },
  collection: COLL.up("Kislorod havodan biroz og'ir (nisbiy zichligi 1,1), shuning uchun og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib yig'iladi; to'lganini idish og'zidagi cho'g'langan cho'p alangalanishidan bilinadi."),
  kinetics: 'tez',
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'gaz-silindri', 'chop-chogllangan', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Vyurs kolbasiga bir chimdim marganes(IV) oksid soling va kolbani shtativga mahkamlang.",
    "Tomchi voronkaga 3% li vodorod peroksid eritmasidan quying.",
    "Peroksidni kolbaga oz-ozdan tomizing, ajralgan gazni naycha orqali og'zi yuqoriga qaratilgan silindrga yo'naltiring.",
    "Silindr og'ziga cho'g'langan cho'p tutib, kislorod to'lganini tekshiring.",
    "Reaksiya tugagach, kolbadagi qora kukun miqdori o'zgarmaganiga e'tibor bering.",
  ],
  safety: "Konsentrlangan (30%) vodorod peroksid terini kuydiradi — faqat 3% li eritma ishlating. Ko'zoynak taqing.",
  explanation: "Vodorod peroksid oddiy sharoitda juda sekin parchalanadi, marganes(IV) oksid esa bu jarayonni keskin tezlashtiradi. MnO₂ reaksiyada sarflanmaydi — u katalizator. Ajralgan kislorod yonishni quvvatlaydi.",
  questions: ["Marganes(IV) oksid bu reaksiyada qanday vazifani bajaradi?", "Katalizator reaksiyadan keyin sarflanmaganini qanday isbotlash mumkin?", "Nima uchun H₂O₂ ham oksidlovchi, ham qaytaruvchi bo'la oladi?"],
});

R({
  title: "Kislorodni kaliy xloratni marganes(IV) oksid ishtirokida qizdirib olish",
  level: '8-sinf', topic: "Kislorod: laboratoriyada olinishi; katalizator", engine: 'record',
  reactants: [{ species: 'KClO3', state: 's', mass_g: 2, form: 'kristall' }],
  cond: { heating: true, temp_min_C: 200, catalyst: 'MnO2', note_uz: "Bertolle tuziga katalizator sifatida oz miqdorda MnO₂ aralashtiriladi (ezmasdan, qog'oz ustida ehtiyotkorlik bilan)." },
  eq: {
    molecular: '2KClO3 = 2KCl + 3O2↑',
    electron_balance: ['Cl⁺⁵ + 6e⁻ = Cl⁻¹', '2O⁻² − 4e⁻ = O2⁰'],
  },
  mech: 'termik-parchalanish',
  steps: ["Xlorat ionidagi xlor (Cl⁺⁵) oltita elektron olib xlorid ionigacha qaytariladi.", "Kislorod atomlari (O⁻²) elektron berib O₂ molekulalariga birlashadi.", "MnO₂ parchalanish haroratini pasaytiradi va jarayonni bir tekis boshqarishga yordam beradi."],
  obs: { gas: gas('O2'), heat: 'ekzotermik', effects: fx('bubbles'), text_uz: "Qizdirilganda aralashma suyuqlanib, rangsiz gaz jadal ajraladi; cho'g'langan cho'p yig'ilgan gazda yorqin alangalanadi." },
  collection: COLL.water("Kislorod suvda kam eriydi — suvni siqib chiqarish usulida yig'iladi."),
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Quruq probirkaga 1–2 g kaliy xlorat va taxminan 0,5 g marganes(IV) oksid soling, ehtiyotkorlik bilan aralashtiring (ishqalamang).",
    "Probirkani gaz chiqarish naychali tiqin bilan yoping, og'zini biroz pastga qaratib shtativga mahkamlang.",
    "Aralashmani bir tekis qizdiring va gazni suv ostida probirkalarga yig'ing.",
    "Avval naychani suvdan chiqaring, so'ng qizdirishni to'xtating; gazni cho'g'langan cho'p bilan tekshiring.",
  ],
  safety: "Kaliy xlorat kuchli oksidlovchi: uni oltingugurt, fosfor, ko'mir, shakar va boshqa yonuvchi moddalar bilan aralashtirish va hovonchada ezish qat'iyan man etiladi — portlash xavfi bor. Faqat toza MnO₂ ishlating, oz miqdorda ishlang.",
  explanation: "Kaliy xlorat qizdirilganda kaliy xlorid va kislorodga parchalanadi. MnO₂ katalizator sifatida parchalanishni ancha past haroratda ketkazadi va o'zi sarflanmaydi. Bu kislorod olishning klassik laboratoriya usuli.",
  questions: ["Bu reaksiyada qaysi element oksidlovchi, qaysi biri qaytaruvchi?", "MnO₂ siz va MnO₂ bilan qizdirishning farqi nimada?", "Nima uchun kaliy xloratni yonuvchi moddalar bilan aralashtirish xavfli?"],
});

R({
  title: "Cho'g'langan cho'pning kislorodda alangalanishi",
  level: '8-sinf', topic: "Kislorodning xossalari: yonishni quvvatlashi", engine: 'record',
  reactants: [
    { species: 'C', state: 's', mass_g: 0.2, form: "bo'lak" },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Cho'g'langan (alangasiz cho'g'lanib turgan) yog'och cho'p kislorodli idishga tushiriladi." },
  eq: {
    molecular: 'C + O2 = CO2',
    electron_balance: ['C⁰ − 4e⁻ = C⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Havoda kislorod atigi 21% ni tashkil etadi, shuning uchun cho'p faqat cho'g'lanadi.", "Toza kislorodda uglerod bilan to'qnashuvlar soni keskin ortadi va yonish tezlashadi.", "Ajralgan issiqlik cho'pni yana alangalantiradi; uglerod CO₂ gacha oksidlanadi."],
  obs: { gas: gas('CO2'), heat: 'kuchli-ekzotermik', flame: { color: '#ffcf5a', desc_uz: 'yorqin sariq alanga' }, effects: fx('glow', 'flame', 'light'), text_uz: "Kislorodli idishga tushirilgan cho'g'langan cho'p birdan yorqin alanga bilan yonib ketadi." },
  kinetics: 'bir-zumda',
  apparatus: ['gaz-silindri', 'chop-chogllangan', 'spirt-lampasi'],
  procedure: [
    "Yog'och cho'pni spirt lampasida yondiring, so'ng alangasini puflab o'chiring — cho'p cho'g'lanib qolsin.",
    "Kislorod to'ldirilgan silindr qopqog'ini oching va cho'g'langan cho'pni ichiga tushiring.",
    "Cho'pning alangalanishini kuzating; tajribani bir necha marta takrorlash mumkin.",
  ],
  safety: "Kislorodli idish yonida yog'li latta va yonuvchi moddalar bo'lmasin. Yonayotgan cho'pni qum solingan idishda o'chiring.",
  explanation: "Kislorod yonishni quvvatlaydi: toza kislorodda moddalar havodagiga qaraganda ancha shiddatli yonadi. Cho'g'langan cho'pning alangalanishi kislorodni aniqlashning oddiy sifat usulidir.",
  questions: ["Nima uchun cho'p havoda cho'g'lanadi-yu, kislorodda alangalanadi?", "Kislorodni boshqa rangsiz gazlardan qanday ajratish mumkin?", "Bu reaksiyada qanday gaz hosil bo'ladi va uni qanday aniqlash mumkin?"],
});

R({
  title: "Temir simning kislorodda yonishi",
  level: '8-sinf', topic: "Kislorodning xossalari: metallarning yonishi", engine: 'record',
  reactants: [
    { species: 'Fe', state: 's', mass_g: 0.3, form: 'sim' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Po'lat sim uchiga cho'g'langan gugurt cho'pi bog'lanib, tubiga qum yoki suv solingan kislorodli silindrga tushiriladi." },
  eq: {
    molecular: '3Fe + 2O2 = Fe3O4',
    electron_balance: ['Fe⁰ − 2e⁻ = Fe⁺²', '2Fe⁰ − 6e⁻ = 2Fe⁺³', '2O2⁰ + 8e⁻ = 4O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Yonayotgan gugurt temirni yonish haroratigacha qizdiradi.", "Toza kislorodda temir atomlari elektron berib Fe²⁺ va Fe³⁺ ga oksidlanadi.", "Hosil bo'lgan temir kuyindisi (Fe₃O₄) erigan tomchilar ko'rinishida uchqun bo'lib sochiladi."],
  obs: { heat: 'kuchli-ekzotermik', effects: fx('sparks', 'light', 'glow'), text_uz: "Temir sim ko'zni qamashtiruvchi uchqunlar sochib yonadi; silindr tubiga qora-qo'ng'ir temir kuyindisi tomchilari tushadi." },
  kinetics: 'tez',
  apparatus: ['gaz-silindri', 'pinset', 'gugurt', 'spirt-lampasi'],
  procedure: [
    "Kislorod to'ldirilgan silindr tubiga 1–2 sm qalinlikda qum seping yoki ozroq suv quying.",
    "Ingichka po'lat simni spiral qilib o'rang, uchiga gugurt cho'pini bog'lang.",
    "Gugurtni yondiring va u deyarli yonib bo'lganda simni silindrga tushiring.",
    "Uchqunlar va hosil bo'lgan qora tomchilarni kuzating.",
  ],
  safety: "Silindr tubiga albatta qum yoki suv soling — erigan temir kuyindisi tomchilari shishani yorib yuboradi. Ko'zoynak taqing, yuzingizni silindrga yaqinlashtirmang.",
  explanation: "Havoda yonmaydigan temir toza kislorodda shiddat bilan yonib, temir kuyindisi Fe₃O₄ ni hosil qiladi. Bu reaksiya kislorodning havoga nisbatan ancha kuchli oksidlovchi muhit yaratishini ko'rsatadi.",
  questions: ["Nima uchun silindr tubiga qum yoki suv solinadi?", "Fe₃O₄ tarkibidagi temirning oksidlanish darajalari qanday?", "Havoda temir qanday sharoitda oksidlanadi?"],
});

// ============================================================================== UGLEROD(IV) OKSID
R({
  title: "Karbonat angidridni Kipp apparatida olish va havoni siqib chiqarib yig'ish",
  level: '8-sinf', topic: "Uglerod(IV) oksid: laboratoriyada olinishi", engine: 'rules',
  reactants: [
    { species: 'CaCO3', state: 's', mass_g: 30, form: "bo'lak" },
    { species: 'HCl', state: 'aq', conc_M: 3, volume_mL: 50 },
  ],
  cond: { note_uz: "Marmar bo'laklari Kipp apparatining o'rta sharida, xlorid kislota (taxminan 10% li) yuqori voronkada." },
  eq: {
    molecular: 'CaCO3 + 2HCl = CaCl2 + CO2↑ + H2O',
    ionic_full: 'CaCO3 + 2H⁺ + 2Cl⁻ = Ca²⁺ + 2Cl⁻ + CO2↑ + H2O',
    ionic_net: 'CaCO3 + 2H⁺ = Ca²⁺ + CO2↑ + H2O',
  },
  mech: 'ion-almashinish',
  steps: ["Kuchli kislota H⁺ ionlari karbonat ionini protonlab, beqaror karbonat kislota hosil qiladi.", "H₂CO₃ darhol suv va CO₂ ga parchalanadi.", "Kalsiy xlorid eritmada qoladi, marmar asta-sekin eriydi."],
  obs: { gas: gas('CO2'), heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Marmar bo'laklari sirtida jadal pufakchalar ajraladi; silindr og'ziga tutilgan yonib turgan cho'p o'chsa — idish gazga to'lgan." },
  collection: COLL.up("CO₂ havodan 1,5 marta og'ir va suvda sezilarli eriydi, shuning uchun og'zi yuqoriga qaratilgan idishda havoni pastdan siqib chiqarib yig'iladi."),
  kinetics: 'tez',
  apparatus: ['kipp-apparati', 'gaz-naycha-egilgan', 'gaz-silindri', 'chop-yonib-turgan'],
  procedure: [
    "Kipp apparatining o'rta shariga marmar bo'laklarini soling, yuqori voronka orqali xlorid kislota quying.",
    "Gaz chiqarish naychasini og'zi yuqoriga qaratilgan silindr tubigacha tushiring.",
    "Jo'mrakni oching va gazni 1–2 daqiqa o'tkazing.",
    "Silindr og'ziga yonib turgan cho'p tuting: cho'p o'chsa, silindr CO₂ ga to'lgan.",
    "Silindrni shisha plastinka bilan yoping va jo'mrakni berkiting.",
  ],
  safety: "Xlorid kislota bilan ehtiyot bo'ling, ko'zoynak taqing. Yopiq xonada ko'p miqdorda CO₂ to'plamang.",
  explanation: "Karbonatlar kuchli kislotalar ta'sirida parchalanib CO₂ ajratadi. Sulfat kislota ishlatilmaydi, chunki kam eriydigan CaSO₄ marmar sirtini qoplab, reaksiyani to'xtatadi. CO₂ havodan og'ir bo'lgani uchun og'zi yuqoriga qaratilgan idishda yig'iladi.",
  questions: ["Nima uchun marmarga sulfat kislota emas, xlorid kislota ta'sir ettiriladi?", "CO₂ ni nima uchun idish og'zini yuqoriga qaratib yig'ish mumkin?", "Idish CO₂ ga to'lganini qanday bilish mumkin?"],
});

R({
  title: "Karbonat angidridni ohakli suv yordamida aniqlash",
  level: '8-sinf', topic: "Uglerod(IV) oksidga sifat reaksiya", engine: 'rules',
  reactants: [
    { species: 'CO2', state: 'g' },
    { species: 'Ca(OH)2', state: 'aq', conc_M: 0.02, volume_mL: 5 },
  ],
  cond: { note_uz: "CO₂ tiniq ohakli suv orqali qisqa vaqt o'tkaziladi." },
  eq: {
    molecular: 'CO2 + Ca(OH)2 = CaCO3↓ + H2O',
    ionic_full: 'CO2 + Ca²⁺ + 2OH⁻ = CaCO3↓ + H2O',
    ionic_net: 'CO2 + Ca²⁺ + 2OH⁻ = CaCO3↓ + H2O',
  },
  mech: 'ion-almashinish',
  steps: ["CO₂ suvda erib karbonat kislota hosil qiladi.", "Ishqoriy muhitda OH⁻ ionlari kislotani karbonat ionigacha neytrallaydi.", "Ca²⁺ va CO₃²⁻ ionlari erimaydigan kalsiy karbonatni hosil qiladi."],
  obs: { precipitate: ppt('CaCO3'), heat: 'sezilarsiz', effects: fx('bubbles', 'turbidity'), text_uz: "Tiniq ohakli suv loyqalanadi — oq kalsiy karbonat cho'kmasi hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: ['probirka', 'gaz-naycha-egilgan', 'kipp-apparati'],
  procedure: [
    "Probirkaga 3–5 ml tiniq ohakli suv quying.",
    "Gaz chiqarish naychasining uchini ohakli suvga tushiring va CO₂ ni qisqa vaqt (5–10 soniya) o'tkazing.",
    "Eritmaning loyqalanishini kuzating.",
  ],
  safety: "Ohakli suv ishqoriy — ko'zga tushishidan saqlaning, ko'zoynak taqing.",
  explanation: "Ohakli suvning loyqalanishi CO₂ ga xos sifat reaksiyadir: kalsiy gidroksid eritmasi bilan suvda erimaydigan oq kalsiy karbonat hosil bo'ladi. Boshqa rangsiz yonmaydigan gazlar (masalan, azot) bu o'zgarishni bermaydi.",
  questions: ["Nima uchun ohakli suv loyqalanadi?", "Nafas chiqarilgan havoni ohakli suvdan o'tkazsak nima kuzatiladi?", "CO₂ ni azotdan qanday farqlash mumkin?"],
});

R({
  title: "Ortiqcha karbonat angidridda kalsiy karbonat cho'kmasining erishi",
  level: '9-sinf', topic: "Karbonatlar va gidrokarbonatlar; suvning vaqtinchalik qattiqligi", engine: 'rules',
  reactants: [
    { species: 'CaCO3', state: 's', mass_g: 0.05, form: 'kukun' },
    { species: 'CO2', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 5 },
  ],
  cond: { note_uz: "Oldingi tajribada hosil bo'lgan loyqa eritma orqali CO₂ uzoq vaqt o'tkaziladi." },
  eq: {
    molecular: 'CaCO3 + CO2 + H2O = Ca(HCO3)2',
    ionic_full: 'CaCO3 + CO2 + H2O = Ca²⁺ + 2HCO3⁻',
    ionic_net: 'CaCO3 + CO2 + H2O = Ca²⁺ + 2HCO3⁻',
  },
  mech: 'birikish',
  steps: ["Ortiqcha CO₂ suvda karbonat kislota hosil qiladi.", "Karbonat kislota CaCO₃ dagi karbonat ionini protonlab gidrokarbonat ioniga aylantiradi.", "Kalsiy gidrokarbonat suvda eriydi, shuning uchun loyqalik yo'qoladi."],
  obs: { heat: 'sezilarsiz', effects: fx('bubbles', 'dissolve'), text_uz: "CO₂ uzoq o'tkazilganda loyqa eritma asta-sekin yana tiniqlashadi." },
  kinetics: 'sekin',
  apparatus: ['probirka', 'gaz-naycha-egilgan', 'kipp-apparati'],
  procedure: [
    "Ohakli suvga CO₂ o'tkazib loyqa eritma hosil qiling.",
    "CO₂ o'tkazishni 2–3 daqiqa davom ettiring.",
    "Cho'kmaning erib, eritmaning tiniqlashishini kuzating.",
    "Tiniq eritmani qizdirib ko'ring: yana loyqalanadi (gidrokarbonat parchalanadi).",
  ],
  safety: "Qizdirishda probirka og'zini o'zingizga qaratmang. Ko'zoynak taqing.",
  explanation: "Kalsiy karbonat suvda erimaydi, lekin ortiqcha CO₂ bilan eruvchan kalsiy gidrokarbonatga aylanadi. Tabiatda ohaktoshlarning erishi va suvning vaqtinchalik qattiqligi shu reaksiya bilan bog'liq; qaynatilganda gidrokarbonat yana CaCO₃ ga parchalanadi.",
  questions: ["Nima uchun CO₂ uzoq o'tkazilganda loyqalik yo'qoladi?", "Suvning vaqtinchalik qattiqligi qanday tuzlar bilan bog'liq va u qanday yo'qotiladi?", "Karst g'orlari qanday hosil bo'ladi?"],
});

R({
  title: "Karbonat angidridning yonishni quvvatlamasligi va havodan og'irligi",
  level: '8-sinf', topic: "Uglerod(IV) oksidning fizik xossalari", engine: 'rules',
  equation_free: true,
  equation_free_uz: "Fizik jarayon: CO₂ havodan og'ir bo'lgani uchun stakanga \"quyiladi\", pastdan yuqoriga to'lib havoni siqib chiqaradi; u yonishni quvvatlamagani uchun shamlar pastdan boshlab birin-ketin o'chadi. Kimyoviy tenglama yozilmaydi.",
  reactants: [{ species: 'CO2', state: 'g' }],
  cond: { note_uz: "Ichida turli balandlikdagi yonib turgan shamlar bo'lgan stakanga CO₂ silindrdan ehtiyotkorlik bilan quyiladi." },
  eq: {},
  mech: 'fizik',
  steps: ["CO₂ ning molyar massasi (44 g/mol) havonikidan (29 g/mol) katta, shuning uchun u idish tubiga cho'kadi.", "Gaz pastdan yuqoriga qarab havoni siqib chiqaradi.", "Alanga atrofida kislorod qolmagani uchun shamlar pastdan boshlab o'chadi."],
  obs: { heat: 'sezilarsiz', effects: fx('flame'), text_uz: "CO₂ \"quyilganda\" pastki sham birinchi, so'ng yuqoridagisi o'chadi." },
  kinetics: 'tez',
  apparatus: ['kimyoviy-stakan', 'gaz-silindri', 'gugurt'],
  procedure: [
    "Keng stakan tubiga balandligi har xil bo'lgan ikkita kichik shamni o'rnating va yondiring.",
    "CO₂ to'ldirilgan silindrni stakan chetiga egib, gazni suv quygandek sekin \"quying\".",
    "Shamlarning qaysi tartibda o'chishini kuzating.",
  ],
  safety: "Yonib turgan shamlar yonida sochingiz va kiyimingizga ehtiyot bo'ling. Xonani shamollating.",
  explanation: "CO₂ havodan og'ir va yonishni quvvatlamaydi, shuning uchun u idish tubidan boshlab to'planib, alangani kisloroddan ajratib qo'yadi. Bu xossa o't o'chirgichlarda qo'llaniladi.",
  questions: ["Nima uchun pastki sham birinchi o'chadi?", "CO₂ ning qaysi xossalari uni o't o'chirishda ishlatishga imkon beradi?", "Yerto'la va quduqlarga tushishdan oldin nima uchun yonib turgan sham tushirib ko'riladi?"],
});

R({
  title: "Magniyning karbonat angidridda yonishi",
  level: '9-sinf', topic: "Uglerod(IV) oksidning oksidlovchilik xossasi", engine: 'record',
  reactants: [
    { species: 'Mg', state: 's', mass_g: 0.2, form: 'lenta' },
    { species: 'CO2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Havoda yondirilgan magniy lentasi tigel qisqichida CO₂ to'ldirilgan silindrga tushiriladi." },
  eq: {
    molecular: '2Mg + CO2 = 2MgO + C',
    electron_balance: ['Mg⁰ − 2e⁻ = Mg⁺²', 'C⁺⁴ + 4e⁻ = C⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Magniy juda faol qaytaruvchi va kislorodga moyilligi uglerodnikidan katta.", "Yuqori haroratda magniy CO₂ dagi kislorodni tortib oladi: Mg²⁺ hosil bo'ladi.", "Uglerod +4 dan 0 gacha qaytarilib, qora qurum ko'rinishida ajraladi."],
  obs: { heat: 'kuchli-ekzotermik', flame: { color: '#ffffff', desc_uz: "ko'zni qamashtiruvchi oq alanga" }, effects: fx('light', 'flame', 'smoke', 'deposit'), text_uz: "Yonayotgan magniy CO₂ da o'chmaydi, yorqin oq alanga bilan yonishda davom etadi; silindr devorlarida oq kukun (MgO) va qora qurum (uglerod) dog'lari qoladi." },
  kinetics: 'tez',
  apparatus: ['gaz-silindri', 'tigel-qisqichi', 'spirt-lampasi'],
  procedure: [
    "Silindrni CO₂ bilan to'ldiring va yonib turgan cho'p bilan to'lganini tekshiring (cho'p o'chishi kerak).",
    "Magniy lentasini tigel qisqichi bilan ushlab spirt lampasida yondiring.",
    "Yonayotgan lentani tezda silindrga tushiring.",
    "Yonish to'xtagach, silindr devorlaridagi oq va qora moddalarni kuzating.",
  ],
  safety: "Magniy alangasiga tik qaramang — kuchli yorug'lik ko'zga zarar yetkazadi. Ko'zoynak taqing, silindr tubiga qum seping.",
  explanation: "CO₂ odatda yonishni quvvatlamaydi, ammo magniy kabi juda faol metallar undagi kislorodni tortib olib yonishda davom etadi va uglerodni erkin holda ajratadi. Shuning uchun yonayotgan magniyni karbonat angidridli o't o'chirgich bilan o'chirib bo'lmaydi.",
  questions: ["Nima uchun yonayotgan magniyni CO₂ bilan o'chirib bo'lmaydi?", "Bu reaksiyada CO₂ qanday xossani namoyon qiladi?", "Silindr devorlaridagi qora va oq moddalar nima?"],
});

// ======================================================================================== AMMIAK
R({
  title: "Ammiakni ammoniy xlorid va kalsiy gidroksid aralashmasini qizdirib olish",
  level: '9-sinf', topic: "Ammiak: laboratoriyada olinishi va yig'ilishi", engine: 'record',
  reactants: [
    { species: 'NH4Cl', state: 's', mass_g: 2, form: 'kukun' },
    { species: 'Ca(OH)2', state: 's', mass_g: 2, form: 'kukun' },
  ],
  cond: { heating: true, temp_min_C: 100, note_uz: "Quruq tuzlar aralashmasi og'zi biroz pastga qaratilgan probirkada qizdiriladi." },
  eq: {
    molecular: '2NH4Cl + Ca(OH)2 = CaCl2 + 2NH3↑ + 2H2O↑',
  },
  mech: 'ion-almashinish',
  steps: ["Kuchli asos (OH⁻) ammoniy ionidan proton tortib oladi.", "Hosil bo'lgan ammiak uchuvchan bo'lgani uchun qizdirilganda gaz holida ajraladi.", "Aralashmada kalsiy xlorid qoladi, suv bug'i ajraladi."],
  obs: { gas: gas('NH3'), heat: 'endotermik', effects: fx('condensate'), text_uz: "O'tkir novshadil hidli gaz ajraladi; to'ntarilgan probirka og'ziga tutilgan ho'l qizil lakmus qog'ozi ko'karadi." },
  collection: COLL.down("Ammiak havodan ancha yengil (nisbiy zichligi 0,59) va suvda juda yaxshi eriydi, shuning uchun suv ostida yig'ilmaydi — og'zi pastga qaratilgan quruq idishda havoni siqib chiqarib yig'iladi."),
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'spirt-lampasi', 'shtativ', 'qisqich-lapka', 'indikator-qogozi'],
  procedure: [
    "Ammoniy xlorid va kalsiy gidroksid kukunlarini teng miqdorda (2 g dan) aralashtiring va quruq probirkaga soling.",
    "Probirkani gaz chiqarish naychali tiqin bilan yoping, og'zini biroz pastga qaratib shtativga mahkamlang.",
    "Naycha uchiga og'zi pastga qaratilgan quruq probirka kiygizing.",
    "Aralashmani qizdiring; probirka og'ziga ho'llangan qizil lakmus qog'ozini tutib, to'lganini tekshiring.",
    "To'lgan probirkani og'zini pastga qaratgan holda tiqin bilan yoping.",
  ],
  safety: `${HOOD}; ammiak hidini to'g'ridan-to'g'ri hidlamang, qo'l bilan yelpib hidlang. Probirka og'zini pastga qaratish suv bug'i kondensatining qizigan joyga oqib, probirkani yorishiga yo'l qo'ymaydi.`,
  explanation: "Ammoniy tuzlari ishqorlar bilan qizdirilganda ammiak ajratadi — bu ammiakni laboratoriyada olishning asosiy usuli. Ammiak havodan yengil va suvda juda yaxshi erigani uchun og'zi pastga qaratilgan idishda yig'iladi.",
  questions: ["Nima uchun ammiakni suv ostida yig'ib bo'lmaydi?", "Idish ammiakka to'lganini qanday bilish mumkin?", "Nima uchun probirka og'zi biroz pastga qaratib mahkamlanadi?"],
});

R({
  title: "Ammiak va vodorod xloridning o'zaro ta'siri — \"tutunsiz olovdan tutun\"",
  level: '9-sinf', topic: "Ammiakning xossalari: kislotalar bilan birikishi", engine: 'record',
  reactants: [
    { species: 'NH3', state: 'g' },
    { species: 'HCl', state: 'g' },
  ],
  cond: { temp_max_C: 300, note_uz: "Konsentrlangan ammiakli suv va konsentrlangan xlorid kislota bilan ho'llangan ikki shisha tayoqcha bir-biriga yaqinlashtiriladi (yoki ikki gaz silindri og'izma-og'iz qo'yiladi)." },
  eq: {
    molecular: 'NH3 + HCl = NH4Cl',
  },
  mech: 'birikish',
  steps: ["Ammiak molekulasidagi azotning bo'linmagan elektron jufti HCl dan protonni qabul qiladi.", "Donor-akseptor bog' hosil bo'lib, ammoniy ioni NH₄⁺ yuzaga keladi.", "Ammoniy xloridning juda mayda kristallari havoda oq tutun hosil qiladi."],
  obs: { heat: 'ekzotermik', effects: fx('smoke'), text_uz: "Gazlar uchrashgan joyda zich oq tutun (ammoniy xloridning mayda kristallari) paydo bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: ['shisha-tayoqcha', 'gaz-silindri'],
  procedure: [
    "Bir shisha tayoqchani konsentrlangan ammiakli suvga, ikkinchisini konsentrlangan xlorid kislotaga botiring.",
    "Tayoqchalarni bir-biriga tegizmasdan 2–3 sm masofagacha yaqinlashtiring.",
    "Tayoqchalar orasida hosil bo'lgan oq tutunni kuzating.",
  ],
  safety: `${HOOD}. Konsentrlangan xlorid kislota va ammiak bug'lari nafas yo'llarini kuydiradi — hidlamang, ko'zoynak va qo'lqopda ishlang.`,
  explanation: "Ammiak asos xossasiga ega: azot atomining bo'linmagan elektron jufti hisobiga protonni biriktirib ammoniy ionini hosil qiladi. Gaz holidagi ammiak va vodorod xlorid to'g'ridan-to'g'ri qattiq ammoniy xloridga aylanadi, shuning uchun havoda oq tutun ko'rinadi. Bu reaksiya ammiak yoki HCl ni aniqlashda ham qo'llaniladi.",
  questions: ["Oq tutun qanday moddadan iborat?", "Ammoniy ionida qanday turdagi kimyoviy bog'lar mavjud?", "Bu reaksiyadan ammiakni aniqlashda qanday foydalanish mumkin?"],
});

R({
  title: "Ammiakning suvda juda yaxshi erishi — \"favvora\" tajribasi",
  level: '9-sinf', topic: "Ammiakning fizik xossalari va suvli eritmasi", engine: 'rules',
  equation_free: true,
  equation_free_uz: "Asosan fizik jarayon: ammiak suvda juda yaxshi eriydi (1 hajm suvda ~700 hajm), kolbadagi bosim keskin tushadi va suv favvora bo'lib otiladi. Eritmaning ishqoriy muhiti NH₃ + H₂O ⇄ NH₄⁺ + OH⁻ muvozanati bilan tushuntiriladi; uning siljishi juda kam bo'lgani uchun alohida tenglama berilmaydi.",
  reactants: [
    { species: 'NH3', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 200 },
    { species: 'C20H14O4', state: 'aq', conc_M: 0.003, volume_mL: 1 },
  ],
  cond: { note_uz: "Quruq ammiak to'ldirilgan kolba uchi ingichkalashgan naychali tiqin bilan yopilib, fenolftaleinli suvga to'ntariladi." },
  eq: {},
  mech: 'fizik',
  steps: ["Tomizgichdan kiritilgan bir necha tomchi suv kolbadagi ammiakning katta qismini eritadi.", "Kolba ichidagi bosim atmosfera bosimidan ancha pasayadi.", "Tashqi bosim suvni naycha orqali kolbaga favvora qilib haydaydi; ammiak eritmasi ishqoriy bo'lgani uchun fenolftalein pushti-qizil rangga kiradi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#d81b8c' }, heat: 'sezilarsiz', effects: fx('splash'), text_uz: "Kolbaga suv favvora bo'lib otilib kiradi va darhol pushti-qizil rangga bo'yaladi." },
  kinetics: 'bir-zumda',
  apparatus: ['dumaloq-tubli-kolba', 'rezina-tiqin-1-teshikli-orta', 'gaz-naycha-toraytirilgan', 'kristallizator', 'tomizgich', 'shtativ'],
  procedure: [
    "Quruq dumaloq tubli kolbani ammiak bilan to'ldiring (og'zi pastga qaratilgan holda).",
    "Kolbani uchi ingichkalashgan shisha naychali tiqin bilan yoping.",
    "Kristallizatorga suv quyib, bir necha tomchi fenolftalein qo'shing.",
    "Kolbani to'ntarib, naycha uchini suvga tushiring; tomizgich bilan kolbaga ozgina suv kiriting.",
    "Favvora va eritma rangini kuzating.",
  ],
  safety: `Ammiakni ${HOOD.toLowerCase()} oladi va kolbaga to'ldiradi. Faqat butun, yorig'i yo'q dumaloq tubli kolba ishlating — bosim farqidan yupqa kolba yorilishi mumkin.`,
  explanation: "Ammiak suvda juda yaxshi eriydi, shuning uchun kolbaga kiritilgan oz miqdordagi suv ham gaz bosimini keskin pasaytiradi va suv favvora bo'lib otiladi. Ammiakning suvdagi eritmasi kuchsiz asos xossasini namoyon qiladi va fenolftaleinni pushti-qizil rangga bo'yaydi.",
  questions: ["Favvora hosil bo'lishining sababi nima?", "Nima uchun eritma pushti-qizil rangga kiradi?", "Favvora tajribasini yana qaysi gazlar bilan o'tkazish mumkin?"],
});

R({
  title: "Ammiakning qizdirilgan mis(II) oksidni qaytarishi",
  level: '9-sinf', topic: "Ammiakning xossalari: qaytaruvchilik", engine: 'record',
  reactants: [
    { species: 'CuO', state: 's', mass_g: 1, form: 'kukun' },
    { species: 'NH3', state: 'g' },
  ],
  cond: { heating: true, temp_min_C: 300, note_uz: "Quruq ammiak qizdirilgan mis(II) oksid ustidan o'tkaziladi." },
  eq: {
    molecular: '3CuO + 2NH3 = 3Cu + N2↑ + 3H2O↑',
    electron_balance: ['Cu⁺² + 2e⁻ = Cu⁰', '2N⁻³ − 6e⁻ = N2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Ammiakdagi azot eng past oksidlanish darajasida (−3) bo'lgani uchun faqat qaytaruvchi bo'la oladi.", "Qizdirilganda azot atomlari elektron berib erkin azotgacha oksidlanadi.", "Mis(II) ionlari elektron qabul qilib metall misgacha qaytariladi; suv bug'i ajraladi."],
  obs: { gas: gas('N2'), solid_color_change: { from: '#1a1a1a', to: '#c27a4a' }, heat: 'ekzotermik', effects: fx('condensate'), text_uz: "Qora mis(II) oksid qizil misga aylanadi, naychaning sovuq qismida suv tomchilari paydo bo'ladi." },
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'gaz-naycha-togri', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Gorizontal mahkamlangan qiyin eriydigan shisha naycha (yoki probirka) ichiga mis(II) oksid kukunini joylashtiring.",
    "Ammiak olinadigan probirkadan quruq ammiakni naycha orqali o'tkazing.",
    "Mis(II) oksidni kuchli qizdiring va rang o'zgarishini kuzating.",
    "Naychaning sovuq qismida suv tomchilari to'planishini kuzating.",
  ],
  safety: `${HOOD}. Ammiak bug'ini hidlamang. Qizigan naychaga sovuq suv tekkizmang.`,
  explanation: "Ammiak tarkibidagi azot −3 oksidlanish darajasida bo'lib, kuchli qaytaruvchi xossaga ega. Qizdirilganda u mis(II) oksidni metall misgacha qaytaradi, o'zi esa erkin azotga oksidlanadi.",
  questions: ["Nima uchun ammiak faqat qaytaruvchi bo'la oladi?", "Reaksiyada azotning oksidlanish darajasi qanday o'zgaradi?", "Bu reaksiyani vodorod bilan CuO ning qaytarilishi bilan solishtiring."],
});

R({
  title: "Ammiakning kislorodda yonishi",
  level: '9-sinf', topic: "Ammiakning xossalari: yonishi", engine: 'record',
  reactants: [
    { species: 'NH3', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Ammiak oqimi kislorod bilan to'ldirilgan idishda yondiriladi; havoda ammiak yonmaydi." },
  eq: {
    molecular: '4NH3 + 3O2 = 2N2 + 6H2O',
    electron_balance: ['2N⁻³ − 6e⁻ = N2⁰', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Toza kislorodda ammiak yonish haroratigacha qizdirilganda yona boshlaydi.", "Azot atomlari (N⁻³) elektron berib erkin azotgacha oksidlanadi.", "Kislorod suv tarkibidagi O⁻² gacha qaytariladi."],
  obs: { gas: gas('N2'), heat: 'kuchli-ekzotermik', flame: { color: '#f0d060', desc_uz: "sarg'ish alanga" }, effects: fx('flame', 'condensate'), text_uz: "Kislorod muhitida ammiak sarg'ish alanga bilan yonadi; havoda alanga o'chadi." },
  kinetics: 'tez',
  apparatus: ['gaz-silindri', 'gaz-naycha-togri', 'spirt-lampasi', 'shtativ'],
  procedure: [
    "Gaz silindrini kislorod bilan to'ldiring va shtativga mahkamlang.",
    "Ammiak chiqayotgan naycha uchini yondirib, uni kislorodli silindrga kiriting.",
    "Alanga rangini kuzating; naychani silindrdan chiqarganda alanga o'chishiga e'tibor bering.",
  ],
  safety: `${HOOD}. Ammiak va kislorod aralashmasini idishda to'plamang — faqat naycha uchida yondiring. Ko'zoynak taqing.`,
  explanation: "Ammiak havoda yonmaydi, ammo toza kislorodda yonib azot va suv hosil qiladi. Katalizator (platina) ishtirokida esa ammiak azot(II) oksidgacha oksidlanadi — bu nitrat kislota ishlab chiqarish asosidir.",
  questions: ["Nima uchun ammiak havoda yonmaydi, kislorodda esa yonadi?", "Katalizator ishtirokida ammiak oksidlanganda qanday mahsulot hosil bo'ladi?", "Reaksiyada qaysi element qaytaruvchi?"],
  confidence: "o'rta",
});

// ================================================================================ VODOROD XLORID
R({
  title: "Vodorod xloridni osh tuzi va konsentrlangan sulfat kislotadan olish",
  level: '9-sinf', topic: "Vodorod xlorid: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'NaCl', state: 's', mass_g: 5, form: 'kristall' },
    { species: 'H2SO4', state: 'aq', conc_M: 18, volume_mL: 5, conc_min_M: 16 },
  ],
  cond: { note_uz: "Quruq osh tuziga konsentrlangan sulfat kislota quyiladi; gaz xona haroratida ajraladi, oxirida kuchsiz qizdirib tezlashtiriladi (kuchsiz qizdirishda nordon tuz hosil bo'ladi)." },
  eq: {
    molecular: 'NaCl + H2SO4 = NaHSO4 + HCl↑',
    ionic_net: 'Cl⁻ + H2SO4 = HSO4⁻ + HCl↑',
  },
  mech: 'ion-almashinish',
  steps: ["Konsentrlangan sulfat kislota uchuvchan bo'lmagan kuchli kislota.", "U xlorid ionlarini protonlab, uchuvchan vodorod xlorid hosil qiladi.", "Konsentrlangan kislotada suv juda kam bo'lgani uchun HCl erimay, gaz holida ajraladi; kuchsiz qizdirishda natriy gidrosulfat qoladi."],
  obs: { gas: gas('HCl'), heat: 'sezilarsiz', effects: fx('bubbles', 'fog'), text_uz: "Rangsiz o'tkir hidli gaz ajraladi; u nam havoda oq \"tuman\" hosil qiladi va ho'l ko'k lakmus qog'ozini qizartiradi." },
  collection: COLL.up("Vodorod xlorid havodan og'ir (nisbiy zichligi 1,26) va suvda juda yaxshi eriydi, shuning uchun og'zi yuqoriga qaratilgan quruq idishda havoni siqib chiqarib yig'iladi."),
  kinetics: 'tez',
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'gaz-silindri', 'spirt-lampasi', 'shtativ', 'qisqich-lapka', 'indikator-qogozi'],
  procedure: [
    "Vyurs kolbasiga 5 g quruq osh tuzi soling va kolbani shtativga mahkamlang.",
    "Tomchi voronkadan konsentrlangan sulfat kislotani oz-ozdan quying.",
    "Kolbani kuchsiz qizdiring, ajralgan gazni og'zi yuqoriga qaratilgan quruq silindrga yo'naltiring.",
    "Silindr og'ziga ho'llangan ko'k lakmus qog'ozini tutib, to'lganini tekshiring.",
  ],
  safety: `${HOOD}. Konsentrlangan sulfat kislota terini kuydiradi; vodorod xlorid nafas yo'llarini qattiq ta'sirlaydi. Gaz chiqarish naychasini suvga tushirmang — suv kolbaga so'rilib ketadi.`,
  explanation: "Uchuvchan bo'lmagan konsentrlangan sulfat kislota uchuvchan kislotalarni ularning tuzlaridan siqib chiqaradi. Osh tuzidan shu usulda vodorod xlorid olinadi; uning suvdagi eritmasi xlorid kislotadir.",
  questions: ["Nima uchun bu reaksiya uchun suyultirilgan emas, konsentrlangan sulfat kislota olinadi?", "Vodorod xloridni nima uchun suv ostida yig'ib bo'lmaydi?", "Kuchli qizdirilganda reaksiya tenglamasi qanday o'zgaradi?"],
});

R({
  title: "Vodorod xloridning suvda erishi va xlorid kislota hosil bo'lishi (lakmus bilan)",
  level: '9-sinf', topic: "Vodorod xlorid va xlorid kislota", engine: 'rules',
  reactants: [
    { species: 'HCl', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 100 },
    { species: 'lakmus', state: 'aq', volume_mL: 1 },
  ],
  cond: { note_uz: "Quruq HCl to'ldirilgan kolba lakmusli suvga to'ntariladi (favvora tajribasi) yoki gaz lakmusli suv orqali o'tkaziladi." },
  eq: {
    molecular: 'HCl = H⁺ + Cl⁻',
    ionic_net: 'HCl = H⁺ + Cl⁻',
  },
  mech: 'sifat-reaksiya',
  steps: ["Qutbli HCl molekulalari suv molekulalari bilan o'zaro ta'sirlashib to'liq ionlarga ajraladi.", "Eritmada H⁺ (aniqrog'i H₃O⁺) ionlari to'planadi — kuchli kislota hosil bo'ladi.", "H⁺ ionlari ta'sirida binafsha lakmus qizaradi."],
  obs: { solution_color_change: { from: '#8a4fb3', to: '#d42a3a' }, heat: 'ekzotermik', effects: fx('splash'), text_uz: "Lakmusli suv kolbaga favvora bo'lib otiladi va qizil rangga kiradi." },
  kinetics: 'bir-zumda',
  apparatus: ['dumaloq-tubli-kolba', 'rezina-tiqin-1-teshikli-orta', 'gaz-naycha-toraytirilgan', 'kristallizator', 'tomizgich'],
  procedure: [
    "Quruq kolbani vodorod xlorid bilan to'ldiring va uchi ingichkalashgan naychali tiqin bilan yoping.",
    "Kristallizatordagi suvga bir necha tomchi lakmus qo'shing.",
    "Kolbani to'ntarib naycha uchini suvga tushiring, tomizgich bilan ozgina suv kiriting.",
    "Favvora va eritma rangini kuzating.",
  ],
  safety: `${HOOD}. Vodorod xlorid nafas yo'llarini kuydiradi. Yorig'i yo'q dumaloq tubli kolba ishlating.`,
  explanation: "Vodorod xlorid suvda juda yaxshi eriydi (1 hajm suvda ~500 hajm) va to'liq dissotsilanib kuchli xlorid kislotani hosil qiladi. Shuning uchun favvora hosil bo'ladi va lakmus qizaradi.",
  questions: ["Nima uchun HCl suvda erishi favvora hosil qiladi?", "HCl ning suvdagi eritmasi qanday kislota xossalariga ega?", "Ammiak va vodorod xlorid bilan o'tkazilgan favvora tajribalarida indikator rangi qanday farq qiladi?"],
});

// =========================================================================================== XLOR
R({
  title: "Xlorni kaliy permanganat va konsentrlangan xlorid kislotadan olish",
  level: '9-sinf', topic: "Xlor: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'KMnO4', state: 's', mass_g: 2, form: 'kristall' },
    { species: 'HCl', state: 'aq', conc_M: 11.6, volume_mL: 10, conc_min_M: 6 },
  ],
  cond: { note_uz: "Kaliy permanganat kristallariga tomchi voronkadan konsentrlangan xlorid kislota tomiziladi; qizdirish shart emas." },
  eq: {
    molecular: '2KMnO4 + 16HCl = 2KCl + 2MnCl2 + 5Cl2↑ + 8H2O',
    ionic_full: '2K⁺ + 2MnO4⁻ + 16H⁺ + 16Cl⁻ = 2K⁺ + 2Cl⁻ + 2Mn²⁺ + 4Cl⁻ + 5Cl2↑ + 8H2O',
    ionic_net: '2MnO4⁻ + 16H⁺ + 10Cl⁻ = 2Mn²⁺ + 5Cl2↑ + 8H2O',
    electron_balance: ['Mn⁺⁷ + 5e⁻ = Mn⁺²', '2Cl⁻¹ − 2e⁻ = Cl2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kislotali muhitda permanganat ioni kuchli oksidlovchi: Mn⁺⁷ besh elektron olib Mn²⁺ gacha qaytariladi.", "Xlorid ionlari elektron berib erkin xlorgacha oksidlanadi.", "Ortiqcha kislorod H⁺ ionlari bilan suv hosil qiladi; 16 molekula HCl dan faqat 10 tasi qaytaruvchi vazifasini bajaradi."],
  obs: { gas: gas('Cl2'), solution_color_change: { from: '#8e1a8e', to: '#f6dfe4' }, heat: 'ekzotermik', effects: fx('bubbles', 'color-gas'), text_uz: "Kristallar ustida sarg'ish-yashil, bo'g'uvchi hidli gaz ajraladi va idishni to'ldiradi; binafsha rang yo'qoladi." },
  collection: COLL.up("Xlor havodan 2,5 marta og'ir va suvda sezilarli eriydi (suv bilan qisman reaksiyaga kirishadi), shuning uchun og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib yig'iladi; ba'zan to'yingan osh tuzi eritmasi ostida ham yig'iladi."),
  kinetics: 'tez',
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'gaz-silindri', 'dreksel-sklyankasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Vyurs kolbasiga 2 g kaliy permanganat kristallarini soling, tomchi voronkaga konsentrlangan xlorid kislota quying.",
    "Kolbani shtativga mahkamlang, gaz chiqarish naychasini og'zi yuqoriga qaratilgan silindr tubigacha tushiring.",
    "Kislotani oz-ozdan tomizing va gaz ajralishini kuzating.",
    "Silindr sarg'ish-yashil gazga to'lgach, uni shisha plastinka bilan yoping.",
    "Ortiqcha xlorni ishqor eritmasi solingan Dreksel sklyankasi orqali yutdiring.",
  ],
  safety: `${HOOD}. Xlor juda zaharli bo'g'uvchi gaz — uni hidlamang. Konsentrlangan xlorid kislota bilan ko'zoynak va qo'lqopda ishlang; ortiqcha xlorni ishqor eritmasida zararsizlantiring.`,
  explanation: "Kuchli oksidlovchilar (KMnO₄, MnO₂) konsentrlangan xlorid kislotadagi xlorid ionlarini erkin xlorgacha oksidlaydi. Kaliy permanganat bilan reaksiya qizdirmasdan ketadi. Xlor havodan og'ir bo'lgani uchun og'zi yuqoriga qaratilgan idishda yig'iladi.",
  questions: ["Bu reaksiyada qaysi modda oksidlovchi, qaysi biri qaytaruvchi?", "16 molekula HCl ning nechtasi qaytaruvchi vazifasini bajaradi? Qolganlari-chi?", "Xlorni nima uchun og'zi yuqoriga qaratilgan idishda yig'ish mumkin?"],
});

R({
  title: "Xlorni marganes(IV) oksid va konsentrlangan xlorid kislotadan olish",
  level: '9-sinf', topic: "Xlor: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'MnO2', state: 's', mass_g: 2, form: 'kukun' },
    { species: 'HCl', state: 'aq', conc_M: 11.6, volume_mL: 10, conc_min_M: 6 },
  ],
  cond: { heating: true, temp_min_C: 60, note_uz: "Aralashma kuchsiz qizdiriladi; sovuqda reaksiya juda sekin ketadi." },
  eq: {
    molecular: 'MnO2 + 4HCl = MnCl2 + Cl2↑ + 2H2O',
    ionic_full: 'MnO2 + 4H⁺ + 4Cl⁻ = Mn²⁺ + 2Cl⁻ + Cl2↑ + 2H2O',
    ionic_net: 'MnO2 + 4H⁺ + 2Cl⁻ = Mn²⁺ + Cl2↑ + 2H2O',
    electron_balance: ['Mn⁺⁴ + 2e⁻ = Mn⁺²', '2Cl⁻¹ − 2e⁻ = Cl2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilganda MnO₂ kislotali muhitda xlorid ionlarini oksidlaydi.", "Mn⁺⁴ ikki elektron olib Mn²⁺ ga qaytariladi.", "Ikki xlorid ioni ikki elektron berib Cl₂ molekulasini hosil qiladi."],
  obs: { gas: gas('Cl2'), heat: 'endotermik', effects: fx('bubbles', 'color-gas'), text_uz: "Qora kukun asta-sekin eriydi, sarg'ish-yashil bo'g'uvchi hidli gaz ajraladi." },
  collection: COLL.up("Xlor havodan og'ir va suvda eriydi, shuning uchun og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib yig'iladi."),
  kinetics: "o'rtacha",
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'gaz-silindri', 'dreksel-sklyankasi', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Vyurs kolbasiga 2 g marganes(IV) oksid kukunini soling va konsentrlangan xlorid kislota quying.",
    "Kolbani kuchsiz qizdiring.",
    "Ajralgan gazni og'zi yuqoriga qaratilgan silindrga yig'ing; ortiqcha xlorni ishqor eritmasiga yutdiring.",
    "Silindrdagi gaz rangini oq qog'oz fonida kuzating.",
  ],
  safety: `${HOOD}. Xlor zaharli — hidlamang. Qizdirishni to'xtatganda gaz chiqarish naychasi orqali suyuqlik so'rilmasligini kuzating.`,
  explanation: "Marganes(IV) oksid qizdirilganda konsentrlangan xlorid kislotani xlorgacha oksidlaydi. Bu Sheele tomonidan xlorni birinchi marta olish usuli bo'lib, hozir ham laboratoriyada qo'llaniladi.",
  questions: ["Bu reaksiyada MnO₂ katalizatormi yoki oksidlovchimi? Javobingizni asoslang.", "Nima uchun suyultirilgan xlorid kislota bilan xlor deyarli olinmaydi?", "Ortiqcha xlor qanday zararsizlantiriladi?"],
});

R({
  title: "Xlorning kaliy yodid eritmasidan yodni siqib chiqarishi",
  level: '9-sinf', topic: "Galogenlarning oksidlovchilik faolligi", engine: 'record',
  reactants: [
    { species: 'Cl2', state: 'g' },
    { species: 'KI', state: 'aq', conc_M: 0.1, volume_mL: 3 },
  ],
  cond: { note_uz: "Xlor kaliy yodid eritmasi orqali qisqa vaqt o'tkaziladi (yoki ho'llangan yodkraxmal qog'oz xlorli idish og'ziga tutiladi)." },
  eq: {
    molecular: 'Cl2 + 2KI = 2KCl + I2',
    ionic_full: 'Cl2 + 2K⁺ + 2I⁻ = 2K⁺ + 2Cl⁻ + I2',
    ionic_net: 'Cl2 + 2I⁻ = 2Cl⁻ + I2',
    electron_balance: ['Cl2⁰ + 2e⁻ = 2Cl⁻¹', '2I⁻¹ − 2e⁻ = I2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Xlor yoddan faolroq galogen — kuchliroq oksidlovchi.", "Cl₂ molekulasi ikki yodid ionidan elektron oladi.", "Erkin yod ajralib, eritmani sariq-qo'ng'ir rangga bo'yaydi (kraxmal bo'lsa — ko'k)."],
  obs: { solution_color_change: { from: '#ffffff', to: '#b0682a' }, heat: 'sezilarsiz', effects: fx('bubbles', 'swirl'), text_uz: "Rangsiz kaliy yodid eritmasi sariq-qo'ng'ir rangga kiradi; yodkraxmal qog'ozi ko'karadi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'gaz-naycha-egilgan', 'indikator-qogozi'],
  procedure: [
    "Probirkaga 2–3 ml kaliy yodid eritmasi quying.",
    "Xlor olinayotgan asbobning gaz chiqarish naychasini eritmaga tushirib, 2–3 soniya gaz o'tkazing.",
    "Eritma rangini kuzating; bir tomchi kraxmal eritmasi qo'shib, ko'k rang paydo bo'lishini tekshiring.",
  ],
  safety: `${HOOD}. Xlorni hidlamang; gazni uzoq o'tkazmang.`,
  explanation: "Galogenlarning oksidlovchilik faolligi ftordan yodga qarab kamayadi, shuning uchun xlor yodid ionlarini erkin yodgacha oksidlaydi. Ho'llangan yodkraxmal qog'ozining ko'karishi xlorni aniqlashning sezgir usulidir.",
  questions: ["Nima uchun yod xlorni xloridlardan siqib chiqara olmaydi?", "Yodkraxmal qog'ozi bilan xlorni qanday aniqlash mumkin?", "Bu reaksiyada oksidlovchi va qaytaruvchini ko'rsating."],
});

R({
  title: "Mis simning xlorda yonishi",
  level: '9-sinf', topic: "Xlorning xossalari: metallar bilan reaksiyasi", engine: 'record',
  reactants: [
    { species: 'Cu', state: 's', mass_g: 0.3, form: 'sim' },
    { species: 'Cl2', state: 'g' },
  ],
  cond: { heating: true, temp_min_C: 300, note_uz: "Qizdirilgan mis sim (yoki yupqa mis folga) xlor to'ldirilgan silindrga tushiriladi." },
  eq: {
    molecular: 'Cu + Cl2 = CuCl2',
    electron_balance: ['Cu⁰ − 2e⁻ = Cu⁺²', 'Cl2⁰ + 2e⁻ = 2Cl⁻¹'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Qizdirilgan mis atomlari xlor molekulalariga elektron beradi.", "Mis Cu²⁺ ga oksidlanadi, xlor Cl⁻ ga qaytariladi.", "Hosil bo'lgan mis(II) xlorid mayda zarrachalar ko'rinishida qo'ng'ir tutun hosil qiladi."],
  obs: { heat: 'kuchli-ekzotermik', effects: fx('smoke', 'glow'), text_uz: "Qizigan mis xlorda cho'g'lanib yonadi, silindr qo'ng'ir-sariq tutun bilan to'ladi; suv qo'shilganda ko'kimtir-yashil eritma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: ['gaz-silindri', 'tigel-qisqichi', 'spirt-lampasi'],
  procedure: [
    "Xlor to'ldirilgan silindrni shtativ yoniga qo'ying.",
    "Ingichka mis simni tigel qisqichi bilan ushlab spirt lampasida qizdiring.",
    "Qizigan simni tezda silindrga tushiring va yonishni kuzating.",
    "Tajribadan so'ng silindrga ozgina suv quyib chayqating va eritma rangini kuzating.",
  ],
  safety: `${HOOD}. Xlor juda zaharli; silindrni yopiq holda saqlang, tajribadan so'ng qolgan xlorni ishqor eritmasi bilan zararsizlantiring.`,
  explanation: "Xlor kuchli oksidlovchi bo'lib, ko'pchilik metallar bilan bevosita birikadi. Qizdirilgan mis xlorda yonib mis(II) xloridni hosil qiladi; uning suvdagi eritmasi ko'kimtir-yashil rangli bo'ladi.",
  questions: ["Mis xlorda yonganda qanday birikma hosil bo'ladi?", "Mis xlorid kislota bilan reaksiyaga kirishmaydi, xlor bilan esa kirishadi — nima uchun?", "Temir xlorda yonganda qanday oksidlanish darajasidagi xlorid hosil bo'ladi?"],
});

// ======================================================================== OLTINGUGURT(IV) OKSID
R({
  title: "Oltingugurt(IV) oksidni natriy sulfitdan olish",
  level: '9-sinf', topic: "Oltingugurt(IV) oksid: laboratoriyada olinishi", engine: 'rules',
  reactants: [
    { species: 'Na2SO3', state: 's', mass_g: 3, form: 'kristall' },
    { species: 'H2SO4', state: 'aq', conc_M: 9, volume_mL: 5 },
  ],
  cond: { note_uz: "Natriy sulfit kristallariga (1:1) suyultirilgan sulfat kislota tomiziladi." },
  eq: {
    molecular: 'Na2SO3 + H2SO4 = Na2SO4 + SO2↑ + H2O',
    ionic_full: '2Na⁺ + SO3²⁻ + 2H⁺ + SO4²⁻ = 2Na⁺ + SO4²⁻ + SO2↑ + H2O',
    ionic_net: 'SO3²⁻ + 2H⁺ = SO2↑ + H2O',
  },
  mech: 'ion-almashinish',
  steps: ["Kuchli sulfat kislota sulfit ionini protonlab sulfit kislotani hosil qiladi.", "Sulfit kislota beqaror: SO₂ va suvga parchalanadi.", "Eritmada suv kam bo'lgani uchun SO₂ erib qolmay, gaz holida ajraladi."],
  obs: { gas: gas('SO2'), heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Kristallar ustida o'tkir, yongan gugurt hidini eslatuvchi rangsiz gaz ajraladi." },
  collection: COLL.up("SO₂ havodan 2,2 marta og'ir va suvda yaxshi eriydi, shuning uchun og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib yig'iladi."),
  kinetics: 'tez',
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'gaz-silindri', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Vyurs kolbasiga 3 g natriy sulfit soling, tomchi voronkaga (1:1) sulfat kislota quying.",
    "Kislotani oz-ozdan tomizing.",
    "Ajralgan gazni og'zi yuqoriga qaratilgan quruq silindrga yo'naltiring.",
    "Silindr og'ziga ho'llangan ko'k lakmus qog'ozini tutib, to'lganini tekshiring.",
  ],
  safety: `${HOOD}. SO₂ zaharli, nafas yo'llarini ta'sirlaydi — hidlamang. Sulfat kislota bilan ko'zoynak va qo'lqopda ishlang.`,
  explanation: "Sulfitlar kuchli kislotalar ta'sirida SO₂ ajratadi, chunki hosil bo'lgan sulfit kislota beqaror. Bu SO₂ ni laboratoriyada olishning qulay usuli. SO₂ havodan og'ir va suvda yaxshi erigani uchun og'zi yuqoriga qaratilgan idishda yig'iladi.",
  questions: ["Nima uchun sulfit kislota erkin holda ajratib olinmaydi?", "SO₂ ni qanday usulda yig'ish mumkin va nima uchun?", "SO₂ ning hidi qanday?"],
});

R({
  title: "Oltingugurt(IV) oksidning kaliy permanganat eritmasini rangsizlantirishi",
  level: '9-sinf', topic: "Oltingugurt(IV) oksidning qaytaruvchilik xossasi", engine: 'record',
  reactants: [
    { species: 'SO2', state: 'g' },
    { species: 'KMnO4', state: 'aq', conc_M: 0.02, volume_mL: 3 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1, excess: true },
  ],
  cond: { medium: 'kislotali', note_uz: "SO₂ sulfat kislota bilan kislotalangan och binafsha KMnO₄ eritmasi orqali o'tkaziladi." },
  eq: {
    molecular: '5SO2 + 2KMnO4 + 2H2O = K2SO4 + 2MnSO4 + 2H2SO4',
    ionic_full: '5H2SO3 + 2K⁺ + 2MnO4⁻ = 2K⁺ + 2Mn²⁺ + 5SO4²⁻ + 4H⁺ + 3H2O',
    ionic_net: '5H2SO3 + 2MnO4⁻ = 2Mn²⁺ + 5SO4²⁻ + 4H⁺ + 3H2O',
    electron_balance: ['Mn⁺⁷ + 5e⁻ = Mn⁺²', 'S⁺⁴ − 2e⁻ = S⁺⁶'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["SO₂ suvda erib sulfit kislota hosil qiladi; oltingugurt +4 oksidlanish darajasida.", "Permanganat ioni (Mn⁺⁷) besh elektron olib rangsiz Mn²⁺ gacha qaytariladi.", "Oltingugurt ikki elektron berib sulfat ioniga (S⁺⁶) oksidlanadi."],
  obs: { solution_color_change: { from: '#8e1a8e', to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('bubbles', 'swirl'), text_uz: "Binafsha rangli eritma SO₂ o'tkazilganda tezda rangsizlanadi." },
  kinetics: 'tez',
  apparatus: ['probirka', 'gaz-naycha-egilgan'],
  procedure: [
    "Probirkaga 2–3 ml suyultirilgan kaliy permanganat eritmasini quying va 1 ml suyultirilgan sulfat kislota qo'shing.",
    "SO₂ olinayotgan asbobning gaz chiqarish naychasini eritmaga tushiring.",
    "Gaz o'tkazib, eritma rangining yo'qolishini kuzating.",
  ],
  safety: `${HOOD}. SO₂ ni hidlamang; KMnO₄ terini bo'yaydi.`,
  explanation: "Oltingugurt(IV) oksiddagi oltingugurt oraliq oksidlanish darajasida (+4) bo'lgani uchun kuchli oksidlovchilar ta'sirida qaytaruvchi bo'ladi. Permanganatning rangsizlanishi SO₂ ni aniqlashda ham qo'llaniladi (CO₂ bu rangni yo'qotmaydi).",
  questions: ["SO₂ va CO₂ ni KMnO₄ eritmasi yordamida qanday farqlash mumkin?", "SO₂ qanday sharoitda oksidlovchi bo'la oladi?", "Reaksiyada elektronlar qanday ko'chadi?"],
});

R({
  title: "Oltingugurt(IV) oksidning bromli suvni rangsizlantirishi",
  level: '9-sinf', topic: "Oltingugurt(IV) oksidning qaytaruvchilik xossasi", engine: 'record',
  reactants: [
    { species: 'SO2', state: 'g' },
    { species: 'bromli-suv', state: 'aq', volume_mL: 3 },
  ],
  cond: { medium: 'kislotali', note_uz: "SO₂ sariq-qo'ng'ir bromli suv orqali o'tkaziladi." },
  eq: {
    molecular: 'SO2 + Br2 + 2H2O = H2SO4 + 2HBr',
    ionic_full: 'H2SO3 + Br2 + H2O = 4H⁺ + SO4²⁻ + 2Br⁻',
    ionic_net: 'H2SO3 + Br2 + H2O = 4H⁺ + SO4²⁻ + 2Br⁻',
    electron_balance: ['Br2⁰ + 2e⁻ = 2Br⁻¹', 'S⁺⁴ − 2e⁻ = S⁺⁶'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Suvda SO₂ sulfit kislota holida bo'ladi.", "Brom molekulasi ikki elektron olib bromid ionlariga qaytariladi.", "Oltingugurt +4 dan +6 gacha oksidlanib sulfat kislota hosil bo'ladi; eritma rangsizlanadi."],
  obs: { solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Sariq-qo'ng'ir bromli suv SO₂ o'tkazilganda rangsizlanadi." },
  kinetics: 'tez',
  apparatus: ['probirka', 'gaz-naycha-egilgan'],
  procedure: [
    "Probirkaga 2–3 ml bromli suv quying.",
    "Eritma orqali SO₂ o'tkazing.",
    "Rangsizlanishni kuzating; eritmaga bariy xlorid qo'shib sulfat ioni hosil bo'lganini tekshiring.",
  ],
  safety: `${HOOD}. Brom va SO₂ bug'lari zaharli — hidlamang; ko'zoynak va qo'lqopda ishlang.`,
  explanation: "SO₂ qaytaruvchi sifatida bromni bromid ionlarigacha qaytaradi, o'zi sulfat kislotagacha oksidlanadi. Eritmada sulfat ioni paydo bo'lganini BaCl₂ bilan oq cho'kma hosil bo'lishidan bilish mumkin.",
  questions: ["Reaksiyadan so'ng eritmada qanday kislotalar bo'ladi?", "Eritmada sulfat ioni hosil bo'lganini qanday isbotlash mumkin?", "Etilen ham bromli suvni rangsizlantiradi — bu ikki reaksiyaning farqi nimada?"],
});

R({
  title: "Oltingugurt(IV) oksidning suvda erishi va sulfit kislota hosil bo'lishi",
  level: '9-sinf', topic: "Kislotali oksidlar: suv bilan reaksiyasi", engine: 'rules',
  reactants: [
    { species: 'SO2', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 5 },
    { species: 'lakmus', state: 'aq', volume_mL: 0.2 },
  ],
  cond: { note_uz: "SO₂ to'ldirilgan probirka lakmusli suvga to'ntariladi yoki gaz suv orqali o'tkaziladi." },
  eq: {
    molecular: 'SO2 + H2O ⇄ H2SO3',
  },
  mech: 'birikish',
  steps: ["SO₂ suvda yaxshi eriydi (1 hajm suvda ~40 hajm).", "Erigan SO₂ suv bilan qisman birikib sulfit kislota hosil qiladi.", "Sulfit kislota o'rtacha kuchli kislota: H⁺ ionlari lakmusni qizartiradi."],
  obs: { solution_color_change: { from: '#8a4fb3', to: '#d42a3a' }, heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "SO₂ li probirkada suv sathi tez ko'tariladi, lakmus qizil rangga kiradi." },
  kinetics: 'tez',
  apparatus: ['probirka', 'kristallizator', 'gaz-naycha-egilgan'],
  procedure: [
    "SO₂ to'ldirilgan probirkani og'zini pastga qaratib lakmusli suvga tushiring.",
    "Probirkadagi suv sathining ko'tarilishini kuzating.",
    "Probirkadagi eritma rangini kuzating.",
  ],
  safety: `${HOOD}. SO₂ ni hidlamang.`,
  explanation: "Oltingugurt(IV) oksid kislotali oksid: suvda yaxshi erib sulfit kislota hosil qiladi. Shu sababli suv probirkaga ko'tariladi va lakmus qizaradi. Atmosferaga chiqarilgan SO₂ kislotali yomg'irlarning sabablaridan biri.",
  questions: ["Nima uchun probirkada suv sathi ko'tariladi?", "Sulfit kislota qanday tuzlar hosil qiladi?", "Kislotali yomg'irlar qanday hosil bo'ladi?"],
});

R({
  title: "Oltingugurt(IV) oksid va vodorod sulfidning o'zaro ta'siri",
  level: '9-sinf', topic: "Oltingugurt birikmalarining oksidlovchilik va qaytaruvchilik xossalari", engine: 'record',
  reactants: [
    { species: 'SO2', state: 'g' },
    { species: 'H2S', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 5 },
  ],
  cond: { medium: 'kislotali', note_uz: "Ikkala gaz ozgina suv solingan idishda aralashtiriladi (yoki ichi ho'llangan ikki silindr og'izma-og'iz qo'yiladi)." },
  eq: {
    molecular: 'SO2 + 2H2S = 3S↓ + 2H2O',
    ionic_full: 'H2SO3 + 2H2S = 3S↓ + 3H2O',
    ionic_net: 'H2SO3 + 2H2S = 3S↓ + 3H2O',
    electron_balance: ['S⁺⁴ + 4e⁻ = S⁰', 'S⁻² − 2e⁻ = S⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["SO₂ dagi oltingugurt (+4) oksidlovchi, H₂S dagi oltingugurt (−2) qaytaruvchi vazifasini bajaradi.", "Ikki S⁻² atomi to'rt elektronni bitta S⁺⁴ atomiga beradi.", "Barcha oltingugurt atomlari erkin oltingugurtga (0) aylanib, sariq cho'kma hosil qiladi."],
  obs: { precipitate: ppt('S'), heat: 'ekzotermik', effects: fx('turbidity', 'deposit'), text_uz: "Idish devorlarida va suvda sariq oltingugurt cho'kmasi (loyqalik) paydo bo'ladi." },
  kinetics: 'tez',
  apparatus: ['gaz-silindri', 'probirka', 'gaz-naycha-egilgan'],
  procedure: [
    "Ichi ozgina suv bilan ho'llangan ikki silindrdan birini SO₂, ikkinchisini H₂S bilan to'ldiring.",
    "Silindrlarni og'izma-og'iz qo'yib, oradagi plastinkani olib tashlang va bir necha marta ag'daring.",
    "Silindr devorlarida sariq qatlam hosil bo'lishini kuzating.",
  ],
  safety: `${HOOD}. Ikkala gaz ham zaharli (H₂S ayniqsa xavfli) — hidlamang, ortiqcha gazlarni ishqor eritmasida yutdiring.`,
  explanation: "Bitta elementning turli oksidlanish darajalaridagi birikmalari o'zaro reaksiyaga kirishib, oraliq oksidlanish darajasidagi moddani hosil qilishi mumkin (sinproporsiyalanish). SO₂ da oltingugurt +4, H₂S da −2 bo'lib, ikkalasi ham erkin oltingugurtga aylanadi. Tabiatda vulqon gazlaridan oltingugurt hosil bo'lishi shu reaksiya bilan bog'liq.",
  questions: ["Bu reaksiyada SO₂ qanday xossani namoyon qiladi?", "Nima uchun reaksiyaga ozgina suv kerak?", "Vulqon atrofidagi oltingugurt konlari qanday hosil bo'lgan bo'lishi mumkin?"],
});

// ============================================================================== VODOROD SULFID
R({
  title: "Vodorod sulfidni temir(II) sulfid va xlorid kislotadan olish",
  level: '9-sinf', topic: "Vodorod sulfid: laboratoriyada olinishi", engine: 'rules',
  reactants: [
    { species: 'FeS', state: 's', mass_g: 10, form: "bo'lak" },
    { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 30 },
  ],
  cond: { note_uz: "Temir(II) sulfid bo'laklari Kipp apparatida yoki gaz chiqarish naychali probirkada suyultirilgan xlorid kislota bilan ta'sirlashtiriladi." },
  eq: {
    molecular: 'FeS + 2HCl = FeCl2 + H2S↑',
    ionic_full: 'FeS + 2H⁺ + 2Cl⁻ = Fe²⁺ + 2Cl⁻ + H2S↑',
    ionic_net: 'FeS + 2H⁺ = Fe²⁺ + H2S↑',
  },
  mech: 'ion-almashinish',
  steps: ["Kuchli kislota H⁺ ionlari sulfid ionini protonlab, kuchsiz va uchuvchan vodorod sulfid kislotasini hosil qiladi.", "H₂S suvda cheklangan eriydi va gaz holida ajraladi.", "Eritmada temir(II) xlorid qoladi."],
  obs: { gas: gas('H2S'), heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Qora bo'laklar sirtida pufakchalar ajraladi, palag'da tuxum hidi seziladi; gazga tutilgan qo'rg'oshin atsetatli qog'oz qorayadi." },
  collection: COLL.up("H₂S havodan biroz og'ir (nisbiy zichligi 1,18) va suvda eriydi, shuning uchun zarur bo'lsa og'zi yuqoriga qaratilgan idishda havoni siqib chiqarib yig'iladi; odatda u to'g'ridan-to'g'ri reaktiv eritmalar orqali o'tkaziladi."),
  kinetics: "o'rtacha",
  apparatus: ['kipp-apparati', 'gaz-naycha-egilgan', 'probirka', 'indikator-qogozi'],
  procedure: [
    "Kipp apparatining o'rta shariga temir(II) sulfid bo'laklarini, yuqori voronkaga suyultirilgan xlorid kislota quying.",
    "Jo'mrakni ochib, gaz ajralishini kuzating.",
    "Gaz chiqarish naychasi og'ziga qo'rg'oshin(II) atsetat eritmasi bilan ho'llangan filtr qog'ozini tuting va qorayishini kuzating.",
    "Ishdan so'ng jo'mrakni yoping, ortiqcha gazni ishqor eritmasi orqali yutdiring.",
  ],
  safety: `${HOOD}. Vodorod sulfid juda zaharli; yuqori konsentratsiyada hid sezish qobiliyatini so'ndiradi — hidiga ishonmang, hidlamang. Ortiqcha H₂S ni ishqor eritmasida yutdiring.`,
  explanation: "Kuchli kislotalar metall sulfidlarini parchalab vodorod sulfid ajratadi. H₂S kuchsiz kislota bo'lgani uchun xlorid kislota uni tuzidan siqib chiqaradi. Gazni qo'rg'oshin tuzi bilan ho'llangan qog'ozning qorayishidan oson aniqlash mumkin.",
  questions: ["Nima uchun H₂S ni hidi bo'yicha aniqlash xavfli?", "H₂S ni qanday reaktiv yordamida aniqlash mumkin?", "Mis(II) sulfiddan xlorid kislota bilan H₂S olish mumkinmi? Nima uchun?"],
});

R({
  title: "Vodorod sulfidni qo'rg'oshin(II) atsetat yordamida aniqlash",
  level: '9-sinf', topic: "Vodorod sulfidga sifat reaksiya", engine: 'rules',
  reactants: [
    { species: 'H2S', state: 'g' },
    { species: '(CH3COO)2Pb', state: 'aq', conc_M: 0.1, volume_mL: 2 },
  ],
  cond: { note_uz: "H₂S qo'rg'oshin(II) atsetat eritmasi orqali o'tkaziladi yoki shu eritmaga ho'llangan qog'oz gazga tutiladi." },
  eq: {
    molecular: 'H2S + (CH3COO)2Pb = PbS↓ + 2CH3COOH',
    ionic_full: 'H2S + Pb²⁺ + 2CH3COO⁻ = PbS↓ + 2CH3COOH',
    ionic_net: 'H2S + Pb²⁺ + 2CH3COO⁻ = PbS↓ + 2CH3COOH',
  },
  mech: 'ion-almashinish',
  steps: ["Qo'rg'oshin sulfid juda kam eriydigan modda.", "H₂S dan ajralgan sulfid ionlari Pb²⁺ bilan darhol qora PbS ni hosil qiladi.", "Ajralgan protonlarni atsetat ionlari bog'lab, sirka kislota hosil qiladi."],
  obs: { precipitate: ppt('PbS'), heat: 'sezilarsiz', effects: fx('bubbles', 'turbidity'), text_uz: "Rangsiz eritmada qora cho'kma hosil bo'ladi; ho'l qo'rg'oshin atsetatli qog'oz qorayadi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'gaz-naycha-egilgan', 'filtr-qogoz'],
  procedure: [
    "Probirkaga 1–2 ml qo'rg'oshin(II) atsetat eritmasi quying.",
    "Eritma orqali H₂S ni qisqa vaqt o'tkazing.",
    "Qora cho'kma hosil bo'lishini kuzating.",
  ],
  safety: `${HOOD}. H₂S va qo'rg'oshin birikmalari zaharli — qo'lqopda ishlang, chiqindilarni maxsus idishga to'kib tashlang.`,
  explanation: "Qo'rg'oshin(II) ionlari sulfid ionlari bilan suvda va kislotalarda erimaydigan qora qo'rg'oshin sulfidni hosil qiladi. Shuning uchun qo'rg'oshin atsetatli qog'oz vodorod sulfidni juda kam miqdorda ham sezadi.",
  questions: ["Qo'rg'oshin atsetatli qog'oz nima uchun qorayadi?", "Kumush buyumlarning havoda qorayishi qaysi gaz bilan bog'liq?", "Reaksiyada qanday kuchsiz kislota hosil bo'ladi?"],
});

R({
  title: "Vodorod sulfidning mis(II) sulfat eritmasi bilan reaksiyasi",
  level: '9-sinf', topic: "Vodorod sulfidning xossalari: sulfidlarning hosil bo'lishi", engine: 'rules',
  reactants: [
    { species: 'H2S', state: 'g' },
    { species: 'CuSO4', state: 'aq', conc_M: 0.1, volume_mL: 3 },
  ],
  cond: { note_uz: "H₂S ko'k mis(II) sulfat eritmasi orqali o'tkaziladi." },
  eq: {
    molecular: 'H2S + CuSO4 = CuS↓ + H2SO4',
    ionic_full: 'H2S + Cu²⁺ + SO4²⁻ = CuS↓ + 2H⁺ + SO4²⁻',
    ionic_net: 'H2S + Cu²⁺ = CuS↓ + 2H⁺',
  },
  mech: 'ion-almashinish',
  steps: ["Mis(II) sulfid juda kam eriydi — hatto kuchli kislotalarda ham erimaydi.", "Shuning uchun kuchsiz H₂S kislotasi kuchli sulfat kislotani hosil qilib reaksiyaga kirisha oladi.", "Qora CuS cho'kmasi tushadi, eritma kislotali bo'lib qoladi."],
  obs: { precipitate: ppt('CuS'), solution_color_change: { from: '#4aa3dc', to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('bubbles', 'turbidity'), text_uz: "Ko'k eritmada qora cho'kma hosil bo'ladi, ko'k rang asta-sekin yo'qoladi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'gaz-naycha-egilgan'],
  procedure: [
    "Probirkaga 2–3 ml mis(II) sulfat eritmasi quying.",
    "Eritma orqali H₂S o'tkazing.",
    "Cho'kma rangini kuzating; cho'kma ustidagi eritmaning muhitini indikator bilan tekshiring.",
  ],
  safety: `${HOOD}. H₂S zaharli — hidlamang.`,
  explanation: "Odatda kuchsiz kislota kuchli kislotani tuzidan siqib chiqara olmaydi. Ammo CuS shunchalik kam eriydiki, H₂S mis(II) sulfatdan sulfat kislota hosil qilib, qora cho'kma beradi. Bu \"kuchsiz kislota kuchli kislotani siqib chiqarmaydi\" qoidasidan istisno.",
  questions: ["Nima uchun bu reaksiya \"kuchsiz kislota kuchli kislotani siqib chiqarmaydi\" qoidasiga zid ko'rinadi?", "Reaksiyadan keyin eritma muhiti qanday bo'ladi?", "FeS kislotada eriydi, CuS esa erimaydi — bu nimani ko'rsatadi?"],
});

R({
  title: "Vodorod sulfidning havoda to'liq yonishi",
  level: '9-sinf', topic: "Vodorod sulfidning xossalari: yonishi", engine: 'record',
  reactants: [
    { species: 'H2S', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Gaz chiqarish naychasi uchida (kislorod yetarli bo'lganda) yondiriladi." },
  eq: {
    molecular: '2H2S + 3O2 = 2SO2 + 2H2O',
    electron_balance: ['S⁻² − 6e⁻ = S⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kislorod yetarli bo'lganda H₂S dagi oltingugurt −2 dan +4 gacha oksidlanadi.", "Vodorod suvga aylanadi.", "Kislorod yetishmasa, oltingugurt faqat erkin holgacha oksidlanib, sovuq sirtga sariq qatlam bo'lib o'tiradi."],
  obs: { gas: gas('SO2'), heat: 'kuchli-ekzotermik', flame: { color: '#7fa8e8', desc_uz: "ko'kimtir alanga" }, effects: fx('flame'), text_uz: "H₂S ko'kimtir alanga bilan yonadi va o'tkir SO₂ hidi paydo bo'ladi; alangaga tutilgan sovuq chinni kosachada sariq oltingugurt dog'i qolishi mumkin." },
  kinetics: 'tez',
  apparatus: ['kipp-apparati', 'gaz-naycha-toraytirilgan', 'gugurt', 'chinni-kosacha'],
  procedure: [
    "Vodorod sulfid olinayotgan asbob naychasining ingichka uchini yondiring.",
    "Alanga rangini kuzating.",
    "Alangaga sovuq chinni kosachani qisqa tuting va uning sirtida hosil bo'lgan dog'ni kuzating.",
  ],
  safety: `${HOOD}. H₂S va hosil bo'lgan SO₂ zaharli. H₂S ning havo bilan aralashmasi portlovchi bo'lgani uchun apparatdagi havo siqib chiqarilgach yondiriladi.`,
  explanation: "Vodorod sulfid yonuvchi gaz: kislorod yetarli bo'lganda SO₂ va suvgacha yonadi, kislorod yetishmaganda esa erkin oltingugurt ajraladi. Bu H₂S tarkibidagi oltingugurtning qaytaruvchi xossasini ko'rsatadi.",
  questions: ["Kislorod yetishmaganda H₂S ning yonish tenglamasi qanday bo'ladi?", "Bu reaksiyada oltingugurtning oksidlanish darajasi qanday o'zgaradi?", "Nima uchun H₂S ni yondirishdan oldin apparatdagi havo chiqarib yuboriladi?"],
});

// ================================================================================ AZOT OKSIDLARI
R({
  title: "Azot(II) oksidni mis va suyultirilgan nitrat kislotadan olish",
  level: '9-sinf', topic: "Azot(II) oksid: olinishi va yig'ilishi", engine: 'record',
  reactants: [
    { species: 'Cu', state: 's', mass_g: 2, form: 'qirindi' },
    { species: 'HNO3', state: 'aq', conc_M: 5, volume_mL: 10, conc_max_M: 8 },
  ],
  cond: { note_uz: "Mis qirindisiga taxminan 30% li nitrat kislota quyiladi; ajralgan gaz suv ostida yig'iladi." },
  eq: {
    molecular: '3Cu + 8HNO3 = 3Cu(NO3)2 + 2NO↑ + 4H2O',
    ionic_full: '3Cu + 8H⁺ + 8NO3⁻ = 3Cu²⁺ + 6NO3⁻ + 2NO↑ + 4H2O',
    ionic_net: '3Cu + 8H⁺ + 2NO3⁻ = 3Cu²⁺ + 2NO↑ + 4H2O',
    electron_balance: ['Cu⁰ − 2e⁻ = Cu⁺²', 'N⁺⁵ + 3e⁻ = N⁺²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Nitrat kislotada oksidlovchi — vodorod ionlari emas, nitrat ionidagi azot (N⁺⁵).", "Suyultirilgan kislotada azot uch elektron olib NO gacha (N⁺²) qaytariladi.", "Mis Cu²⁺ ga oksidlanadi va eritma ko'k rangga kiradi."],
  obs: { gas: gas('NO'), solution_color_change: { from: '#ffffff', to: '#4aa3dc' }, heat: 'ekzotermik', effects: fx('bubbles'), text_uz: "Mis eriydi, eritma ko'karadi; rangsiz gaz ajraladi, u kolba ichidagi havo bilan uchrashgan joyda qo'ng'ir tusga kiradi, suv ostida yig'ilgan gaz esa rangsiz." },
  collection: COLL.water("NO suvda kam eriydi va havodagi kislorod bilan darhol NO₂ ga oksidlanadi, shuning uchun faqat suvni siqib chiqarish usulida yig'iladi."),
  kinetics: "o'rtacha",
  apparatus: ['probirka-yon-naychali', 'rezina-tiqin-yaxlit-kichik', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'probirka', 'shtativ'],
  procedure: [
    "Yon naychali probirkaga 2 g mis qirindisi soling va 10 ml 30% li nitrat kislota quying, tiqin bilan yoping.",
    "Yon naychaga ulangan gaz chiqarish naychasining uchini pnevmatik vannadagi suv bilan to'ldirilgan probirka ostiga yo'naltiring.",
    "Probirkaning yuqori qismida havo bilan qo'ng'ir gaz hosil bo'lishini, yig'gich probirkada esa gaz rangsizligini kuzating.",
    "Gaz yig'ilgach, probirkani suv ostida yoping.",
  ],
  safety: `${HOOD}. Azot oksidlari zaharli. Nitrat kislota terini sarg'aytirib kuydiradi — ko'zoynak va qo'lqopda ishlang.`,
  explanation: "Nitrat kislota metallar bilan reaksiyada vodorod ajratmaydi: oksidlovchi nitrat ionidir. Suyultirilgan kislota mis bilan rangsiz NO ni hosil qiladi; u havoda darhol qo'ng'ir NO₂ ga aylanadi, shuning uchun suv ostida yig'iladi.",
  questions: ["Nima uchun nitrat kislota metallar bilan vodorod ajratmaydi?", "NO ni nima uchun havoni siqib chiqarish usulida yig'ib bo'lmaydi?", "Konsentrlangan nitrat kislota bilan reaksiyada qanday gaz ajraladi?"],
});

R({
  title: "Azot(II) oksidning havoda azot(IV) oksidga oksidlanishi",
  level: '9-sinf', topic: "Azot oksidlarining xossalari", engine: 'record',
  reactants: [
    { species: 'NO', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { temp_max_C: 150, note_uz: "Suv ostida yig'ilgan NO li probirka havoga ochiladi yoki unga kislorod kiritiladi." },
  eq: {
    molecular: '2NO + O2 = 2NO2',
    electron_balance: ['N⁺² − 2e⁻ = N⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'birikish',
  steps: ["NO molekulasida juftlashmagan elektron bor — u kislorod bilan oson birikadi.", "Azot +2 dan +4 gacha oksidlanadi.", "Hosil bo'lgan NO₂ qo'ng'ir rangli gaz."],
  obs: { gas: gas('NO2'), heat: 'ekzotermik', effects: fx('color-gas'), text_uz: "Rangsiz gaz havo bilan uchrashganda bir zumda qo'ng'ir rangga kiradi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'gaz-silindri'],
  procedure: [
    "NO to'ldirilgan probirkani suv ostidan tiqin bilan yopib oling.",
    "Probirkani oq qog'oz fonida tutib, tiqinni oching.",
    "Probirka og'zidan boshlab gazning qo'ng'ir rangga kirishini kuzating.",
  ],
  safety: `${HOOD}. NO va NO₂ zaharli — hidlamang.`,
  explanation: "Azot(II) oksid havoda oddiy sharoitda o'z-o'zidan kislorod bilan birikib qo'ng'ir azot(IV) oksidni hosil qiladi. Bu reaksiya NO ni aniqlash belgisi bo'lib, nitrat kislota ishlab chiqarish bosqichlaridan biridir.",
  questions: ["NO ni qanday belgisiga ko'ra aniqlash mumkin?", "Reaksiyada azotning oksidlanish darajasi qanday o'zgaradi?", "Bu reaksiya sanoatda qayerda qo'llaniladi?"],
});

R({
  title: "Azot(IV) oksidni mis va konsentrlangan nitrat kislotadan olish",
  level: '9-sinf', topic: "Azot(IV) oksid: olinishi va yig'ilishi", engine: 'record',
  reactants: [
    { species: 'Cu', state: 's', mass_g: 1, form: 'qirindi' },
    { species: 'HNO3', state: 'aq', conc_M: 14.4, volume_mL: 5, conc_min_M: 12 },
  ],
  cond: { note_uz: "Mis qirindisiga konsentrlangan nitrat kislota quyiladi; reaksiya qizdirmasdan shiddatli boradi." },
  eq: {
    molecular: 'Cu + 4HNO3 = Cu(NO3)2 + 2NO2↑ + 2H2O',
    ionic_full: 'Cu + 4H⁺ + 4NO3⁻ = Cu²⁺ + 2NO3⁻ + 2NO2↑ + 2H2O',
    ionic_net: 'Cu + 4H⁺ + 2NO3⁻ = Cu²⁺ + 2NO2↑ + 2H2O',
    electron_balance: ['Cu⁰ − 2e⁻ = Cu⁺²', 'N⁺⁵ + 1e⁻ = N⁺⁴'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Konsentrlangan nitrat kislotada nitrat ioni bir elektron olib NO₂ gacha qaytariladi.", "Mis ikki elektron berib Cu²⁺ ga oksidlanadi.", "Qo'ng'ir NO₂ gazi ajraladi, eritma ko'k-yashil rangga kiradi."],
  obs: { gas: gas('NO2'), solution_color_change: { from: '#ffffff', to: '#4aa3dc' }, heat: 'ekzotermik', effects: fx('bubbles', 'color-gas'), text_uz: "Mis shiddat bilan eriydi, qo'ng'ir \"tulki dumi\" gazi ajraladi, eritma yashil-ko'k rangga kiradi." },
  collection: COLL.up("NO₂ havodan og'ir (nisbiy zichligi 1,59) va suv bilan reaksiyaga kirishadi, shuning uchun og'zi yuqoriga qaratilgan quruq idishda havoni siqib chiqarib yig'iladi."),
  kinetics: 'tez',
  apparatus: ['probirka-yon-naychali', 'rezina-tiqin-yaxlit-kichik', 'gaz-naycha-egilgan', 'gaz-silindri', 'shtativ'],
  procedure: [
    "Yon naychali probirkaga 1 g mis qirindisi soling, shtativga mahkamlang.",
    "Konsentrlangan nitrat kislotadan 3–5 ml quyib, probirkani darhol tiqin bilan yoping.",
    "Yon naycha orqali chiqqan qo'ng'ir gazni og'zi yuqoriga qaratilgan quruq silindrga yo'naltiring.",
    "Silindr to'lgach shisha plastinka bilan yoping va gaz rangini oq fonda kuzating.",
  ],
  safety: `${HOOD} — NO₂ juda zaharli. Konsentrlangan nitrat kislota kuchli oksidlovchi va o'yuvchi; ko'zoynak, qo'lqop va xalatda ishlang.`,
  explanation: "Konsentrlangan nitrat kislota mis bilan reaksiyada asosan NO₂ ni hosil qiladi, suyultirilgan kislota esa NO ni. Mahsulot kislota konsentratsiyasiga bog'liqligi nitrat kislotaning o'ziga xos xossasidir.",
  questions: ["Nitrat kislota konsentratsiyasi mahsulotga qanday ta'sir qiladi?", "NO₂ ni nima uchun suv ostida yig'ib bo'lmaydi?", "Reaksiya davomida kislota suyulsa, ajralayotgan gaz tarkibi qanday o'zgaradi?"],
});

R({
  title: "Azot(IV) oksidning kislorod ishtirokida suvda yutilishi — nitrat kislota hosil bo'lishi",
  level: '9-sinf', topic: "Azot(IV) oksidning xossalari; nitrat kislota olinishi", engine: 'record',
  reactants: [
    { species: 'NO2', state: 'g' },
    { species: 'O2', state: 'g' },
    { species: 'H2O', state: 'l', volume_mL: 50 },
    { species: 'lakmus', state: 'aq', volume_mL: 0.5 },
  ],
  cond: { note_uz: "NO₂ to'ldirilgan silindr lakmusli suvga to'ntariladi va unga oz-ozdan kislorod kiritiladi." },
  eq: {
    molecular: '4NO2 + O2 + 2H2O = 4HNO3',
    ionic_full: '4NO2 + O2 + 2H2O = 4H⁺ + 4NO3⁻',
    ionic_net: '4NO2 + O2 + 2H2O = 4H⁺ + 4NO3⁻',
    electron_balance: ['N⁺⁴ − 1e⁻ = N⁺⁵', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["NO₂ suv bilan reaksiyaga kirishib nitrat kislota hosil qiladi.", "Kislorod ishtirokida barcha azot +5 gacha oksidlanadi va NO ajralmaydi.", "Eritmada kuchli nitrat kislota to'planadi — lakmus qizaradi."],
  obs: { solution_color_change: { from: '#8a4fb3', to: '#d42a3a' }, heat: 'ekzotermik', effects: fx('color-gas'), text_uz: "Silindrdagi qo'ng'ir rang yo'qoladi, suv silindrga ko'tariladi, lakmus qizil rangga kiradi." },
  kinetics: "o'rtacha",
  apparatus: ['gaz-silindri', 'kristallizator', 'gaz-naycha-egilgan'],
  procedure: [
    "Kristallizatorga suv quyib, bir necha tomchi lakmus qo'shing.",
    "NO₂ to'ldirilgan silindrni og'zini pastga qaratib suvga tushiring.",
    "Silindr ostiga naycha orqali kislorodni oz-ozdan kiriting.",
    "Qo'ng'ir rangning yo'qolishi, suv sathining ko'tarilishi va lakmus rangini kuzating.",
  ],
  safety: `${HOOD}. NO₂ juda zaharli — hidlamang.`,
  explanation: "Azot(IV) oksid kislorod ishtirokida suv bilan to'liq reaksiyaga kirishib nitrat kislota hosil qiladi. Sanoatda nitrat kislota aynan shu bosqich orqali olinadi; atmosferada esa bu reaksiya kislotali yomg'irlarga sabab bo'ladi.",
  questions: ["Nima uchun silindrda suv sathi ko'tariladi?", "Kislorodsiz NO₂ suv bilan qanday reaksiyaga kirishadi?", "Bu reaksiya sanoatda qayerda qo'llaniladi?"],
});

// ================================================================================ UGLEVODORODLAR
R({
  title: "Metanni natriy atsetat va natronli ohakdan olish",
  level: '10-sinf', topic: "Metan: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'CH3COONa', state: 's', mass_g: 3, form: 'kukun' },
    { species: 'NaOH', state: 's', mass_g: 3, form: 'kukun' },
  ],
  cond: { heating: true, temp_min_C: 300, note_uz: "Suvsiz natriy atsetat natronli ohak (NaOH va CaO aralashmasi) bilan aralashtirilib kuchli qizdiriladi." },
  eq: {
    molecular: 'CH3COONa + NaOH = CH4↑ + Na2CO3',
  },
  mech: 'organik',
  steps: ["Kuchli qizdirilganda atsetat ionidagi C–C bog'i uziladi (dekarboksillanish).", "Metil guruhi ishqordan vodorod atomini olib metanga aylanadi.", "Karboksil guruh karbonat ioni ko'rinishida qoladi."],
  obs: { gas: gas('CH4'), heat: 'endotermik', effects: fx('bubbles'), text_uz: "Kuchli qizdirilganda rangsiz, hidsiz gaz ajraladi; u suv ostida yig'iladi va havorang alanga bilan yonadi." },
  collection: COLL.water("Metan suvda deyarli erimaydi va havodan yengil (nisbiy zichligi 0,55), shuning uchun suv ostida yoki og'zi pastga qaratilgan idishda yig'iladi."),
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'rezina-tiqin-1-teshikli-kichik', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Suvsiz natriy atsetat va natronli ohakni 1:1 nisbatda hovonchada aralashtiring va quruq probirkaga soling.",
    "Probirkani gaz chiqarish naychali tiqin bilan yoping, og'zini biroz pastga qaratib mahkamlang.",
    "Aralashmani avval butun probirka bo'ylab, so'ng kuchli qizdiring.",
    "Gazni suv ostida probirkalarga yig'ing; avval naychani suvdan chiqaring, keyin qizdirishni to'xtating.",
  ],
  safety: "Metan havo bilan portlovchi aralashma hosil qiladi — yig'ilgan gazni yondirishdan oldin tozaligini tekshiring. Ishqor terini kuydiradi, ko'zoynak va qo'lqop taqing.",
  explanation: "Karbon kislotalar tuzlari ishqorlar bilan qattiq qizdirilganda dekarboksillanib, bitta uglerod atomi kam bo'lgan alkan hosil qiladi. Natriy atsetatdan shu usulda metan olinadi. Natronli ohakdagi CaO ishqorni quruq saqlaydi va shishani yemirilishdan himoya qiladi.",
  questions: ["Natriy propionatdan shu usulda qanday alkan olinadi?", "Metan nima uchun suv ostida yig'iladi?", "Natronli ohak tarkibida nima uchun CaO bo'ladi?"],
});

R({
  title: "Metanning yonishi va yonish mahsulotlarini aniqlash",
  level: '10-sinf', topic: "Alkanlarning xossalari: yonishi", engine: 'record',
  reactants: [
    { species: 'CH4', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Tozaligi tekshirilgan metan naycha uchida yondiriladi; alanga ustiga quruq stakan, so'ng ohakli suv bilan chayilgan stakan tutiladi." },
  eq: {
    molecular: 'CH4 + 2O2 = CO2 + 2H2O',
    electron_balance: ['C⁻⁴ − 8e⁻ = C⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Yuqori haroratda C–H bog'lari uzilib, radikal zanjir jarayoni boshlanadi.", "Uglerod −4 dan +4 gacha oksidlanib CO₂ ga, vodorod suvga aylanadi.", "Ko'p issiqlik ajraladi — metan qimmatli yoqilg'i."],
  obs: { gas: gas('CO2'), heat: 'kuchli-ekzotermik', flame: { color: '#7fb0ff', desc_uz: 'och havorang, deyarli tutunsiz alanga' }, effects: fx('flame', 'condensate'), text_uz: "Metan och havorang alanga bilan tutunsiz yonadi; sovuq stakan devori terlaydi, ohakli suv bilan chayilgan stakan devori loyqalanadi." },
  kinetics: 'tez',
  apparatus: ['gaz-naycha-toraytirilgan', 'kimyoviy-stakan', 'gugurt'],
  procedure: [
    "Metan tozaligini qarsillash sinovi bilan tekshiring.",
    "Gaz chiqarish naychasining ingichka uchida metanni yondiring va alanga rangini kuzating.",
    "Alanga ustiga quruq sovuq stakanni to'ntarib tuting — devorlarda suv tomchilari paydo bo'ladi.",
    "Ichi ohakli suv bilan chayilgan stakanni tuting — devorlar oq dog' bilan qoplanadi.",
  ],
  safety: "Gazni yondirishdan oldin uning tozaligini albatta tekshiring. Metan–havo aralashmasi portlovchi.",
  explanation: "Metan to'liq yonganda uglerod(IV) oksid va suv hosil bo'ladi. Suv bug'i sovuq stakanda kondensatlanadi, CO₂ esa ohakli suvni loyqalaydi. Uglerod miqdori kam bo'lgani uchun alanga tutunsiz va kam yorug'.",
  questions: ["Yonish mahsulotlarida suv va CO₂ borligini qanday isbotlash mumkin?", "Nima uchun metan alangasi tutunsiz?", "Kislorod yetishmaganda metan yonishida qanday zaharli gaz hosil bo'lishi mumkin?"],
});

R({
  title: "Metanning kaliy permanganat eritmasini rangsizlantirmasligi",
  level: '10-sinf', topic: "Alkanlarning kimyoviy barqarorligi", engine: 'record',
  no_reaction: true, match: ['CH4', 'MnO4⁻'],
  reactants: [
    { species: 'CH4', state: 'g' },
    { species: 'KMnO4', state: 'aq', conc_M: 0.02, volume_mL: 3 },
  ],
  cond: { note_uz: "Metan suyultirilgan KMnO₄ eritmasi orqali o'tkaziladi." },
  eq: {},
  mech: 'organik',
  steps: ["Metan molekulasida faqat mustahkam C–H σ-bog'lari bor.", "Oddiy sharoitda permanganat ioni bu bog'larni oksidlay olmaydi.", "Shuning uchun eritma rangi o'zgarmaydi."],
  obs: { heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Gaz eritma orqali o'tib ketadi, binafsha rang o'zgarmaydi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'gaz-naycha-egilgan'],
  procedure: [
    "Probirkaga 2–3 ml suyultirilgan kaliy permanganat eritmasi quying.",
    "Eritma orqali bir necha daqiqa metan o'tkazing.",
    "Eritma rangini etilen o'tkazilgan probirka bilan solishtiring.",
  ],
  safety: "Metan yonuvchi — yaqinda olov bo'lmasin. KMnO₄ terini bo'yaydi.",
  explanation: "Alkanlar to'yingan uglevodorodlar bo'lib, oddiy sharoitda kuchli oksidlovchilar bilan ham reaksiyaga kirishmaydi. Shuning uchun metan permanganat va bromli suvni rangsizlantirmaydi — bu xossa uni to'yinmagan uglevodorodlardan farqlashga imkon beradi.",
  questions: ["Metan va etilenni qanday reaktiv yordamida farqlash mumkin?", "Nima uchun alkanlar \"parafinlar\" deb ataladi?", "Metan qanday sharoitda xlor bilan reaksiyaga kirishadi?"],
});

R({
  title: "Etilenni etil spirtini konsentrlangan sulfat kislota bilan qizdirib olish",
  level: '10-sinf', topic: "Etilen: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'C2H5OH', state: 'l', volume_mL: 2 },
    { species: 'H2SO4', state: 'aq', conc_M: 18, volume_mL: 6, conc_min_M: 12 },
  ],
  cond: { heating: true, temp_min_C: 170, catalyst: 'H2SO4', note_uz: "Spirt va konsentrlangan sulfat kislota (1:3) aralashmasi qaynash toshchalari bilan 170 °C dan yuqori qizdiriladi." },
  eq: {
    molecular: 'C2H5OH → CH2=CH2↑ + H2O',
  },
  mech: 'organik',
  steps: ["Sulfat kislota spirtning gidroksil guruhini protonlaydi.", "Protonlangan spirtdan suv molekulasi ajraladi, qo'shni uglerod atomidan proton chiqib qo'shbog' hosil bo'ladi (molekula ichidan degidratlanish).", "140 °C atrofida esa asosan dietil efir hosil bo'ladi, shuning uchun harorat 170 °C dan yuqori ushlanadi."],
  obs: { gas: gas('CH2=CH2'), solution_color_change: { from: '#ffffff', to: '#5a3a1a' }, heat: 'endotermik', effects: fx('bubbles', 'boil'), text_uz: "Aralashma qorayadi, rangsiz gaz ajraladi; u bromli suv va KMnO₄ eritmasini rangsizlantiradi." },
  collection: COLL.water("Etilen suvda kam eriydi, shuning uchun suv ostida yig'iladi; havoga zichligi 1 ga yaqin bo'lgani uchun havoni siqib chiqarish usuli toza gaz bermaydi."),
  kinetics: "o'rtacha",
  apparatus: ['vyurs-kolbasi', 'termometr', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'probirka', 'spirt-lampasi', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Kolbaga 2 ml etil spirti soling va ehtiyotkorlik bilan aralashtirib 6 ml konsentrlangan sulfat kislota qo'shing; qaynash toshchalari soling.",
    "Kolbani termometrli tiqin bilan yoping va gaz chiqarish naychasini pnevmatik vannaga yo'naltiring.",
    "Aralashmani 170 °C gacha qizdiring va gazni suv ostida yig'ing.",
    "Gazni bromli suv va kaliy permanganat eritmasi orqali o'tkazib, rangsizlanishni kuzating.",
  ],
  safety: "Spirtga sulfat kislotani asta-sekin, chayqatib qo'shing (aksincha emas). Qizigan aralashma sachrashi mumkin — ko'zoynak taqing. Naychani suvdan chiqarmasdan qizdirishni to'xtatmang.",
  explanation: "Konsentrlangan sulfat kislota suvni tortib oluvchi modda sifatida 170 °C dan yuqorida etil spirtidan suv molekulasini ajratib, etilen hosil qiladi. Etilen to'yinmagan uglevodorod bo'lgani uchun bromli suv va permanganatni rangsizlantiradi.",
  questions: ["Nima uchun reaksiya 170 °C dan yuqori haroratda olib boriladi?", "140 °C da qanday mahsulot ko'proq hosil bo'ladi?", "Etilenni qanday reaksiyalar yordamida aniqlash mumkin?"],
});

R({
  title: "Etilenning yonishi",
  level: '10-sinf', topic: "Alkenlarning xossalari: yonishi", engine: 'record',
  reactants: [
    { species: 'CH2=CH2', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Tozaligi tekshirilgan etilen naycha uchida yondiriladi." },
  eq: {
    molecular: 'CH2=CH2 + 3O2 → 2CO2 + 2H2O',
    electron_balance: ['2C⁻² − 12e⁻ = 2C⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Etilen molekulasida uglerodning massa ulushi metandagiga qaraganda katta.", "Alangada yonib ulgurmagan uglerod zarrachalari cho'g'lanib, alangani yorug' qiladi.", "To'liq yonishda CO₂ va suv hosil bo'ladi."],
  obs: { gas: gas('CO2'), heat: 'kuchli-ekzotermik', flame: { color: '#ffd24a', desc_uz: 'yorug\' sariq alanga' }, effects: fx('flame', 'light'), text_uz: "Etilen metandan farqli ravishda yorug' sariq alanga bilan yonadi." },
  kinetics: 'tez',
  apparatus: ['gaz-naycha-toraytirilgan', 'gugurt', 'kimyoviy-stakan'],
  procedure: [
    "Etilen tozaligini qarsillash sinovi bilan tekshiring.",
    "Gaz chiqarish naychasi uchida etilenni yondiring.",
    "Alanga rangini metan alangasi bilan solishtiring.",
  ],
  safety: "Etilen–havo aralashmasi portlovchi; yondirishdan oldin tozaligini tekshiring.",
  explanation: "Etilen to'liq yonganda CO₂ va suv hosil bo'ladi. Molekulasida uglerod ulushi metandagidan katta bo'lgani uchun alangasi yorug'roq bo'ladi.",
  questions: ["Nima uchun etilen alangasi metan alangasidan yorug'roq?", "Etilen yonishining tenglamasidagi koeffitsiyentlarni tushuntiring.", "Atsetilen alangasi qanday bo'ladi deb o'ylaysiz?"],
});

R({
  title: "Atsetilenni kalsiy karbid va suvdan olish",
  level: '10-sinf', topic: "Atsetilen: laboratoriyada olinishi", engine: 'record',
  reactants: [
    { species: 'CaC2', state: 's', mass_g: 2, form: "bo'lak" },
    { species: 'H2O', state: 'l', volume_mL: 10 },
  ],
  cond: { note_uz: "Kalsiy karbid bo'laklariga tomchi voronkadan suv tomiziladi; reaksiya qizdirmasdan boradi." },
  eq: {
    molecular: 'CaC2 + 2H2O = Ca(OH)2 + CH≡CH↑',
  },
  mech: 'gidroliz',
  steps: ["Kalsiy karbid tarkibida C₂²⁻ (atsetilenid) anioni bor.", "Bu anion juda kuchli asos: suvdan ikki proton tortib olib atsetilenga aylanadi.", "Qolgan OH⁻ ionlari Ca²⁺ bilan kalsiy gidroksid hosil qiladi."],
  obs: { gas: gas('CH≡CH'), heat: 'ekzotermik', effects: fx('bubbles', 'foam', 'turbidity'), text_uz: "Karbid bo'laklari ko'piklanib, shiddat bilan gaz ajratadi; idishda oq loyqa (kalsiy gidroksid) hosil bo'ladi." },
  collection: COLL.water("Atsetilen suvda kam eriydi, shuning uchun suv ostida yig'iladi; havodan biroz yengil (nisbiy zichligi 0,9)."),
  kinetics: 'tez',
  apparatus: ['vyurs-kolbasi', 'tomchi-voronka', 'gaz-naycha-egilgan', 'pnevmatik-vanna', 'probirka', 'shtativ', 'qisqich-lapka'],
  procedure: [
    "Vyurs kolbasiga bir necha bo'lak kalsiy karbid soling.",
    "Tomchi voronkaga suv (yoki osh tuzining to'yingan eritmasi) quying va kolbani shtativga mahkamlang.",
    "Suvni oz-ozdan tomizib, gaz ajralish tezligini boshqaring.",
    "Ajralgan gazni suv ostida probirkalarga yig'ing.",
  ],
  safety: "Atsetilen havo bilan juda keng chegarada portlovchi aralashma hosil qiladi — olovdan uzoqda ishlang. Kalsiy karbidni quruq, germetik idishda saqlang.",
  explanation: "Kalsiy karbid suv bilan reaksiyaga kirishib atsetilen va kalsiy gidroksid hosil qiladi. Suv tomchilab qo'shilganda reaksiya tezligini boshqarish oson. Bu atsetilenni laboratoriyada va sanoatda olishning asosiy usullaridan biri.",
  questions: ["Nima uchun suv karbidga tomchilab qo'shiladi?", "Reaksiyadan keyin idishdagi eritma qanday muhitga ega bo'ladi?", "Atsetilenni qanday usulda yig'ish mumkin va nima uchun?"],
});

R({
  title: "Atsetilenning tutunli alanga bilan yonishi",
  level: '10-sinf', topic: "Alkinlarning xossalari: yonishi", engine: 'record',
  reactants: [
    { species: 'CH≡CH', state: 'g' },
    { species: 'O2', state: 'g' },
  ],
  cond: { ignition: true, note_uz: "Tozaligi tekshirilgan atsetilen naycha uchida havoda yondiriladi." },
  eq: {
    molecular: '2CH≡CH + 5O2 → 4CO2 + 2H2O',
    electron_balance: ['2C⁻¹ − 10e⁻ = 2C⁺⁴', 'O2⁰ + 4e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Atsetilenda uglerodning massa ulushi juda katta (92%).", "Havoda kislorod yetishmagani uchun uglerodning bir qismi qurum holida ajraladi.", "Kislorod yetarli bo'lganda atsetilen to'liq yonib, juda yuqori harorat beradi."],
  obs: { gas: gas('CO2'), heat: 'kuchli-ekzotermik', flame: { color: '#ffb83a', desc_uz: 'yorqin, kuchli tutunli alanga' }, effects: fx('flame', 'smoke', 'light'), text_uz: "Atsetilen havoda juda yorqin, qurumli tutun chiqaruvchi alanga bilan yonadi." },
  kinetics: 'tez',
  apparatus: ['gaz-naycha-toraytirilgan', 'gugurt', 'chinni-kosacha'],
  procedure: [
    "Atsetilen tozaligini qarsillash sinovi bilan tekshiring.",
    "Naycha uchida atsetilenni yondiring va alangani etilen alangasi bilan solishtiring.",
    "Alanga ustiga chinni kosachani tutib, qurum o'tirishini kuzating.",
  ],
  safety: "Atsetilenni faqat tozaligi tekshirilgandan so'ng yondiring; qurumdan kiyim va qo'llarni ehtiyot qiling.",
  explanation: "Atsetilen molekulasida uglerod ulushi juda katta bo'lgani uchun havoda to'liq yonib ulgurmaydi va tutun chiqaradi. Kislorodda yonganda esa juda yuqori harorat hosil bo'ladi — bu metallarni payvandlash va kesishda qo'llaniladi.",
  questions: ["Metan, etilen va atsetilen alangalarini solishtiring.", "Nima uchun atsetilen havoda tutunli alanga bilan yonadi?", "Atsetilen-kislorod alangasi qayerda qo'llaniladi?"],
});

const json = JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n';
writeFileSync(join(DATA, 'reactions', `${CAT}.json`), json);
console.log(`${CAT}: ${out.length} ta yozuv yozildi`);
