// "Polimerlar" toifasi tajribalari generatori.
// Ishga tushirish: node tools/seed/reactions/polimerlar.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CAT = 'polimerlar';
const PFX = 'polimer';
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

const T_POL = 'Polimerlanish reaksiyalari';
const T_PK = 'Polikondensatlanish reaksiyalari';
const T_ID = 'Polimerlarni aniqlash va xossalari';
const RADICAL_STEPS = (mono, poly) => [
  "Initsiatsiya: initsiator (peroksid yoki kislorod izlari) qizdirilganda erkin radikallarga parchalanadi; radikal monomerning C=C bog'iga birikadi.",
  `O'sish: hosil bo'lgan yangi radikal ketma-ket ${mono} molekulalarini biriktirib, zanjir uzayadi.`,
  `Uzilish: ikki radikal uchrashganda zanjir o'sishi to'xtaydi — ${poly} makromolekulasi hosil bo'ladi.`,
];

R({
  title: "Etilenning polimerlanishi (polietilen olish modeli)",
  level: '10-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'CH2=CH2', state: 'g' }],
  cond: { heating: true, temp_min_C: 200, temp_max_C: 300, catalyst: '(C6H5COO)2', note_uz: "Sanoat sharoiti: yuqori bosim (150–300 MPa), initsiator — organik peroksid (modelda benzoil peroksid) yoki kislorod izlari. Maktab laboratoriyasida bajarilmaydi — virtual model." },
  eq: { molecular: 'nCH2=CH2 → (–CH2–CH2–)n' },
  mech: 'organik',
  steps: RADICAL_STEPS('etilen', 'polietilen'),
  organic: { template: 'polimer-radikal', params: { monomer: 'CH2=CH2', initiator: 'R–O• (peroksid, O2 izlari)', radical: 'R–CH2–CH2•', polymer: '(–CH2–CH2–)n' } },
  obs: { heat: 'ekzotermik', effects: [], text_uz: "Gazsimon etilen qattiq, oq, mumsimon modda — polietilenga aylanadi." },
  kinetics: 'sekin', app: ['gaz-silindri', 'termometr'],
  proc: ["Virtual reaktorni etilen bilan to'ldiring.", "Yuqori bosim va 200 °C dan yuqori harorat sharoitini o'rnating, initsiator qo'shing.", "Gazning qattiq polimerga aylanishini kuzating."],
  safety: "Etilen yonuvchan gaz, havo bilan portlovchi aralashma hosil qiladi. Yuqori bosimli polimerlanish faqat sanoat qurilmalarida o'tkaziladi.",
  expl: "Polimerlanish — kichik molekulalarning (monomerlarning) qo'shbog'larning uzilishi hisobiga birikib, yirik molekula (polimer) hosil qilishi; qo'shimcha mahsulot ajralmaydi. Yuqori bosimda radikal mexanizm bo'yicha olingan polietilen tarmoqlangan va yumshoq bo'ladi; Sigler–Natta katalizatorlarida past bosimda olingan polietilen esa zichroq va qattiqroq.",
  q: ["Polietilenning monomeri, struktura zvenosi va polimerlanish darajasi nima?", "Polimerlanish reaksiyasi polikondensatlanishdan nimasi bilan farq qiladi?"],
});

R({
  title: "Stirolning polimerlanishi (polistirol olish)",
  level: '11-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'C6H5CH=CH2', state: 'l', volume_mL: 5 }],
  cond: { heating: true, temp_min_C: 100, temp_max_C: 150, catalyst: '(C6H5COO)2', note_uz: "Stirolga ozgina initsiator (benzoil peroksid) qo'shilib, qaytar sovutgichli kolbada uzoq vaqt qizdiriladi; suyuqlik asta-sekin quyuqlashadi." },
  eq: { molecular: 'nC6H5CH=CH2 → (–CH2–CH(C6H5)–)n' },
  mech: 'organik',
  steps: RADICAL_STEPS('stirol', 'polistirol'),
  organic: { template: 'polimer-radikal', params: { monomer: 'C6H5–CH=CH2', initiator: 'R• (benzoil peroksid yoki issiqlik)', radical: 'R–CH2–CH•(C6H5)', polymer: '(–CH2–CH(C6H5)–)n' } },
  obs: { heat: 'ekzotermik', effects: [], text_uz: "Suyuq stirol uzoq qizdirilganda tobora quyuqlashadi va sovutilganda shaffof qattiq massa — polistirolga aylanadi." },
  kinetics: 'juda-sekin', app: ['dumaloq-tubli-kolba', 'sharikli-sovutgich', 'kolba-isitgich', 'termometr'],
  proc: ["Kolbaga 5 ml stirol va ozgina initsiator soling.", "Kolbaga qaytar sovutgich o'rnatib, aralashmani 100–120 °C da bir necha soat qizdiring.", "Suyuqlikning quyuqlashishini kuzating; sovutib, hosil bo'lgan qattiq massani ko'zdan kechiring."],
  safety: "Stirol yonuvchan va zararli, bug'i qitiqlaydi — mo'rili shkafda ishlang. Peroksid initsiatorlar zarbadan va qizishdan parchalanishi mumkin — faqat o'qituvchi beradigan oz miqdorda ishlating.",
  expl: "Stirol radikal mexanizm bo'yicha polimerlanib, polistirol hosil qiladi. Polistirol termoplastik polimer: qizdirilganda yumshaydi va shakl beriladi. Undan bir martalik idishlar va ko'pikli izolatsiya materiali (penoplast) tayyorlanadi.",
  q: ["Polistirolning struktura zvenosini yozing.", "Penopolistirol qanday olinadi va qayerda ishlatiladi?"],
  conf: "o'rta",
});

