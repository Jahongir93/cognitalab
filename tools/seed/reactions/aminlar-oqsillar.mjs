// "Aminlar, aminokislotalar, oqsillar" toifasi tajribalari generatori.
// Ishga tushirish: node tools/seed/reactions/aminlar-oqsillar.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CAT = 'aminlar-oqsillar';
const PFX = 'amin';
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

const T_AMIN = 'Aminlar: asos xossalari';
const T_ANILIN = 'Anilin va uning xossalari';
const T_AMINOK = 'Aminokislotalar';
const T_OQSIL = 'Oqsillar: tarkibi va xossalari';
const PROTEIN_FREE = "Oqsil — tarkibi aniq bitta formula bilan ifodalanmaydigan biopolimer; kuzatiladigan o'zgarish uning ko'plab funksional guruhlari ishtirokida boradi, shuning uchun tenglama yozilmaydi.";

R({
  title: "Metilaminning asos xossalari: indikator va xlorid kislota bilan",
  level: '11-sinf', topic: T_AMIN, engine: 'rules',
  reactants: [{ species: 'CH3NH2', state: 'aq', conc_M: 2, volume_mL: 1 }, { species: 'HCl', state: 'aq', conc_M: 1, volume_mL: 3 }],
  cond: { note_uz: "Metilamin eritmasiga avval 1 tomchi fenolftalein qo'shiladi, so'ng xlorid kislota tomchilab quyiladi." },
  eq: {
    molecular: 'CH3NH2 + HCl → CH3NH3Cl',
    ionic_full: 'CH3NH2 + H⁺ + Cl⁻ → CH3NH3⁺ + Cl⁻',
    ionic_net: 'CH3NH2 + H⁺ → CH3NH3⁺',
  },
  mech: 'neytrallanish',
  steps: ["Metilamindagi azot atomi bo'linmagan elektron juftiga ega.", "Suvda u suv molekulasidan proton olib, CH₃NH₃⁺ va OH⁻ ionlarini hosil qiladi — eritma ishqoriy (fenolftalein to'q pushti).", "Xlorid kislota qo'shilganda amin protonni H⁺ dan oladi — metilammoniy xlorid tuzi hosil bo'ladi, pushti rang yo'qoladi."],
  obs: { solution_color_change: { from: '#d81b8c', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Metilamin eritmasi fenolftaleinni to'q pushti rangga bo'yaydi; xlorid kislota qo'shilganda rang yo'qoladi, baliqqa o'xshash o'tkir hid ham kamayadi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 1 ml metilamin eritmasi quying va 1 tomchi fenolftalein qo'shing.", "Rang o'zgarishini kuzating.", "Tomizgich bilan xlorid kislota eritmasini tomchilab qo'shib, eritma rangsizlanguncha chayqating."],
  safety: "Metilamin o'tkir hidli va nafas yo'llarini qitiqlaydi — mo'rili shkafda ishlang; kislota va asos eritmalari bilan ko'zoynak taqing.",
  expl: "Aminlar ammiak kabi asos xossalarini namoyon qiladi: azot atomining bo'linmagan elektron jufti protonni biriktiradi. Metil guruhi azotdagi elektron zichligini oshirgani uchun metilamin ammiakdan kuchliroq asos. Kislotalar bilan aminlar tuzlar — alkilammoniy tuzlarini hosil qiladi.",
  q: ["Nima uchun metilamin ammiakdan kuchliroq asos?", "Metilammoniy xlorid tuzi ishqor ta'sirida qanday o'zgaradi?"],
});

R({
  title: "Metilamin eritmasining temir(III) xlorid bilan reaksiyasi",
  level: '11-sinf', topic: T_AMIN, engine: 'rules',
  reactants: [{ species: 'FeCl3', state: 'aq', conc_M: 0.1, volume_mL: 1 }, { species: 'CH3NH2', state: 'aq', conc_M: 2, volume_mL: 1 }],
  eq: {
    molecular: '3CH3NH2 + FeCl3 + 3H2O → Fe(OH)3↓ + 3CH3NH3Cl',
    ionic_full: '3CH3NH2 + Fe³⁺ + 3Cl⁻ + 3H2O → Fe(OH)3↓ + 3CH3NH3⁺ + 3Cl⁻',
    ionic_net: '3CH3NH2 + Fe³⁺ + 3H2O → Fe(OH)3↓ + 3CH3NH3⁺',
  },
  mech: 'ion-almashinish',
  steps: ["Metilamin suv bilan reaksiyaga kirishib eritmada OH⁻ ionlarini hosil qiladi.", "OH⁻ ionlari Fe³⁺ bilan erimaydigan temir(III) gidroksid hosil qiladi.", "Natijada ammiak eritmasidagi kabi qo'ng'ir cho'kma tushadi."],
  obs: { precipitate: { species: 'Fe(OH)3', color: '#9a4a1c', texture: 'iviqsimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Qo'ng'ir-qizil iviqsimon cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 1 ml temir(III) xlorid eritmasi quying.", "Unga tomchilab metilamin eritmasidan qo'shing.", "Hosil bo'lgan cho'kma rangini kuzating."],
  safety: "Metilamin hidli va qitiqlovchi — mo'rili shkafda ishlang; temir(III) xlorid terini bo'yaydi.",
  expl: "Metilaminning suvdagi eritmasi ammiak eritmasi kabi ishqoriy muhitga ega va metallarning erimaydigan gidroksidlarini cho'ktiradi. Bu aminlarning asos xossasini ko'rsatadigan yana bir tajriba.",
  q: ["Bu tajribada metilamin qaysi moddaga o'xshab ta'sir ko'rsatadi?", "Anilin eritmasi bilan Fe(OH)₃ cho'kmasini olish mumkinmi? Nima uchun?"],
});

R({
  title: "Anilinning xlorid kislotada erishi",
  level: '11-sinf', topic: T_ANILIN, engine: 'record',
  reactants: [{ species: 'C6H5NH2', state: 'l', volume_mL: 0.3 }, { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 2 }],
  eq: {
    molecular: 'C6H5NH2 + HCl → C6H5NH3Cl',
    ionic_full: 'C6H5NH2 + H⁺ + Cl⁻ → C6H5NH3⁺ + Cl⁻',
    ionic_net: 'C6H5NH2 + H⁺ → C6H5NH3⁺',
  },
  mech: 'neytrallanish',
  steps: ["Anilin suvda deyarli erimaydi va probirka tubida moysimon tomchilar hosil qiladi.", "Azotning bo'linmagan elektron jufti H⁺ ionini biriktiradi.", "Hosil bo'lgan fenilammoniy xlorid ionli tuz bo'lib, suvda yaxshi eriydi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'layers' }, { type: 'dissolve' }], text_uz: "Suvda erimay turgan anilin tomchilari xlorid kislota qo'shilib chayqatilganda eriydi, tiniq eritma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml suv va 2–3 tomchi anilin soling, chayqating — anilin erimaydi, eritma loyqalanadi.", "Ustiga tomchilab xlorid kislota eritmasidan qo'shib chayqating.", "Anilin tomchilarining erishini kuzating."],
  safety: "Anilin zaharli, teri orqali so'riladi — qo'lqop taqing, mo'rili shkafda ishlang; to'kilgan anilinni darhol arting.",
  expl: "Anilin kuchsiz asos: benzol halqasi azotning elektron juftini o'ziga tortib, uning proton biriktirish qobiliyatini kamaytiradi. Shunga qaramay, kuchli kislotalar bilan u tuz — fenilammoniy xlorid hosil qiladi va eriydi. Anilin eritmasi lakmus rangini o'zgartirmaydi.",
  q: ["Nima uchun anilin metilamindan kuchsiz asos?", "Anilin tuzidan anilinni qanday qayta ajratib olish mumkin?"],
});

R({
  title: "Fenilammoniy xloriddan ishqor ta'sirida anilinning ajralishi",
  level: '11-sinf', topic: T_ANILIN, engine: 'rules',
  reactants: [{ species: 'C6H5NH3Cl', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 2 }],
  eq: {
    molecular: 'C6H5NH3Cl + NaOH → C6H5NH2 + NaCl + H2O',
    ionic_full: 'C6H5NH3⁺ + Cl⁻ + Na⁺ + OH⁻ → C6H5NH2 + Na⁺ + Cl⁻ + H2O',
    ionic_net: 'C6H5NH3⁺ + OH⁻ → C6H5NH2 + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Fenilammoniy ioni — kuchsiz asos anilinning kislotasi.", "Kuchli asos (OH⁻) undan protonni tortib oladi.", "Ajralgan anilin suvda erimaydi va loyqalik, so'ng moysimon tomchilar hosil qiladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }, { type: 'layers' }], text_uz: "Tiniq eritma oqarib loyqalanadi (emulsiya), tindirilganda moysimon anilin tomchilari ajraladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml fenilammoniy xlorid eritmasi quying (oldingi tajribada olingan eritmadan foydalanish mumkin).", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Loyqalanish va moysimon tomchilar paydo bo'lishini kuzating."],
  safety: "Anilin zaharli — qo'lqop taqing, mo'rili shkafda ishlang; ishqor eritmasi bilan ehtiyot bo'ling.",
  expl: "Kuchli asos kuchsiz asosni uning tuzidan siqib chiqaradi. Fenilammoniy xloriddan ishqor ta'sirida erkin anilin ajraladi; u suvda erimagani uchun emulsiya va moysimon qatlam hosil qiladi.",
  q: ["Bu reaksiya ammoniy tuzlarining ishqor bilan reaksiyasiga qanday o'xshaydi?", "Anilinni tozalashda bu xossadan qanday foydalanish mumkin?"],
});

R({
  title: "Anilinning bromli suv bilan reaksiyasi",
  level: '11-sinf', topic: T_ANILIN, engine: 'record',
  reactants: [{ species: 'C6H5NH2', state: 'l', volume_mL: 0.1 }, { species: 'bromli-suv', state: 'aq', volume_mL: 5 }],
  eq: {
    molecular: 'C6H5NH2 + 3Br2 → C6H2Br3NH2↓ + 3HBr',
    ionic_full: 'C6H5NH2 + 3Br2 → C6H2Br3NH2↓ + 3H⁺ + 3Br⁻',
    ionic_net: 'C6H5NH2 + 3Br2 → C6H2Br3NH2↓ + 3H⁺ + 3Br⁻',
  },
  mech: 'organik',
  steps: ["Aminoguruh benzol halqasidagi elektron zichligini, ayniqsa orto- va para-holatlarda, keskin oshiradi.", "Shu sababli brom katalizatorsiz ham elektrofil sifatida halqaga hujum qiladi (σ-kompleks hosil bo'ladi).", "Proton ajralib, vodorod atomlari ketma-ket 2, 4, 6-holatlarda bromga almashinadi; 2,4,6-tribromanilin oq cho'kmaga tushadi."],
  organic: { template: 'SEAr', params: { arene: 'C6H5–NH2', reagent: 'Br–Br', catalyst: "kerak emas (NH₂ guruhi halqani faollashtiradi)", electrophile: 'Br⁺', sigma_complex: 'σ-kompleks (arenoniy ioni)', product: 'C6H2Br3NH2', byproduct: 'HBr' } },
  obs: { precipitate: { species: 'C6H2Br3NH2', color: '#f6f6f0', texture: 'suzmasimon' }, solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Bromli suv darhol rangsizlanadi va oq cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml suv va 1 tomchi anilin soling, yaxshilab chayqating.", "Aralashmaga tomchilab bromli suv qo'shing.", "Rang yo'qolishi va cho'kma hosil bo'lishini kuzating."],
  safety: "Anilin va brom zaharli — tajriba mo'rili shkafda, qo'lqop va ko'zoynakda o'tkaziladi.",
  expl: "Aminoguruh va benzol halqasining o'zaro ta'siri natijasida anilin halqasi benzolga qaraganda ancha faol. Shuning uchun anilin bromli suv bilan katalizatorsiz, oddiy sharoitda 2,4,6-tribromanilin hosil qiladi. Bu reaksiya anilinga sifat reaksiyasi hisoblanadi (fenol ham shunga o'xshash reaksiya beradi).",
  q: ["Nima uchun benzol bromli suv bilan reaksiyaga kirishmaydi, anilin esa oson kirishadi?", "Bu reaksiyada qaysi atomlar bromga almashinadi?"],
});

R({
  title: "Metilaminning yonishi",
  level: '11-sinf', topic: T_AMIN, engine: 'record',
  reactants: [{ species: 'CH3NH2', state: 'g' }, { species: 'O2', state: 'g' }],
  cond: { ignition: true, note_uz: "Metilamin gazi naycha uchida yondiriladi (havodagi kislorod hisobiga)." },
  eq: { molecular: '4CH3NH2 + 9O2 → 4CO2 + 10H2O + 2N2' },
  mech: 'organik',
  steps: ["Yonish — metilaminning kislorod bilan to'liq oksidlanishi.", "Uglerod atomlari CO₂ gacha, vodorod atomlari suvgacha oksidlanadi.", "Azot atomlari oksidlanmasdan erkin azot (N₂) holida ajraladi."],
  organic: { template: 'oksidlanish', params: { substrate: 'CH3–NH2', oxidant: 'O2', product: 'CO2 + H2O + N2' } },
  obs: { gas: { species: 'N2', color: null, smell_uz: null }, heat: 'kuchli-ekzotermik', flame: { color: '#f2d27a', desc_uz: "och sarg'ish, deyarli rangsiz alanga" }, effects: [{ type: 'flame' }, { type: 'condensate' }], text_uz: "Metilamin och sarg'ish alanga bilan yonadi; alanga ustida tutilgan sovuq shisha xiralashadi (suv bug'i)." },
  kinetics: 'bir-zumda', app: ['gaz-naycha-togri', 'gugurt', 'soat-oynasi'],
  proc: ["Metilamin gazini naycha orqali sekin chiqaring.", "Naycha uchini yondiring.", "Alanga ustida sovuq soat oynasini qisqa vaqt tutib, suv tomchilarini kuzating."],
  safety: "Metilamin yonuvchan va havo bilan portlovchi aralashma hosil qiladi; zaharli va qitiqlovchi. Tajriba faqat o'qituvchi tomonidan mo'rili shkafda ko'rsatiladi.",
  expl: "Aminlar yonganda uglevodorodlardan farqli ravishda CO₂ va H₂O dan tashqari erkin azot ham hosil bo'ladi. Bu reaksiya aminlarning tarkibida azot borligini ko'rsatadi; ammiak ham kislorodda yonganda azot hosil qiladi.",
  q: ["Etilaminning yonish tenglamasini yozing.", "Nima uchun aminlar yonganda azot oksidlari emas, erkin azot hosil bo'ladi?"],
  conf: "o'rta",
});

R({
  title: "Glitsinning xlorid kislota bilan reaksiyasi",
  level: '11-sinf', topic: T_AMINOK, engine: 'record',
  reactants: [{ species: 'H2NCH2COOH', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'HCl', state: 'aq', conc_M: 1, volume_mL: 1 }],
  cond: { note_uz: "Glitsin eritmasiga metiloranj qo'shilib, xlorid kislota tomchilab quyiladi; taqqoslash uchun toza suvga ham shuncha kislota qo'shiladi." },
  eq: {
    molecular: 'H2NCH2COOH + HCl → [H3NCH2COOH]Cl',
    ionic_net: 'H2NCH2COOH + H⁺ + Cl⁻ → [H3NCH2COOH]Cl',
  },
  mech: 'neytrallanish',
  steps: ["Glitsin molekulasida asosli aminoguruh (–NH₂) va kislotali karboksil guruh (–COOH) bor.", "Kislotali muhitda aminoguruh H⁺ ni biriktirib, ⁺H₃N–CH₂–COOH kationiga aylanadi.", "Natijada glitsin gidroxloridi hosil bo'ladi — aminokislota asos sifatida ta'sir ko'rsatadi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Tashqi o'zgarish ko'rinmaydi; glitsin eritmasida metiloranj qizarishi uchun toza suvdagiga qaraganda ko'proq kislota talab qilinadi (kislota bog'lanadi)." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Ikki probirka oling: biriga 2 ml glitsin eritmasi, ikkinchisiga 2 ml distillangan suv quying.", "Ikkalasiga 1 tomchidan metiloranj qo'shing.", "Har biriga tomchilab xlorid kislota qo'shing va qizil rang paydo bo'lguncha ketgan tomchilar sonini solishtiring."],
  safety: "Xlorid kislota terini kuydiradi — ko'zoynak taqing.",
  expl: "Aminokislotalar amfoter birikmalar: aminoguruh hisobiga kislotalar bilan tuz hosil qiladi. Glitsin eritmaga qo'shilgan H⁺ ionlarini bog'lagani uchun eritma pH i sekin o'zgaradi (bufer ta'siri).",
  q: ["Aminokislotalarning amfoterligi nimadan kelib chiqadi?", "Glitsin gidroxloridining tuzilish formulasini yozing."],
});

R({
  title: "Glitsinning natriy gidroksid bilan reaksiyasi",
  level: '11-sinf', topic: T_AMINOK, engine: 'record',
  reactants: [{ species: 'H2NCH2COOH', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 }],
  cond: { note_uz: "Glitsin eritmasiga fenolftalein qo'shilib, ishqor tomchilab quyiladi; taqqoslash uchun toza suvga ham shuncha ishqor qo'shiladi." },
  eq: {
    molecular: 'H2NCH2COOH + NaOH → H2NCH2COONa + H2O',
    ionic_net: 'H2NCH2COOH + Na⁺ + OH⁻ → H2NCH2COONa + H2O',
  },
  mech: 'neytrallanish',
  steps: ["Ishqoriy muhitda glitsinning karboksil guruhi protonini beradi.", "OH⁻ ionlari protonni biriktirib suv hosil qiladi.", "Natriy glitsinat hosil bo'ladi — aminokislota kislota sifatida ta'sir ko'rsatadi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Tashqi o'zgarish ko'rinmaydi; glitsin eritmasida fenolftalein pushti rangga kirishi uchun toza suvdagiga qaraganda ko'proq ishqor talab qilinadi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Ikki probirka oling: biriga 2 ml glitsin eritmasi, ikkinchisiga 2 ml distillangan suv quying.", "Ikkalasiga 1 tomchidan fenolftalein qo'shing.", "Har biriga tomchilab natriy gidroksid eritmasi qo'shing va pushti rang paydo bo'lguncha ketgan tomchilar sonini solishtiring."],
  safety: "Ishqor eritmasi ko'zga xavfli — ko'zoynak taqing.",
  expl: "Glitsin karboksil guruhi hisobiga ishqorlar bilan tuz hosil qiladi. Avvalgi tajriba bilan birgalikda bu aminokislotalarning amfoterligini ko'rsatadi: ular ham kislota, ham asos bilan reaksiyaga kirishadi.",
  q: ["Glitsinning kislota va ishqor bilan reaksiyalari tenglamalarini taqqoslang.", "Glitsinning suvdagi eritmasi qanday muhitga ega va nima uchun?"],
});

R({
  title: "Glitsinning mis(II) gidroksid bilan reaksiyasi",
  level: '11-sinf', topic: T_AMINOK, engine: 'record',
  reactants: [{ species: 'Cu(OH)2', state: 's', mass_g: 0.1 }, { species: 'H2NCH2COOH', state: 'aq', conc_M: 0.5, volume_mL: 3 }],
  cond: { note_uz: "Cu(OH)₂ CuSO₄ va NaOH eritmalaridan yangi cho'ktirib olinadi; reaksiyani tezlashtirish uchun biroz iliqlash mumkin." },
  eq: { molecular: '2H2NCH2COOH + Cu(OH)2 → (H2NCH2COO)2Cu + 2H2O' },
  mech: 'kompleks',
  steps: ["Glitsinning karboksil guruhi Cu(OH)₂ bilan tuz hosil qiladi.", "Bir vaqtda aminoguruhdagi azot atomi o'zining elektron jufti hisobiga Cu²⁺ bilan donor-akseptor bog' hosil qiladi.", "Natijada barqaror besh a'zoli halqali ichki kompleks tuz — mis(II) glitsinat hosil bo'ladi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#2a5ad0' }, heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Havorang Cu(OH)₂ cho'kmasi eriydi, eritma to'q ko'k rangga kiradi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'suv-hammomi'],
  proc: ["Probirkada 1 ml CuSO₄ eritmasiga ozgina NaOH eritmasi qo'shib Cu(OH)₂ cho'kmasini oling.", "Cho'kma ustiga 3 ml glitsin eritmasini qo'shing va chayqating.", "Zarur bo'lsa, probirkani iliq suv hammomida biroz qizdiring.", "Eritma rangini kuzating."],
  safety: "Mis tuzlari zaharli — chiqindini maxsus idishga yig'ing, qo'lni yuving.",
  expl: "Aminokislotalar ikki funksional guruhi orqali mis(II) ionlari bilan to'q ko'k rangli ichki kompleks tuzlar (xelatlar) hosil qiladi. Bu reaksiya aminokislotalarni aniqlash va ajratishda qo'llaniladi.",
  q: ["Mis(II) glitsinatda Cu²⁺ ioni glitsinning qaysi atomlari bilan bog'langan?", "Bu reaksiya glitserin bilan Cu(OH)₂ reaksiyasidan nimasi bilan farq qiladi?"],
});

R({
  title: "Oqsillarning biuret reaksiyasi",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: "Ishqoriy muhitda oqsilning peptid bog'lari (–CO–NH–) Cu²⁺ ionlari bilan tarkibi o'zgaruvchan binafsha kompleks hosil qiladi; oqsil formulasi aniq bo'lmagani uchun tenglama yozilmaydi.",
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 2 }, { species: 'NaOH', state: 'aq', conc_M: 2, volume_mL: 2 }, { species: 'CuSO4', state: 'aq', conc_M: 0.05, volume_mL: 0.2 }],
  mech: 'sifat-reaksiya',
  steps: ["Ishqoriy muhitda peptid guruhlaridagi azot atomlari protonini yo'qotadi.", "Cu²⁺ ioni bir nechta peptid guruhining azot atomlari bilan koordinatsion bog'lar hosil qiladi.", "Hosil bo'lgan kompleks binafsha rangga ega; rang kamida ikkita peptid bog'i bo'lgan moddalarda kuzatiladi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#8a4ab8' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Eritma qizg'ish-binafsha rangga bo'yaladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml oqsil eritmasi (tuxum oqi eritmasi) quying.", "Unga 2 ml natriy gidroksid eritmasidan qo'shing.", "Chayqatib turib 2–3 tomchi suyultirilgan mis(II) sulfat eritmasi qo'shing (ortiqcha qo'shmang).", "Rang o'zgarishini kuzating."],
  safety: "Natriy gidroksid eritmasi ko'zni shikastlaydi — ko'zoynak taqing; mis tuzlarini to'kmang.",
  expl: "Biuret reaksiyasi — barcha oqsillar va peptidlarga (kamida ikkita peptid bog'i bo'lganda) xos sifat reaksiyasi. U peptid bog'larini aniqlaydi. Reaksiya nomi bir molekulasida ikkita –CO–NH– guruhi bo'lgan biuret moddasidan olingan.",
  q: ["Biuret reaksiyasi oqsil molekulasining qaysi qismini aniqlaydi?", "Mis(II) sulfatni ortiqcha qo'shish nima uchun natijani buzadi?"],
});

R({
  title: "Oqsillarning ksantoprotein reaksiyasi",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: "Konsentrlangan nitrat kislota oqsil tarkibidagi aromatik aminokislota qoldiqlarini nitrolaydi; mahsulotlar oqsil zanjiridagi ko'plab guruhlar bo'lgani uchun tenglama yozilmaydi.",
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 2 }, { species: 'HNO3', state: 'aq', conc_M: 14.4, volume_mL: 0.5 }],
  cond: { heating: true, temp_min_C: null, note_uz: "Konsentrlangan HNO₃ qo'shilgach, aralashma ehtiyotlik bilan qizdiriladi; sovigach ammiak eritmasi qo'shiladi." },
  mech: 'sifat-reaksiya',
  steps: ["Konsentrlangan nitrat kislota avval oqsilni koagulyatsiyalaydi (oq cho'kma).", "Qizdirilganda oqsil tarkibidagi aromatik halqali aminokislota qoldiqlari (tirozin, fenilalanin, triptofan) nitrolanadi — sariq rangli nitrobirikmalar hosil bo'ladi.", "Ishqoriy muhitda (ammiak qo'shilganda) rang to'q sariq-zarg'aldoqqa o'tadi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#e8c020' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Avval oq cho'kma hosil bo'ladi, qizdirilganda u sariq rangga kiradi; ammiak qo'shilganda to'q sariq (zarg'aldoq) tus oladi." },
  kinetics: "o'rtacha", app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml oqsil eritmasi quying.", "Ehtiyotlik bilan 0,5 ml konsentrlangan nitrat kislota qo'shing — oq cho'kma hosil bo'ladi.", "Probirkani qisqichga olib, ehtiyotlik bilan qizdiring va rang o'zgarishini kuzating.", "Sovigach, tomchilab ammiak eritmasi qo'shing."],
  safety: "Konsentrlangan nitrat kislota terini kuydiradi va sarg'aytiradi, bug'lari zaharli — mo'rili shkafda, qo'lqop va ko'zoynakda ishlang; qizdirishda probirka og'zini odamlarga qaratmang.",
  expl: "Ksantoprotein reaksiyasi tarkibida aromatik halqali aminokislotalar bo'lgan oqsillarni aniqlaydi. Nitrat kislota teriga tekkanda uning sarg'ayishi ham shu reaksiya bilan bog'liq.",
  q: ["Ksantoprotein reaksiyasi qaysi aminokislotalar borligini ko'rsatadi?", "Nima uchun konsentrlangan nitrat kislota teriga tekkanda teri sarg'ayadi?"],
});

R({
  title: "Oqsillarning qizdirilganda denaturatsiyasi",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: PROTEIN_FREE,
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 70, note_uz: "Oqsil eritmasi spirt lampasida qaynaguncha qizdiriladi." },
  mech: 'fizik',
  steps: ["Qizdirilganda oqsil molekulasining ikkilamchi va uchlamchi tuzilishini ushlab turgan vodorod bog'lar va boshqa kuchsiz ta'sirlar uziladi.", "Polipeptid zanjiri yoyilib, molekulalar bir-biriga yopishadi (koagulyatsiya).", "Birlamchi tuzilish (peptid bog'lari) saqlanib qoladi, lekin oqsil biologik faolligini qaytmas yo'qotadi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Tiniq oqsil eritmasi qizdirilganda oqarib loyqalanadi va oq parchalar (ivib qolgan oqsil) ajraladi; sovutilganda qayta erimaydi." },
  kinetics: "o'rtacha", app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 3 ml oqsil eritmasi quying.", "Probirkani qisqichga olib, spirt lampasida qaynaguncha qizdiring.", "Hosil bo'lgan o'zgarishni kuzating, so'ng sovutib, cho'kma qayta erimasligini tekshiring."],
  safety: "Qizdirishda probirka og'zini odamlarga qaratmang; issiq probirkani qisqichda ushlang.",
  expl: "Denaturatsiya — oqsilning tabiiy fazoviy tuzilishining buzilishi. Yuqori harorat, kuchli kislotalar, ishqorlar, og'ir metall tuzlari va spirt ta'sirida yuz beradi. Tuxum pishirilganda oqsilining oqarib qotishi issiqlik ta'sirida denaturatsiyaga misol.",
  q: ["Denaturatsiyada oqsilning qaysi tuzilish darajalari buziladi?", "Nima uchun yuqori harorat ko'pchilik mikroorganizmlarni nobud qiladi?"],
});

R({
  title: "Og'ir metall tuzlari ta'sirida oqsillarning cho'kishi",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: PROTEIN_FREE,
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 2 }, { species: 'CuSO4', state: 'aq', conc_M: 0.5, volume_mL: 0.5 }],
  mech: 'fizik',
  steps: ["Cu²⁺ kabi og'ir metall ionlari oqsilning karboksilat, aminoguruh va tiol (–SH) guruhlari bilan mustahkam bog'lanadi.", "Oqsil molekulalari bir-biri bilan \"tikiladi\" va eruvchanligini yo'qotadi.", "Hosil bo'lgan cho'kma suv qo'shilganda qayta erimaydi — denaturatsiya qaytmas."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oqsil eritmasiga mis(II) sulfat qo'shilganda havorang parchasimon cho'kma hosil bo'ladi; suv qo'shilganda u erimaydi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml oqsil eritmasi quying.", "Tomchilab mis(II) sulfat eritmasidan qo'shing.", "Cho'kma hosil bo'lishini kuzating.", "Probirkaga 3–4 ml suv qo'shib chayqating va cho'kma erimasligini tekshiring."],
  safety: "Mis tuzlari zaharli — reaktivni og'izga olmang, qo'lni yuving.",
  expl: "Og'ir metall (mis, qo'rg'oshin, simob) tuzlari oqsillarni qaytmas cho'ktiradi. Shu sababli ular tirik organizm uchun zaharli. Og'ir metall tuzlari bilan zaharlanganda birinchi yordam sifatida sut yoki tuxum oqi ichirilishi ham shunga asoslangan: tuz oshqozondagi oqsil bilan bog'lanadi.",
  q: ["Nima uchun og'ir metallarning tuzlari zaharli?", "Og'ir metall tuzi bilan zaharlanganda nima uchun sut ichiriladi?"],
});

R({
  title: "Etil spirti ta'sirida oqsillarning denaturatsiyasi",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: PROTEIN_FREE,
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 2 }, { species: 'C2H5OH', state: 'l', volume_mL: 3 }],
  mech: 'fizik',
  steps: ["Etanol oqsil molekulasi atrofidagi gidrat (suv) qobig'ini buzadi.", "Oqsil molekulasining fazoviy tuzilishini ushlab turgan gidrofob va vodorod bog'lar o'zgaradi.", "Oqsil molekulalari yopishib, oq cho'kma hosil qiladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Oqsil eritmasi etanol qo'shilganda oqarib loyqalanadi va oq parchalar ajraladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml oqsil eritmasi quying.", "Unga 3 ml etil spirti qo'shing va chayqating.", "Loyqalanish va cho'kma hosil bo'lishini kuzating."],
  safety: "Etanol yonuvchan — alangadan uzoqda ishlang.",
  expl: "Etil spirti oqsillarni denaturatsiyalaydi. Uning dezinfeksiyalovchi (mikroblarni o'ldiruvchi) ta'siri ham mikroorganizmlar oqsillarining denaturatsiyasiga asoslangan.",
  q: ["Tibbiyotda spirt nima maqsadda ishlatiladi va bu qaysi xossaga asoslangan?", "Spirt ta'sirida denaturatsiyaning issiqlik ta'siridagidan qanday o'xshash va farqli tomonlari bor?"],
});

