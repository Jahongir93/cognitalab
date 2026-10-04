// "sifat-reaksiyalari" toifasi (kation va anionlarning sifat reaksiyalari) yozuvlari generatori.
// Ishga tushirish: node tools/seed/reactions/sifat-reaksiyalari.mjs -> frontend/lab/data/reactions/sifat-reaksiyalari.json
// Cho'kma rangi/tuzilishi, gaz ma'lumotlari va alanga ranglari bazadan (substances.json, ions.json) olinadi.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DATA = join(ROOT, 'frontend', 'lab', 'data');
const SUBS = JSON.parse(readFileSync(join(DATA, 'substances.json'), 'utf8'));
const IONS = JSON.parse(readFileSync(join(DATA, 'ions.json'), 'utf8'));
const CAT = 'sifat-reaksiyalari';
const PREFIX = 'sifat';

function sub(id) {
  const s = SUBS[id];
  if (!s) throw new Error(`modda yo'q: ${id}`);
  return s;
}
function ppt(id) {
  const s = sub(id);
  const p = s.precipitate || { color: s.appearance?.color, texture: 'mayda-kristall' };
  return { species: id, color: p.color, texture: p.texture };
}
function gas(id) {
  const s = sub(id);
  return { species: id, color: s.gas?.color ?? (s.state === 'g' ? s.appearance?.color ?? null : null), smell_uz: s.gas?.smell_uz ?? null };
}
const ionColor = (id) => IONS[id]?.color?.hex;

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
  if (o.flame_test) r.flame_test = o.flame_test;
  if (o.equation_free) { r.equation_free = true; r.equation_free_uz = o.equation_free_uz; }
  r.reactants = o.reactants;
  r.conditions = { heating: false, temp_min_C: null, catalyst: null, medium: null, light: false, note_uz: null, ...(o.cond || {}) };
  r.equation = { molecular: null, ionic_full: null, ionic_net: null, electron_balance: null, ...(o.eq || {}) };
  r.mechanism = { type: o.mech, steps_uz: o.steps, organic: null };
  r.observations = { precipitate: null, gas: null, solution_color_change: null, heat: 'sezilarsiz', flame: null, effects: [], text_uz: '', ...(o.obs || {}) };
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
const TUBE = ['probirka', 'tomizgich'];
const HOOD = "Tajriba mo'rili shkafda o'tkaziladi";
const GOGGLES = "Ko'zoynak taqing; reaktivlarni tomizgich bilan oz miqdorda oling.";