R({
  title: "Metilmetakrilatning polimerlanishi (organik shisha olish)",
  level: '11-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'CH2=C(CH3)COOCH3', state: 'l', volume_mL: 5 }],
  cond: { heating: true, temp_min_C: 60, temp_max_C: 150, catalyst: '(C6H5COO)2', note_uz: "Metilmetakrilatga initsiator (benzoil peroksid) qo'shilib, probirka 60–80 °C li suv hammomida bir necha soat qizdiriladi." },
  eq: { molecular: 'nCH2=C(CH3)COOCH3 → (–CH2–C(CH3)(COOCH3)–)n' },
  mech: 'organik',
  steps: RADICAL_STEPS('metilmetakrilat', 'polimetilmetakrilat'),
  organic: { template: 'polimer-radikal', params: { monomer: 'CH2=C(CH3)–COOCH3', initiator: 'R• (benzoil peroksid)', radical: 'R–CH2–C•(CH3)(COOCH3)', polymer: '(–CH2–C(CH3)(COOCH3)–)n' } },
  obs: { heat: 'ekzotermik', effects: [], text_uz: "Suyuq monomer asta-sekin quyuqlashib, shaffof qattiq massa — organik shishaga aylanadi." },
  kinetics: 'juda-sekin', app: ['probirka', 'suv-hammomi', 'termometr', 'probirka-qisqichi'],
  proc: ["Probirkaga 5 ml metilmetakrilat va ozgina initsiator soling.", "Probirkani 60–80 °C li suv hammomiga qo'ying va bir necha soat qizdiring.", "Suyuqlikning quyuqlashishini va shaffof qattiq massaga aylanishini kuzating."],
  safety: "Metilmetakrilat yonuvchan, o'tkir hidli va qitiqlovchi — mo'rili shkafda ishlang; peroksid initsiatorni oz miqdorda, ehtiyotlik bilan ishlating.",
  expl: "Metilmetakrilat radikal polimerlanib, shaffof va mustahkam polimer — polimetilmetakrilat (organik shisha, pleksiglas) hosil qiladi. U yorug'likni yaxshi o'tkazadi va oddiy shishaga qaraganda yengil hamda sinmaydi.",
  q: ["Organik shishaning oddiy shishadan afzalliklari va kamchiliklari qanday?", "Metilmetakrilat qaysi kislota va spirtning murakkab efiri?"],
  conf: "o'rta",
});

R({
  title: "Organik shishaning qizdirilganda depolimerlanishi",
  level: '11-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: '(–CH2–C(CH3)(COOCH3)–)n', state: 's', mass_g: 1 }],
  cond: { heating: true, temp_min_C: 300, note_uz: "Organik shisha bo'laklari gaz chiqarish naychali probirkada qizdiriladi, ajralgan bug'lar sovuq probirkada kondensatlanadi." },
  eq: { molecular: '(–CH2–C(CH3)(COOCH3)–)n → nCH2=C(CH3)COOCH3↑' },
  mech: 'organik',
  steps: ["Kuchli qizdirilganda makromolekula zanjirining uchlarida yoki kuchsiz joylarida radikallar hosil bo'ladi.", "Radikal zanjirdan monomer molekulalari ketma-ket uzilib chiqadi (polimerlanishga teskari jarayon).", "Ajralgan metilmetakrilat bug'lari sovuq idishda suyuqlikka aylanadi."],
  organic: { template: 'polimer-radikal', params: { monomer: 'CH2=C(CH3)–COOCH3', initiator: 'issiqlik (300 °C dan yuqori)', radical: '~CH2–C•(CH3)(COOCH3)', polymer: '(–CH2–C(CH3)(COOCH3)–)n' } },
  obs: { heat: 'endotermik', effects: [{ type: 'condensate' }, { type: 'boil' }], text_uz: "Organik shisha yumshab, ko'piklanib qaynaydi; sovuq probirkada o'ziga xos o'tkir (mevasimon) hidli rangsiz suyuqlik — monomer yig'iladi." },
  kinetics: "o'rtacha", app: ['probirka-yon-naychali', 'probirka', 'probirka-qisqichi', 'spirt-lampasi', 'kimyoviy-stakan'],
  proc: ["Yon naychali probirkaga organik shisha bo'laklarini soling.", "Yon naychaga sovuq suvli stakanga botirilgan qabul qiluvchi probirkani ulang.", "Probirkani spirt lampasida asta-sekin, so'ng kuchliroq qizdiring.", "Qabul qiluvchi probirkada yig'ilgan suyuqlikni va uning hidini kuzating."],
  safety: "Monomer bug'lari yonuvchan va qitiqlovchi — mo'rili shkafda ishlang, ochiq alangani qabul qiluvchi probirkadan uzoq tuting.",
  expl: "Polimetilmetakrilat qizdirilganda asosan monomerga parchalanadi (depolimerlanish). Bu jarayon organik shisha chiqindilarini qayta ishlab, monomerni qayta olishga imkon beradi.",
  q: ["Depolimerlanish polimerlanishdan qanday farq qiladi?", "Plastmassa chiqindilarini qayta ishlashning qanday usullarini bilasiz?"],
});