R({
  title: "Oqsillarning tuzlar ta'sirida qaytar cho'kishi (tuzlash)",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: "Tuzlash — oqsilning gidrat qobig'ini tuz ionlari tortib olishi natijasida eruvchanligining kamayishi; kimyoviy bog'lar uzilmaydi, tenglama yozilmaydi.",
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 3 }, { species: '(NH4)2SO4', state: 's', mass_g: 2 }],
  cond: { note_uz: "Oqsil eritmasiga to'yinguncha ammoniy sulfat qo'shiladi; so'ng cho'kmaning bir qismi suvga solinadi." },
  mech: 'fizik',
  steps: ["Ko'p miqdordagi tuz ionlari suv molekulalarini o'ziga tortadi.", "Oqsil molekulalarining gidrat qobig'i kamayib, ular o'zaro birikadi va cho'kadi.", "Oqsilning fazoviy tuzilishi buzilmaydi — suv qo'shilganda cho'kma qayta eriydi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }, { type: 'dissolve' }], text_uz: "Tuz eritilgan sari eritma loyqalanib, oq parchali cho'kma hosil bo'ladi; cho'kma suvga solinganda yana eriydi." },
  kinetics: "o'rtacha", app: ['probirka', 'shpatel', 'shisha-tayoqcha'],
  proc: ["Probirkaga 3 ml oqsil eritmasi quying.", "Shpatel bilan oz-ozdan ammoniy sulfat kristallari solib, eriguncha aralashtiring.", "Cho'kma hosil bo'lishini kuzating.", "Cho'kmaning bir qismini toza suvli probirkaga o'tkazib, uning qayta erishini tekshiring."],
  safety: "Tajriba xavfsiz; reaktivlarni tatib ko'rmang.",
  expl: "Ishqoriy va ishqoriy-yer metallari hamda ammoniy tuzlarining konsentrlangan eritmalari oqsillarni qaytar cho'ktiradi (tuzlash). Bunda oqsil denaturatsiyaga uchramaydi va suyultirilganda yana eriydi. Bu usul oqsillarni ajratish va tozalashda qo'llaniladi.",
  q: ["Tuzlash denaturatsiyadan nimasi bilan farq qiladi?", "Nima uchun og'ir metall tuzlari oqsilni qaytmas cho'ktiradi, ammoniy sulfat esa qaytar?"],
});

