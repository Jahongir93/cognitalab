// "Uglevodlar" toifasi tajribalari generatori.
// Ishga tushirish: node tools/seed/reactions/uglevodlar.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CAT = 'uglevodlar';
const PFX = 'sakarid';
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

const T_MONO = 'Monosaxaridlar: glyukoza va fruktoza';
const T_DI = 'Disaxaridlar: saxaroza';
const T_POLI = 'Polisaxaridlar: kraxmal va sellyuloza';
const GLU = 'CH2OH–(CHOH)4–CHO';

R({
  title: "Glyukozaning \"kumush ko'zgu\" reaksiyasi",
  level: '10-sinf', topic: T_MONO, engine: 'record',
  reactants: [{ species: 'C6H12O6', state: 'aq', conc_M: 0.5, volume_mL: 1 }, { species: 'Tollens', state: 'aq', volume_mL: 4 }],
  cond: { heating: true, temp_min_C: 50, note_uz: "Probirka 60–70 °C li suv hammomida chayqatmasdan qizdiriladi." },
  eq: {
    molecular: 'C6H12O6 + 2[Ag(NH3)2]OH → 2Ag↓ + C6H11O7NH4 + 3NH3 + H2O',
    ionic_net: 'C6H12O6 + 2[Ag(NH3)2]⁺ + 2OH⁻ → 2Ag↓ + C6H11O7NH4 + 3NH3 + H2O',
    electron_balance: ['C⁺¹ − 2e⁻ = C⁺³', 'Ag⁺ + 1e⁻ = Ag⁰'],
  },
  mech: 'organik',
  steps: ["Glyukozaning ochiq zanjirli shaklida aldegid guruhi (–CHO) bor.", "Ammiakli eritmada diamminkumush(I) ionlari aldegid guruhini karboksil guruhgacha oksidlaydi (ammiakli muhitda ammoniy glyukonat hosil bo'ladi).", "Ag⁺ ionlari metall kumushgacha qaytarilib, probirka devoriga ko'zgu qatlami bo'lib o'tiradi."],
  organic: { template: 'oksidlanish', params: { substrate: GLU, oxidant: '[Ag(NH3)2]⁺', product: 'CH2OH–(CHOH)4–COONH4' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'mirror' }, { type: 'deposit' }], text_uz: "Bir necha daqiqadan so'ng probirka devorlarida yaltiroq kumush ko'zgu qatlami hosil bo'ladi." },
  kinetics: "o'rtacha", app: ['probirka', 'suv-hammomi', 'tomizgich', 'termometr'],
  proc: ["Yaxshi yuvilgan (ishqor bilan yog'sizlantirilgan) probirkaga 2–4 ml yangi tayyorlangan Tollens reaktivi quying.", "Unga 1 ml glyukoza eritmasi qo'shing.", "Probirkani 60–70 °C li suv hammomiga qo'ying va chayqatmasdan kuzating."],
  safety: "Tollens reaktivini faqat tajriba oldidan tayyorlang va saqlamang — eskirganda portlovchi birikmalar hosil bo'lishi mumkin; qoldiqni darhol suyultirilgan nitrat kislota bilan zararsizlantiring.",
  expl: "Glyukoza aldegid guruhi tutgani uchun aldegidlar kabi \"kumush ko'zgu\" reaksiyasini beradi va glyukon kislotagacha (ammiakli muhitda uning ammoniyli tuzigacha) oksidlanadi. Bu reaksiya glyukozani aniqlashda va oyna (ko'zgu) ishlab chiqarishda qo'llaniladi.",
  q: ["Glyukoza molekulasidagi qaysi guruh \"kumush ko'zgu\" reaksiyasini beradi?", "Saxaroza bu reaksiyani beradimi? Nima uchun?", "Glyukoza qaysi moddagacha oksidlanadi?"],
});

R({
  title: "Glyukozaning ko'p atomli spirt sifatida mis(II) gidroksid bilan reaksiyasi (sovuqda)",
  level: '10-sinf', topic: T_MONO, engine: 'rules',
  equation_free: true, equation_free_uz: "Glyukozaning qo'shni gidroksil guruhlari Cu²⁺ bilan ko'k rangli kompleks hosil qiladi; kompleks tarkibi muhit va nisbatlarga bog'liq bo'lgani uchun aniq tenglama yozilmaydi (darsliklarda soddalashtirilgan sxema beriladi).",
  reactants: [{ species: 'C6H12O6', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'Cu(OH)2', state: 's', mass_g: 0.05 }],
  cond: { note_uz: "Cu(OH)₂ ortiqcha NaOH ishtirokida CuSO₄ dan yangi cho'ktirib olinadi; reaksiya xona haroratida o'tkaziladi." },
  mech: 'kompleks',
  steps: ["Glyukoza molekulasida beshta gidroksil guruh bor, ulardan qo'shnilari ko'p atomli spirtlar kabi ta'sir ko'rsatadi.", "Ishqoriy muhitda qo'shni OH guruhlari Cu²⁺ ioni bilan halqali kompleks hosil qiladi.", "Cu(OH)₂ cho'kmasi erib, to'q ko'k eritma hosil bo'ladi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#2a50c8' }, heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Havorang Cu(OH)₂ cho'kmasi glyukoza eritmasida eriydi, to'q ko'k tiniq eritma hosil bo'ladi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml NaOH eritmasidan quying va 2–3 tomchi CuSO₄ eritmasi qo'shib Cu(OH)₂ cho'kmasini oling.", "Ustiga 2 ml glyukoza eritmasi qo'shib chayqating.", "Cho'kmaning erishini va eritma rangini kuzating (eritmani keyingi tajriba uchun saqlang)."],
  safety: "Ishqor eritmasi ko'zga xavfli — ko'zoynak taqing; mis tuzlari zaharli.",
  expl: "Glyukoza ikki xil funksional guruh tutadi: gidroksil guruhlari hisobiga u glitserin kabi Cu(OH)₂ ni eritib to'q ko'k eritma beradi, aldegid guruhi hisobiga esa qizdirilganda Cu(OH)₂ ni qaytaradi. Demak, glyukoza aldegidospirt.",
  q: ["Bu tajriba glyukoza molekulasida qaysi guruhlar borligini isbotlaydi?", "Glitserin bilan Cu(OH)₂ ning reaksiyasi bu reaksiyaga qanday o'xshaydi?"],
});