R({
  title: "Polistirolning qizdirilganda depolimerlanishi",
  level: '11-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: '(–CH2–CH(C6H5)–)n', state: 's', mass_g: 1 }],
  cond: { heating: true, temp_min_C: 300, note_uz: "Polistirol bo'laklari gaz chiqarish naychali probirkada qizdiriladi, ajralgan bug'lar sovuq probirkada kondensatlanadi." },
  eq: { molecular: '(–CH2–CH(C6H5)–)n → nC6H5CH=CH2↑' },
  mech: 'organik',
  steps: ["Kuchli qizdirilganda polistirol zanjiri radikallarga uziladi.", "Radikallardan stirol molekulalari ketma-ket ajralib chiqadi (depolimerlanish).", "Stirol bug'lari sovuq idishda kondensatlanadi; qisman dimer va trimerlar ham hosil bo'ladi."],
  organic: { template: 'polimer-radikal', params: { monomer: 'C6H5–CH=CH2', initiator: 'issiqlik (300 °C dan yuqori)', radical: '~CH2–CH•(C6H5)', polymer: '(–CH2–CH(C6H5)–)n' } },
  obs: { heat: 'endotermik', effects: [{ type: 'condensate' }, { type: 'boil' }], text_uz: "Polistirol suyuqlanib qaynaydi; qabul qiluvchi probirkada o'ziga xos shirinsimon hidli rangsiz-sarg'ish suyuqlik yig'iladi; u bromli suvni rangsizlantiradi." },
  kinetics: "o'rtacha", app: ['probirka-yon-naychali', 'probirka', 'probirka-qisqichi', 'spirt-lampasi', 'kimyoviy-stakan'],
  proc: ["Yon naychali probirkaga polistirol (ko'pikli plastik emas, qattiq polistirol) bo'laklarini soling.", "Yon naychaga sovuq suvga botirilgan qabul qiluvchi probirkani ulang.", "Probirkani asta-sekin, so'ng kuchli qizdiring.", "Yig'ilgan suyuqlikni bromli suv bilan sinab ko'ring."],
  safety: "Stirol bug'lari yonuvchan va zararli — mo'rili shkafda ishlang, qabul qiluvchi probirkani alangadan uzoq tuting.",
  expl: "Polistirol qizdirilganda depolimerlanib, asosan monomer — stirolni hosil qiladi. Olingan suyuqlikning bromli suvni rangsizlantirishi unda qo'shbog'li modda borligini, ya'ni polimer monomerga parchalanganini ko'rsatadi.",
  q: ["Olingan suyuqlikning bromli suvni rangsizlantirishi nimani isbotlaydi?", "Nima uchun polistirolning o'zi bromli suvni rangsizlantirmaydi?"],
  conf: "o'rta",
});

R({
  title: "Fenol-formaldegid smolasini olish (polikondensatlanish)",
  level: '11-sinf', topic: T_PK, engine: 'record',
  reactants: [{ species: 'C6H5OH', state: 's', mass_g: 2 }, { species: 'HCHO', state: 'aq', conc_M: 13, volume_mL: 2 }],
  cond: { heating: true, temp_min_C: 80, catalyst: 'HCl', note_uz: "Katalizator — 1 ml konsentrlangan xlorid kislota; aralashma qaynoq suv hammomida qizdiriladi (fenol ortiqcha — novolak smola)." },
  eq: { molecular: 'nC6H5OH + nHCHO → [–C6H3(OH)–CH2–]n + nH2O' },
  mech: 'organik',
  steps: ["Kislotali muhitda formaldegid protonlanib, elektrofil +CH₂OH zarrachasini hosil qiladi.", "U fenol halqasiga orto- yoki para-holatda birikadi (gidroksimetilfenol hosil bo'ladi).", "Gidroksimetil guruhi boshqa fenol molekulasi bilan suv ajratib, –CH₂– ko'prik hosil qiladi; jarayon takrorlanib, zanjir o'sadi."],
  organic: { template: 'polikondensatlanish', params: { monomer1: 'C6H5–OH', monomer2: 'H–CHO', polymer: '[–C6H3(OH)–CH2–]n', byproduct: 'H2O' } },
  obs: { precipitate: { species: '[–C6H3(OH)–CH2–]n', color: '#b8783a', texture: 'kolloid' }, heat: 'ekzotermik', effects: [{ type: 'layers' }, { type: 'turbidity' }], text_uz: "Aralashma loyqalanadi, so'ng idish tubida yopishqoq och qo'ng'ir smola qatlami ajraladi; sovutilganda u qotib, mo'rt qattiq massaga aylanadi." },
  kinetics: 'sekin', app: ['probirka', 'suv-hammomi', 'probirka-qisqichi', 'tomizgich', 'shisha-tayoqcha'],
  proc: ["Mo'rili shkafda probirkaga 2 g fenol va 2 ml formalin soling.", "Ehtiyotlik bilan 1 ml konsentrlangan xlorid kislota qo'shing.", "Probirkani qaynoq suv hammomida qizdiring va loyqalanish hamda smola qatlami hosil bo'lishini kuzating.", "Suyuq qatlamni to'kib, smolani sovuting va qattiqligini shisha tayoqcha bilan tekshiring."],
  safety: "Fenol zaharli va terini kuydiradi, formaldegid zaharli va kanserogen, konsentrlangan HCl qitiqlovchi — tajriba faqat mo'rili shkafda, qo'lqop va ko'zoynakda o'tkaziladi.",
  expl: "Polikondensatlanish — monomerlarning birikib polimer hosil qilishi bilan birga quyi molekulyar modda (bu yerda suv) ajralishi. Fenol va formaldegiddan fenol-formaldegid smolalari olinadi; ular plastmassalar (fenoplastlar), lak va yelimlar tayyorlashda ishlatiladi. Qizdirilganda smola to'rsimon tuzilishga o'tib, termoreaktiv bo'ladi.",
  q: ["Polikondensatlanish polimerlanishdan nimasi bilan farq qiladi?", "Fenol-formaldegid smolasi nima uchun qizdirilganda yumshamaydi?"],
});