R({
  title: "Jun ipini yondirish — oqsil tolani aniqlash",
  level: '10-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: "Oqsil yonganda ko'plab mahsulotlar (CO₂, H₂O, N₂, azot va oltingugurt birikmalari, ko'mir) hosil bo'ladi; tarkib aniq bo'lmagani uchun tenglama yozilmaydi.",
  reactants: [{ species: 'jun', state: 's', mass_g: 0.1 }],
  cond: { ignition: true, note_uz: "Jun ipining uchi pinset bilan ushlanib alangaga tutiladi; taqqoslash uchun paxta ipi ham yondiriladi." },
  mech: 'fizik',
  steps: ["Jun asosan keratin oqsilidan iborat; uning tarkibida azot va oltingugurt bor.", "Qizdirilganda oqsil parchalanib, azot va oltingugurt tutuvchi uchuvchan moddalar ajraladi — kuygan pat (soch) hidi seziladi.", "Yonish mahsuloti — oson ezilib ketadigan qora mo'rt sharcha."],
  obs: { heat: 'ekzotermik', flame: { color: '#f0a030', desc_uz: "sekin, o'z-o'zidan o'chishga moyil alanga" }, effects: [{ type: 'smoke' }, { type: 'flame' }], text_uz: "Jun ipi sekin yonadi, alangadan olinganda o'chishga moyil; kuygan soch (pat) hidi chiqadi, uchida qora mo'rt sharcha qoladi. Paxta ipi esa tez yonib, kuygan qog'oz hidini beradi va kul qoldiradi." },
  kinetics: 'tez', app: ['pinset', 'spirt-lampasi', 'chinni-kosacha'],
  proc: ["Jun ipining kichik bo'lagini pinset bilan ushlang.", "Uni spirt lampasi alangasiga tuting va yonishini kuzating.", "Alangadan olib, hidni yelpib hidlang va qoldiqni chinni kosachada barmoq bilan ezib ko'ring.", "Xuddi shunday tajribani paxta ipi bilan takrorlang va natijalarni solishtiring."],
  safety: "Yonayotgan ipni faqat pinset bilan ushlang, ostiga chinni kosacha qo'ying; tutunni chuqur hidlamang.",
  expl: "Oqsil tolalari (jun, ipak) yonganda kuygan pat hidini beradi va qora mo'rt qoldiq hosil qiladi. Sellyuloza tolalari (paxta, zig'ir) esa kuygan qog'oz hidini beradi va kul qoldiradi. Bu oddiy usul bilan tabiiy tolalarning turini aniqlash mumkin.",
  q: ["Jun va paxta tolalarini qanday farqlash mumkin?", "Jun yonganda kuygan pat hidi qaysi elementlar borligi bilan bog'liq?"],
});

R({
  title: "Oqsil tarkibida oltingugurtni aniqlash",
  level: '11-sinf', topic: T_OQSIL, engine: 'rules',
  equation_free: true, equation_free_uz: "Oltingugurt tutuvchi aminokislota qoldiqlarining ishqoriy parchalanishi ko'p bosqichli va mahsulotlari murakkab; faqat oxirgi bosqich (S²⁻ + Pb²⁺ = PbS↓) aniq yoziladi.",
  reactants: [{ species: 'oqsil', state: 'aq', volume_mL: 2 }, { species: 'NaOH', state: 'aq', conc_M: 6, volume_mL: 2 }, { species: '(CH3COO)2Pb', state: 'aq', conc_M: 0.1, volume_mL: 0.5 }],
  cond: { heating: true, temp_min_C: 90, note_uz: "Oqsil eritmasi konsentrlangan ishqor bilan 2–3 daqiqa qaynatiladi, so'ng qo'rg'oshin(II) atsetat qo'shiladi." },
  mech: 'sifat-reaksiya',
  steps: ["Ishqor bilan qaynatilganda oqsil gidrolizlanadi, oltingugurt tutuvchi aminokislota (sistein) qoldiqlaridan sulfid ionlari ajraladi.", "Qo'rg'oshin(II) ionlari sulfid ionlari bilan erimaydigan qora qo'rg'oshin(II) sulfid hosil qiladi: Pb²⁺ + S²⁻ = PbS↓.", "Eritma qorayadi yoki qo'ng'ir-qora cho'kma tushadi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#3a2a1a' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Qaynatilgan ishqoriy oqsil eritmasiga qo'rg'oshin(II) atsetat qo'shilganda eritma qo'ng'ir-qora rangga kiradi yoki qora cho'kma tushadi." },
  kinetics: "o'rtacha", app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi', 'tomizgich'],
  proc: ["Probirkaga 2 ml oqsil eritmasi va 2 ml konsentrlangan NaOH eritmasi quying.", "Aralashmani ehtiyotlik bilan 2–3 daqiqa qaynating.", "Unga bir necha tomchi qo'rg'oshin(II) atsetat eritmasi qo'shing va yana biroz qizdiring.", "Rang o'zgarishi va cho'kmani kuzating."],
  safety: "Qo'rg'oshin birikmalari zaharli; konsentrlangan ishqor qaynatilganda sachraydi — ko'zoynak va qo'lqop majburiy, chiqindini alohida idishga yig'ing.",
  expl: "Ko'pchilik oqsillar tarkibida oltingugurt tutuvchi aminokislotalar bor. Ishqor bilan parchalanganda ajralgan sulfid ionlari qo'rg'oshin tuzlari bilan qora PbS hosil qiladi. Bu reaksiya oqsil tarkibida oltingugurt borligini ko'rsatadi.",
  q: ["Oqsil tarkibida qaysi elementlar bo'ladi?", "Qora cho'kma qaysi modda?"],
  conf: "o'rta",
});

R({
  title: "Anilinning sulfat kislota bilan tuz hosil qilishi",
  level: '11-sinf', topic: T_ANILIN, engine: 'record',
  reactants: [{ species: 'C6H5NH2', state: 'l', volume_mL: 0.3 }, { species: 'H2SO4', state: 'aq', conc_M: 5, volume_mL: 1 }],
  cond: { note_uz: "Anilinli suvga sulfat kislota tomchilab qo'shiladi; probirka sovuq suvda sovutiladi." },
  eq: {
    molecular: '2C6H5NH2 + H2SO4 → (C6H5NH3)2SO4↓',
    ionic_net: '2C6H5NH2 + 2H⁺ + SO4²⁻ → (C6H5NH3)2SO4↓',
  },
  mech: 'neytrallanish',
  steps: ["Anilin molekulasidagi azot atomi sulfat kislotadan proton oladi.", "Fenilammoniy kationlari va sulfat anionlaridan ionli tuz hosil bo'ladi.", "Fenilammoniy sulfat sovuq suvda kam erigani uchun oq kristallar holida ajraladi."],
  obs: { precipitate: { species: '(C6H5NH3)2SO4', color: '#f6f6f2', texture: 'mayda-kristall' }, heat: 'ekzotermik', effects: [{ type: 'crystals' }], text_uz: "Moysimon anilin tomchilari yo'qolib, oq kristall cho'kma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'kimyoviy-stakan'],
  proc: ["Probirkaga 1 ml suv va 3–4 tomchi anilin soling.", "Ehtiyotlik bilan tomchilab sulfat kislota eritmasidan qo'shing va chayqating.", "Probirkani sovuq suvli stakanda sovuting va oq kristallar hosil bo'lishini kuzating."],
  safety: "Anilin zaharli, sulfat kislota terini kuydiradi — mo'rili shkafda, qo'lqop va ko'zoynakda ishlang.",
  expl: "Anilin asos sifatida sulfat kislota bilan tuz — fenilammoniy sulfat hosil qiladi. Bu tuz sovuq suvda kam eriydi va kristall holida ajraladi. Ishqor qo'shilsa, tuzdan yana anilin ajraladi.",
  q: ["Fenilammoniy sulfatdan anilinni qanday qayta olish mumkin?", "Anilinning asos xossasi benzol halqasi ta'sirida qanday o'zgaradi?"],
  conf: "o'rta",
});

R({
  title: "Anilinning gipoxlorit bilan sifat reaksiyasi",
  level: '11-sinf', topic: T_ANILIN, engine: 'rules',
  equation_free: true, equation_free_uz: "Anilinning gipoxlorit bilan oksidlanishida tarkibi murakkab bo'lgan rangli mahsulotlar aralashmasi hosil bo'ladi; yagona tenglama bilan ifodalanmaydi.",
  reactants: [{ species: 'C6H5NH2', state: 'l', volume_mL: 0.05 }, { species: 'NaClO', state: 'aq', conc_M: 0.7, volume_mL: 0.5 }],
  cond: { note_uz: "1 tomchi anilin 3–4 ml suvda chayqatiladi, so'ng bir necha tomchi natriy gipoxlorit (yoki xlorli ohak) eritmasi qo'shiladi." },
  mech: 'sifat-reaksiya',
  steps: ["Gipoxlorit kuchli oksidlovchi.", "U anilin molekulalarini oksidlaydi va ular o'zaro birikib rangli moddalar hosil qiladi.", "Eritma binafsha rangga bo'yaladi — anilinga xos reaksiya."],
  obs: { solution_color_change: { from: '#ffffff', to: '#6a2a8a' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Eritma asta-sekin binafsha (ko'k-binafsha) rangga bo'yaladi." },
  kinetics: "o'rtacha", app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 3–4 ml suv quying va 1 tomchi anilin qo'shib, yaxshilab chayqating.", "Unga 2–3 tomchi natriy gipoxlorit eritmasi qo'shing.", "Rang o'zgarishini kuzating."],
  safety: "Anilin zaharli; gipoxlorit kislotalar bilan aralashganda zaharli xlor ajratadi — kislota bilan aralashtirmang, mo'rili shkafda ishlang.",
  expl: "Anilin oson oksidlanadi. Xlorli ohak yoki natriy gipoxlorit ta'sirida u binafsha rangli mahsulotlar hosil qiladi — bu reaksiya anilinni aniqlashda qo'llaniladi. Havoda saqlangan anilinning qo'ng'irlashishi ham oksidlanish bilan bog'liq.",
  q: ["Nima uchun havoda saqlangan anilin qo'ng'ir rangga kiradi?", "Anilinni aniqlashning qanday sifat reaksiyalarini bilasiz?"],
  conf: "o'rta",
});

R({
  title: "Mochevinadan biuret olish va biuret reaksiyasi",
  level: '11-sinf', topic: "Amidlar va peptid bog'i", engine: 'record',
  reactants: [{ species: 'CO(NH2)2', state: 's', mass_g: 0.5 }],
  cond: { heating: true, temp_min_C: 150, note_uz: "Quruq probirkada mochevina suyuqlanguncha va qayta qotguncha qizdiriladi; so'ng qoldiq suvda eritilib, NaOH va CuSO₄ bilan sinaladi." },
  eq: { molecular: '2CO(NH2)2 → H2NCONHCONH2 + NH3↑' },
  mech: 'organik',
  steps: ["Qizdirilganda mochevina suyuqlanadi va qisman ammiak ajratib izotsian kislotaga (HN=C=O) parchalanadi.", "Izotsian kislota ikkinchi mochevina molekulasining aminoguruhi bilan birikadi.", "Ikkita –CO–NH– guruhi tutgan biuret hosil bo'ladi; ammiak gaz holida ajraladi."],
  organic: { template: 'atsil', params: { acyl: 'H2N–CO–NH2', nucleophile: 'H2N–CO–NH2', intermediate: 'HN=C=O (izotsian kislota)', leaving: 'NH3', product: 'H2N–CO–NH–CO–NH2' } },
  obs: { gas: { species: 'NH3', color: null, smell_uz: "o'tkir ammiak hidi" }, heat: 'endotermik', effects: [{ type: 'boil' }], text_uz: "Mochevina suyuqlanadi, ammiak hidi keladi (ho'l qizil lakmus qog'ozi ko'karadi), so'ng suyuqlik oq massaga aylanib qotadi. Uning eritmasi NaOH va CuSO₄ bilan binafsha rang beradi." },
  kinetics: "o'rtacha", app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi', 'indikator-qogozi', 'tomizgich'],
  proc: ["Quruq probirkaga 0,5 g mochevina soling.", "Probirkani qisqichga olib, mochevina suyuqlanguncha ehtiyotlik bilan qizdiring; og'ziga ho'llangan qizil lakmus qog'ozini tuting.", "Suyuqlik qotib, oq massa hosil bo'lgach qizdirishni to'xtating.", "Sovigan qoldiqni 2 ml suvda eriting, 1 ml NaOH eritmasi va 1 tomchi CuSO₄ eritmasi qo'shing, rangni kuzating."],
  safety: "Ajraladigan ammiak nafas yo'llarini qitiqlaydi — mo'rili shkafda ishlang; probirka og'zini odamlarga qaratmang.",
  expl: "Mochevina qizdirilganda ikki molekulasidan ammiak ajralib, biuret hosil bo'ladi. Biuret molekulasida oqsillardagidek ikkita –CO–NH– guruhi bor, shuning uchun u ishqoriy muhitda Cu²⁺ bilan binafsha rang beradi. Oqsillarning biuret reaksiyasi nomi shu moddadan olingan.",
  q: ["Biuret molekulasida nechta peptid (amid) guruhi bor?", "Ajralayotgan gaz qanday aniqlanadi?"],
});

writeFileSync(join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${CAT}.json`), JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n');
console.log(`${CAT}: ${out.length} ta yozuv`);