R({
  title: "Glyukozaning mis(II) gidroksid bilan qizdirilgandagi oksidlanishi",
  level: '10-sinf', topic: T_MONO, engine: 'record',
  reactants: [{ species: 'C6H12O6', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'Cu(OH)2', state: 's', mass_g: 0.1 }],
  cond: { heating: true, temp_min_C: 60, note_uz: "Cu(OH)₂ ortiqcha ishqor ishtirokida yangi cho'ktirib olinadi; aralashmaning yuqori qismi qizdiriladi." },
  eq: {
    molecular: 'C6H12O6 + 2Cu(OH)2 → C6H12O7 + Cu2O↓ + 2H2O',
    electron_balance: ['C⁺¹ − 2e⁻ = C⁺³', 'Cu⁺² + 1e⁻ = Cu⁺¹'],
  },
  mech: 'organik',
  steps: ["Qizdirilganda glyukozaning aldegid guruhi Cu(OH)₂ tomonidan karboksil guruhgacha oksidlanadi.", "Cu⁺² bir elektron qabul qilib Cu⁺¹ ga qaytariladi.", "Avval sariq CuOH, so'ng qizil mis(I) oksid cho'kmasi hosil bo'ladi."],
  organic: { template: 'oksidlanish', params: { substrate: GLU, oxidant: 'Cu(OH)2', product: 'CH2OH–(CHOH)4–COOH' } },
  obs: { precipitate: { species: 'Cu2O', color: '#b8321e', texture: 'kukunsimon' }, heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Qizdirilganda to'q ko'k eritma avval sarg'ayadi, so'ng g'isht-qizil Cu₂O cho'kmasi tushadi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Oldingi tajribada olingan glyukozaning Cu(OH)₂ bilan hosil qilgan to'q ko'k eritmasini oling (yoki yangidan tayyorlang).", "Probirkani qisqichga olib, eritmaning yuqori qismini spirt lampasida qizdiring.", "Rang o'zgarishini va cho'kma hosil bo'lishini kuzating."],
  safety: "Ishqoriy eritma qizdirilganda sachrashi mumkin — probirka og'zini odamlarga qaratmang, ko'zoynak taqing.",
  expl: "Glyukoza aldegid guruhi hisobiga qizdirilganda mis(II) gidroksidni mis(I) oksidgacha qaytaradi, o'zi esa glyukon kislotagacha oksidlanadi. Bu reaksiya (shuningdek Feling suyuqligi bilan) qon va siydikda qand miqdorini aniqlashda qo'llanilgan.",
  q: ["Nima uchun sovuqda va qizdirilganda Cu(OH)₂ bilan turlicha natija kuzatiladi?", "Bu reaksiyada oksidlovchi va qaytaruvchini ko'rsating."],
});

R({
  title: "Saxarozaning \"kumush ko'zgu\" reaksiyasini bermasligi",
  level: '10-sinf', topic: T_DI, engine: 'record',
  no_reaction: true, match: ['C12H22O11', '[Ag(NH3)2]⁺'],
  reactants: [{ species: 'C12H22O11', state: 'aq', conc_M: 0.3, volume_mL: 1 }, { species: 'Tollens', state: 'aq', volume_mL: 2 }],
  cond: { heating: true, temp_min_C: 50, note_uz: "Taqqoslash uchun glyukoza bilan ham parallel tajriba o'tkaziladi." },
  mech: 'oksidlanish-qaytarilish',
  steps: ["Saxaroza molekulasida glyukoza va fruktoza qoldiqlari o'zlarining yarimatsetal (glikozid) gidroksillari orqali bog'langan.", "Shu sababli saxaroza eritmada ochiq zanjirli aldegid shaklga o'ta olmaydi.", "Aldegid guruhi bo'lmagani uchun diamminkumush(I) ionlari qaytarilmaydi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Qizdirilganda ham kumush ko'zgu hosil bo'lmaydi, eritma tiniq qoladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'suv-hammomi', 'tomizgich'],
  proc: ["Ikki toza probirkaga 2 ml dan Tollens reaktivi quying.", "Biriga 1 ml saxaroza, ikkinchisiga 1 ml glyukoza eritmasi qo'shing.", "Ikkala probirkani 60–70 °C li suv hammomida qizdiring va natijalarni solishtiring."],
  safety: "Tollens reaktivini oldindan tayyorlab qo'ymang; tajribadan so'ng qoldiqni darhol zararsizlantiring.",
  expl: "Saxaroza qaytaruvchi bo'lmagan disaxarid: uning molekulasida erkin aldegid guruhi yo'q. Shuning uchun u \"kumush ko'zgu\" reaksiyasini bermaydi va Cu(OH)₂ ni qizdirilganda qaytarmaydi. Maltoza va laktoza esa qaytaruvchi disaxaridlar.",
  q: ["Nima uchun saxaroza qaytaruvchi xossaga ega emas?", "Qaysi disaxaridlar \"kumush ko'zgu\" reaksiyasini beradi?"],
});

R({
  title: "Saxarozaning kislotali gidrolizi",
  level: '10-sinf', topic: T_DI, engine: 'record',
  reactants: [{ species: 'C12H22O11', state: 'aq', conc_M: 0.3, volume_mL: 3 }],
  cond: { heating: true, temp_min_C: 70, catalyst: 'H2SO4', note_uz: "Katalizator — 1 ml suyultirilgan sulfat kislota; aralashma 5 daqiqa qaynatiladi, so'ng NaOH bilan neytrallanib, Cu(OH)₂ bilan sinaladi." },
  eq: { molecular: 'C12H22O11 + H2O → C6H12O6 + C6H12O6' },
  mech: 'organik',
  steps: ["H⁺ ioni glyukoza va fruktoza qoldiqlarini bog'lovchi glikozid kislorod atomini protonlaydi.", "Glikozid bog'i uziladi, suv molekulasi qoldiqlarga OH va H tarzida birikadi.", "Natijada glyukoza va fruktoza aralashmasi (invert shakar) hosil bo'ladi; tenglamadagi birinchi C₆H₁₂O₆ — glyukoza, ikkinchisi — fruktoza."],
  organic: { template: 'SN1', params: { substrate: 'saxaroza (glikozid bog\'i)', nucleophile: 'H2O', leaving_group: 'fruktoza (glyukoza) qoldig\'i', product: 'C6H12O6 + C6H12O6' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'boil' }], text_uz: "Qaynatishda tashqi o'zgarish ko'rinmaydi; neytrallangan gidrolizat Cu(OH)₂ bilan qizdirilganda qizil Cu₂O cho'kmasi beradi, gidrolizlanmagan saxaroza esa bermaydi." },
  kinetics: 'sekin', app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi', 'tomizgich'],
  proc: ["Probirkaga 3 ml saxaroza eritmasi va 1 ml suyultirilgan sulfat kislota quying.", "Aralashmani 5 daqiqa qaynating.", "Sovigach, NaOH eritmasi bilan ishqoriy muhitgacha neytrallang.", "Unga 2–3 tomchi CuSO₄ eritmasi qo'shib qizdiring va qizil cho'kma hosil bo'lishini kuzating."],
  safety: "Kislotali va ishqoriy eritmalarni qizdirishda probirka og'zini odamlarga qaratmang; ko'zoynak taqing.",
  expl: "Saxaroza kislotalar (yoki fermentlar) ta'sirida gidrolizlanib, glyukoza va fruktozaga parchalanadi. Gidroliz mahsulotlari qaytaruvchi bo'lgani uchun Cu(OH)₂ ni qaytaradi, saxarozaning o'zi esa qaytarmaydi. Asal asosan glyukoza va fruktoza aralashmasidan iborat.",
  q: ["Nima uchun gidrolizdan keyin eritma Cu(OH)₂ ni qaytaradi?", "Nima uchun Cu(OH)₂ bilan sinashdan oldin eritmani neytrallash kerak?"],
});

R({
  title: "Kraxmalning yod bilan sifat reaksiyasi",
  level: '10-sinf', topic: T_POLI, engine: 'rules',
  equation_free: true, equation_free_uz: "Yod molekulalari kraxmal (amiloza) spiralining ichiga kirib, o'zgaruvchan tarkibli rangli birikma hosil qiladi; kimyoviy bog' hosil bo'lmagani uchun tenglama yozilmaydi.",
  reactants: [{ species: '(C6H10O5)n', state: 'aq', conc_M: 0.06, volume_mL: 2 }, { species: 'Lugol', state: 'aq', volume_mL: 0.1 }],
  mech: 'sifat-reaksiya',
  steps: ["Kraxmalning amiloza qismi spiral shaklidagi uzun zanjirlardan iborat.", "Yod molekulalari (I₂ va I₃⁻) spiral ichiga joylashib, \"kiritilish birikmasi\" hosil qiladi.", "Bu birikma ko'k rangga ega; qizdirilganda spiral yoyilib rang yo'qoladi, sovutilganda qaytadi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#1a1a6a' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Kraxmal kleysteri yod tomizilganda to'q ko'k rangga kiradi; qizdirilganda rang yo'qoladi, sovutilganda yana paydo bo'ladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml kraxmal kleysteri quying.", "Unga 1–2 tomchi yodning kaliy yodiddagi eritmasini (Lugol) qo'shing.", "Rang o'zgarishini kuzating.", "Probirkani qizdirib, so'ng sovutib, rang o'zgarishini kuzating."],
  safety: "Yod eritmasi terini va kiyimni bo'yaydi; qizdirishda probirka og'zini odamlarga qaratmang.",
  expl: "Kraxmal yod bilan to'q ko'k rang beradi — bu kraxmalga (va yodga) xos sifat reaksiya. U yordamida oziq-ovqat mahsulotlarida (kartoshka, non, guruch) kraxmal borligini aniqlash mumkin.",
  q: ["Kartoshka kesimiga yod tomizilganda qanday o'zgarish kuzatiladi?", "Nima uchun qizdirilganda ko'k rang yo'qoladi?"],
});

R({
  title: "Kraxmalning kislotali gidrolizi",
  level: '10-sinf', topic: T_POLI, engine: 'record',
  reactants: [{ species: '(C6H10O5)n', state: 'aq', conc_M: 0.06, volume_mL: 5 }],
  cond: { heating: true, temp_min_C: 90, catalyst: 'H2SO4', note_uz: "Katalizator — 1 ml suyultirilgan sulfat kislota; aralashma 10–15 daqiqa qaynatiladi, vaqti-vaqti bilan bir tomchisi yod bilan sinab turiladi." },
  eq: { molecular: '(C6H10O5)n + nH2O → nC6H12O6' },
  mech: 'organik',
  steps: ["H⁺ ioni glyukoza qoldiqlari orasidagi glikozid bog'larining kislorod atomini protonlaydi.", "Glikozid bog'lari suv ta'sirida ketma-ket uziladi: kraxmal → dekstrinlar → maltoza → glyukoza.", "Gidroliz tugaganda eritma yod bilan ko'k rang bermaydi, lekin Cu(OH)₂ ni qaytaradi."],
  organic: { template: 'SN1', params: { substrate: "kraxmal (α-1,4-glikozid bog'lari)", nucleophile: 'H2O', leaving_group: "glyukoza qoldig'i", product: 'C6H12O6' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'boil' }], text_uz: "Qaynatish davomida olingan namunalarning yod bilan rangi ko'kdan binafsha, qizg'ish-qo'ng'ir rangga o'tadi va oxirida rang bermaydi; neytrallangan gidrolizat Cu(OH)₂ bilan qizil cho'kma beradi." },
  kinetics: 'sekin', app: ['kimyoviy-stakan', 'spirt-lampasi', 'tomchi-plastinkasi', 'tomizgich', 'shisha-tayoqcha'],
  proc: ["Stakanga 5 ml kraxmal kleysteri va 1 ml suyultirilgan sulfat kislota quying.", "Aralashmani qaynating; har 2–3 daqiqada bir tomchisini tomchi plastinkasiga olib, yod eritmasi bilan sinang.", "Yod bilan rang bermay qolgach, eritmani sovutib NaOH bilan neytrallang.", "Gidrolizatni Cu(OH)₂ bilan qizdirib, qizil cho'kma hosil bo'lishini tekshiring."],
  safety: "Kislotali eritmani qaynatishda sachrashdan ehtiyot bo'ling, ko'zoynak taqing.",
  expl: "Kraxmal polisaxarid bo'lib, kislota yoki fermentlar ta'sirida bosqichma-bosqich gidrolizlanadi va oxirida glyukoza hosil bo'ladi. Sanoatda kraxmaldan shu usulda glyukoza va qiyom (patoka) olinadi; organizmda kraxmal fermentlar ta'sirida gidrolizlanadi.",
  q: ["Kraxmal gidrolizining oraliq mahsulotlarini ayting.", "Gidroliz tugaganini qanday aniqlash mumkin?"],
});