R({
  title: "Neylon (anid) tolasini fazalar chegarasida olish",
  level: '11-sinf', topic: T_PK, engine: 'record',
  reactants: [{ species: 'ClC(O)(CH2)4C(O)Cl', state: 'l', volume_mL: 0.5 }, { species: 'H2N(CH2)6NH2', state: 'aq', conc_M: 0.5, volume_mL: 5 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 5 }],
  cond: { note_uz: "Adipoilxloridning siklogeksandagi eritmasi geksametilendiamin va NaOH ning suvdagi eritmasi ustiga ehtiyotlik bilan quyiladi; ikki qatlam chegarasida plyonka hosil bo'ladi." },
  eq: {
    molecular: 'nClC(O)(CH2)4C(O)Cl + nH2N(CH2)6NH2 + 2nNaOH → [–OC(CH2)4CONH(CH2)6NH–]n + 2nNaCl + 2nH2O',
    ionic_full: 'nClC(O)(CH2)4C(O)Cl + nH2N(CH2)6NH2 + 2nNa⁺ + 2nOH⁻ → [–OC(CH2)4CONH(CH2)6NH–]n + 2nNa⁺ + 2nCl⁻ + 2nH2O',
    ionic_net: 'nClC(O)(CH2)4C(O)Cl + nH2N(CH2)6NH2 + 2nOH⁻ → [–OC(CH2)4CONH(CH2)6NH–]n + 2nCl⁻ + 2nH2O',
  },
  mech: 'organik',
  steps: ["Diaminning aminoguruhi (nukleofil) xlorangidridning karbonil uglerodiga hujum qiladi.", "Tetraedrik oraliq birikmadan xlorid ioni ajralib, amid (–CO–NH–) bog'i hosil bo'ladi.", "Jarayon ikkala uchida takrorlanib, poliamid zanjiri o'sadi; ajralgan HCl ishqor bilan neytrallanadi."],
  organic: { template: 'polikondensatlanish', params: { monomer1: 'ClOC–(CH2)4–COCl', monomer2: 'H2N–(CH2)6–NH2', polymer: '[–OC(CH2)4CONH(CH2)6NH–]n', byproduct: 'HCl (NaOH bilan NaCl + H2O)' } },
  obs: { precipitate: { species: '[–OC(CH2)4CONH(CH2)6NH–]n', color: '#f4f2ea', texture: 'kolloid' }, heat: 'sezilarsiz', effects: [{ type: 'layers' }], text_uz: "Ikki suyuqlik chegarasida darhol oq yupqa plyonka hosil bo'ladi; uni pinset bilan tortib olinganda uzluksiz neylon ipi cho'ziladi." },
  kinetics: 'bir-zumda', app: ['kimyoviy-stakan', 'pinset', 'shisha-tayoqcha'],
  proc: ["Stakanga geksametilendiamin va natriy gidroksidning suvdagi eritmasidan 5 ml quying.", "Uning ustiga stakan devori bo'ylab ehtiyotlik bilan adipoilxloridning siklogeksandagi eritmasini quying — aralashtirmang.", "Qatlamlar chegarasida hosil bo'lgan plyonkani pinset bilan ushlab, sekin yuqoriga torting va shisha tayoqchaga o'rang.", "Olingan ipni suv bilan yuving va ko'zdan kechiring."],
  safety: "Adipoilxlorid va geksametilendiamin terini kuydiradi, siklogeksan yonuvchan — mo'rili shkafda, qo'lqop va ko'zoynakda ishlang; ipni yuvmasdan qo'l bilan ushlamang.",
  expl: "Dikarbon kislota xlorangidridi va diamin polikondensatlanib, poliamid — neylon-6,6 (anid) hosil qiladi; quyi molekulyar mahsulot sifatida HCl ajraladi. Reaksiya ikki aralashmaydigan suyuqlik chegarasida juda tez boradi, shuning uchun ipni to'g'ridan-to'g'ri tortib olish mumkin.",
  q: ["Neylon molekulasida qaysi bog' takrorlanadi va u oqsillardagi qaysi bog'ga o'xshaydi?", "Nima uchun suvli qatlamga ishqor qo'shiladi?"],
});

R({
  title: "Kaprolaktamdan kapron olish",
  level: '11-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'C6H11NO', state: 's', mass_g: 5 }],
  cond: { heating: true, temp_min_C: 250, note_uz: "Sanoatda kaprolaktam oz miqdordagi suv (initsiator) ishtirokida 250–270 °C da qizdiriladi." },
  eq: { molecular: 'nC6H11NO → [–NH(CH2)5CO–]n' },
  mech: 'organik',
  steps: ["Suv ta'sirida kaprolaktamning bir qismi halqasi ochilib, aminokapron kislotaga aylanadi.", "Aminoguruh boshqa kaprolaktam molekulasining karbonil uglerodiga hujum qiladi va halqani ochadi.", "Halqalarning ketma-ket ochilishi hisobiga poliamid zanjiri o'sadi; qo'shimcha mahsulot ajralmaydi."],
  organic: { template: 'atsil', params: { acyl: '(CH2)5CONH (kaprolaktam halqasining amid guruhi)', nucleophile: 'R–NH2 (zanjir uchidagi aminoguruh)', intermediate: 'tetraedrik oraliq birikma', leaving: "R′–NH (halqa azoti — ajralmaydi, zanjirda qoladi)", product: '[–NH(CH2)5CO–]n' } },
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Suyuqlangan kaprolaktam asta-sekin quyuqlashadi; suyuqlanmadan tola tortish mumkin bo'ladi, sovutilganda qattiq oq massa hosil bo'ladi." },
  kinetics: 'juda-sekin', app: ['probirka', 'probirka-qisqichi', 'qum-hammomi', 'termometr', 'shisha-tayoqcha'],
  proc: ["Probirkaga kaprolaktam soling va 1–2 tomchi suv qo'shing.", "Probirkani qum hammomida 250 °C atrofida uzoq vaqt qizdiring.", "Suyuqlanmaning quyuqlashishini kuzating, shisha tayoqcha bilan tola tortib ko'ring."],
  safety: "Yuqori harorat bilan ishlashda qisqich va himoya ko'zoynagidan foydalaning; kaprolaktam bug'i qitiqlaydi — mo'rili shkafda ishlang.",
  expl: "Kapron (polikaproamid, neylon-6) kaprolaktam halqasining ochilishi hisobiga hosil bo'ladi. Bu jarayonda qo'shimcha modda ajralmaydi, shuning uchun u polimerlanish hisoblanadi, lekin hosil bo'lgan polimer poliamid — polikondensatlanish mahsulotlariga o'xshash tuzilishga ega. Kapron tolalar, arqonlar va paypoqlar tayyorlashda ishlatiladi.",
  q: ["Kapron va neylon-6,6 tuzilishida qanday farq bor?", "Kapronni aminokapron kislotadan qanday olish mumkin?"],
  conf: "o'rta",
});