// =================================================================================== KATIONLAR
// ---------------------------------------------------------------------------------- Ag+
R({
  title: "Kumush ionini xlorid kislota bilan aniqlash",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: kumush ioni", engine: 'rules',
  reactants: [
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'HCl', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'AgNO3 + HCl = AgCl↓ + HNO3',
    ionic_full: 'Ag⁺ + NO3⁻ + H⁺ + Cl⁻ = AgCl↓ + H⁺ + NO3⁻',
    ionic_net: 'Ag⁺ + Cl⁻ = AgCl↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ag⁺ va Cl⁻ ionlari uchrashganda suvda deyarli erimaydigan AgCl hosil bo'ladi.", "Cho'kma oq, ivib qolgan (suzmasimon) ko'rinishda bo'ladi.", "AgCl nitrat kislotada erimaydi — bu boshqa oq cho'kmalardan farqlashga yordam beradi."],
  obs: { precipitate: ppt('AgCl'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq suzmasimon cho'kma tushadi; yorug'likda asta-sekin qorayadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml tekshiriladigan eritma (kumush nitrat) quying.", "Tomizgich bilan 2–3 tomchi suyultirilgan xlorid kislota qo'shing.", "Hosil bo'lgan cho'kmaning rangi va ko'rinishini kuzating.", "Cho'kmaga bir necha tomchi nitrat kislota qo'shib, erimasligiga ishonch hosil qiling."],
  safety: `Kumush nitrat teri va kiyimni qoraytiradi. ${GOGGLES}`,
  explanation: "Kumush ioni xlorid ionlari bilan kislotalarda erimaydigan oq suzmasimon AgCl cho'kmasini hosil qiladi. Shuning uchun xlorid kislota (yoki xloridlar) kumush ioniga, kumush nitrat esa xlorid ioniga reaktiv bo'ladi.",
  questions: ["Nima uchun Ag⁺ ni aniqlashda xloridlardan foydalaniladi?", "AgCl cho'kmasini yorug'likda qoldirsak nima kuzatiladi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Kumush xlorid cho'kmasining ammiakda erishi",
  level: '11-sinf', topic: "Kompleks birikmalar; kumush ionini tasdiqlash", engine: 'rules',
  reactants: [
    { species: 'AgCl', state: 's', mass_g: 0.05, form: 'kukun' },
    { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 2, excess: true },
  ],
  cond: { note_uz: "Oldingi tajribada olingan AgCl cho'kmasiga ammiakli suv qo'shiladi." },
  eq: {
    molecular: 'AgCl + 2NH3 = [Ag(NH3)2]Cl',
    ionic_full: 'AgCl + 2NH3 = [Ag(NH3)2]⁺ + Cl⁻',
    ionic_net: 'AgCl + 2NH3 = [Ag(NH3)2]⁺ + Cl⁻',
  },
  mech: 'kompleks',
  steps: ["Ammiak molekulalari azotning bo'linmagan elektron jufti hisobiga Ag⁺ ioniga birikadi.", "Barqaror diamminkumush kompleks ioni [Ag(NH₃)₂]⁺ hosil bo'ladi.", "Eritmadagi erkin Ag⁺ kamayib ketgani uchun AgCl cho'kmasi eriydi; nitrat kislota qo'shilsa kompleks parchalanib, AgCl qayta cho'kadi."],
  obs: { heat: 'sezilarsiz', effects: fx('dissolve'), text_uz: "Oq cho'kma ammiakli suvda erib, rangsiz tiniq eritma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Kumush xlorid cho'kmasi bor probirkaga tomchilab ammiakli suv qo'shing va chayqating.", "Cho'kmaning to'liq erishini kuzating.", "Hosil bo'lgan eritmaga nitrat kislota tomizib, oq cho'kma qayta tushishini kuzating."],
  safety: `Ammiakli suv o'tkir hidli — hidlamang. Kumush ammiakatli eritmani uzoq saqlamang (portlovchi birikmalar hosil bo'lishi mumkin) — tajribadan so'ng darhol kislotalab to'kib tashlang. ${GOGGLES}`,
  explanation: "Kumush xlorid ammiakda eruvchan kompleks — diamminkumush xlorid hosil qilib eriydi, AgBr qisman, AgI esa umuman erimaydi. Bu xossa kumush ionini va galogenid ionlarini bir-biridan farqlashda qo'llaniladi.",
  questions: ["Nima uchun AgCl ammiakda eriydi?", "Eritmaga nitrat kislota qo'shilsa nima uchun cho'kma qayta tushadi?", "AgCl, AgBr va AgI ni ammiak yordamida qanday farqlash mumkin?"],
});

R({
  title: "Kumush ionining kaliy xromat bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: kumush ioni", engine: 'rules',
  reactants: [
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K2CrO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: '2AgNO3 + K2CrO4 = Ag2CrO4↓ + 2KNO3',
    ionic_full: '2Ag⁺ + 2NO3⁻ + 2K⁺ + CrO4²⁻ = Ag2CrO4↓ + 2K⁺ + 2NO3⁻',
    ionic_net: '2Ag⁺ + CrO4²⁻ = Ag2CrO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kumush ionlari xromat ionlari bilan kam eriydigan kumush xromat hosil qiladi.", "Cho'kma g'isht-qizil rangli bo'ladi.", "Bu reaksiya neytral muhitda olib boriladi: kislotada xromat dixromatga o'tadi, ishqorda esa Ag₂O cho'kadi."],
  obs: { precipitate: ppt('Ag2CrO4'), solution_color_change: { from: ionColor('CrO4^2-'), to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Sariq eritmada g'isht-qizil cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kumush nitrat eritmasi quying.", "2–3 tomchi kaliy xromat eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Xromatlar zaharli va kanserogen — qo'lqopda ishlang, chiqindini maxsus idishga to'king. ${GOGGLES}`,
  explanation: "Kumush xromat g'isht-qizil rangli kam eriydigan tuz. Bu reaksiya neytral muhitda kumush ionini aniqlashda, shuningdek xloridlarni kumush nitrat bilan titrlashda (Mor usuli) indikator reaksiya sifatida qo'llaniladi.",
  questions: ["Nima uchun reaksiya neytral muhitda olib boriladi?", "Mor usulida kaliy xromat qanday vazifani bajaradi?", "Kumush xromat cho'kmasi qanday rangda?"],
});

R({
  title: "Kumush ionining ishqor bilan reaksiyasi — kumush(I) oksid hosil bo'lishi",
  level: '10-sinf', topic: "Kationlarga sifat reaksiyalar: kumush ioni", engine: 'rules',
  reactants: [
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: '2AgNO3 + 2NaOH = Ag2O↓ + 2NaNO3 + H2O',
    ionic_full: '2Ag⁺ + 2NO3⁻ + 2Na⁺ + 2OH⁻ = Ag2O↓ + 2Na⁺ + 2NO3⁻ + H2O',
    ionic_net: '2Ag⁺ + 2OH⁻ = Ag2O↓ + H2O',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ag⁺ ionlari OH⁻ ionlari bilan dastlab kumush gidroksid hosil qiladi.", "AgOH beqaror bo'lib, darhol suv ajratib kumush(I) oksidga aylanadi.", "Qo'ng'ir Ag₂O cho'kmasi tushadi."],
  obs: { precipitate: ppt('Ag2O'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Qo'ng'ir (to'q jigarrang) cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kumush nitrat eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Ishqor va kumush nitrat terini kuydiradi. ${GOGGLES}`,
  explanation: "Kumush gidroksid oddiy sharoitda mavjud bo'lmaydi: u hosil bo'lishi bilanoq qo'ng'ir kumush(I) oksidga parchalanadi. Bu kumush ionining ishqorlar bilan boshqa metall ionlaridan farq qiluvchi xususiyatidir.",
  questions: ["Nima uchun AgOH o'rniga Ag₂O cho'kadi?", "Ag₂O ammiakli suvda erisa qanday reaktiv hosil bo'ladi?", "Qisqartirilgan ionli tenglamani yozing."],
});

// ---------------------------------------------------------------------------------- Ba2+
R({
  title: "Bariy ionini sulfat kislota bilan aniqlash",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: bariy ioni", engine: 'rules',
  reactants: [
    { species: 'BaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'BaCl2 + H2SO4 = BaSO4↓ + 2HCl',
    ionic_full: 'Ba²⁺ + 2Cl⁻ + 2H⁺ + SO4²⁻ = BaSO4↓ + 2H⁺ + 2Cl⁻',
    ionic_net: 'Ba²⁺ + SO4²⁻ = BaSO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ba²⁺ va SO₄²⁻ ionlari suvda amalda erimaydigan BaSO₄ ni hosil qiladi.", "Cho'kma oq, mayda kristall holda tushadi.", "BaSO₄ kislotalarda ham erimaydi — bu uni BaCO₃, BaSO₃ dan farqlaydi."],
  obs: { precipitate: ppt('BaSO4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq mayda kristall cho'kma tushadi; u xlorid va nitrat kislotalarda erimaydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml bariy xlorid eritmasi quying.", "Tomchilab suyultirilgan sulfat kislota qo'shing.", "Cho'kmaga xlorid kislota qo'shib, erimasligini tekshiring."],
  safety: `Eruvchan bariy tuzlari zaharli — og'izga tegmasin, ishdan so'ng qo'lingizni yuving. ${GOGGLES}`,
  explanation: "Bariy ioni sulfat ionlari bilan kislotalarda ham erimaydigan oq bariy sulfat cho'kmasini beradi. Sulfat kislota yoki eruvchan sulfatlar bariy ioniga, bariy tuzlari esa sulfat ioniga reaktivdir.",
  questions: ["Bariy ionini qanday reaktiv bilan aniqlash mumkin?", "Nima uchun BaSO₄ rentgen tekshiruvida zararsiz, BaCl₂ esa zaharli?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Bariy ionining kaliy xromat bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: bariy ioni", engine: 'rules',
  reactants: [
    { species: 'BaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K2CrO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'BaCl2 + K2CrO4 = BaCrO4↓ + 2KCl',
    ionic_full: 'Ba²⁺ + 2Cl⁻ + 2K⁺ + CrO4²⁻ = BaCrO4↓ + 2K⁺ + 2Cl⁻',
    ionic_net: 'Ba²⁺ + CrO4²⁻ = BaCrO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ba²⁺ ionlari xromat ionlari bilan sariq bariy xromatni hosil qiladi.", "BaCrO₄ sirka kislotada erimaydi, kuchli kislotalarda esa eriydi.", "Shu xossa bariyni kalsiy va stronsiydan ajratishda ishlatiladi."],
  obs: { precipitate: ppt('BaCrO4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Sariq kristall cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml bariy xlorid eritmasi quying.", "2–3 tomchi kaliy xromat eritmasidan qo'shing.", "Cho'kmaga sirka kislota qo'shib, erimasligini kuzating."],
  safety: `Bariy tuzlari va xromatlar zaharli — qo'lqopda ishlang. ${GOGGLES}`,
  explanation: "Bariy ioni xromat ionlari bilan sariq bariy xromat cho'kmasini hosil qiladi. Kalsiy ioni bunday sharoitda cho'kma bermaydi, shuning uchun bu reaksiya bariyni kalsiydan farqlashga imkon beradi.",
  questions: ["Bariy xromat qanday rangda?", "Bu reaksiya yordamida bariyni kalsiydan qanday farqlash mumkin?", "Nima uchun cho'kmani sirka kislotada tekshirish kerak?"],
});

// ---------------------------------------------------------------------------------- Ca2+
R({
  title: "Kalsiy ionini ammoniy oksalat bilan aniqlash",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: kalsiy ioni", engine: 'rules',
  reactants: [
    { species: 'CaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: '(NH4)2C2O4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'CaCl2 + (NH4)2C2O4 = CaC2O4↓ + 2NH4Cl',
    ionic_full: 'Ca²⁺ + 2Cl⁻ + 2NH4⁺ + C2O4²⁻ = CaC2O4↓ + 2NH4⁺ + 2Cl⁻',
    ionic_net: 'Ca²⁺ + C2O4²⁻ = CaC2O4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ca²⁺ va oksalat ionlari juda kam eriydigan kalsiy oksalatni hosil qiladi.", "Oq mayda kristall cho'kma tushadi.", "CaC₂O₄ sirka kislotada erimaydi, xlorid kislotada esa eriydi."],
  obs: { precipitate: ppt('CaC2O4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq mayda kristall cho'kma hosil bo'ladi; u sirka kislotada erimaydi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kalsiy xlorid eritmasi quying.", "1 ml ammoniy oksalat eritmasi qo'shing.", "Cho'kmani ikki qismga bo'lib, biriga sirka kislota, ikkinchisiga xlorid kislota qo'shing va solishtiring."],
  safety: `Oksalatlar zaharli — og'izga tegmasin. ${GOGGLES}`,
  explanation: "Kalsiy ioni oksalat ionlari bilan sirka kislotada erimaydigan oq kalsiy oksalat cho'kmasini beradi — bu kalsiyga xos sifat reaksiya. Buyrak toshlarining asosiy qismi ham kalsiy oksalatdan iborat.",
  questions: ["Kalsiy oksalat qaysi kislotada eriydi, qaysisida erimaydi?", "Bu reaksiya kalsiyni magniydan qanday farqlashga yordam beradi?", "Organizmda kalsiy oksalat qayerda uchraydi?"],
});

// ------------------------------------------------------------------------------- Fe2+, Fe3+
R({
  title: "Temir(II) ionini qizil qon tuzi bilan aniqlash (Turnbul ko'ki)",
  level: '9-sinf', topic: "Temir ionlariga sifat reaksiyalar", engine: 'record',
  reactants: [
    { species: 'FeSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K3[Fe(CN)6]', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  cond: { note_uz: "Temir(II) sulfat eritmasi yangi tayyorlangan bo'lishi kerak." },
  eq: {
    molecular: '3FeSO4 + 2K3[Fe(CN)6] = Fe3[Fe(CN)6]2↓ + 3K2SO4',
    ionic_full: '3Fe²⁺ + 3SO4²⁻ + 6K⁺ + 2[Fe(CN)6]³⁻ = Fe3[Fe(CN)6]2↓ + 6K⁺ + 3SO4²⁻',
    ionic_net: '3Fe²⁺ + 2[Fe(CN)6]³⁻ = Fe3[Fe(CN)6]2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Fe²⁺ ionlari geksatsianoferrat(III) ionlari bilan birikadi.", "To'q ko'k rangli cho'kma — Turnbul ko'ki hosil bo'ladi.", "Fe³⁺ ionlari bu reaktiv bilan ko'k cho'kma bermaydi, shuning uchun reaksiya Fe²⁺ ga xos."],
  obs: { precipitate: ppt('Fe3[Fe(CN)6]2'), heat: 'sezilarsiz', effects: fx('turbidity', 'swirl'), text_uz: "Och yashil eritmada darhol to'q ko'k cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml yangi tayyorlangan temir(II) sulfat eritmasi quying.", "1–2 tomchi kaliy geksatsianoferrat(III) (qizil qon tuzi) eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Qon tuzlarini kuchli kislotalar bilan qizdirmang — zaharli HCN ajralishi mumkin. ${GOGGLES}`,
  explanation: "Temir(II) ioni qizil qon tuzi bilan to'q ko'k Turnbul ko'ki cho'kmasini hosil qiladi. Zamonaviy tadqiqotlarga ko'ra Turnbul ko'ki va Berlin lazuri tarkibi bir xil, ammo maktab kursida ular alohida formulalar bilan yoziladi. Bu reaksiya Fe²⁺ ni Fe³⁺ dan farqlashda qo'llaniladi.",
  questions: ["Fe²⁺ ioniga qaysi reaktiv sifat reaksiya beradi?", "Fe³⁺ ionini qaysi reaktivlar bilan aniqlash mumkin?", "Nima uchun temir(II) sulfat eritmasi yangi tayyorlangan bo'lishi kerak?"],
});

R({
  title: "Temir(III) ionini sariq qon tuzi bilan aniqlash (Berlin lazuri)",
  level: '9-sinf', topic: "Temir ionlariga sifat reaksiyalar", engine: 'record',
  reactants: [
    { species: 'FeCl3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K4[Fe(CN)6]', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: '4FeCl3 + 3K4[Fe(CN)6] = Fe4[Fe(CN)6]3↓ + 12KCl',
    ionic_full: '4Fe³⁺ + 12Cl⁻ + 12K⁺ + 3[Fe(CN)6]⁴⁻ = Fe4[Fe(CN)6]3↓ + 12K⁺ + 12Cl⁻',
    ionic_net: '4Fe³⁺ + 3[Fe(CN)6]⁴⁻ = Fe4[Fe(CN)6]3↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Fe³⁺ ionlari geksatsianoferrat(II) ionlari bilan birikadi.", "To'q ko'k rangli Berlin lazuri cho'kmasi hosil bo'ladi.", "Fe²⁺ ionlari bu reaktiv bilan oq (havoda ko'karuvchi) cho'kma beradi, ko'k emas."],
  obs: { precipitate: ppt('Fe4[Fe(CN)6]3'), heat: 'sezilarsiz', effects: fx('turbidity', 'swirl'), text_uz: "Sarg'ish eritmada to'q ko'k cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml temir(III) xlorid eritmasi quying.", "1–2 tomchi kaliy geksatsianoferrat(II) (sariq qon tuzi) eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Qon tuzlarini kuchli kislotalar bilan qizdirmang. ${GOGGLES}`,
  explanation: "Temir(III) ioni sariq qon tuzi bilan to'q ko'k Berlin lazuri cho'kmasini beradi. Bu juda sezgir reaksiya bo'lib, Fe³⁺ ning oz miqdorini ham aniqlashga imkon beradi; Berlin lazuri bo'yoq sifatida ham ishlatiladi.",
  questions: ["Fe³⁺ ga qaysi reaktivlar sifat reaksiya beradi?", "Berlin lazuri va Turnbul ko'ki qanday reaktivlardan olinadi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Temir(III) ionini kaliy rodanid bilan aniqlash",
  level: '9-sinf', topic: "Temir ionlariga sifat reaksiyalar", engine: 'record',
  reactants: [
    { species: 'FeCl3', state: 'aq', conc_M: 0.05, volume_mL: 1 },
    { species: 'KSCN', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'FeCl3 + 3KSCN = Fe(SCN)3 + 3KCl',
    ionic_full: 'Fe³⁺ + 3Cl⁻ + 3K⁺ + 3SCN⁻ = Fe(SCN)3 + 3K⁺ + 3Cl⁻',
    ionic_net: 'Fe³⁺ + 3SCN⁻ = Fe(SCN)3',
  },
  mech: 'kompleks',
  steps: ["Fe³⁺ ionlari tiotsianat (rodanid) ionlari bilan kompleks birikmalar hosil qiladi.", "Temir(III) tiotsianat eritmani qon-qizil rangga bo'yaydi.", "Fe²⁺ ionlari rodanid bilan bunday rang bermaydi."],
  obs: { solution_color_change: { from: ionColor('Fe^3+'), to: sub('Fe(SCN)3').aq_color.hex }, heat: 'sezilarsiz', effects: fx('swirl'), text_uz: "Och sariq eritma bir zumda qon-qizil rangga kiradi; cho'kma tushmaydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml suyultirilgan temir(III) xlorid eritmasi quying.", "1–2 tomchi kaliy rodanid eritmasidan qo'shing.", "Eritma rangini kuzating."],
  safety: `Rodanidlarni kuchli kislotalar bilan qizdirmang. ${GOGGLES}`,
  explanation: "Temir(III) ionlari rodanid ionlari bilan qon-qizil rangli kompleks hosil qiladi. Bu Fe³⁺ ga eng sezgir sifat reaksiyalardan biri: hatto juda oz miqdordagi temir(III) ham eritmani pushti-qizil rangga bo'yaydi.",
  questions: ["Bu reaksiyada cho'kma hosil bo'ladimi?", "Fe²⁺ eritmasiga KSCN qo'shilsa nima kuzatiladi?", "Eski FeSO₄ eritmasi KSCN bilan pushti rang bersa, bu nimani bildiradi?"],
});

R({
  title: "Temir(III) ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Temir ionlariga sifat reaksiyalar", engine: 'rules',
  reactants: [
    { species: 'FeCl3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'FeCl3 + 3NaOH = Fe(OH)3↓ + 3NaCl',
    ionic_full: 'Fe³⁺ + 3Cl⁻ + 3Na⁺ + 3OH⁻ = Fe(OH)3↓ + 3Na⁺ + 3Cl⁻',
    ionic_net: 'Fe³⁺ + 3OH⁻ = Fe(OH)3↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Fe³⁺ ionlari gidroksid ionlari bilan erimaydigan temir(III) gidroksidni hosil qiladi.", "Cho'kma qo'ng'ir-qizg'ish, iviqsimon ko'rinishda bo'ladi.", "Fe(OH)₃ ortiqcha ishqorda erimaydi."],
  obs: { precipitate: ppt('Fe(OH)3'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Qo'ng'ir-qizg'ish iviqsimon cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml temir(III) xlorid eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kma rangini kuzating, ortiqcha ishqor qo'shib erimasligini tekshiring."],
  safety: `Ishqor terini kuydiradi. ${GOGGLES}`,
  explanation: "Temir(III) ioni ishqorlar bilan qo'ng'ir temir(III) gidroksid cho'kmasini beradi. Bu cho'kma rangi Fe³⁺ ni Fe²⁺ (yashil-oq cho'kma) dan oson farqlashga imkon beradi.",
  questions: ["Fe(OH)₃ va Fe(OH)₂ cho'kmalari rangi bilan qanday farq qiladi?", "Fe(OH)₃ qizdirilsa nima hosil bo'ladi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Temir(II) ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Temir ionlariga sifat reaksiyalar", engine: 'rules',
  reactants: [
    { species: 'FeSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'FeSO4 + 2NaOH = Fe(OH)2↓ + Na2SO4',
    ionic_full: 'Fe²⁺ + SO4²⁻ + 2Na⁺ + 2OH⁻ = Fe(OH)2↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Fe²⁺ + 2OH⁻ = Fe(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Fe²⁺ ionlari gidroksid ionlari bilan temir(II) gidroksidni hosil qiladi.", "Cho'kma yashil-oq (och yashil) iviqsimon bo'ladi.", "Havoda Fe(OH)₂ kislorod ta'sirida asta-sekin qo'ng'ir Fe(OH)₃ ga oksidlanadi: 4Fe(OH)₂ + O₂ + 2H₂O = 4Fe(OH)₃."],
  obs: { precipitate: ppt('Fe(OH)2'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Och yashil iviqsimon cho'kma hosil bo'ladi; havoda yuqori qismidan boshlab asta-sekin qo'ng'irlashadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml yangi tayyorlangan temir(II) sulfat eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kma rangini darhol va 10–15 daqiqadan keyin kuzating."],
  safety: `Ishqor terini kuydiradi. ${GOGGLES}`,
  explanation: "Temir(II) ioni ishqor bilan yashil-oq temir(II) gidroksid cho'kmasini beradi. U havodagi kislorod ta'sirida temir(III) gidroksidga oksidlanib qo'ng'ir tusga kiradi — bu temir(II) birikmalarining qaytaruvchilik xossasini ko'rsatadi.",
  questions: ["Nima uchun Fe(OH)₂ cho'kmasi havoda qo'ng'irlashadi?", "Fe²⁺ va Fe³⁺ ni ishqor yordamida qanday farqlash mumkin?", "Fe(OH)₂ ning oksidlanish tenglamasini yozing."],
});

// ---------------------------------------------------------------------------------- Cu2+
R({
  title: "Mis(II) ionini ammiakli suv bilan aniqlash",
  level: '11-sinf', topic: "Kationlarga sifat reaksiyalar: mis(II) ioni; kompleks birikmalar", engine: 'rules',
  reactants: [
    { species: 'CuSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 2, excess: true },
  ],
  cond: { note_uz: "Ammiakli suv avval tomchilab, so'ng ortiqcha miqdorda qo'shiladi." },
  eq: {
    molecular: 'CuSO4 + 4NH3 = [Cu(NH3)4]SO4',
    ionic_full: 'Cu²⁺ + SO4²⁻ + 4NH3 = [Cu(NH3)4]²⁺ + SO4²⁻',
    ionic_net: 'Cu²⁺ + 4NH3 = [Cu(NH3)4]²⁺',
  },
  mech: 'kompleks',
  steps: ["Oz miqdordagi ammiak eritmani ishqoriy qilib, havorang Cu(OH)₂ (asosli tuz) cho'kmasini hosil qiladi.", "Ortiqcha ammiak molekulalari Cu²⁺ ioniga donor-akseptor bog' orqali birikadi.", "To'q ko'k tetraamminmis(II) ioni [Cu(NH₃)₄]²⁺ hosil bo'lib, cho'kma eriydi."],
  obs: { solution_color_change: { from: ionColor('Cu^2+'), to: ionColor('[Cu(NH3)4]^2+') }, heat: 'sezilarsiz', effects: fx('turbidity', 'dissolve', 'swirl'), text_uz: "Avval havorang cho'kma tushadi, ortiqcha ammiakda u erib, eritma to'q ko'k (ko'k-binafsha) rangga kiradi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml mis(II) sulfat eritmasi quying.", "Tomchilab ammiakli suv qo'shing va havorang cho'kma hosil bo'lishini kuzating.", "Ammiakli suvni ortiqcha qo'shib, cho'kmaning erishi va eritma rangini kuzating."],
  safety: `Ammiakli suv o'tkir hidli — hidlamang. ${GOGGLES}`,
  explanation: "Mis(II) ioni ortiqcha ammiak bilan to'q ko'k rangli tetraamminmis(II) kompleks ionini hosil qiladi. Bu rang juda yaqqol bo'lgani uchun reaksiya mis ionlarini aniqlashning eng qulay usulidir.",
  questions: ["Nima uchun dastlab cho'kma tushadi, keyin eriydi?", "Kompleks iondagi ligand va markaziy ionni ko'rsating.", "Qaysi boshqa metall gidroksidlari ortiqcha ammiakda eriydi?"],
});

R({
  title: "Mis(II) ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: mis(II) ioni", engine: 'rules',
  reactants: [
    { species: 'CuSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'CuSO4 + 2NaOH = Cu(OH)2↓ + Na2SO4',
    ionic_full: 'Cu²⁺ + SO4²⁻ + 2Na⁺ + 2OH⁻ = Cu(OH)2↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Cu²⁺ + 2OH⁻ = Cu(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Cu²⁺ ionlari gidroksid ionlari bilan mis(II) gidroksidni hosil qiladi.", "Havorang iviqsimon cho'kma tushadi.", "Qizdirilganda Cu(OH)₂ qora CuO ga parchalanadi."],
  obs: { precipitate: ppt('Cu(OH)2'), solution_color_change: { from: ionColor('Cu^2+'), to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Havorang iviqsimon cho'kma hosil bo'ladi; qizdirilganda qorayadi." },
  kinetics: 'bir-zumda',
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml mis(II) sulfat eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kmali probirkani ehtiyotkorlik bilan qizdirib, rang o'zgarishini kuzating."],
  safety: `Ishqor terini kuydiradi; qizdirishda probirka og'zini o'zingizga qaratmang. ${GOGGLES}`,
  explanation: "Mis(II) ioni ishqorlar bilan havorang mis(II) gidroksid cho'kmasini beradi; qizdirilganda u qora mis(II) oksidga aylanadi. Cho'kmaning o'ziga xos rangi mis ionini aniqlashga imkon beradi.",
  questions: ["Mis(II) gidroksid qanday rangda?", "Cu(OH)₂ qizdirilganda qanday o'zgarish kuzatiladi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Mis(II) ionining sariq qon tuzi bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: mis(II) ioni", engine: 'record',
  reactants: [
    { species: 'CuSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K4[Fe(CN)6]', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: '2CuSO4 + K4[Fe(CN)6] = Cu2[Fe(CN)6]↓ + 2K2SO4',
    ionic_full: '2Cu²⁺ + 2SO4²⁻ + 4K⁺ + [Fe(CN)6]⁴⁻ = Cu2[Fe(CN)6]↓ + 4K⁺ + 2SO4²⁻',
    ionic_net: '2Cu²⁺ + [Fe(CN)6]⁴⁻ = Cu2[Fe(CN)6]↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Cu²⁺ ionlari geksatsianoferrat(II) ionlari bilan birikadi.", "Qizil-qo'ng'ir mis(II) geksatsianoferrat(II) cho'kmasi hosil bo'ladi.", "Cho'kma suyultirilgan kislotalarda erimaydi, ammiakda eriydi."],
  obs: { precipitate: ppt('Cu2[Fe(CN)6]'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Qizil-qo'ng'ir cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml mis(II) sulfat eritmasi quying.", "1–2 tomchi sariq qon tuzi eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Qon tuzlarini kuchli kislotalar bilan qizdirmang. ${GOGGLES}`,
  explanation: "Mis(II) ioni sariq qon tuzi bilan qizil-qo'ng'ir cho'kma beradi. Bu reaksiya juda sezgir bo'lib, ammiak bilan reaksiyani tasdiqlovchi qo'shimcha sinov sifatida qo'llaniladi.",
  questions: ["Cu²⁺ ga qanday sifat reaksiyalarni bilasiz?", "Sariq qon tuzi Fe³⁺ va Cu²⁺ bilan qanday rangli cho'kmalar beradi?", "Cho'kmaning formulasini yozing."],
});

R({
  title: "Mis(II) ionining kaliy yodid bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: mis(II) ioni", engine: 'rules',
  reactants: [
    { species: 'CuSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'KI', state: 'aq', conc_M: 0.5, volume_mL: 1 },
  ],
  eq: {
    molecular: '2CuSO4 + 4KI = 2CuI↓ + I2 + 2K2SO4',
    ionic_full: '2Cu²⁺ + 2SO4²⁻ + 4K⁺ + 4I⁻ = 2CuI↓ + I2 + 4K⁺ + 2SO4²⁻',
    ionic_net: '2Cu²⁺ + 4I⁻ = 2CuI↓ + I2',
    electron_balance: ['Cu⁺² + 1e⁻ = Cu⁺¹', '2I⁻¹ − 2e⁻ = I2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Cu²⁺ ionlari yodid ionlarini erkin yodgacha oksidlaydi.", "Mis +1 oksidlanish darajasigacha qaytarilib, erimaydigan oq mis(I) yodid hosil qiladi.", "Ajralgan yod cho'kmani va eritmani qo'ng'ir rangga bo'yaydi."],
  obs: { precipitate: ppt('CuI'), solution_color_change: { from: ionColor('Cu^2+'), to: sub('I2').aq_color.hex }, heat: 'sezilarsiz', effects: fx('turbidity', 'swirl'), text_uz: "Qo'ng'ir eritma va iflos-oq (sarg'ish-qo'ng'ir tusli) cho'kma hosil bo'ladi; natriy tiosulfat bilan yod yo'qotilsa, cho'kmaning oq rangi ko'rinadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml mis(II) sulfat eritmasi quying.", "1 ml kaliy yodid eritmasidan qo'shing.", "Eritma va cho'kma rangini kuzating; bir necha tomchi natriy tiosulfat qo'shib, cho'kmaning oqarishini kuzating."],
  safety: GOGGLES,
  explanation: "Mis(II) ioni yodid ionlari bilan oksidlanish-qaytarilish reaksiyasiga kirishadi: oq mis(I) yodid cho'kadi va erkin yod ajraladi. Bu reaksiya misni yodometrik aniqlashning asosidir.",
  questions: ["Bu reaksiyada qaysi ion oksidlovchi?", "Nima uchun cho'kma qo'ng'ir ko'rinadi?", "Natriy tiosulfat qo'shilganda nima uchun cho'kma oqaradi?"],
});

// --------------------------------------------------------------------------------- NH4+
R({
  title: "Ammoniy ionini ishqor bilan qizdirib aniqlash",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: ammoniy ioni", engine: 'rules',
  reactants: [
    { species: '(NH4)2SO4', state: 'aq', conc_M: 0.5, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  cond: { heating: true, note_uz: "Aralashma ehtiyotkorlik bilan isitiladi; probirka og'ziga ho'llangan qizil lakmus qog'ozi tutiladi." },
  eq: {
    molecular: '(NH4)2SO4 + 2NaOH = Na2SO4 + 2NH3↑ + 2H2O',
    ionic_full: '2NH4⁺ + SO4²⁻ + 2Na⁺ + 2OH⁻ = 2Na⁺ + SO4²⁻ + 2NH3↑ + 2H2O',
    ionic_net: 'NH4⁺ + OH⁻ = NH3↑ + H2O',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kuchli asos OH⁻ ammoniy ionidan proton tortib oladi.", "Hosil bo'lgan ammiak isitilganda eritmadan gaz holida ajraladi.", "Ammiak ho'l qizil lakmusni ko'k rangga bo'yaydi va o'ziga xos hidga ega."],
  obs: { gas: gas('NH3'), heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Isitilganda novshadil hidi paydo bo'ladi; probirka og'zidagi ho'l qizil lakmus qog'ozi ko'karadi." },
  kinetics: "o'rtacha",
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi', 'indikator-qogozi'],
  procedure: ["Probirkaga 1 ml ammoniy tuzi eritmasini quying va 1 ml natriy gidroksid eritmasidan qo'shing.", "Probirkani qisqich bilan ushlab, ehtiyotkorlik bilan isiting.", "Probirka og'ziga (devorga tegizmasdan) ho'llangan qizil lakmus qog'ozini tuting.", "Hidni qo'l bilan yelpib aniqlang."],
  safety: `Ammiakni to'g'ridan-to'g'ri hidlamang; ishqor sachrashidan ehtiyot bo'ling. ${GOGGLES}`,
  explanation: "Barcha ammoniy tuzlari ishqorlar bilan isitilganda ammiak ajratadi. Ammiak hidi va ho'l qizil lakmusning ko'karishi ammoniy ioniga xos sifat reaksiyadir.",
  questions: ["Nima uchun lakmus qog'ozi ho'llanadi?", "Nima uchun qog'oz probirka devoriga tegmasligi kerak?", "Ammoniy ionini aniqlashning yana qaysi usullarini bilasiz?"],
});

R({
  title: "Ammoniy ionini Nessler reaktivi bilan aniqlash",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: ammoniy ioni", engine: 'record',
  reactants: [
    { species: 'NH4Cl', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'Nessler', state: 'aq', volume_mL: 5 },
  ],
  eq: {
    molecular: 'NH4Cl + 2K2[HgI4] + 4KOH = [OHg2NH2]I↓ + KCl + 7KI + 3H2O',
    ionic_full: 'NH4⁺ + Cl⁻ + 4K⁺ + 2[HgI4]²⁻ + 4K⁺ + 4OH⁻ = [OHg2NH2]I↓ + K⁺ + Cl⁻ + 7K⁺ + 7I⁻ + 3H2O',
    ionic_net: 'NH4⁺ + 2[HgI4]²⁻ + 4OH⁻ = [OHg2NH2]I↓ + 7I⁻ + 3H2O',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ishqoriy muhitda ammoniy ioni ammiakka aylanadi.", "Ammiak tetrayodomerkurat(II) ionlari bilan reaksiyaga kirishib, qizil-qo'ng'ir oksodimerkurammoniy yodid hosil qiladi.", "Ammoniy juda oz bo'lganda cho'kma o'rniga eritma sariq-qo'ng'ir tusga kiradi."],
  obs: { precipitate: ppt('[OHg2NH2]I'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Qizil-qo'ng'ir cho'kma hosil bo'ladi (juda oz NH₄⁺ bo'lsa — eritma sarg'ish-qo'ng'ir tusga kiradi)." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml tekshiriladigan eritma quying.", "Ustiga 1–2 ml Nessler reaktivi qo'shing.", "Cho'kma yoki rang hosil bo'lishini kuzating."],
  safety: "Nessler reaktivi tarkibida simob birikmalari bor — juda zaharli. Qo'lqopda ishlang, chiqindini simob chiqindilari uchun maxsus idishga to'king.",
  explanation: "Nessler reaktivi (K₂[HgI₄] ning ishqoriy eritmasi) ammoniy ioni bilan qizil-qo'ng'ir cho'kma beradi. Reaksiya juda sezgir bo'lgani uchun suvda ammoniyning juda oz miqdorini aniqlashda qo'llaniladi.",
  questions: ["Nessler reaktivi tarkibida qanday ionlar bor?", "Nima uchun bu reaksiya suv sifatini tekshirishda ishlatiladi?", "Ammoniyni aniqlashning ishqor bilan qizdirish usulidan farqi nimada?"],
});

// ---------------------------------------------------------------------------------- Pb2+
R({
  title: "Qo'rg'oshin(II) ionini kaliy yodid bilan aniqlash (\"oltin yomg'ir\")",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: qo'rg'oshin ioni", engine: 'rules',
  reactants: [
    { species: 'Pb(NO3)2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'KI', state: 'aq', conc_M: 0.2, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Pb(NO3)2 + 2KI = PbI2↓ + 2KNO3',
    ionic_full: 'Pb²⁺ + 2NO3⁻ + 2K⁺ + 2I⁻ = PbI2↓ + 2K⁺ + 2NO3⁻',
    ionic_net: 'Pb²⁺ + 2I⁻ = PbI2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Pb²⁺ va I⁻ ionlari sovuq suvda kam eriydigan qo'rg'oshin(II) yodidni hosil qiladi.", "Yorqin sariq cho'kma tushadi.", "PbI₂ issiq suvda eriydi, sovutilganda esa yaltiroq oltinrang plastinkalar holida qayta kristallanadi."],
  obs: { precipitate: ppt('PbI2'), heat: 'sezilarsiz', effects: fx('turbidity', 'crystals'), text_uz: "Yorqin sariq cho'kma tushadi; qizdirib eritilib sovutilganda oltinrang yaltiroq kristallar (\"oltin yomg'ir\") paydo bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml qo'rg'oshin(II) nitrat eritmasi quying.", "1 ml kaliy yodid eritmasidan qo'shing.", "Cho'kmaga 3–4 ml suv qo'shib, u eriguncha qizdiring, so'ng probirkani sovuq suv ostida sovuting.", "Kristallarning hosil bo'lishini kuzating."],
  safety: "Qo'rg'oshin birikmalari zaharli — qo'lqopda ishlang, chiqindini maxsus idishga to'king, ishdan so'ng qo'lingizni yuving.",
  explanation: "Qo'rg'oshin(II) ioni yodid ionlari bilan sariq qo'rg'oshin(II) yodid cho'kmasini hosil qiladi. Uning issiq suvda eriydigan va sovuganda chiroyli oltinrang kristallar hosil qiladigan xossasi qo'rg'oshin ionini ishonchli aniqlashga imkon beradi.",
  questions: ["\"Oltin yomg'ir\" tajribasida qanday fizik jarayon kuzatiladi?", "Pb²⁺ ga yana qanday sifat reaksiyalarni bilasiz?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Qo'rg'oshin(II) ionining kaliy xromat bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: qo'rg'oshin ioni", engine: 'rules',
  reactants: [
    { species: 'Pb(NO3)2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K2CrO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Pb(NO3)2 + K2CrO4 = PbCrO4↓ + 2KNO3',
    ionic_full: 'Pb²⁺ + 2NO3⁻ + 2K⁺ + CrO4²⁻ = PbCrO4↓ + 2K⁺ + 2NO3⁻',
    ionic_net: 'Pb²⁺ + CrO4²⁻ = PbCrO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Pb²⁺ ionlari xromat ionlari bilan juda kam eriydigan qo'rg'oshin xromatni hosil qiladi.", "Sariq cho'kma (\"xrom sarig'i\") tushadi.", "PbCrO₄ sirka kislotada erimaydi, ishqorda esa eriydi — bu uni BaCrO₄ dan farqlaydi."],
  obs: { precipitate: ppt('PbCrO4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Yorqin sariq cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml qo'rg'oshin(II) nitrat eritmasi quying.", "2–3 tomchi kaliy xromat eritmasidan qo'shing.", "Cho'kmani ikkiga bo'lib, biriga sirka kislota, ikkinchisiga natriy gidroksid qo'shing."],
  safety: "Qo'rg'oshin birikmalari va xromatlar zaharli — qo'lqopda ishlang, chiqindini maxsus idishga to'king.",
  explanation: "Qo'rg'oshin(II) ioni xromat ionlari bilan sariq qo'rg'oshin xromat cho'kmasini beradi. Bu modda ilgari \"xrom sarig'i\" bo'yog'i sifatida ishlatilgan; uning ishqorda erishi qo'rg'oshin gidroksidining amfoterligi bilan bog'liq.",
  questions: ["PbCrO₄ va BaCrO₄ ni qanday farqlash mumkin?", "Nima uchun PbCrO₄ ishqorda eriydi?", "Cho'kmaning rangi qanday?"],
});

R({
  title: "Qo'rg'oshin(II) ionining xlorid kislota bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: qo'rg'oshin ioni", engine: 'rules',
  reactants: [
    { species: 'Pb(NO3)2', state: 'aq', conc_M: 0.5, volume_mL: 1 },
    { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Pb(NO3)2 + 2HCl = PbCl2↓ + 2HNO3',
    ionic_full: 'Pb²⁺ + 2NO3⁻ + 2H⁺ + 2Cl⁻ = PbCl2↓ + 2H⁺ + 2NO3⁻',
    ionic_net: 'Pb²⁺ + 2Cl⁻ = PbCl2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Konsentrlangan eritmalarda Pb²⁺ va Cl⁻ ionlari kam eriydigan PbCl₂ ni hosil qiladi.", "Oq ignasimon kristall cho'kma tushadi.", "PbCl₂ issiq suvda yaxshi eriydi — bu uni AgCl dan farqlaydi."],
  obs: { precipitate: ppt('PbCl2'), heat: 'sezilarsiz', effects: fx('turbidity', 'crystals'), text_uz: "Oq kristall cho'kma tushadi; qizdirilganda eriydi, sovutilganda ignasimon kristallar holida qayta ajraladi." },
  kinetics: 'tez',
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml qo'rg'oshin(II) nitrat eritmasi quying.", "1 ml xlorid kislota qo'shing.", "Cho'kmali probirkaga 2–3 ml suv qo'shib qizdiring, so'ng sovuting."],
  safety: "Qo'rg'oshin birikmalari zaharli — qo'lqopda ishlang, chiqindini maxsus idishga to'king.",
  explanation: "Qo'rg'oshin(II) xlorid sovuq suvda kam, issiq suvda esa ancha yaxshi eriydi. Shu xossa sifat analizida PbCl₂ ni boshqa erimaydigan xloridlardan (AgCl dan) ajratishda qo'llaniladi.",
  questions: ["PbCl₂ va AgCl ni qanday farqlash mumkin?", "Nima uchun suyultirilgan eritmalarda cho'kma tushmasligi mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

// ------------------------------------------------------------------------------ Al3+, Zn2+
R({
  title: "Alyuminiy ionining ammiakli suv bilan reaksiyasi",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: alyuminiy ioni", engine: 'rules',
  reactants: [
    { species: 'AlCl3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 2, excess: true },
  ],
  eq: {
    molecular: 'AlCl3 + 3NH3 + 3H2O = Al(OH)3↓ + 3NH4Cl',
    ionic_full: 'Al³⁺ + 3Cl⁻ + 3NH3 + 3H2O = Al(OH)3↓ + 3NH4⁺ + 3Cl⁻',
    ionic_net: 'Al³⁺ + 3NH3 + 3H2O = Al(OH)3↓ + 3NH4⁺',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ammiak suvda kuchsiz asos bo'lib, OH⁻ ionlarini hosil qiladi.", "Al³⁺ ionlari oq iviqsimon alyuminiy gidroksid holida cho'kadi.", "Ammiak kuchsiz asos bo'lgani uchun ortiqcha ammiakda Al(OH)₃ erimaydi (ishqordan farqli)."],
  obs: { precipitate: ppt('Al(OH)3'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq iviqsimon cho'kma hosil bo'ladi; ortiqcha ammiakli suvda u erimaydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml alyuminiy xlorid eritmasi quying.", "Tomchilab, so'ng ortiqcha miqdorda ammiakli suv qo'shing.", "Cho'kmaning ortiqcha ammiakda erimasligini kuzating; ikkinchi probirkada uni ishqorda eritib solishtiring."],
  safety: `Ammiakli suvni hidlamang. ${GOGGLES}`,
  explanation: "Alyuminiy ioni ammiakli suv bilan oq iviqsimon Al(OH)₃ cho'kmasini beradi. Ishqordan farqli ravishda ortiqcha ammiak bu cho'kmani eritmaydi; rux gidroksidi esa ortiqcha ammiakda eriydi — shu tufayli Al³⁺ va Zn²⁺ ni farqlash mumkin.",
  questions: ["Nima uchun Al(OH)₃ ortiqcha ammiakda erimaydi, ortiqcha NaOH da esa eriydi?", "Al³⁺ va Zn²⁺ ni ammiak yordamida qanday farqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Rux ionining ortiqcha ammiakli suvda kompleks hosil qilishi",
  level: '11-sinf', topic: "Kationlarga sifat reaksiyalar: rux ioni; kompleks birikmalar", engine: 'rules',
  reactants: [
    { species: 'ZnSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 3, excess: true },
  ],
  cond: { note_uz: "Ammiakli suv avval tomchilab, so'ng ortiqcha qo'shiladi." },
  eq: {
    molecular: 'ZnSO4 + 4NH3 = [Zn(NH3)4]SO4',
    ionic_full: 'Zn²⁺ + SO4²⁻ + 4NH3 = [Zn(NH3)4]²⁺ + SO4²⁻',
    ionic_net: 'Zn²⁺ + 4NH3 = [Zn(NH3)4]²⁺',
  },
  mech: 'kompleks',
  steps: ["Oz miqdordagi ammiak oq Zn(OH)₂ cho'kmasini hosil qiladi.", "Ortiqcha ammiak molekulalari Zn²⁺ ioniga birikib rangsiz [Zn(NH₃)₄]²⁺ kompleksini hosil qiladi.", "Cho'kma eriydi va eritma tiniqlashadi."],
  obs: { heat: 'sezilarsiz', effects: fx('turbidity', 'dissolve'), text_uz: "Avval oq cho'kma tushadi, ortiqcha ammiakli suvda u erib, rangsiz tiniq eritma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml rux sulfat eritmasi quying.", "Tomchilab ammiakli suv qo'shing va oq cho'kmani kuzating.", "Ammiakli suvni ortiqcha qo'shib, cho'kmaning erishini kuzating."],
  safety: `Ammiakli suvni hidlamang. ${GOGGLES}`,
  explanation: "Rux ioni ortiqcha ammiak bilan eruvchan rangsiz tetraamminrux kompleksini hosil qiladi. Alyuminiy ionida bunday xossa yo'q, shuning uchun ammiak bu ikki ionni farqlashga imkon beradi.",
  questions: ["Qaysi metall gidroksidlari ortiqcha ammiakda eriydi?", "Kompleks ionning tarkibini tushuntiring.", "Zn²⁺ va Al³⁺ ni qanday farqlash mumkin?"],
});

R({
  title: "Rux ionining sariq qon tuzi bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: rux ioni", engine: 'record',
  reactants: [
    { species: 'ZnSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'K4[Fe(CN)6]', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: '3ZnSO4 + 2K4[Fe(CN)6] = K2Zn3[Fe(CN)6]2↓ + 3K2SO4',
    ionic_full: '3Zn²⁺ + 3SO4²⁻ + 8K⁺ + 2[Fe(CN)6]⁴⁻ = K2Zn3[Fe(CN)6]2↓ + 6K⁺ + 3SO4²⁻',
    ionic_net: '3Zn²⁺ + 2K⁺ + 2[Fe(CN)6]⁴⁻ = K2Zn3[Fe(CN)6]2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Zn²⁺ ionlari kaliy ionlari ishtirokida geksatsianoferrat(II) ionlari bilan qo'shaloq tuz hosil qiladi.", "Oq iviqsimon cho'kma tushadi.", "Cho'kma suyultirilgan kislotalarda erimaydi, ishqorlarda eriydi."],
  obs: { precipitate: ppt('K2Zn3[Fe(CN)6]2'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq iviqsimon cho'kma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml rux sulfat eritmasi quying.", "2–3 tomchi sariq qon tuzi eritmasidan qo'shing.", "Cho'kma rangini kuzating; suyultirilgan xlorid kislotada erimasligini tekshiring."],
  safety: `Qon tuzlarini kuchli kislotalar bilan qizdirmang. ${GOGGLES}`,
  explanation: "Rux ioni sariq qon tuzi bilan kislotalarda erimaydigan oq kaliy-rux geksatsianoferrat(II) cho'kmasini hosil qiladi. Bu reaksiya ruxni alyuminiydan farqlashda qo'llaniladi.",
  questions: ["Zn²⁺ ga qanday sifat reaksiyalarni bilasiz?", "Sariq qon tuzi Zn²⁺, Cu²⁺ va Fe³⁺ bilan qanday rangli cho'kmalar beradi?", "Cho'kma tarkibida kaliy ioni bo'lishi nimani anglatadi?"],
});

R({
  title: "Rux ionining natriy sulfid bilan reaksiyasi — oq sulfid hosil bo'lishi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: rux ioni", engine: 'rules',
  reactants: [
    { species: 'ZnSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'Na2S', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'ZnSO4 + Na2S = ZnS↓ + Na2SO4',
    ionic_full: 'Zn²⁺ + SO4²⁻ + 2Na⁺ + S²⁻ = ZnS↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Zn²⁺ + S²⁻ = ZnS↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Zn²⁺ va S²⁻ ionlari erimaydigan rux sulfidni hosil qiladi.", "Ko'pchilik og'ir metall sulfidlari qora, ZnS esa oq rangli.", "ZnS kuchli kislotalarda eriydi, sirka kislotada erimaydi."],
  obs: { precipitate: ppt('ZnS'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml rux sulfat eritmasi quying.", "Tomchilab natriy sulfid eritmasidan qo'shing.", "Cho'kma rangini boshqa metallar sulfidlari bilan solishtiring."],
  safety: `${HOOD}: sulfidlar kislota bilan zaharli H₂S ajratadi. ${GOGGLES}`,
  explanation: "Rux sulfid oq rangli yagona keng tarqalgan erimaydigan sulfid bo'lib, bu rux ionini aniqlashga imkon beradi. Mis, qo'rg'oshin, kumush sulfidlari qora, marganes sulfidi esa pushti rangli.",
  questions: ["Qaysi metall sulfidlari qora, qaysilari rangli?", "ZnS qanday kislotalarda eriydi?", "Qisqartirilgan ionli tenglamani yozing."],
});

// -------------------------------------------------------------------------------- Ni2+, Co2+
R({
  title: "Nikel(II) ionini dimetilglioksim bilan aniqlash (Chugayev reaksiyasi)",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: nikel ioni", engine: 'record',
  reactants: [
    { species: 'NiSO4', state: 'aq', conc_M: 0.05, volume_mL: 1 },
    { species: 'C4H8N2O2', state: 'aq', conc_M: 0.08, volume_mL: 1 },
  ],
  cond: { note_uz: "Reaksiya neytral yoki kuchsiz ammiakli muhitda olib boriladi: ajralgan H⁺ ni bog'lash uchun 1–2 tomchi ammiakli suv qo'shiladi." },
  eq: {
    molecular: 'NiSO4 + 2C4H8N2O2 = Ni(C4H7N2O2)2↓ + H2SO4',
    ionic_full: 'Ni²⁺ + SO4²⁻ + 2C4H8N2O2 = Ni(C4H7N2O2)2↓ + 2H⁺ + SO4²⁻',
    ionic_net: 'Ni²⁺ + 2C4H8N2O2 = Ni(C4H7N2O2)2↓ + 2H⁺',
  },
  mech: 'kompleks',
  steps: ["Dimetilglioksimning har bir molekulasi bitta protonini yo'qotib, ikki azot atomi orqali Ni²⁺ ga birikadi.", "Tekis kvadrat tuzilishli ichki kompleks (xelat) hosil bo'ladi.", "Ajralgan H⁺ ionlari ammiak bilan neytrallanadi, aks holda kislotali muhitda cho'kma to'liq tushmaydi."],
  obs: { precipitate: ppt('Ni(C4H7N2O2)2'), solution_color_change: { from: ionColor('Ni^2+'), to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Malina-qizil (qizil-pushti) cho'kma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml nikel(II) tuzi eritmasi quying.", "1–2 tomchi ammiakli suv qo'shing (cho'kma tushmasligi kerak).", "1 ml dimetilglioksimning spirtli eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `Nikel birikmalari allergen va kanserogen — qo'lqopda ishlang. Dimetilglioksim eritmasi spirtli — olovdan uzoq tuting. ${GOGGLES}`,
  explanation: "Nikel(II) ioni dimetilglioksim (Chugayev reaktivi) bilan malina-qizil rangli ichki kompleks tuz hosil qiladi. Bu reaksiya nikelga juda tanlab ta'sir qiladi va uni kobalt va boshqa ionlar ishtirokida ham aniqlashga imkon beradi.",
  questions: ["Nima uchun reaksiya kuchli kislotali muhitda olib borilmaydi?", "Ichki kompleks (xelat) deganda nimani tushunasiz?", "Bu reaksiya qaysi olim nomi bilan ataladi?"],
});

R({
  title: "Nikel(II) ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: nikel ioni", engine: 'rules',
  reactants: [
    { species: 'NiSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'NiSO4 + 2NaOH = Ni(OH)2↓ + Na2SO4',
    ionic_full: 'Ni²⁺ + SO4²⁻ + 2Na⁺ + 2OH⁻ = Ni(OH)2↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Ni²⁺ + 2OH⁻ = Ni(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ni²⁺ ionlari gidroksid ionlari bilan nikel(II) gidroksidni hosil qiladi.", "Och yashil iviqsimon cho'kma tushadi.", "Ni(OH)₂ havoda oksidlanmaydi va ortiqcha ishqorda erimaydi."],
  obs: { precipitate: ppt('Ni(OH)2'), solution_color_change: { from: ionColor('Ni^2+'), to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Och yashil iviqsimon cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml nikel(II) sulfat eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kma rangini kuzating, ortiqcha ishqorda erimasligini tekshiring."],
  safety: `Nikel birikmalari allergen — qo'lqopda ishlang. ${GOGGLES}`,
  explanation: "Nikel(II) ioni ishqorlar bilan och yashil nikel(II) gidroksid cho'kmasini beradi. Fe(OH)₂ dan farqli ravishda bu cho'kma havoda o'z rangini o'zgartirmaydi.",
  questions: ["Ni(OH)₂ va Fe(OH)₂ cho'kmalarini qanday farqlash mumkin?", "Ni(OH)₂ ortiqcha ammiakda eriydimi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Nikel(II) ionining ortiqcha ammiakda kompleks hosil qilishi",
  level: '11-sinf', topic: "Kompleks birikmalar: nikel ammiakati", engine: 'rules',
  reactants: [
    { species: 'NiSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NH3·H2O', state: 'aq', conc_M: 2, volume_mL: 3, excess: true },
  ],
  eq: {
    molecular: 'NiSO4 + 6NH3 = [Ni(NH3)6]SO4',
    ionic_full: 'Ni²⁺ + SO4²⁻ + 6NH3 = [Ni(NH3)6]²⁺ + SO4²⁻',
    ionic_net: 'Ni²⁺ + 6NH3 = [Ni(NH3)6]²⁺',
  },
  mech: 'kompleks',
  steps: ["Oz miqdordagi ammiak och yashil Ni(OH)₂ (asosli tuz) cho'kmasini hosil qiladi.", "Ortiqcha ammiakda Ni²⁺ oltita ammiak molekulasini biriktiradi.", "Ko'k-binafsha geksaamminnikel(II) ioni hosil bo'lib, cho'kma eriydi."],
  obs: { solution_color_change: { from: ionColor('Ni^2+'), to: ionColor('[Ni(NH3)6]^2+') }, heat: 'sezilarsiz', effects: fx('turbidity', 'dissolve', 'swirl'), text_uz: "Yashil eritmada avval och yashil cho'kma tushadi, ortiqcha ammiakda u erib, eritma ko'k-binafsha rangga kiradi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml nikel(II) sulfat eritmasi quying.", "Tomchilab, so'ng ortiqcha ammiakli suv qo'shing.", "Eritma rangini mis ammiakati rangi bilan solishtiring."],
  safety: `Ammiakli suvni hidlamang; nikel birikmalari allergen. ${GOGGLES}`,
  explanation: "Nikel(II) ioni ortiqcha ammiak bilan ko'k-binafsha geksaamminnikel(II) kompleksini hosil qiladi. Koordinatsion son 6 ga teng; mis ammiakati esa to'q ko'k rangli va koordinatsion soni 4.",
  questions: ["Kompleks ionning koordinatsion sonini aniqlang.", "Nikel va mis ammiakatlari rangi bilan qanday farq qiladi?", "Kompleks ion zaryadini qanday hisoblash mumkin?"],
});

R({
  title: "Kobalt(II) ionining ishqor bilan reaksiyasi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: kobalt ioni", engine: 'rules',
  reactants: [
    { species: 'CoCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1, excess: true },
  ],
  cond: { note_uz: "Ishqor ortiqcha qo'shiladi va aralashma biroz isitiladi." },
  eq: {
    molecular: 'CoCl2 + 2NaOH = Co(OH)2↓ + 2NaCl',
    ionic_full: 'Co²⁺ + 2Cl⁻ + 2Na⁺ + 2OH⁻ = Co(OH)2↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: 'Co²⁺ + 2OH⁻ = Co(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Ishqor yetishmaganda avval ko'k rangli asosli tuz (CoOHCl) cho'kadi.", "Ortiqcha ishqor va isitish ta'sirida u pushti rangli Co(OH)₂ ga aylanadi.", "Havoda Co(OH)₂ asta-sekin qo'ng'irlashadi (Co(III) birikmalari hosil bo'ladi)."],
  obs: { precipitate: ppt('Co(OH)2'), solution_color_change: { from: ionColor('Co^2+'), to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Avval ko'k cho'kma tushadi, ortiqcha ishqor qo'shib isitilganda u pushti rangga kiradi." },
  kinetics: 'tez',
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml kobalt(II) xlorid eritmasi quying.", "Tomchilab natriy gidroksid qo'shing va ko'k cho'kmani kuzating.", "Ortiqcha ishqor qo'shib, aralashmani biroz isiting va rang o'zgarishini kuzating."],
  safety: `Kobalt birikmalari zaharli va allergen — qo'lqopda ishlang. ${GOGGLES}`,
  explanation: "Kobalt(II) ioni ishqor bilan dastlab ko'k asosli tuz, so'ng pushti kobalt(II) gidroksid hosil qiladi. Cho'kma rangining bunday o'zgarishi kobalt ioniga xosdir.",
  questions: ["Nima uchun avval ko'k, keyin pushti cho'kma kuzatiladi?", "Co(OH)₂ havoda qanday o'zgaradi?", "Qisqartirilgan ionli tenglamani yozing."],
  confidence: "o'rta",
});

// ---------------------------------------------------------------------------- Mn2+, Cr3+, Mg2+
R({
  title: "Marganes(II) ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: marganes ioni", engine: 'rules',
  reactants: [
    { species: 'MnSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'MnSO4 + 2NaOH = Mn(OH)2↓ + Na2SO4',
    ionic_full: 'Mn²⁺ + SO4²⁻ + 2Na⁺ + 2OH⁻ = Mn(OH)2↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Mn²⁺ + 2OH⁻ = Mn(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Mn²⁺ ionlari gidroksid ionlari bilan oq marganes(II) gidroksidni hosil qiladi.", "Havodagi kislorod ta'sirida Mn(OH)₂ tezda qo'ng'ir MnO(OH)₂ ga oksidlanadi.", "Shuning uchun cho'kma sirtidan boshlab qo'ng'irlashadi."],
  obs: { precipitate: ppt('Mn(OH)2'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq (och pushti tusli) cho'kma hosil bo'ladi va havoda tezda qo'ng'irlashadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml marganes(II) sulfat eritmasi quying.", "Tomchilab natriy gidroksid eritmasidan qo'shing.", "Cho'kma rangining vaqt o'tishi bilan o'zgarishini kuzating."],
  safety: `Ishqor terini kuydiradi. ${GOGGLES}`,
  explanation: "Marganes(II) ioni ishqor bilan oq gidroksid cho'kmasini beradi; u havoda tezda qo'ng'ir marganes(IV) birikmalariga oksidlanadi. Bu Mn(II) birikmalarining qaytaruvchilik xossasini ko'rsatadi.",
  questions: ["Nima uchun Mn(OH)₂ havoda qo'ng'irlashadi?", "Mn(OH)₂ va Fe(OH)₂ ning havodagi o'zgarishlarini solishtiring.", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Marganes(II) ionini qo'rg'oshin(IV) oksid bilan permanganatgacha oksidlash",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: marganes ioni", engine: 'record',
  reactants: [
    { species: 'Mn(NO3)2', state: 'aq', conc_M: 0.01, volume_mL: 1 },
    { species: 'PbO2', state: 's', mass_g: 0.2, form: 'kukun' },
    { species: 'HNO3', state: 'aq', conc_M: 6, volume_mL: 2 },
  ],
  cond: { heating: true, temp_min_C: 80, medium: 'kislotali', note_uz: "Marganes juda oz miqdorda olinadi; xlorid ionlari bo'lmasligi kerak. Aralashma qaynaguncha qizdiriladi va cho'kma tindiriladi." },
  eq: {
    molecular: '2Mn(NO3)2 + 5PbO2 + 6HNO3 = 2HMnO4 + 5Pb(NO3)2 + 2H2O',
    ionic_full: '2Mn²⁺ + 4NO3⁻ + 5PbO2 + 6H⁺ + 6NO3⁻ = 2H⁺ + 2MnO4⁻ + 5Pb²⁺ + 10NO3⁻ + 2H2O',
    ionic_net: '2Mn²⁺ + 5PbO2 + 4H⁺ = 2MnO4⁻ + 5Pb²⁺ + 2H2O',
    electron_balance: ['Mn⁺² − 5e⁻ = Mn⁺⁷', 'Pb⁺⁴ + 2e⁻ = Pb⁺²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kislotali muhitda qizdirilganda PbO₂ juda kuchli oksidlovchi.", "Mn²⁺ beshta elektron berib permanganat ioniga (Mn⁺⁷) oksidlanadi.", "Pb⁺⁴ ikki elektron olib Pb²⁺ ga qaytariladi; eritma binafsha-qizil rangga kiradi."],
  obs: { solution_color_change: { from: '#ffffff', to: ionColor('MnO4^-') }, heat: 'sezilarsiz', effects: fx('boil', 'swirl'), text_uz: "Cho'kma tingach, uning ustidagi eritma binafsha-qizil (permanganat) rangga kiradi." },
  kinetics: "o'rtacha",
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga ozgina qo'rg'oshin(IV) oksid kukuni soling va 2 ml nitrat kislota (1:1) quying.", "1–2 tomchi suyultirilgan marganes(II) tuzi eritmasidan qo'shing.", "Aralashmani qaynaguncha qizdiring va 1–2 daqiqa qaynating.", "Probirkani shtativga qo'yib, cho'kma tingach eritma rangini kuzating."],
  safety: `${HOOD}. Qo'rg'oshin birikmalari zaharli, nitrat kislota o'yuvchi; qaynayotgan aralashma sachrashi mumkin — ko'zoynak va qo'lqopda ishlang.`,
  explanation: "Kislotali muhitda qo'rg'oshin(IV) oksid marganes(II) ionini binafsha-qizil permanganat ioniga oksidlaydi. Rang juda intensiv bo'lgani uchun reaksiya marganesning juda oz miqdorini ham aniqlashga imkon beradi; marganes ko'p bo'lsa, ortiqcha Mn²⁺ permanganatni qaytarib, rangni yo'qotadi.",
  questions: ["Nima uchun marganes tuzi juda oz miqdorda olinadi?", "Nima uchun eritmada xlorid ionlari bo'lmasligi kerak?", "Bu reaksiyada elektronlar qanday ko'chadi?"],
});

R({
  title: "Marganes(II) ionining natriy sulfid bilan reaksiyasi — pushti sulfid",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: marganes ioni", engine: 'rules',
  reactants: [
    { species: 'MnSO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'Na2S', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'MnSO4 + Na2S = MnS↓ + Na2SO4',
    ionic_full: 'Mn²⁺ + SO4²⁻ + 2Na⁺ + S²⁻ = MnS↓ + 2Na⁺ + SO4²⁻',
    ionic_net: 'Mn²⁺ + S²⁻ = MnS↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Mn²⁺ va S²⁻ ionlari erimaydigan marganes(II) sulfidni hosil qiladi.", "Cho'kma pushti (go'sht rangi) bo'ladi.", "MnS hatto sirka kislotada ham eriydi."],
  obs: { precipitate: ppt('MnS'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Och pushti (go'sht rangli) cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml marganes(II) sulfat eritmasi quying.", "Tomchilab natriy sulfid eritmasidan qo'shing.", "Cho'kma rangini kuzating."],
  safety: `${HOOD}: sulfidlar kislota bilan zaharli H₂S ajratadi. ${GOGGLES}`,
  explanation: "Marganes(II) sulfid boshqa metall sulfidlaridan farqli ravishda pushti rangli bo'lib, bu marganes ionini aniqlashga yordam beradi. U kislotalarda oson eriydi.",
  questions: ["MnS ning rangi qanday?", "Rux va marganes sulfidlarini rangi bo'yicha qanday farqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Xrom(III) birikmasining ishqoriy muhitda vodorod peroksid bilan xromatgacha oksidlanishi",
  level: 'litsey', topic: "Kationlarga sifat reaksiyalar: xrom(III) ioni", engine: 'record',
  reactants: [
    { species: 'Na3[Cr(OH)6]', state: 'aq', conc_M: 0.05, volume_mL: 2 },
    { species: 'H2O2', state: 'aq', conc_M: 0.88, volume_mL: 1 },
  ],
  cond: { heating: true, temp_min_C: 60, medium: 'ishqoriy', note_uz: "Natriy geksagidroksoxromat(III) eritmasi xrom(III) tuziga ortiqcha ishqor qo'shib olinadi." },
  eq: {
    molecular: '2Na3[Cr(OH)6] + 3H2O2 = 2Na2CrO4 + 2NaOH + 8H2O',
    ionic_full: '6Na⁺ + 2[Cr(OH)6]³⁻ + 3H2O2 = 4Na⁺ + 2CrO4²⁻ + 2Na⁺ + 2OH⁻ + 8H2O',
    ionic_net: '2[Cr(OH)6]³⁻ + 3H2O2 = 2CrO4²⁻ + 2OH⁻ + 8H2O',
    electron_balance: ['Cr⁺³ − 3e⁻ = Cr⁺⁶', '2O⁻¹ + 2e⁻ = 2O⁻²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Ishqoriy muhitda xrom(III) geksagidroksoxromat ioni holida bo'ladi (yashil eritma).", "Vodorod peroksid oksidlovchi: har bir O⁻¹ atomi bitta elektron olib O⁻² ga qaytariladi.", "Xrom uch elektron berib +6 oksidlanish darajasigacha — sariq xromat ioniga o'tadi."],
  obs: { solution_color_change: { from: ionColor('[Cr(OH)6]^3-'), to: ionColor('CrO4^2-') }, heat: 'ekzotermik', effects: fx('bubbles', 'swirl'), text_uz: "Yashil eritma isitilganda sariq rangga kiradi." },
  kinetics: "o'rtacha",
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml xrom(III) tuzi eritmasi quying va hosil bo'lgan kulrang-yashil cho'kma eriguncha natriy gidroksid qo'shing.", "Yashil eritmaga 1 ml 3% li vodorod peroksid qo'shing.", "Aralashmani ehtiyotkorlik bilan isiting va rang o'zgarishini kuzating."],
  safety: `Xromatlar zaharli va kanserogen — qo'lqopda ishlang, chiqindini maxsus idishga to'king. Ishqor terini kuydiradi. ${GOGGLES}`,
  explanation: "Ishqoriy muhitda vodorod peroksid yashil xrom(III) birikmalarini sariq xromat ionlarigacha oksidlaydi. Sariq rangning paydo bo'lishi xrom(III) ionini aniqlashda qo'llaniladi; xromatni so'ng BaCl₂ yoki AgNO₃ bilan tasdiqlash mumkin.",
  questions: ["Reaksiyada xromning oksidlanish darajasi qanday o'zgaradi?", "Hosil bo'lgan xromat ionini qanday tasdiqlash mumkin?", "Nima uchun reaksiya ishqoriy muhitda olib boriladi?"],
});

R({
  title: "Magniy ionining ishqor bilan reaksiyasi",
  level: '9-sinf', topic: "Kationlarga sifat reaksiyalar: magniy ioni", engine: 'rules',
  reactants: [
    { species: 'MgCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'NaOH', state: 'aq', conc_M: 1, volume_mL: 1, excess: true },
  ],
  eq: {
    molecular: 'MgCl2 + 2NaOH = Mg(OH)2↓ + 2NaCl',
    ionic_full: 'Mg²⁺ + 2Cl⁻ + 2Na⁺ + 2OH⁻ = Mg(OH)2↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: 'Mg²⁺ + 2OH⁻ = Mg(OH)2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Mg²⁺ ionlari gidroksid ionlari bilan oq magniy gidroksidni hosil qiladi.", "Mg(OH)₂ asos xossali — ortiqcha ishqorda erimaydi.", "Bu uni amfoter Al(OH)₃ va Zn(OH)₂ dan farqlaydi."],
  obs: { precipitate: ppt('Mg(OH)2'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq iviqsimon cho'kma hosil bo'ladi; ortiqcha ishqorda erimaydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml magniy xlorid eritmasi quying.", "Natriy gidroksid eritmasini avval tomchilab, so'ng ortiqcha qo'shing.", "Cho'kmaning ortiqcha ishqorda erimasligini kuzating."],
  safety: `Ishqor terini kuydiradi. ${GOGGLES}`,
  explanation: "Magniy ioni ishqor bilan oq magniy gidroksid cho'kmasini beradi, u ortiqcha ishqorda erimaydi. Shu tufayli magniyni oq gidroksid hosil qiluvchi amfoter metallar (alyuminiy, rux) dan farqlash mumkin.",
  questions: ["Mg(OH)₂, Al(OH)₃ va Zn(OH)₂ ni qanday farqlash mumkin?", "Mg(OH)₂ kislotalarda eriydimi?", "Qisqartirilgan ionli tenglamani yozing."],
});

// ------------------------------------------------------------------------------ ALANGA SINOVLARI
const FLAMES = [
  { ion: 'Li^+', salt: 'LiCl', name: 'litiy', title: "Litiy ionini alanga rangi bo'yicha aniqlash", desc: "to'q qizil (karmin)" },
  { ion: 'Na^+', salt: 'NaCl', name: 'natriy', title: "Natriy ionini alanga rangi bo'yicha aniqlash", desc: "sariq" },
  { ion: 'K^+', salt: 'KCl', name: 'kaliy', title: "Kaliy ionini alanga rangi bo'yicha aniqlash (kobalt shisha orqali)", desc: "binafsha (och siyohrang)" },
  { ion: 'Ca^2+', salt: 'CaCl2', name: 'kalsiy', title: "Kalsiy ionini alanga rangi bo'yicha aniqlash", desc: "g'isht-qizil" },
  { ion: 'Sr^2+', salt: 'SrCl2', name: 'stronsiy', title: "Stronsiy ionini alanga rangi bo'yicha aniqlash", desc: "qizil (karmin)" },
  { ion: 'Ba^2+', salt: 'BaCl2', name: 'bariy', title: "Bariy ionini alanga rangi bo'yicha aniqlash", desc: "sarg'ish-yashil" },
  { ion: 'Cu^2+', salt: 'CuCl2', name: 'mis', title: "Mis(II) ionini alanga rangi bo'yicha aniqlash", desc: "yashil (ko'kimtir-yashil)" },
];
for (const f of FLAMES) {
  const color = IONS[f.ion].flame.color;
  const isK = f.ion === 'K^+';
  const isNa = f.ion === 'Na^+';
  R({
    title: f.title,
    level: '9-sinf', topic: "Alanga sinovi: metall ionlarini aniqlash", engine: 'rules',
    flame_test: { ion: f.ion },
    equation_free: true,
    equation_free_uz: `Alanga sinovi — fizik jarayon: alanga issiqligida ${f.name} atomlari (ionlari) qo'zg'aladi va asosiy holatga qaytishda faqat shu elementga xos to'lqin uzunlikdagi nur chiqaradi. Kimyoviy tenglama yozilmaydi.`,
    reactants: [{ species: f.salt, state: 'aq', conc_M: 1, volume_mL: 1 }],
    cond: { note_uz: isK ? "Kaliy alangasi natriy aralashmasi sariq rangini to'sib qo'yish uchun ko'k kobalt shisha orqali kuzatiladi." : "Nixrom sim avval xlorid kislotada yuvilib, alanga rangsiz bo'lguncha qizdiriladi." },
    eq: {},
    mech: 'fizik',
    steps: ["Alanga issiqligida tuz tarkibidagi metall atomlarining tashqi elektronlari yuqori energetik pog'onalarga o'tadi.", "Qo'zg'algan elektronlar asosiy holatga qaytishda ma'lum to'lqin uzunlikdagi yorug'lik chiqaradi.", `${f.name[0].toUpperCase() + f.name.slice(1)} uchun bu yorug'lik alangani ${f.desc} rangga bo'yaydi.`],
    obs: { heat: 'sezilarsiz', flame: { color, desc_uz: f.desc }, effects: fx('flame'), text_uz: `Rangsiz alanga ${f.desc} rangga bo'yaladi.` },
    kinetics: 'bir-zumda',
    apparatus: isK ? ['nixrom-sim', 'bunzen-gorelkasi', 'probirka'] : ['nixrom-sim', 'bunzen-gorelkasi', 'probirka'],
    procedure: [
      "Nixrom sim uchini konsentrlangan xlorid kislotaga botirib, alanga rangsiz bo'lguncha gorelka alangasida qizdiring.",
      `Toza simni ${f.salt} eritmasiga (yoki kristallariga) botiring.`,
      "Simni gorelka alangasining rangsiz qismiga kiriting.",
      isK ? "Alanga rangini ko'k kobalt shisha orqali kuzating." : "Alanga rangini kuzating va uni boshqa tuzlar alangasi bilan solishtiring.",
    ],
    safety: "Gorelka alangasi bilan ehtiyot bo'ling, sochni yig'ib oling. Konsentrlangan xlorid kislota bug'larini hidlamang." + (f.ion === 'Ba^2+' ? " Bariy tuzlari zaharli." : ''),
    explanation: `${f.name[0].toUpperCase() + f.name.slice(1)} birikmalari rangsiz alangani ${f.desc} rangga bo'yaydi. Har bir element o'ziga xos nurlanish spektriga ega bo'lgani uchun alanga sinovi metall ionlarini tez aniqlashga imkon beradi.` + (isNa ? " Natriyning sariq rangi juda kuchli bo'lib, boshqa ionlar rangini to'sib qo'yadi." : '') + (isK ? " Natriy aralashmasining sariq rangini to'sish uchun ko'k kobalt shishadan foydalaniladi." : ''),
    questions: ["Nima uchun turli metallar alangani turli rangga bo'yaydi?", isK ? "Nima uchun kaliy alangasi kobalt shisha orqali kuzatiladi?" : "Nima uchun nixrom sim har bir sinovdan oldin xlorid kislotada tozalanadi?", "Mushakbozlikda (salyutlarda) qaysi metallarning tuzlari ishlatiladi?"],
  });
}

// ===================================================================================== ANIONLAR
R({
  title: "Xlorid ionini kumush nitrat bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: galogenid ionlari", engine: 'rules',
  reactants: [
    { species: 'NaCl', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  cond: { note_uz: "Tekshiriladigan eritma bir necha tomchi nitrat kislota bilan kislotalanadi (karbonat, fosfat ionlari xalaqit bermasligi uchun)." },
  eq: {
    molecular: 'NaCl + AgNO3 = AgCl↓ + NaNO3',
    ionic_full: 'Na⁺ + Cl⁻ + Ag⁺ + NO3⁻ = AgCl↓ + Na⁺ + NO3⁻',
    ionic_net: 'Ag⁺ + Cl⁻ = AgCl↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Cl⁻ ionlari Ag⁺ ionlari bilan erimaydigan AgCl ni hosil qiladi.", "Nitrat kislotali muhitda Ag₂CO₃, Ag₃PO₄ kabi cho'kmalar hosil bo'lmaydi — reaksiya tanlab ta'sir qiladi.", "Oq suzmasimon cho'kma ammiakda eriydi."],
  obs: { precipitate: ppt('AgCl'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq suzmasimon cho'kma tushadi; u nitrat kislotada erimaydi, ammiakli suvda eriydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml tekshiriladigan eritma (natriy xlorid) quying va 2 tomchi nitrat kislota qo'shing.", "2–3 tomchi kumush nitrat eritmasidan qo'shing.", "Cho'kmaning rangi va ko'rinishini kuzating."],
  safety: `Kumush nitrat terini qoraytiradi; nitrat kislota o'yuvchi. ${GOGGLES}`,
  explanation: "Xlorid ionlari kumush ionlari bilan nitrat kislotada erimaydigan oq suzmasimon AgCl cho'kmasini hosil qiladi. Shuning uchun kumush nitrat xlorid kislota va uning tuzlariga reaktivdir.",
  questions: ["Nima uchun eritma nitrat kislota bilan kislotalanadi?", "Vodoprovod suvida xlorid ionlari borligini qanday aniqlash mumkin?", "AgCl, AgBr va AgI ni rangi bo'yicha qanday farqlash mumkin?"],
});

R({
  title: "Bromid ionini kumush nitrat bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: galogenid ionlari", engine: 'rules',
  reactants: [
    { species: 'KBr', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'KBr + AgNO3 = AgBr↓ + KNO3',
    ionic_full: 'K⁺ + Br⁻ + Ag⁺ + NO3⁻ = AgBr↓ + K⁺ + NO3⁻',
    ionic_net: 'Ag⁺ + Br⁻ = AgBr↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Br⁻ ionlari Ag⁺ ionlari bilan erimaydigan kumush bromidni hosil qiladi.", "Cho'kma och sarg'ish (oq-sarg'ish) rangli.", "AgBr nitrat kislotada erimaydi, ammiakda esa qisman eriydi."],
  obs: { precipitate: ppt('AgBr'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Och sarg'ish suzmasimon cho'kma tushadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kaliy bromid eritmasi quying.", "2–3 tomchi kumush nitrat eritmasidan qo'shing.", "Cho'kma rangini AgCl va AgI cho'kmalari bilan solishtiring."],
  safety: `Kumush nitrat terini qoraytiradi. ${GOGGLES}`,
  explanation: "Bromid ionlari kumush ionlari bilan och sarg'ish kumush bromid cho'kmasini hosil qiladi. Kumush galogenidlarining rangi xloriddan yodidga qarab oqdan sariqqa o'zgaradi; AgBr yorug'likka sezgir bo'lgani uchun fotografiyada ishlatilgan.",
  questions: ["AgCl, AgBr, AgI cho'kmalarining ranglarini taqqoslang.", "Kumush bromid qayerda ishlatilgan?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Yodid ionini kumush nitrat bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: galogenid ionlari", engine: 'rules',
  reactants: [
    { species: 'KI', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'KI + AgNO3 = AgI↓ + KNO3',
    ionic_full: 'K⁺ + I⁻ + Ag⁺ + NO3⁻ = AgI↓ + K⁺ + NO3⁻',
    ionic_net: 'Ag⁺ + I⁻ = AgI↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["I⁻ ionlari Ag⁺ ionlari bilan kumush galogenidlari ichida eng kam eriydigan AgI ni hosil qiladi.", "Cho'kma sariq rangli.", "AgI nitrat kislotada ham, ammiakda ham erimaydi."],
  obs: { precipitate: ppt('AgI'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Sariq suzmasimon cho'kma tushadi; u ammiakli suvda erimaydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kaliy yodid eritmasi quying.", "2–3 tomchi kumush nitrat eritmasidan qo'shing.", "Cho'kmaga ammiakli suv qo'shib, erimasligini tekshiring."],
  safety: `Kumush nitrat terini qoraytiradi. ${GOGGLES}`,
  explanation: "Yodid ionlari kumush ionlari bilan sariq, ammiakda ham erimaydigan kumush yodid cho'kmasini hosil qiladi. Rangi va ammiakka munosabati bo'yicha AgI ni AgCl va AgBr dan farqlash mumkin.",
  questions: ["Nima uchun AgI ammiakda erimaydi?", "Galogenid ionlarini bir-biridan qanday farqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Bromid ionini xlorli suv bilan aniqlash (organik qatlamda)",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: galogenlarning siqib chiqarilishi", engine: 'record',
  reactants: [
    { species: 'KBr', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'xlorli-suv', state: 'aq', volume_mL: 1 },
    { species: 'C6H14', state: 'l', volume_mL: 1 },
  ],
  cond: { note_uz: "Eritma ustiga ozgina organik erituvchi (geksan) quyilib, xlorli suv tomizilgach chayqatiladi." },
  eq: {
    molecular: '2KBr + Cl2 = 2KCl + Br2',
    ionic_full: '2K⁺ + 2Br⁻ + Cl2 = 2K⁺ + 2Cl⁻ + Br2',
    ionic_net: '2Br⁻ + Cl2 = 2Cl⁻ + Br2',
    electron_balance: ['Cl2⁰ + 2e⁻ = 2Cl⁻¹', '2Br⁻¹ − 2e⁻ = Br2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Xlor bromdan faolroq galogen bo'lgani uchun bromid ionlaridan elektron oladi.", "Erkin brom ajraladi.", "Brom suvga qaraganda organik erituvchida yaxshiroq eriydi va uni sariq-to'q sariq rangga bo'yaydi."],
  obs: { solution_color_change: { from: '#ffffff', to: sub('Br2').aq_color.hex }, heat: 'sezilarsiz', effects: fx('layers', 'swirl'), text_uz: "Chayqatilgandan so'ng yuqoridagi organik qatlam sariq-to'q sariq rangga bo'yaladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kaliy bromid eritmasi quying.", "Ustiga 0,5–1 ml geksan (yoki boshqa suvda erimaydigan organik erituvchi) quying.", "Tomchilab xlorli suv qo'shing va probirkani tiqin bilan yopib chayqating.", "Qatlamlar ajralgach organik qatlam rangini kuzating."],
  safety: `${HOOD}. Xlorli suv va brom bug'lari zaharli; organik erituvchi yonuvchi — olovdan uzoq tuting.`,
  explanation: "Xlor bromid ionlarini erkin bromgacha oksidlaydi. Ajralgan brom organik erituvchiga o'tib, uni sariq-to'q sariq rangga bo'yaydi. Yodid ionlari bilan esa organik qatlam binafsha rangga kiradi — shu bilan Br⁻ va I⁻ farqlanadi.",
  questions: ["Nima uchun brom organik qatlamga o'tadi?", "Yodid ioni bo'lganda organik qatlam qanday rangga bo'yaladi?", "Galogenlarning oksidlovchilik faolligi qanday tartibda o'zgaradi?"],
});

R({
  title: "Sulfat ionini bariy xlorid bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: sulfat ioni", engine: 'rules',
  reactants: [
    { species: 'K2SO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'BaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  cond: { note_uz: "Tekshiriladigan eritma oldindan xlorid kislota bilan kislotalanadi (karbonat va sulfit ionlari xalaqit bermasligi uchun)." },
  eq: {
    molecular: 'K2SO4 + BaCl2 = BaSO4↓ + 2KCl',
    ionic_full: '2K⁺ + SO4²⁻ + Ba²⁺ + 2Cl⁻ = BaSO4↓ + 2K⁺ + 2Cl⁻',
    ionic_net: 'Ba²⁺ + SO4²⁻ = BaSO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["SO₄²⁻ ionlari Ba²⁺ ionlari bilan erimaydigan BaSO₄ ni hosil qiladi.", "Kislotali muhitda BaCO₃ va BaSO₃ cho'kmaydi, shuning uchun oq cho'kma faqat sulfatga xos.", "BaSO₄ kuchli kislotalarda ham erimaydi."],
  obs: { precipitate: ppt('BaSO4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Kislotali eritmada oq mayda kristall cho'kma tushadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml tekshiriladigan eritma (kaliy sulfat) quying va 2–3 tomchi xlorid kislota qo'shing.", "Bir necha tomchi bariy xlorid eritmasidan qo'shing.", "Oq cho'kma hosil bo'lishini kuzating."],
  safety: `Bariy xlorid zaharli — og'izga tegmasin, ishdan so'ng qo'lingizni yuving. ${GOGGLES}`,
  explanation: "Sulfat ionlari bariy ionlari bilan kislotalarda erimaydigan oq bariy sulfat cho'kmasini beradi. Eritmani avval kislotalash boshqa anionlar (CO₃²⁻, SO₃²⁻, PO₄³⁻) hosil qiladigan bariy cho'kmalarining xalaqitini yo'qotadi.",
  questions: ["Nima uchun eritma avval xlorid kislota bilan kislotalanadi?", "Sulfat va karbonat ionlarini bariy xlorid yordamida qanday farqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Sulfit ionining bariy xlorid bilan reaksiyasi",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: sulfit ioni", engine: 'rules',
  reactants: [
    { species: 'Na2SO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'BaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Na2SO3 + BaCl2 = BaSO3↓ + 2NaCl',
    ionic_full: '2Na⁺ + SO3²⁻ + Ba²⁺ + 2Cl⁻ = BaSO3↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: 'Ba²⁺ + SO3²⁻ = BaSO3↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Neytral eritmada SO₃²⁻ ionlari Ba²⁺ bilan oq BaSO₃ ni hosil qiladi.", "BaSO₃ xlorid kislotada SO₂ ajratib eriydi.", "Bu xossasi bilan u kislotada erimaydigan BaSO₄ dan farq qiladi."],
  obs: { precipitate: ppt('BaSO3'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq cho'kma tushadi; xlorid kislota qo'shilganda u o'tkir SO₂ hidi chiqarib eriydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy sulfit eritmasi quying.", "Bir necha tomchi bariy xlorid eritmasidan qo'shing.", "Cho'kmaga xlorid kislota tomizib, erishini va hidni (qo'l bilan yelpib) kuzating."],
  safety: `${HOOD}: kislota qo'shilganda SO₂ ajraladi. Bariy tuzlari zaharli. ${GOGGLES}`,
  explanation: "Sulfit ioni bariy ionlari bilan oq cho'kma beradi, ammo u bariy sulfatdan farqli ravishda kuchli kislotalarda SO₂ ajratib eriydi. Shu xossa sulfit va sulfat ionlarini farqlashga imkon beradi.",
  questions: ["BaSO₃ va BaSO₄ ni qanday farqlash mumkin?", "BaSO₃ xlorid kislotada erish tenglamasini yozing.", "Sulfit eritmasi havoda uzoq tursa qanday o'zgaradi?"],
});

R({
  title: "Sulfit ionining yod eritmasini rangsizlantirishi",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: sulfit ioni", engine: 'record',
  reactants: [
    { species: 'Na2SO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'Lugol', state: 'aq', volume_mL: 1 },
  ],
  eq: {
    molecular: 'Na2SO3 + I2 + H2O = Na2SO4 + 2HI',
    ionic_full: '2Na⁺ + SO3²⁻ + I2 + H2O = 2Na⁺ + SO4²⁻ + 2H⁺ + 2I⁻',
    ionic_net: 'SO3²⁻ + I2 + H2O = SO4²⁻ + 2I⁻ + 2H⁺',
    electron_balance: ['I2⁰ + 2e⁻ = 2I⁻¹', 'S⁺⁴ − 2e⁻ = S⁺⁶'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Sulfit ionidagi oltingugurt (+4) qaytaruvchi.", "Yod molekulasi ikki elektron olib rangsiz yodid ionlariga qaytariladi.", "Oltingugurt sulfat ionigacha (+6) oksidlanadi va eritma rangsizlanadi."],
  obs: { solution_color_change: { from: sub('I2').aq_color.hex, to: '#ffffff' }, heat: 'sezilarsiz', effects: fx('swirl'), text_uz: "Qo'ng'ir yod eritmasi sulfit qo'shilganda rangsizlanadi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy sulfit eritmasi quying.", "Tomchilab yodning kaliy yodiddagi eritmasidan qo'shing.", "Yod rangining yo'qolishini kuzating."],
  safety: GOGGLES,
  explanation: "Sulfit ionlari yodni yodid ionlarigacha qaytarib, eritmani rangsizlantiradi; o'zlari sulfat ionlariga oksidlanadi. Bu sulfit ionlarining qaytaruvchilik xossasini ko'rsatadi va ularni aniqlashda qo'llaniladi.",
  questions: ["Bu reaksiyada qaysi ion qaytaruvchi?", "Reaksiyadan keyin sulfat ioni hosil bo'lganini qanday isbotlash mumkin?", "Sulfat ioni yodni rangsizlantiradimi? Nima uchun?"],
});

R({
  title: "Sulfid ionini qo'rg'oshin(II) atsetat bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: sulfid ioni", engine: 'rules',
  reactants: [
    { species: 'Na2S', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: '(CH3COO)2Pb', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Na2S + (CH3COO)2Pb = PbS↓ + 2CH3COONa',
    ionic_full: '2Na⁺ + S²⁻ + Pb²⁺ + 2CH3COO⁻ = PbS↓ + 2Na⁺ + 2CH3COO⁻',
    ionic_net: 'Pb²⁺ + S²⁻ = PbS↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["S²⁻ ionlari Pb²⁺ ionlari bilan juda kam eriydigan qo'rg'oshin sulfidni hosil qiladi.", "Qora cho'kma tushadi.", "Bu reaksiya juda sezgir — qo'rg'oshin atsetatli qog'oz sulfidning izlarini ham sezadi."],
  obs: { precipitate: ppt('PbS'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Qora cho'kma hosil bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy sulfid eritmasi quying.", "Bir necha tomchi qo'rg'oshin(II) atsetat eritmasidan qo'shing.", "Qora cho'kma hosil bo'lishini kuzating."],
  safety: `Qo'rg'oshin birikmalari zaharli; sulfidlarni kislotalar bilan aralashtirmang (H₂S ajraladi). ${GOGGLES}`,
  explanation: "Sulfid ionlari qo'rg'oshin(II) ionlari bilan qora qo'rg'oshin sulfid cho'kmasini hosil qiladi. Bu sulfid ionlari va vodorod sulfidga eng ko'p ishlatiladigan sifat reaksiyadir.",
  questions: ["Sulfid ionini yana qanday reaktivlar bilan aniqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing.", "Nima uchun kumush buyumlar vaqt o'tishi bilan qorayadi?"],
});

R({
  title: "Sulfid ionining kislota bilan reaksiyasi — vodorod sulfid ajralishi",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: sulfid ioni", engine: 'rules',
  reactants: [
    { species: 'Na2S', state: 'aq', conc_M: 0.5, volume_mL: 1 },
    { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Na2S + 2HCl = 2NaCl + H2S↑',
    ionic_full: '2Na⁺ + S²⁻ + 2H⁺ + 2Cl⁻ = 2Na⁺ + 2Cl⁻ + H2S↑',
    ionic_net: 'S²⁻ + 2H⁺ = H2S↑',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kuchli kislota H⁺ ionlari sulfid ionini protonlaydi.", "Kuchsiz va uchuvchan vodorod sulfid hosil bo'ladi.", "H₂S palag'da tuxum hidi va qo'rg'oshin atsetatli qog'ozni qoraytirishi bilan aniqlanadi."],
  obs: { gas: gas('H2S'), heat: 'sezilarsiz', effects: fx('bubbles'), text_uz: "Palag'da tuxum hidi paydo bo'ladi; probirka og'ziga tutilgan qo'rg'oshin atsetatli ho'l qog'oz qorayadi." },
  kinetics: 'bir-zumda',
  apparatus: [...TUBE, 'filtr-qogoz'],
  procedure: ["Probirkaga 1 ml natriy sulfid eritmasi quying.", "Ustiga 1 ml suyultirilgan xlorid kislota qo'shing.", "Probirka og'ziga qo'rg'oshin(II) atsetat eritmasi bilan ho'llangan filtr qog'ozini tuting."],
  safety: `${HOOD}. H₂S juda zaharli — hidlamang, faqat oz miqdorda ishlang.`,
  explanation: "Sulfidlar kuchli kislotalar bilan vodorod sulfid ajratadi. Gazning hidi va qo'rg'oshin atsetatli qog'ozning qorayishi sulfid ionlari borligini tasdiqlaydi.",
  questions: ["Nima uchun sulfidlarni kislotalar bilan ishlash xavfli?", "H₂S ni qanday aniqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Karbonat ionini kislota va ohakli suv yordamida aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: karbonat ioni", engine: 'rules',
  reactants: [
    { species: 'Na2CO3', state: 'aq', conc_M: 0.5, volume_mL: 1 },
    { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  cond: { note_uz: "Ajralgan gaz gaz chiqarish naychasi orqali ohakli suvga o'tkaziladi." },
  eq: {
    molecular: 'Na2CO3 + 2HCl = 2NaCl + CO2↑ + H2O',
    ionic_full: '2Na⁺ + CO3²⁻ + 2H⁺ + 2Cl⁻ = 2Na⁺ + 2Cl⁻ + CO2↑ + H2O',
    ionic_net: 'CO3²⁻ + 2H⁺ = CO2↑ + H2O',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kuchli kislota karbonat ionini beqaror karbonat kislotagacha protonlaydi.", "H₂CO₃ CO₂ va suvga parchalanadi — eritma \"qaynaydi\".", "Ajralgan CO₂ ohakli suvni loyqalantiradi (CaCO₃ cho'kmasi)."],
  obs: { gas: gas('CO2'), heat: 'sezilarsiz', effects: fx('bubbles', 'foam'), text_uz: "Shiddatli pufakchalar (\"qaynash\") kuzatiladi; ajralgan hidsiz gaz ohakli suvni loyqalantiradi." },
  kinetics: 'bir-zumda',
  apparatus: ['probirka', 'tomizgich', 'gaz-naycha-egilgan', 'rezina-tiqin-1-teshikli-kichik'],
  procedure: ["Probirkaga 1 ml natriy karbonat eritmasi quying.", "Xlorid kislota qo'shib, probirkani darhol gaz chiqarish naychali tiqin bilan yoping.", "Naycha uchini ohakli suvli probirkaga tushiring va loyqalanishni kuzating."],
  safety: GOGGLES,
  explanation: "Karbonatlar kislotalar bilan CO₂ ajratadi; gaz hidsiz bo'lib, ohakli suvni loyqalantiradi. Bu ikki belgining birgalikda kuzatilishi karbonat (yoki gidrokarbonat) ioni borligini tasdiqlaydi.",
  questions: ["Karbonat va sulfit ionlarini kislota ta'sirida qanday farqlash mumkin?", "Ohakli suvning loyqalanish tenglamasini yozing.", "Ohaktosh tarkibida karbonat borligini uyda qanday tekshirish mumkin?"],
});

R({
  title: "Karbonat ionining bariy xlorid bilan reaksiyasi va cho'kmaning kislotada erishi",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: karbonat ioni", engine: 'rules',
  reactants: [
    { species: 'K2CO3', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'BaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: 'K2CO3 + BaCl2 = BaCO3↓ + 2KCl',
    ionic_full: '2K⁺ + CO3²⁻ + Ba²⁺ + 2Cl⁻ = BaCO3↓ + 2K⁺ + 2Cl⁻',
    ionic_net: 'Ba²⁺ + CO3²⁻ = BaCO3↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Neytral eritmada CO₃²⁻ ionlari Ba²⁺ bilan oq BaCO₃ ni hosil qiladi.", "BaCO₃ kislotalarda CO₂ ajratib eriydi.", "Bu xossasi bilan u BaSO₄ dan farq qiladi."],
  obs: { precipitate: ppt('BaCO3'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq cho'kma tushadi; xlorid kislota qo'shilganda pufakchalar chiqarib eriydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kaliy karbonat eritmasi quying.", "Bir necha tomchi bariy xlorid eritmasidan qo'shing.", "Cho'kmaga xlorid kislota tomizib, gaz ajralib erishini kuzating."],
  safety: `Bariy tuzlari zaharli. ${GOGGLES}`,
  explanation: "Karbonat ioni bariy ionlari bilan oq cho'kma beradi, lekin bu cho'kma kislotada CO₂ ajratib eriydi. Shu bilan karbonat ionini kislotada erimaydigan BaSO₄ beruvchi sulfat ionidan farqlash mumkin.",
  questions: ["BaCO₃ ning xlorid kislotada erish tenglamasini yozing.", "Sulfat va karbonat ionlarini qanday farqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Fosfat ionini kumush nitrat bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: fosfat ioni", engine: 'rules',
  reactants: [
    { species: 'Na3PO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'AgNO3', state: 'aq', conc_M: 0.1, volume_mL: 3 },
  ],
  eq: {
    molecular: 'Na3PO4 + 3AgNO3 = Ag3PO4↓ + 3NaNO3',
    ionic_full: '3Na⁺ + PO4³⁻ + 3Ag⁺ + 3NO3⁻ = Ag3PO4↓ + 3Na⁺ + 3NO3⁻',
    ionic_net: '3Ag⁺ + PO4³⁻ = Ag3PO4↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["PO₄³⁻ ionlari Ag⁺ ionlari bilan erimaydigan kumush fosfatni hosil qiladi.", "Cho'kma sariq rangli.", "Ag₃PO₄ nitrat kislotada eriydi — bu uni AgI dan farqlaydi."],
  obs: { precipitate: ppt('Ag3PO4'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Sariq cho'kma hosil bo'ladi; u nitrat kislotada eriydi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy fosfat eritmasi quying.", "Bir necha tomchi kumush nitrat eritmasidan qo'shing.", "Cho'kmaga nitrat kislota tomizib, erishini kuzating."],
  safety: `Kumush nitrat terini qoraytiradi. ${GOGGLES}`,
  explanation: "Fosfat ionlari kumush ionlari bilan sariq kumush fosfat cho'kmasini beradi. Bu cho'kma nitrat kislotada eriydi, sariq kumush yodid esa erimaydi — shu bilan bu ikki ion farqlanadi.",
  questions: ["Ag₃PO₄ va AgI ni qanday farqlash mumkin?", "Mineral o'g'itlarda fosfat borligini qanday aniqlash mumkin?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Nitrat ionini mis va sulfat kislota bilan aniqlash",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: nitrat ioni", engine: 'rules',
  reactants: [
    { species: 'KNO3', state: 'aq', conc_M: 1, volume_mL: 1 },
    { species: 'Cu', state: 's', mass_g: 0.5, form: 'qirindi' },
    { species: 'H2SO4', state: 'aq', conc_M: 9, volume_mL: 1 },
  ],
  cond: { heating: true, note_uz: "Nitrat eritmasiga mis qirindisi va (1:1) sulfat kislota qo'shilib, kuchsiz qizdiriladi." },
  eq: {
    molecular: '3Cu + 2KNO3 + 4H2SO4 = 3CuSO4 + K2SO4 + 2NO↑ + 4H2O',
    ionic_full: '3Cu + 2K⁺ + 2NO3⁻ + 8H⁺ + 4SO4²⁻ = 3Cu²⁺ + 3SO4²⁻ + 2K⁺ + SO4²⁻ + 2NO↑ + 4H2O',
    ionic_net: '3Cu + 2NO3⁻ + 8H⁺ = 3Cu²⁺ + 2NO↑ + 4H2O',
    electron_balance: ['Cu⁰ − 2e⁻ = Cu⁺²', 'N⁺⁵ + 3e⁻ = N⁺²'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Sulfat kislota muhitida nitrat ionlari nitrat kislota kabi oksidlovchi bo'ladi.", "Mis Cu²⁺ ga oksidlanadi, nitrat ionidagi azot (+5) NO gacha (+2) qaytariladi.", "Rangsiz NO probirka og'zida havodagi kislorod bilan qo'ng'ir NO₂ ga aylanadi: 2NO + O₂ = 2NO₂."],
  obs: { gas: gas('NO'), solution_color_change: { from: '#ffffff', to: ionColor('Cu^2+') }, heat: 'ekzotermik', effects: fx('bubbles', 'color-gas'), text_uz: "Qizdirilganda mis atrofida pufakchalar ajraladi, eritma ko'kimtir tusga kiradi; probirkaning yuqori qismida va og'zida qo'ng'ir gaz paydo bo'ladi." },
  kinetics: "o'rtacha",
  apparatus: ['probirka', 'tomizgich', 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml tekshiriladigan eritma (kaliy nitrat) quying va bir bo'lak mis qirindisi soling.", "Ehtiyotkorlik bilan 1 ml (1:1) sulfat kislota qo'shing.", "Probirkani kuchsiz qizdiring va oq qog'oz fonida probirka og'zidagi gaz rangini kuzating."],
  safety: `${HOOD}: azot oksidlari juda zaharli. Sulfat kislota terini kuydiradi — ko'zoynak, qo'lqop va xalatda ishlang.`,
  explanation: "Nitrat ionlari kislotali muhitda misni oksidlaydi va azot(II) oksid ajraladi; u havoda qo'ng'ir NO₂ ga aylanadi. Nitratlar deyarli barcha kationlar bilan eriydigan tuzlar hosil qilgani uchun nitrat ioni cho'ktirish orqali emas, aynan shu oksidlovchilik xossasi bo'yicha aniqlanadi. Dvigatelda Cu + NO₃⁻ + H⁺ jarayoni gazlar toifasidagi suyultirilgan nitrat kislota yozuvi (gazolish) orqali bajariladi.",
  questions: ["Nima uchun nitrat ionini cho'ktirish reaksiyasi bilan aniqlab bo'lmaydi?", "Probirka og'zida qo'ng'ir gaz paydo bo'lishini tenglama bilan tushuntiring.", "Bu reaksiyada sulfat kislotaning vazifasi nima?"],
  confidence: "o'rta",
});

R({
  title: "Silikat ionini kislota bilan aniqlash — silikat kislota iviqining hosil bo'lishi",
  level: '9-sinf', topic: "Anionlarga sifat reaksiyalar: silikat ioni", engine: 'rules',
  reactants: [
    { species: 'Na2SiO3', state: 'aq', conc_M: 0.5, volume_mL: 1 },
    { species: 'HCl', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  eq: {
    molecular: 'Na2SiO3 + 2HCl = H2SiO3↓ + 2NaCl',
    ionic_full: '2Na⁺ + SiO3²⁻ + 2H⁺ + 2Cl⁻ = H2SiO3↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: 'SiO3²⁻ + 2H⁺ = H2SiO3↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["Silikat kislota juda kuchsiz kislota, shuning uchun kuchli kislotalar uni tuzlaridan siqib chiqaradi.", "H₂SiO₃ suvda erimaydi.", "U iviqsimon (gel) cho'kma yoki butun hajmni egallovchi iviq hosil qiladi."],
  obs: { precipitate: ppt('H2SiO3'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Rangsiz shaffof iviqsimon cho'kma hosil bo'ladi; konsentrlangan eritmalarda butun suyuqlik iviqqa aylanadi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy silikat (suyuq shisha) eritmasi quying.", "Tomchilab xlorid kislota qo'shing va chayqating.", "Iviqsimon cho'kma hosil bo'lishini kuzating."],
  safety: `Natriy silikat eritmasi ishqoriy — ko'zga tushishidan saqlaning. ${GOGGLES}`,
  explanation: "Silikat ionlari kislotalar bilan suvda erimaydigan iviqsimon silikat kislota hosil qiladi. Bu silikat ioniga xos sifat reaksiya bo'lib, \"kuchli kislota kuchsiz kislotani tuzidan siqib chiqaradi\" qoidasini yaqqol ko'rsatadi.",
  questions: ["Nima uchun silikat kislota iviq holida ajraladi?", "Natriy silikat eritmasiga CO₂ o'tkazilsa nima kuzatiladi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Atsetat ionini sulfat kislota bilan aniqlash (sirka kislota hidi)",
  level: '10-sinf', topic: "Anionlarga sifat reaksiyalar: atsetat ioni", engine: 'rules',
  reactants: [
    { species: 'CH3COONa', state: 'aq', conc_M: 1, volume_mL: 1 },
    { species: 'H2SO4', state: 'aq', conc_M: 2, volume_mL: 1 },
  ],
  cond: { heating: true, note_uz: "Aralashma kuchsiz isitiladi va hid qo'l bilan yelpib aniqlanadi." },
  eq: {
    molecular: '2CH3COONa + H2SO4 = Na2SO4 + 2CH3COOH',
    ionic_full: '2Na⁺ + 2CH3COO⁻ + 2H⁺ + SO4²⁻ = 2Na⁺ + SO4²⁻ + 2CH3COOH',
    ionic_net: 'CH3COO⁻ + H⁺ = CH3COOH',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kuchli sulfat kislota atsetat ionlarini protonlaydi.", "Kuchsiz va uchuvchan sirka kislota hosil bo'ladi.", "Isitilganda sirka kislota bug'lari o'ziga xos o'tkir hidi bilan seziladi."],
  obs: { heat: 'sezilarsiz', effects: fx('heat-haze'), text_uz: "Isitilganda o'tkir sirka hidi paydo bo'ladi." },
  kinetics: 'bir-zumda',
  apparatus: [...TUBE, 'spirt-lampasi', 'probirka-qisqichi'],
  procedure: ["Probirkaga 1 ml natriy atsetat eritmasi quying.", "1 ml suyultirilgan sulfat kislota qo'shing.", "Aralashmani kuchsiz isiting va hidni qo'l bilan yelpib aniqlang."],
  safety: `Kislota bug'larini to'g'ridan-to'g'ri hidlamang; qizdirishda probirka og'zini o'zingizga qaratmang. ${GOGGLES}`,
  explanation: "Kuchli kislotalar atsetatlardan kuchsiz sirka kislotani siqib chiqaradi; uning o'tkir hidi atsetat ioni borligini ko'rsatadi. Bu reaksiyada cho'kma yoki rang o'zgarishi bo'lmagani uchun aniqlash hid bo'yicha amalga oshiriladi.",
  questions: ["Nima uchun sulfat kislota sirka kislotani tuzidan siqib chiqaradi?", "Atsetat ionini aniqlashning yana qanday usullarini bilasiz?", "Qisqartirilgan ionli tenglamani yozing."],
  confidence: "o'rta",
});

R({
  title: "Xromat ionining kislotali muhitda dixromatga o'tishi",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: xromat va dixromat ionlari", engine: 'record',
  reactants: [
    { species: 'K2CrO4', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  eq: {
    molecular: '2K2CrO4 + H2SO4 = K2Cr2O7 + K2SO4 + H2O',
    ionic_full: '4K⁺ + 2CrO4²⁻ + 2H⁺ + SO4²⁻ = 2K⁺ + Cr2O7²⁻ + 2K⁺ + SO4²⁻ + H2O',
    ionic_net: '2CrO4²⁻ + 2H⁺ = Cr2O7²⁻ + H2O',
  },
  mech: 'sifat-reaksiya',
  steps: ["Kislotali muhitda xromat ionlari protonlanadi.", "Ikki xromat ioni suv ajratib birlashadi va dixromat ionini hosil qiladi.", "Eritma sariqdan to'q sariq rangga o'tadi; ishqor qo'shilsa jarayon teskari yo'nalishda boradi."],
  obs: { solution_color_change: { from: ionColor('CrO4^2-'), to: ionColor('Cr2O7^2-') }, heat: 'sezilarsiz', effects: fx('swirl'), text_uz: "Sariq eritma kislota qo'shilganda to'q sariq rangga kiradi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml kaliy xromat eritmasi quying.", "Tomchilab suyultirilgan sulfat kislota qo'shing va rang o'zgarishini kuzating.", "So'ng natriy gidroksid qo'shib, sariq rangning qaytishini kuzating."],
  safety: `Xromatlar va dixromatlar zaharli va kanserogen — qo'lqopda ishlang, chiqindini maxsus idishga to'king. ${GOGGLES}`,
  explanation: "Xromat va dixromat ionlari muhitga qarab bir-biriga o'tadi: kislotali muhitda to'q sariq dixromat, ishqoriy muhitda sariq xromat barqaror. Bu oksidlanish-qaytarilish emas — xromning oksidlanish darajasi ikkala ionda ham +6.",
  questions: ["Bu reaksiyada xromning oksidlanish darajasi o'zgaradimi?", "Dixromat eritmasiga ishqor qo'shilsa nima kuzatiladi?", "Muvozanatning siljishini Le Shatelye prinsipi asosida tushuntiring."],
});

R({
  title: "Yodni kraxmal yordamida aniqlash",
  level: '9-sinf', topic: "Yodga sifat reaksiya", engine: 'rules',
  equation_free: true,
  equation_free_uz: "Yod molekulalari kraxmal (amiloza) spiral molekulalari ichiga kirib, to'q ko'k rangli kiritma birikma (klatrat) hosil qiladi; bu birikma aniq stexiometrik tarkibga ega emas, shuning uchun kimyoviy tenglama yozilmaydi.",
  reactants: [
    { species: 'yodli-suv', state: 'aq', volume_mL: 1 },
    { species: '(C6H10O5)n', state: 'aq', conc_M: 0.06, volume_mL: 1 },
  ],
  eq: {},
  mech: 'sifat-reaksiya',
  steps: ["Kraxmal tarkibidagi amiloza molekulalari spiral shaklga ega.", "Yod molekulalari (I₃⁻ zanjirlari) spiral ichiga joylashib qoladi.", "Hosil bo'lgan kiritma birikma yorug'likni kuchli yutib, to'q ko'k rang beradi; qizdirilganda rang yo'qoladi, sovutilganda qaytadi."],
  obs: { solution_color_change: { from: sub('I2').aq_color.hex, to: sub('kraxmal-yod').aq_color.hex }, heat: 'sezilarsiz', effects: fx('swirl'), text_uz: "Och sariq yodli suv kraxmal kleystri qo'shilganda to'q ko'k rangga kiradi." },
  kinetics: 'bir-zumda',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml yodli suv quying.", "Bir necha tomchi kraxmal kleystri qo'shing.", "Rangni kuzating; probirkani isitib, so'ng sovutib rang o'zgarishini kuzating."],
  safety: GOGGLES,
  explanation: "Kraxmal yod bilan to'q ko'k rang beradi — bu juda sezgir reaksiya bo'lib, yodni ham, kraxmalni ham aniqlashda qo'llaniladi. Rang kimyoviy bog' emas, yodning kraxmal spirallari ichiga kirib qolishi bilan bog'liq, shuning uchun qizdirilganda yo'qolib, sovutilganda qaytadi.",
  questions: ["Kraxmal-yod reaksiyasi qayerlarda qo'llaniladi?", "Nima uchun qizdirilganda ko'k rang yo'qoladi?", "Kartoshka kesimiga yod tomizilsa nima kuzatiladi?"],
});

R({
  title: "Ftorid ionini kalsiy xlorid bilan aniqlash",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: ftorid ioni", engine: 'rules',
  reactants: [
    { species: 'NaF', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'CaCl2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
  ],
  eq: {
    molecular: '2NaF + CaCl2 = CaF2↓ + 2NaCl',
    ionic_full: '2Na⁺ + 2F⁻ + Ca²⁺ + 2Cl⁻ = CaF2↓ + 2Na⁺ + 2Cl⁻',
    ionic_net: 'Ca²⁺ + 2F⁻ = CaF2↓',
  },
  mech: 'sifat-reaksiya',
  steps: ["F⁻ ionlari Ca²⁺ ionlari bilan juda kam eriydigan kalsiy ftoridni hosil qiladi.", "Oq, kolloidga yaqin mayda cho'kma tushadi.", "Kumush ftorid esa suvda eriydi, shuning uchun F⁻ ni AgNO₃ bilan aniqlab bo'lmaydi."],
  obs: { precipitate: ppt('CaF2'), heat: 'sezilarsiz', effects: fx('turbidity'), text_uz: "Oq mayda (shilimshiq) cho'kma hosil bo'ladi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy ftorid eritmasi quying.", "Bir necha tomchi kalsiy xlorid eritmasidan qo'shing.", "Cho'kma hosil bo'lishini kuzating."],
  safety: `Ftoridlar zaharli — og'izga tegmasin, ishdan so'ng qo'lingizni yuving. ${GOGGLES}`,
  explanation: "Ftorid ioni boshqa galogenid ionlaridan farqli ravishda kumush bilan cho'kma bermaydi, ammo kalsiy bilan erimaydigan oq kalsiy ftorid (flyuorit) hosil qiladi. Tish pastasidagi ftoridlarning tish emalini mustahkamlashi ham kalsiy bilan birikishiga asoslangan.",
  questions: ["Nima uchun ftorid ionini kumush nitrat bilan aniqlab bo'lmaydi?", "Tabiatda CaF₂ qanday mineral holida uchraydi?", "Qisqartirilgan ionli tenglamani yozing."],
});

R({
  title: "Nitrit ionini kaliy yodid bilan kislotali muhitda aniqlash",
  level: 'litsey', topic: "Anionlarga sifat reaksiyalar: nitrit ioni", engine: 'record',
  reactants: [
    { species: 'NaNO2', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'KI', state: 'aq', conc_M: 0.1, volume_mL: 1 },
    { species: 'H2SO4', state: 'aq', conc_M: 1, volume_mL: 1 },
  ],
  cond: { medium: 'kislotali' },
  eq: {
    molecular: '2NaNO2 + 2KI + 2H2SO4 = 2NO↑ + I2 + Na2SO4 + K2SO4 + 2H2O',
    ionic_full: '2Na⁺ + 2NO2⁻ + 2K⁺ + 2I⁻ + 4H⁺ + 2SO4²⁻ = 2NO↑ + I2 + 2Na⁺ + SO4²⁻ + 2K⁺ + SO4²⁻ + 2H2O',
    ionic_net: '2NO2⁻ + 2I⁻ + 4H⁺ = 2NO↑ + I2 + 2H2O',
    electron_balance: ['N⁺³ + 1e⁻ = N⁺²', '2I⁻¹ − 2e⁻ = I2⁰'],
  },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Kislotali muhitda nitrit ioni nitrit kislotaga aylanadi va oksidlovchi bo'ladi.", "Azot (+3) bir elektron olib NO ga (+2) qaytariladi.", "Yodid ionlari erkin yodgacha oksidlanadi — eritma qo'ng'irlashadi, kraxmal bilan ko'karadi."],
  obs: { gas: gas('NO'), solution_color_change: { from: '#ffffff', to: sub('I2').aq_color.hex }, heat: 'sezilarsiz', effects: fx('bubbles', 'swirl'), text_uz: "Eritma qo'ng'ir rangga kiradi (kraxmal bilan to'q ko'k), mayda pufakchalar ajraladi; probirka og'zida gaz havoda qo'ng'irlashadi." },
  kinetics: 'tez',
  apparatus: TUBE,
  procedure: ["Probirkaga 1 ml natriy nitrit eritmasi quying.", "1 ml kaliy yodid eritmasi va 1 ml suyultirilgan sulfat kislota qo'shing.", "Eritma rangini kuzating; bir tomchi kraxmal kleystri qo'shib, ko'k rangni tekshiring."],
  safety: `${HOOD}: azot oksidlari zaharli. Nitritlar zaharli — og'izga tegmasin. ${GOGGLES}`,
  explanation: "Kislotali muhitda nitrit ionlari yodid ionlarini erkin yodgacha oksidlaydi, o'zlari esa azot(II) oksidgacha qaytariladi. Nitrat ionlari bunday sharoitda yodni ajratmaydi, shuning uchun bu reaksiya nitritni nitratdan farqlashga imkon beradi.",
  questions: ["Nitrit va nitrat ionlarini qanday farqlash mumkin?", "Bu reaksiyada nitrit ioni qanday xossani namoyon qiladi?", "Oziq-ovqat mahsulotlarida nitritlarning ko'pligi nima uchun xavfli?"],
});

const json = JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n';
writeFileSync(join(DATA, 'reactions', `${CAT}.json`), json);
console.log(`${CAT}: ${out.length} ta yozuv yozildi`);