R({
  title: "Glyukozaning spirtli bijg'ishi",
  level: '10-sinf', topic: T_MONO, engine: 'record',
  reactants: [{ species: 'C6H12O6', state: 'aq', conc_M: 0.5, volume_mL: 20 }],
  cond: { catalyst: 'achitqi', note_uz: "Glyukoza eritmasiga ozgina achitqi qo'shilib, iliq joyda (25–35 °C) bir necha soat qoldiriladi; ajralgan gaz ohakli suvga o'tkaziladi." },
  eq: { molecular: 'C6H12O6 → 2C2H5OH + 2CO2↑' },
  mech: 'organik',
  steps: ["Achitqi zamburug'lari tarkibidagi fermentlar glyukozani ko'p bosqichli jarayonda parchalaydi.", "Avval glyukoza pirouzum kislotaga, so'ng atsetaldegid va CO₂ ga aylanadi.", "Atsetaldegid etanolgacha qaytariladi; jarayon kislorodsiz sharoitda boradi."],
  organic: { template: 'oksidlanish', params: { substrate: 'C6H12O6', oxidant: "ichki oksidlanish-qaytarilish (achitqi fermentlari)", product: '2C2H5OH + 2CO2' } },
  obs: { gas: { species: 'CO2', color: null, smell_uz: null }, heat: 'ekzotermik', effects: [{ type: 'bubbles' }, { type: 'foam' }], text_uz: "Bir necha soatdan so'ng eritmadan gaz pufakchalari ajrala boshlaydi, yuzada ko'pik hosil bo'ladi; gaz ohakli suvni loyqalantiradi, eritmadan spirt hidi keladi." },
  kinetics: 'juda-sekin', app: ['konussimon-kolba', 'rezina-tiqin-1-teshikli-orta', 'gaz-naycha-egilgan', 'probirka', 'termometr'],
  proc: ["Kolbaga 20 ml glyukoza eritmasi quying va ozgina achitqi qo'shing.", "Kolbani gaz chiqarish naychali tiqin bilan yoping; naycha uchini ohakli suvli probirkaga tushiring.", "Kolbani iliq joyda (25–35 °C) bir necha soat qoldiring.", "Gaz ajralishini, ohakli suvning loyqalanishini va eritma hidini kuzating."],
  safety: "Kolbani germetik yopmang — gaz chiqish yo'li ochiq bo'lishi kerak, aks holda bosim oshadi. Hosil bo'lgan eritmani tatib ko'rmang.",
  expl: "Spirtli bijg'ish — achitqi fermentlari ta'sirida glyukozaning etil spirti va karbonat angidridga parchalanishi. Non yopishda xamirning ko'pchishi va vino tayyorlash shu jarayonga asoslangan. Jarayon biokimyoviy va ko'p bosqichli; tenglama faqat umumiy natijani ko'rsatadi.",
  q: ["Xamir ko'pchishiga qaysi gaz sabab bo'ladi?", "Sut kislotali bijg'ishning tenglamasini yozing."],
  conf: "o'rta",
});