R({
  title: "Butadienning natriy ishtirokida polimerlanishi (Lebedev sintetik kauchugi)",
  level: '10-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'CH2=CHCH=CH2', state: 'g' }],
  cond: { catalyst: 'Na', note_uz: "S.V. Lebedev usuli: butadien metall natriy ishtirokida polimerlanadi (sanoat jarayoni, virtual model)." },
  eq: { molecular: 'nCH2=CH–CH=CH2 → (–CH2–CH=CH–CH2–)n' },
  mech: 'organik',
  steps: ["Natriy atomi butadien molekulasiga elektron berib, anion-radikal hosil qiladi.", "Hosil bo'lgan karbanion keyingi butadien molekulalarini ketma-ket biriktiradi (anion polimerlanish).", "1,4-birikishda zvenoning o'rtasida qo'shbog' qoladi; natriyli polimerlanishda 1,2-birikish zvenolari ham ko'p hosil bo'ladi."],
  organic: { template: 'polimer-ion', params: { monomer: 'CH2=CH–CH=CH2', initiator: 'Na (anion polimerlanish)', polymer: '(–CH2–CH=CH–CH2–)n' } },
  obs: { heat: 'ekzotermik', effects: [], text_uz: "Gazsimon butadien elastik, kauchuksimon qattiq massaga aylanadi." },
  kinetics: 'sekin', app: ['gaz-silindri', 'termometr'],
  proc: ["Virtual reaktorni butadien bilan to'ldiring va natriy katalizatorini qo'shing.", "Reaksiya borishini va kauchuksimon massa hosil bo'lishini kuzating.", "Olingan polimerning elastikligini tabiiy kauchuk bilan solishtiring."],
  safety: "Butadien yonuvchan gaz; natriy suv bilan shiddatli reaksiyaga kirishadi. Jarayon faqat sanoat sharoitida o'tkaziladi.",
  expl: "1932-yilda S.V. Lebedev etanoldan butadien olib, uni natriy ishtirokida polimerlab, birinchi sanoat sintetik kauchugini yaratgan. Polibutadien molekulasida qo'shbog'lar saqlanib qoladi, shuning uchun u tabiiy kauchuk kabi vulkanlanadi.",
  q: ["Butadienning 1,4- va 1,2-polimerlanish zvenolarini yozing.", "Kauchukni rezinaga aylantirish uchun qanday jarayon o'tkaziladi?"],
  conf: "o'rta",
});

R({
  title: "Vinilxloridning polimerlanishi (polivinilxlorid olish modeli)",
  level: '10-sinf', topic: T_POL, engine: 'record',
  reactants: [{ species: 'CH2=CHCl', state: 'g' }],
  cond: { heating: true, temp_min_C: 50, temp_max_C: 80, catalyst: '(C6H5COO)2', note_uz: "Sanoatda vinilxlorid suvdagi suspenziyada peroksid initsiator ishtirokida 50–70 °C da polimerlanadi (virtual model)." },
  eq: { molecular: 'nCH2=CHCl → (–CH2–CHCl–)n' },
  mech: 'organik',
  steps: RADICAL_STEPS('vinilxlorid', 'polivinilxlorid'),
  organic: { template: 'polimer-radikal', params: { monomer: 'CH2=CHCl', initiator: 'R–O• (peroksid)', radical: 'R–CH2–CH•Cl', polymer: '(–CH2–CHCl–)n' } },
  obs: { heat: 'ekzotermik', effects: [], text_uz: "Gazsimon (bosim ostida suyultirilgan) vinilxlorid oq kukun — polivinilxloridga aylanadi." },
  kinetics: 'sekin', app: ['gaz-silindri', 'termometr'],
  proc: ["Virtual reaktorga vinilxlorid, suv va initsiator kiriting.", "Haroratni 50–70 °C da ushlab turing.", "Oq polimer kukuni hosil bo'lishini kuzating."],
  safety: "Vinilxlorid yonuvchan va kanserogen gaz — u bilan maktab laboratoriyasida ishlanmaydi; jarayon faqat sanoatda yopiq qurilmalarda o'tkaziladi.",
  expl: "Vinilxlorid radikal mexanizm bo'yicha polimerlanib polivinilxlorid (PVX) hosil qiladi. PVX quvurlar, linoleum, sun'iy charm, sim izolatsiyasi tayyorlashda ishlatiladi; tarkibida xlor bo'lgani uchun yonmaydi, lekin qizdirilganda HCl ajratadi.",
  q: ["PVX ning struktura zvenosini yozing.", "Nima uchun PVX buyumlarini yoqish atrof-muhit uchun zararli?"],
});

R({
  title: "Polietilenning yonishi",
  level: '10-sinf', topic: T_ID, engine: 'record',
  reactants: [{ species: '(–CH2–CH2–)n', state: 's', mass_g: 0.2 }, { species: 'O2', state: 'g' }],
  cond: { ignition: true, note_uz: "Polietilen plyonka bo'lagi tigel qisqichi bilan alangaga tutiladi." },
  eq: { molecular: '(–CH2–CH2–)n + 3nO2 → 2nCO2 + 2nH2O' },
  mech: 'organik',
  steps: ["Qizdirilganda polietilen yumshaydi va suyuqlanadi.", "Suyuqlanma bug'lari havo kislorodi bilan uglerod(IV) oksid va suvgacha oksidlanadi.", "Tarkibida faqat C va H bo'lgani uchun tutunsiz yonadi va parafin (sham) hidi seziladi."],
  organic: { template: 'oksidlanish', params: { substrate: '(–CH2–CH2–)n', oxidant: 'O2', product: 'CO2 + H2O' } },
  obs: { gas: { species: 'CO2', color: null, smell_uz: null }, heat: 'kuchli-ekzotermik', flame: { color: '#f6c040', desc_uz: "asosi ko'kimtir, uchi sariq, tutunsiz alanga" }, effects: [{ type: 'flame' }], text_uz: "Polietilen suyuqlanib tomchilaydi, ko'kimtir asosli sariq alanga bilan tutunsiz yonadi, o'chirilgan sham hidi keladi; alangadan olinganda ham yonishda davom etadi." },
  kinetics: 'tez', app: ['tigel-qisqichi', 'spirt-lampasi', 'chinni-kosacha'],
  proc: ["Polietilen plyonkaning kichik bo'lagini tigel qisqichi bilan ushlang.", "Uni spirt lampasi alangasiga tuting; ostiga chinni kosacha qo'ying.", "Alanga rangini, tutun bor-yo'qligini va hidni kuzating, so'ng alangadan olib yonishda davom etishini tekshiring."],
  safety: "Yonayotgan polimer tomchilari kuydiradi — ostiga chinni kosacha qo'ying; tutunni hidlamang, xonani shamollating.",
  expl: "Polietilen to'yingan uglevodorodlarga o'xshash tuzilishga ega, shuning uchun parafin kabi yonadi: yorqin, tutunsiz alanga hosil qiladi va sham hidi keladi. Yonish xarakteri plastmassalarni farqlashda ishlatiladi.",
  q: ["Polietilenning yonishi nimasi bilan parafinning yonishiga o'xshaydi?", "Polietilen va polistirolni yonishi bo'yicha qanday farqlash mumkin?"],
});

R({
  title: "Polivinilxloridni aniqlash: Beylshteyn sinovi va yonishi",
  level: '10-sinf', topic: T_ID, engine: 'rules',
  equation_free: true, equation_free_uz: "PVX ning yonishi va parchalanishi ko'p mahsulotli (HCl, CO₂, H₂O, ko'mir, mis xloridlari); Beylshteyn sinovida alangani uchuvchan mis xloridlari bo'yaydi — aniq yagona tenglama yo'q.",
  reactants: [{ species: '(–CH2–CHCl–)n', state: 's', mass_g: 0.1 }, { species: 'Cu', state: 's', mass_g: 1, form: 'sim' }],
  cond: { ignition: true, note_uz: "Mis sim alangada qizdirilib, PVX ga tekkiziladi va yana alangaga kiritiladi." },
  mech: 'sifat-reaksiya',
  steps: ["Qizdirilgan mis sim yuzasi mis(II) oksid bilan qoplanadi.", "Unga tekkizilgan PVX qizdirilganda parchalanib HCl ajratadi; u mis oksidi bilan uchuvchan mis xloridlarini hosil qiladi.", "Mis birikmalari alangani yashil rangga bo'yaydi — bu organik moddada galogen borligini ko'rsatadi."],
  obs: { heat: 'ekzotermik', flame: { color: '#21c47a', desc_uz: "yorqin yashil (yashil-ko'kish) alanga" }, effects: [{ type: 'flame' }, { type: 'smoke' }], text_uz: "Mis sim PVX bilan birga alangaga kiritilganda alanga yorqin yashil rangga bo'yaladi. PVX bo'lagining o'zi qiyin yonadi, alangadan olinganda o'chadi, qorayadi va o'tkir hidli gaz (HCl) ajratadi — ho'l ko'k lakmus qog'ozi qizaradi." },
  kinetics: 'tez', app: ['nixrom-sim', 'tigel-qisqichi', 'spirt-lampasi', 'indikator-qogozi'],
  proc: ["Mis simning uchini alangada yashil rang yo'qolguncha qizdiring.", "Qizigan simni PVX bo'lagiga tekkizing (ozgina polimer yopishib qoladi).", "Simni yana alangaga kiriting va alanga rangini kuzating.", "Alohida tajribada PVX bo'lagini tigel qisqichida yondirib, ajralayotgan gazga ho'l lakmus qog'ozini tuting."],
  safety: "PVX yonganda zaharli HCl va boshqa xlorli moddalar ajraladi — faqat mo'rili shkafda, juda kichik namunalar bilan ishlang; tutunni hidlamang.",
  expl: "Beylshteyn sinovi organik birikmalarda xlor, brom yoki yod borligini aniqlashning oddiy usuli: galogen mis bilan uchuvchan birikma hosil qilib, alangani yashil rangga bo'yaydi. PVX tarkibida xlor bo'lgani uchun u yaxshi yonmaydi va parchalanganda HCl ajratadi.",
  q: ["Beylshteyn sinovi qaysi elementlarni aniqlaydi?", "Nima uchun PVX o'z-o'zidan o'chadi?"],
});