R({
  title: "Saxarozaning konsentrlangan sulfat kislota ta'sirida ko'mirlanishi",
  level: '10-sinf', topic: T_DI, engine: 'record',
  reactants: [{ species: 'C12H22O11', state: 's', mass_g: 10 }, { species: 'H2SO4', state: 'aq', conc_M: 18, volume_mL: 8, conc_min_M: 15 }],
  cond: { catalyst: 'H2SO4', note_uz: "Konsentrlangan sulfat kislota suvni tortib oluvchi modda sifatida ta'sir ko'rsatadi; uning bir qismi hosil bo'lgan ko'mirni oksidlab, SO₂ va CO₂ ajratadi." },
  eq: { molecular: 'C12H22O11 → 12C + 11H2O' },
  mech: 'organik',
  steps: ["Konsentrlangan sulfat kislota saxaroza molekulasidagi –CH(OH)– guruhlarini protonlaydi; suv ajralib, karbokationlar va qo'shbog'lar hosil bo'ladi (kislotali degidratlanish).", "Degidratlanish ketma-ket takrorlanib, uglerod skeleti ko'mirga aylanadi; ko'p issiqlik ajraladi, suv bug'lanadi.", "Qisman C + 2H₂SO₄ = CO₂ + 2SO₂ + 2H₂O reaksiyasi ham boradi — ajralgan gazlar qora massani ko'pirtirib ko'taradi."],
  organic: { template: 'E1', params: { substrate: '–CH(OH)–CH– (saxaroza qoldiqlari)', base: 'HSO4⁻ / H2O', leaving_group: 'H2O', intermediate: 'karbokation', product: 'C (ko\'mir)', byproduct: 'H2O' } },
  obs: { solid_color_change: { from: '#f8f8f6', to: '#1e1e1e' }, heat: 'kuchli-ekzotermik', effects: [{ type: 'volcano' }, { type: 'smoke' }, { type: 'foam' }], text_uz: "Oq shakar avval sarg'ayadi, so'ng qorayadi; qora g'ovak massa \"ilon\" kabi stakandan yuqoriga ko'tariladi, bug' va o'tkir hidli gaz (SO₂) ajraladi, stakan qattiq qiziydi." },
  kinetics: "o'rtacha", app: ['kimyoviy-stakan', 'shisha-tayoqcha'],
  proc: ["Kimyoviy stakanga 10 g shakar (saxaroza) soling va ozgina suv bilan namlang.", "Mo'rili shkafda ehtiyotlik bilan 8 ml konsentrlangan sulfat kislota quying va shisha tayoqcha bilan bir marta aralashtiring.", "Stakanni qo'zg'atmasdan, uzoqroqda turib kuzating."],
  safety: "Faqat o'qituvchi ko'rsatadi, mo'rili shkafda. Konsentrlangan sulfat kislota og'ir kuyish keltiradi, ajraladigan SO₂ zaharli; massa juda qiziydi — himoya ko'zoynagi, qo'lqop va xalat majburiy, stakanga engashmang.",
  expl: "Konsentrlangan sulfat kislota kuchli suv tortib oluvchi modda: u uglevodlardan suvni tortib olib, ularni ko'mirga aylantiradi. Uglevodlarning nomi ham ularning tarkibi Cₙ(H₂O)ₘ kabi yozilishi bilan bog'liq. Ajralgan gazlar ko'mirni ko'pirtirib, g'ovak massa hosil qiladi.",
  q: ["Nima uchun bu tajribada SO₂ hidi seziladi?", "Konsentrlangan sulfat kislota bilan ishlashda qanday ehtiyot choralari ko'riladi?"],
  conf: "o'rta",
});