R({
  title: "Polistirolning yonishi",
  level: '10-sinf', topic: T_ID, engine: 'rules',
  equation_free: true, equation_free_uz: "Polistirol havoda to'liq yonmaydi: CO₂ va H₂O dan tashqari ko'p miqdorda qurum (C) va boshqa mahsulotlar hosil bo'ladi; ularning nisbati sharoitga bog'liq bo'lgani uchun tenglama yozilmaydi.",
  reactants: [{ species: '(–CH2–CH(C6H5)–)n', state: 's', mass_g: 0.1 }],
  cond: { ignition: true, note_uz: "Polistirol bo'lagi tigel qisqichi bilan alangaga tutiladi." },
  mech: 'fizik',
  steps: ["Polistirol tarkibida uglerodning massa ulushi yuqori (aromatik halqa).", "Havodagi kislorod uglerodni to'liq oksidlashga yetmaydi — qurum zarrachalari hosil bo'ladi.", "Qurum zarrachalari alangada cho'g'lanib, uni sariq va tutunli qiladi."],
  obs: { heat: 'kuchli-ekzotermik', flame: { color: '#f0a020', desc_uz: "yorqin sariq, ko'p qurumli (tutunli) alanga" }, effects: [{ type: 'flame' }, { type: 'smoke' }], text_uz: "Polistirol yumshab, yorqin sariq alanga bilan ko'p qora qurum (tutun parchalari) chiqarib yonadi; shirinsimon (gul) hidi seziladi." },
  kinetics: 'tez', app: ['tigel-qisqichi', 'spirt-lampasi', 'chinni-kosacha'],
  proc: ["Polistirolning kichik bo'lagini tigel qisqichi bilan ushlang.", "Uni alangaga tuting; ostiga chinni kosacha qo'ying.", "Alanga va tutunni kuzating, polietilenning yonishi bilan solishtiring."],
  safety: "Tutun va qurum zararli — mo'rili shkafda, kichik namuna bilan ishlang; yonayotgan tomchilardan ehtiyot bo'ling.",
  expl: "Aromatik halqa tutgan polimerlar (benzol kabi) qurumli alanga bilan yonadi, chunki ularda uglerodning ulushi yuqori. Bu belgi bo'yicha polistirolni polietilen va polipropilendan oson farqlash mumkin.",
  q: ["Nima uchun polistirol qurumli alanga bilan yonadi?", "Benzol va geksanning yonishini taqqoslang."],
});

R({
  title: "Kapron (poliamid) tolasini qizdirish va yondirish",
  level: '10-sinf', topic: T_ID, engine: 'rules',
  equation_free: true, equation_free_uz: "Poliamid yonganda va parchalanganda ko'plab azot tutuvchi mahsulotlar hosil bo'ladi; tarkib aniq bo'lmagani uchun tenglama yozilmaydi.",
  reactants: [{ species: '[–NH(CH2)5CO–]n', state: 's', mass_g: 0.1 }],
  cond: { ignition: true, note_uz: "Kapron ipi pinset bilan alangaga yaqinlashtiriladi, so'ng alangaga kiritiladi." },
  mech: 'fizik',
  steps: ["Kapron termoplastik polimer: qizdirilganda avval yumshaydi va suyuqlanadi.", "Alangada sekin yonadi; tarkibidagi azot hisobiga o'ziga xos hid chiqadi.", "Suyuqlanma sovuganda qattiq, ezilmaydigan sharchaga aylanadi."],
  obs: { heat: 'ekzotermik', flame: { color: '#f4b040', desc_uz: "kichik, ko'kimtir-sariq alanga" }, effects: [{ type: 'flame' }, { type: 'smoke' }], text_uz: "Kapron ipi alangaga yaqinlashganda kirishib suyuqlanadi, sekin yonadi va o'ziga xos hid chiqaradi; uchida qattiq, barmoq bilan ezilmaydigan qo'ng'ir sharcha qoladi." },
  kinetics: 'tez', app: ['pinset', 'spirt-lampasi', 'chinni-kosacha'],
  proc: ["Kapron ipining bo'lagini pinset bilan ushlang.", "Uni asta-sekin alangaga yaqinlashtiring va o'zgarishini kuzating.", "Ipni alangaga kiritib, yonishini kuzating; alangadan oling.", "Sovigan qoldiqni ezib ko'ring va natijani jun bilan solishtiring."],
  safety: "Suyuqlangan polimer tomchilari kuydiradi — pinsetda ushlang, ostiga chinni kosacha qo'ying; tutunni hidlamang.",
  expl: "Sintetik poliamid tolalar (kapron, neylon) qizdirilganda suyuqlanadi va qattiq sharcha hosil qiladi. Tabiiy oqsil tola (jun) esa suyuqlanmasdan kuyadi va mo'rt qoldiq beradi. Yonish sinovi orqali sintetik va tabiiy tolalarni farqlash mumkin.",
  q: ["Kapron va jun yonishidagi farqni tushuntiring.", "Nima uchun kapron qizdirilganda suyuqlanadi?"],
});

R({
  title: "Polietilenning bromli suvni rangsizlantirmasligi",
  level: '10-sinf', topic: T_ID, engine: 'record',
  no_reaction: true, match: ['(–CH2–CH2–)n', 'Br2'],
  reactants: [{ species: '(–CH2–CH2–)n', state: 's', mass_g: 0.2 }, { species: 'bromli-suv', state: 'aq', volume_mL: 3 }],
  mech: 'sifat-reaksiya',
  steps: ["Polimerlanishda etilen molekulalaridagi qo'shbog'lar uzilib, zanjir hosil qiladi.", "Polietilen makromolekulasida faqat oddiy (σ) C–C va C–H bog'lari qoladi.", "Qo'shbog' bo'lmagani uchun brom birikmaydi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Polietilen bo'lagi bilan chayqatilgan bromli suvning rangi o'zgarmaydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'pinset'],
  proc: ["Probirkaga 3 ml bromli suv quying.", "Unga polietilen plyonkaning mayda bo'laklarini soling va chayqating.", "Rangni kuzating; taqqoslash uchun boshqa probirkada tabiiy kauchuk bilan tajriba qiling."],
  safety: "Brom zaharli — mo'rili shkafda ishlang, bug'ini hidlamang.",
  expl: "Polimerlanish natijasida monomerning qo'shbog'lari yo'qoladi, shuning uchun polietilen to'yingan uglevodorodlar kabi bromli suvni rangsizlantirmaydi. Etilen (monomer) esa bromli suvni tez rangsizlantiradi.",
  q: ["Nima uchun etilen bromli suvni rangsizlantiradi, polietilen esa yo'q?", "Polimerlarning kimyoviy chidamliligi qayerda qo'llaniladi?"],
});

R({
  title: "Tabiiy kauchukning to'yinmaganligini bromli suv bilan aniqlash",
  level: '10-sinf', topic: T_ID, engine: 'record',
  reactants: [{ species: '(–CH2–C(CH3)=CH–CH2–)n', state: 's', mass_g: 0.2 }, { species: 'bromli-suv', state: 'aq', volume_mL: 3 }],
  cond: { note_uz: "Kauchuk mayda bo'laklarga qirqiladi yoki uning benzindagi eritmasidan foydalaniladi." },
  eq: { molecular: '(–CH2–C(CH3)=CH–CH2–)n + nBr2 → (–CH2–CBr(CH3)–CHBr–CH2–)n' },
  mech: 'organik',
  steps: ["Poliizopren (tabiiy kauchuk) har bir zvenosida bitta C=C qo'shbog' saqlaydi.", "Brom qo'shbog'ga elektrofil birikadi (bromoniy ioni orqali).", "Har bir zvenoga bitta brom molekulasi birikadi, bromli suv rangsizlanadi."],
  organic: { template: 'AdE', params: { alkene: '–CH2–C(CH3)=CH–CH2–', reagent: 'Br–Br', electrophile: 'Br⁺', nucleophile: 'Br⁻', intermediate: 'bromoniy ioni', product: '–CH2–CBr(CH3)–CHBr–CH2–' } },
  obs: { solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: [], text_uz: "Kauchuk bo'laklari bilan chayqatilgan bromli suv asta-sekin rangsizlanadi (kauchuk eritmasida tezroq)." },
  kinetics: 'sekin', app: ['probirka', 'tomizgich', 'pinset'],
  proc: ["Probirkaga 3 ml bromli suv quying.", "Unga mayda qirqilgan tabiiy kauchuk (yoki uning benzindagi eritmasidan bir necha tomchi) qo'shing.", "Probirkani tiqin bilan yopib chayqating va rang o'zgarishini kuzating."],
  safety: "Brom zaharli, benzin yonuvchan — mo'rili shkafda, alangadan uzoqda ishlang.",
  expl: "Tabiiy kauchuk — izoprenning polimeri; polimer zvenolarida qo'shbog'lar saqlanib qolgani uchun u bromli suvni rangsizlantiradi. Shu qo'shbog'lar hisobiga kauchuk oltingugurt bilan vulkanlanadi va havoda asta-sekin oksidlanib eskiradi.",
  q: ["Kauchuk molekulasida qo'shbog'lar borligini qanday isbotlash mumkin?", "Vulkanlash nima va u kauchuk xossalarini qanday o'zgartiradi?"],
  conf: "o'rta",
});

R({
  title: "Termoplastik va termoreaktiv polimerlarning qizdirishga munosabati",
  level: '10-sinf', topic: T_ID, engine: 'rules',
  equation_free: true, equation_free_uz: "Termoplastik polimerning yumshashi fizik o'zgarish; termoreaktiv polimerning kuyishi esa ko'p mahsulotli parchalanish — ikkalasi ham yagona tenglama bilan ifodalanmaydi.",
  reactants: [{ species: '(–CH2–CH2–)n', state: 's', mass_g: 0.2 }, { species: '[–C6H3(OH)–CH2–]n', state: 's', mass_g: 0.2 }],
  cond: { heating: true, temp_min_C: 120, note_uz: "Polietilen va fenoplast (fenol-formaldegid smolasi) bo'laklari alohida-alohida, ehtiyotlik bilan qizdiriladi." },
  mech: 'fizik',
  steps: ["Termoplastik polimerlar (polietilen) chiziqli yoki kam tarmoqlangan makromolekulalardan iborat; qizdirilganda molekulalararo kuchlar zaiflashib, polimer yumshaydi.", "Sovutilganda u yana qotadi — jarayon ko'p marta takrorlanishi mumkin.", "Termoreaktiv polimerlarda (fenoplast) makromolekulalar kovalent bog'lar bilan to'rsimon tuzilishga bog'langan; qizdirilganda yumshamaydi, kuchli qizdirishda kuyib parchalanadi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'smoke' }], text_uz: "Polietilen bo'lagi qizdirilganda yumshab, shaklini o'zgartiradi va sovutilganda yangi shaklda qotadi. Fenoplast bo'lagi yumshamaydi, kuchli qizdirilganda qorayib, fenol hidini chiqaradi." },
  kinetics: "o'rtacha", app: ['tigel-qisqichi', 'spirt-lampasi', 'chinni-kosacha', 'shisha-tayoqcha'],
  proc: ["Polietilen bo'lagini tigel qisqichi bilan ushlab, alangadan biroz yuqorida qizdiring va shisha tayoqcha bilan bosib, shaklini o'zgartiring.", "Bo'lak sovigach, yangi shaklini kuzating.", "Xuddi shunday fenoplast bo'lagini qizdiring va o'zgarishlarni solishtiring."],
  safety: "Polimerlarni alangaga tekkizmasdan, ehtiyotlik bilan qizdiring; parchalanish mahsulotlari zararli — mo'rili shkafda ishlang.",
  expl: "Termoplastlar qizdirilganda yumshaydi va qayta shakllantirilishi mumkin — ularni qayta ishlash oson. Termoreaktiv polimerlar qizdirilganda qaytmas o'zgaradi (to'rsimon tuzilish hosil bo'ladi) va qayta suyuqlanmaydi; ular issiqlikka chidamli buyumlar (elektr vilkalari, tutqichlar) tayyorlashda ishlatiladi.",
  q: ["Termoplastik va termoreaktiv polimerlarga misollar keltiring.", "Nima uchun termoreaktiv polimerlar qizdirilganda yumshamaydi?"],
});

writeFileSync(join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${CAT}.json`), JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n');
console.log(`${CAT}: ${out.length} ta yozuv`);