R({
  title: "Saxarozaning qizdirilganda karamellanishi va ko'mirlanishi",
  level: '10-sinf', topic: T_DI, engine: 'record',
  reactants: [{ species: 'C12H22O11', state: 's', mass_g: 1 }],
  cond: { heating: true, temp_min_C: 200, note_uz: "Quruq probirkada shakar avval suyuqlanadi (karamel), keyin kuchli qizdirilganda ko'mirlanadi." },
  eq: { molecular: 'C12H22O11 → 12C + 11H2O↑' },
  mech: 'termik-parchalanish',
  steps: ["Qizdirilganda saxaroza suyuqlanadi va qisman suv yo'qotib jigarrang karamelga aylanadi.", "Kuchli qizdirishda molekulalar to'liq parchalanib, suv bug'i ajraladi.", "Probirkada qora ko'mir qoladi; bu uglevod tarkibida uglerod borligini isbotlaydi."],
  organic: null,
  obs: { solid_color_change: { from: '#f8f8f6', to: '#1e1e1e' }, heat: 'endotermik', effects: [{ type: 'condensate' }, { type: 'smoke' }], text_uz: "Shakar suyuqlanib sarg'ayadi, so'ng jigarrang karamelga aylanadi va kuyik hidi chiqadi; oxirida qora ko'mir qoladi, probirka devorida suv tomchilari paydo bo'ladi." },
  kinetics: "o'rtacha", app: ['probirka', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Quruq probirkaga ozgina shakar soling.", "Probirkani qisqichga olib, og'zini biroz pastga qaratib, spirt lampasida qizdiring.", "Rang o'zgarishini, hid va probirka devoridagi tomchilarni kuzating."],
  safety: "Suyuqlangan shakar juda issiq va teriga yopishib kuydiradi; probirka og'zini odamlarga qaratmang, tutunni hidlamang.",
  expl: "Uglevodlar qizdirilganda parchalanib, ko'mir va suv hosil qiladi. Bu ularning tarkibida uglerod, vodorod va kislorod borligini ko'rsatadi. Oraliq bosqichda hosil bo'ladigan karamel qandolatchilikda ishlatiladi.",
  q: ["Bu tajriba saxaroza tarkibida qaysi elementlar borligini isbotlaydi?", "Karamel qanday hosil bo'ladi?"],
  conf: "o'rta",
});

R({
  title: "Sellyulozaning (paxtaning) yonishi",
  level: '10-sinf', topic: T_POLI, engine: 'record',
  reactants: [{ species: '[C6H7O2(OH)3]n', state: 's', mass_g: 0.2 }, { species: 'O2', state: 'g' }],
  cond: { ignition: true, note_uz: "Paxta momig'i yoki filtr qog'oz bo'lagi pinset bilan alangaga tutiladi." },
  eq: { molecular: '[C6H7O2(OH)3]n + 6nO2 → 6nCO2 + 5nH2O' },
  mech: 'organik',
  steps: ["Sellyuloza — glyukoza qoldiqlaridan tuzilgan polisaxarid.", "Yonganda uglerod atomlari CO₂ gacha, vodorod atomlari suvgacha oksidlanadi.", "Tarkibida azot va oltingugurt bo'lmagani uchun kuygan qog'oz hidi seziladi, kul ozgina qoladi."],
  organic: { template: 'oksidlanish', params: { substrate: '[C6H7O2(OH)3]n (sellyuloza)', oxidant: 'O2', product: 'CO2 + H2O' } },
  obs: { gas: { species: 'CO2', color: null, smell_uz: null }, heat: 'kuchli-ekzotermik', flame: { color: '#f8b030', desc_uz: "yorqin sariq alanga" }, effects: [{ type: 'flame' }, { type: 'smoke' }], text_uz: "Paxta tez va yorqin sariq alanga bilan yonadi, kuygan qog'oz hidi keladi, oz miqdorda kulrang kul qoladi." },
  kinetics: 'tez', app: ['pinset', 'spirt-lampasi', 'chinni-kosacha'],
  proc: ["Kichik paxta bo'lagini pinset bilan ushlang.", "Uni spirt lampasi alangasiga tuting va yonishini kuzating (ostiga chinni kosacha qo'ying).", "Hidni yelpib hidlang va qoldiqni jun ipi yonganidan keyingi qoldiq bilan solishtiring."],
  safety: "Paxta juda tez yonadi — kichik bo'lak oling, pinsetda ushlang, yonuvchan moddalarni yaqinda qoldirmang.",
  expl: "Sellyuloza to'liq yonganda karbonat angidrid va suv hosil qiladi. Paxta, zig'ir kabi o'simlik tolalari yonganda kuygan qog'oz hidi chiqadi va kul qoladi; oqsil tolalar (jun, ipak) esa kuygan pat hidini beradi — bu tolalarni farqlash usuli.",
  q: ["Paxta va jun tolalarini yondirib qanday farqlash mumkin?", "Sellyuloza va kraxmalning yonish tenglamalari nima uchun bir xil?"],
});

R({
  title: "Sellyulozaning (filtr qog'ozning) kislotali gidrolizi",
  level: '10-sinf', topic: T_POLI, engine: 'record',
  reactants: [{ species: '[C6H7O2(OH)3]n', state: 's', mass_g: 0.2 }, { species: 'H2O', state: 'l', volume_mL: 10 }],
  cond: { heating: true, temp_min_C: 90, catalyst: 'H2SO4', note_uz: "Filtr qog'oz bo'lakchalari ozgina konsentrlangan sulfat kislotada eritilib, eritma suv bilan suyultiriladi va 10–15 daqiqa qaynatiladi." },
  eq: { molecular: '[C6H7O2(OH)3]n + nH2O → nC6H12O6' },
  mech: 'organik',
  steps: ["Konsentrlangan sulfat kislota sellyuloza tolalarini bo'kib eritadi.", "Suyultirilib qaynatilganda H⁺ ionlari β-1,4-glikozid bog'larining uzilishini tezlashtiradi.", "Oxirgi mahsulot — glyukoza; u Cu(OH)₂ bilan qizdirilganda qizil cho'kma beradi."],
  organic: { template: 'SN1', params: { substrate: "sellyuloza (β-1,4-glikozid bog'lari)", nucleophile: 'H2O', leaving_group: "glyukoza qoldig'i", product: 'C6H12O6' } },
  obs: { heat: 'sezilarsiz', effects: [{ type: 'dissolve' }, { type: 'boil' }], text_uz: "Qog'oz bo'lakchalari kislotada erib, rangsiz (biroz sarg'ish) quyuq eritma hosil bo'ladi; qaynatilib neytrallangan eritma Cu(OH)₂ bilan qizdirilganda qizil Cu₂O cho'kmasi beradi." },
  kinetics: 'sekin', app: ['chinni-kosacha', 'shisha-tayoqcha', 'kimyoviy-stakan', 'spirt-lampasi', 'tomizgich'],
  proc: ["Chinni kosachaga mayda qirqilgan filtr qog'oz soling va ustiga 2–3 ml konsentrlangan sulfat kislota quyib, shisha tayoqcha bilan qog'oz eriguncha aralashtiring.", "Hosil bo'lgan quyuq eritmani ehtiyotlik bilan 10 ml suvli stakanga quying.", "Eritmani 10–15 daqiqa qaynating, sovutib NaOH bilan neytrallang.", "Bir qismini Cu(OH)₂ bilan qizdirib, qizil cho'kma hosil bo'lishini tekshiring."],
  safety: "Konsentrlangan sulfat kislotani suvga quying, aksincha emas; kuyishdan ehtiyot bo'ling — ko'zoynak, qo'lqop va xalat majburiy.",
  expl: "Sellyuloza ham kraxmal kabi glyukoza qoldiqlaridan tuzilgan, shuning uchun kislotali gidrolizda glyukoza hosil qiladi. Sanoatda yog'och qipiqlarini gidrolizlab glyukoza, undan esa bijg'itib etil spirti olinadi (gidroliz spirti).",
  q: ["Sellyuloza va kraxmal tuzilishida qanday farq bor?", "Nima uchun inson oshqozonida sellyuloza hazm bo'lmaydi?"],
  conf: "o'rta",
});

R({
  title: "Kraxmal kleysterini tayyorlash",
  level: '10-sinf', topic: T_POLI, engine: 'rules',
  equation_free: true, equation_free_uz: "Kleyster hosil bo'lishi — kraxmal donachalarining issiq suvda bo'kib, kolloid eritma hosil qilishi; kimyoviy o'zgarish yo'q.",
  reactants: [{ species: '(C6H10O5)n', state: 's', mass_g: 0.5 }, { species: 'H2O', state: 'l', volume_mL: 10 }],
  cond: { heating: true, temp_min_C: 70, note_uz: "Kraxmal avval ozgina sovuq suvda aralashtirilib, qaynoq suvga quyiladi." },
  mech: 'fizik',
  steps: ["Sovuq suvda kraxmal donachalari erimaydi va tindirilganda cho'kadi.", "Qizdirilganda suv molekulalari donachalar ichiga kirib, ularni bo'ktiradi.", "Donachalar yorilib, amiloza va amilopektin molekulalari kolloid eritma (kleyster) hosil qiladi."],
  obs: { heat: 'sezilarsiz', effects: [{ type: 'turbidity' }], text_uz: "Sovuq suvda oq loyqa hosil bo'ladi va tez cho'kadi; qaynoq suvga quyilganda opalsimon, yopishqoq kleyster hosil bo'ladi." },
  kinetics: "o'rtacha", app: ['kimyoviy-stakan', 'shisha-tayoqcha', 'spirt-lampasi', 'probirka'],
  proc: ["Probirkada 0,5 g kraxmalni 2 ml sovuq suv bilan aralashtiring va bir oz tindiring — kraxmal cho'kadi.", "Stakanda 8 ml suvni qaynating.", "Aralashtirib turgan holda kraxmal suspenziyasini qaynoq suvga quying.", "Hosil bo'lgan kleysterning ko'rinishini kuzating."],
  safety: "Qaynoq suv va issiq kleyster teriga yopishib kuydiradi — ehtiyot bo'ling.",
  expl: "Kraxmal sovuq suvda erimaydi, issiq suvda esa bo'kib kolloid eritma — kleyster hosil qiladi. Kleyster yelim sifatida, to'qimachilikda va kraxmalning yod bilan reaksiyasini o'tkazishda ishlatiladi.",
  q: ["Nima uchun kraxmal sovuq suvda erimaydi?", "Kleyster qayerlarda ishlatiladi?"],
});

R({
  title: "Saxarozaning ko'p atomli spirt sifatida mis(II) gidroksid bilan reaksiyasi",
  level: '10-sinf', topic: T_DI, engine: 'record',
  reactants: [{ species: 'C12H22O11', state: 'aq', conc_M: 0.3, volume_mL: 2 }, { species: 'Cu(OH)2', state: 's', mass_g: 0.05 }],
  cond: { note_uz: "Cu(OH)₂ ortiqcha ishqor ishtirokida yangi cho'ktirib olinadi; reaksiya xona haroratida boradi." },
  eq: { molecular: '2C12H22O11 + Cu(OH)2 → (C12H21O11)2Cu + 2H2O' },
  mech: 'kompleks',
  steps: ["Saxaroza molekulasida sakkizta gidroksil guruh bor; qo'shni OH guruhlar ko'p atomli spirtlar kabi ta'sir ko'rsatadi.", "Ishqoriy muhitda ular Cu²⁺ bilan halqali kompleks — mis(II) saxaratini hosil qiladi.", "Kompleks suvda eriydi va to'q ko'k rang beradi."],
  obs: { solution_color_change: { from: '#ffffff', to: '#2a50c8' }, heat: 'sezilarsiz', effects: [{ type: 'dissolve' }], text_uz: "Havorang Cu(OH)₂ cho'kmasi eriydi, to'q ko'k eritma hosil bo'ladi; qizdirilganda qizil cho'kma hosil bo'lmaydi." },
  kinetics: 'tez', app: ['probirka', 'tomizgich', 'probirka-qisqichi', 'spirt-lampasi'],
  proc: ["Probirkaga 2 ml NaOH eritmasi va 2–3 tomchi CuSO₄ eritmasi qo'shib, Cu(OH)₂ cho'kmasini oling.", "Ustiga 2 ml saxaroza eritmasi qo'shib chayqating.", "Eritma rangini kuzating, so'ng uni qizdirib, qizil cho'kma hosil bo'lmasligini tekshiring."],
  safety: "Ishqor eritmasi bilan ko'zoynakda ishlang; qizdirishda probirka og'zini odamlarga qaratmang.",
  expl: "Saxaroza ko'p atomli spirt xossasini namoyon qiladi va Cu(OH)₂ bilan to'q ko'k eritma hosil qiladi. Ammo molekulasida erkin aldegid guruhi bo'lmagani uchun qizdirilganda Cu(OH)₂ ni Cu₂O gacha qaytarmaydi — glyukozadan farqi shunda.",
  q: ["Saxaroza va glyukozani Cu(OH)₂ yordamida qanday farqlash mumkin?", "Mis(II) saxarati formulasi nima uchun soddalashtirilgan deyiladi?"],
  conf: "o'rta",
});

R({
  title: "Glyukozaning bromli suv bilan oksidlanishi",
  level: '11-sinf', topic: T_MONO, engine: 'record',
  reactants: [{ species: 'C6H12O6', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'bromli-suv', state: 'aq', volume_mL: 2 }],
  eq: {
    molecular: 'C6H12O6 + Br2 + H2O → C6H12O7 + 2HBr',
    ionic_full: 'C6H12O6 + Br2 + H2O → C6H12O7 + 2H⁺ + 2Br⁻',
    ionic_net: 'C6H12O6 + Br2 + H2O → C6H12O7 + 2H⁺ + 2Br⁻',
    electron_balance: ['C⁺¹ − 2e⁻ = C⁺³', 'Br2⁰ + 2e⁻ = 2Br⁻'],
  },
  mech: 'organik',
  steps: ["Bromli suv kuchsiz oksidlovchi bo'lib, faqat aldegid guruhini oksidlaydi.", "Glyukozaning aldegid guruhi karboksil guruhgacha oksidlanadi — glyukon kislota hosil bo'ladi.", "Brom bromid ionlarigacha qaytariladi, eritma rangsizlanadi."],
  organic: { template: 'oksidlanish', params: { substrate: GLU, oxidant: 'Br2 (bromli suv)', product: 'CH2OH–(CHOH)4–COOH' } },
  obs: { solution_color_change: { from: '#e8a040', to: '#ffffff' }, heat: 'sezilarsiz', effects: [{ type: 'swirl' }], text_uz: "Sariq bromli suv glyukoza eritmasi bilan aralashtirilganda bir necha daqiqada rangsizlanadi." },
  kinetics: 'sekin', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml glyukoza eritmasi quying.", "Unga 2 ml bromli suv qo'shing va chayqating.", "Bir necha daqiqa davomida rang o'zgarishini kuzating; taqqoslash uchun fruktoza eritmasi bilan ham tajriba qiling."],
  safety: "Brom zaharli — bromli suv bilan mo'rili shkafda ishlang, bug'ini hidlamang.",
  expl: "Bromli suv aldozalarni (aldegid guruhli monosaxaridlarni) glyukon kislota kabi kislotalargacha oksidlaydi, ketozalarni (fruktozani) esa bu sharoitda oksidlamaydi. Shu sababli bromli suv yordamida glyukoza va fruktozani farqlash mumkin.",
  q: ["Glyukoza va fruktozani bromli suv yordamida qanday farqlash mumkin?", "Glyukon kislota molekulasida qaysi funksional guruhlar bor?"],
});

R({
  title: "Fruktozaning bromli suvni rangsizlantirmasligi",
  level: '11-sinf', topic: T_MONO, engine: 'record',
  no_reaction: true, match: ['C6H12O6|fruktoza', 'Br2'],
  reactants: [{ species: 'C6H12O6|fruktoza', state: 'aq', conc_M: 0.5, volume_mL: 2 }, { species: 'bromli-suv', state: 'aq', volume_mL: 2 }],
  mech: 'oksidlanish-qaytarilish',
  steps: ["Fruktoza ketoza: uning ochiq zanjirli shaklida aldegid emas, keton guruhi (C=O zanjir ichida) bor.", "Kuchsiz oksidlovchi bo'lgan bromli suv kislotali-neytral muhitda keton guruhini oksidlay olmaydi.", "Shu sababli bromli suvning rangi saqlanib qoladi."],
  obs: { heat: 'sezilarsiz', effects: [], text_uz: "Bromli suvning sariq rangi uzoq vaqt saqlanib qoladi." },
  kinetics: 'bir-zumda', app: ['probirka', 'tomizgich'],
  proc: ["Probirkaga 2 ml fruktoza eritmasi quying.", "Unga 2 ml bromli suv qo'shing va chayqating.", "Rangni glyukoza bilan o'tkazilgan parallel tajriba natijasi bilan solishtiring."],
  safety: "Brom zaharli — mo'rili shkafda ishlang.",
  expl: "Fruktoza glyukozaning izomeri, lekin keton guruhi tutadi. Bromli suv kabi yumshoq oksidlovchilar uni oksidlamaydi. Ishqoriy muhitda esa fruktoza glyukozaga izomerlanishi mumkin, shuning uchun u Tollens va Feling reaktivlari bilan musbat natija beradi.",
  q: ["Glyukoza va fruktoza tuzilishida qanday farq bor?", "Nima uchun fruktoza ishqoriy muhitdagi \"kumush ko'zgu\" reaksiyasini beradi, bromli suvni esa rangsizlantirmaydi?"],
  conf: "o'rta",
});

writeFileSync(join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${CAT}.json`), JSON.stringify({ category: CAT, reactions: out }, null, 1) + '\n');
console.log(`${CAT}: ${out.length} ta yozuv`);
