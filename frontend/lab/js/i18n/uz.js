// Interfeys matnlari (o'zbek tili, lotin yozuvi). Rus va ingliz tillari shu tuzilishda qo'shiladi.
// Kimyoviy ma'lumotlar (moddalar nomi, tajriba matnlari) data/ fayllarida.
export const uz = {
  app: { title: 'Virtual kimyo laboratoriyasi', short: 'Laboratoriya', loading: 'Laboratoriya yuklanmoqda…', loadingData: "Ma'lumotlar yuklanmoqda…", error: 'Yuklashda xato', webglMissing: "Brauzeringiz WebGL'ni qo'llab-quvvatlamaydi yoki u o'chirilgan. Laboratoriya ishlashi uchun WebGL kerak." },
  mode: { guided: "Yo'riqnomali tajriba", free: 'Erkin laboratoriya', guidedShort: "Yo'riqnoma", freeShort: 'Erkin', demo: "Ko'rgazma rejimi" },
  toolbar: {
    catalog: 'Tajribalar', reagents: 'Reaktivlar', equipment: 'Jihozlar', templates: 'Asboblar', journal: 'Jurnal', settings: 'Sozlamalar',
    save: 'Saqlash', load: 'Ochish', reset: 'Stolni tozalash', view: "Umumiy ko'rinish", help: 'Yordam', time: 'Vaqt',
  },
  catalog: {
    title: 'Tajribalar katalogi', search: 'Qidirish: nomi, modda, formula…', allCats: 'Barcha toifalar', allLevels: 'Barcha sinflar',
    count: '{n} ta tajriba', start: 'Boshlash', details: 'Batafsil', confidenceMid: "Kimyogar tekshiruvida", empty: 'Hech narsa topilmadi',
  },
  reagents: { title: 'Reaktivlar javoni', search: 'Modda nomi yoki formulasi…', solution: 'Eritma', solid: 'Qattiq', liquid: 'Suyuqlik', gas: 'Gaz', take: 'Stolga olish', conc: 'Konsentratsiya', all: 'Barchasi', hazards: 'Xavf belgilari', storage: 'Saqlanishi' },
  equipment: { title: 'Jihozlar shkafi', search: 'Jihoz nomi…', take: 'Stolga qo\'yish', size: "O'lcham" },
  templates: { title: 'Tayyor asbob andozalari', auto: "Avtomatik yig'ish", manual: "Qo'lda yig'ish ro'yxati", checklist: "Yig'ish ro'yxati", done: "Asbob to'g'ri yig'ildi", missing: 'Yetishmayapti' },
  inspector: {
    empty: "Jihozni tanlash uchun ustiga bosing. Ikki marta bosish — yaqinlashtirish.", contents: 'Tarkibi', volume: 'Hajm', temp: 'Harorat', ph: 'pH', mass: 'Massa',
    emptyVessel: "Idish bo'sh", solids: "Qattiq moddalar / cho'kma", gases: 'Gazlar', layers: 'Organik qatlam', pressure: 'Bosim', capacity: "Sig'imi",
    actions: 'Amallar', pour: 'Quyish', drops: 'Tomizish', pipette: 'Pipetka bilan olish', spatula: 'Shpatel bilan solish', weigh: 'Tortish', stir: 'Aralashtirish',
    heat: 'Qizdirish', heatOff: "O'chirish", wash: 'Yuvish', remove: 'Olib qo\'yish', disconnect: 'Ajratish', close: 'Tiqin bilan yopish', light: 'Yoritish', ignite: 'Yondirish',
    flameTest: 'Alanga sinovi', indicator: 'Indikator qog\'ozi', thermometer: "Termometr", tare: 'TARA', rotate: 'Burish', tilt: "Og'dirish", water: 'Suv qo\'shish',
    current: 'Tok', power: 'Quvvat', on: 'Yoqish', off: "O'chirish", cooling: "Sovutish suvi",
    gasPass: "Gazni o'tkazish", waste: 'Chiqindiga', splint: "Yonib turgan cho'p", splintGlow: "Cho'g'langan cho'p",
  },
  pour: { title: 'Quyish', target: 'Qayerga quyiladi — idishni tanlang', angle: "Og'ish burchagi", hold: 'Bosib turing — quyiladi', poured: '{v} ml quyildi', amount: 'Miqdor', cancel: 'Bekor qilish', spill: "Suyuqlik stolga to'kildi!" },
  dose: { title: 'Miqdorni tanlang', ml: 'ml', g: 'g', drops: 'tomchi', ok: 'Bajarish', from: 'Qayerdan', to: 'Qayerga', chooseTarget: "Endi qabul qiluvchi idishni bosing" },
  guided: {
    title: "Tajriba bosqichlari", step: '{i}-bosqich', next: 'Keyingi', prev: 'Oldingi', check: 'Tekshirish', done: 'Bajarildi', notYet: 'Hali bajarilmadi',
    prepare: 'Tayyorlash', autoPlace: "Jihoz va reaktivlarni stolga qo'yish", need: 'Kerakli jihozlar va reaktivlar', safety: 'Xavfsizlik', safetyCheck: "Tajriba oldidan tekshiring", ppe: { kozoynak: "Himoya ko'zoynagi taqildi", qolqop: "Qo'lqop kiyildi", xalat: 'Xalat kiyildi' },
    result: 'Natija', observation: 'Kuzatish', equation: 'Tenglama', mechanism: 'Mexanizm', explanation: 'Tushuntirish', questions: 'Nazorat savollari', finished: 'Tajriba yakunlandi', restart: 'Qaytadan',
    observed: 'Kuzatildi', expected: 'Kutilgan natija',
  },
  mechanism: { title: 'Reaksiya mexanizmi', molecular: 'Molekulyar tenglama', ionicFull: "To'liq ionli tenglama", ionicNet: 'Qisqartirilgan ionli tenglama', electron: 'Elektron balans', steps: 'Bosqichlar', play: "Ko'rsatish", pause: "To'xtatish", stepNext: 'Keyingi bosqich', oxidant: 'Oksidlovchi', reductant: 'Qaytaruvchi' },
  journal: { title: 'Laboratoriya jurnali', print: 'Chop etish', clear: 'Tozalash', empty: "Hozircha yozuv yo'q", date: 'Sana', action: 'Amal', observation: 'Kuzatish', equation: 'Tenglama', export: 'Yuklab olish' },
  settings: { title: 'Sozlamalar', quality: 'Grafika sifati', q: { past: 'Past', orta: "O'rta", yuqori: 'Yuqori' }, theme: 'Mavzu', themes: { auto: 'Tizim', light: "Yorug'", dark: "Qorong'i" }, sound: 'Tovush', speed: 'Simulyatsiya tezligi', bigUi: 'Interaktiv doska uchun yirik interfeys', reload: 'Sifat o\'zgarishi sahifa qayta yuklanganda qo\'llanadi' },
  warn: {
    'suv-kislotaga': "Xavfli! Konsentrlangan kislotaga suv quyildi — sachrash va kuyish xavfi. To'g'ri tartib: kislotani suvga ingichka oqim bilan quyish.",
    'zaharli-gaz': "Zaharli gaz ({gas}) mo'rili shkafdan tashqarida ajralmoqda! Tajribani mo'rili shkafda o'tkazing.",
    'bosim': "Diqqat: yopiq idishda bosim oshmoqda ({p} atm)!", 'tiqin-otildi': "Tiqin otilib chiqdi! Germetik yopiq idishni qizdirish mumkin emas.",
    'darz': "Shisha darz ketdi! {name} qizdirish uchun mo'ljallanmagan (yoki keskin harorat farqi).",
    'toshib-ketdi': "Idish to'lib, suyuqlik toshib ketdi.", 'tor-kerak': "Shisha idishni to'g'ridan-to'g'ri alangada qizdirmang — asbest (keramik) to'r ishlating.",
    'yigish-xato': "Gaz yig'ilmayapti: {reason}", 'sovutgich-suvi': "Sovutgichga suv berilmagan — bug' kondensatlanmaydi.",
    'ppe': "Tajribani boshlashdan oldin himoya vositalarini kiying (ko'zoynak, qo'lqop, xalat).",
    'yonuvchan-alanga': "Yonuvchan suyuqlik ({name}) ochiq alanga yonida! Elektr plitka yoki suv hammomidan foydalaning.",
    'qizigan': "Idish issiq ({t} °C) — qisqich bilan ushlang.",
  },
  info: {
    noReaction: 'Reaksiya bormadi', why: 'Sababi', placed: '{name} stolga qo\'yildi', connected: '{a} → {b} ulandi', cannotConnect: "Ulab bo'lmaydi: {reason}",
    washed: 'Idish yuvildi', waste: "Idish chiqindi idishiga bo'shatildi", saved: 'Stol holati saqlandi', loaded: 'Stol holati tiklandi', heatOn: 'Qizdirish yoqildi', heatOff: "Qizdirish o'chirildi",
    tooFull: "Idish to'la", emptySrc: "Manba idish bo'sh", selectTarget: 'Qabul qiluvchi idishni tanlang', reactionStarted: 'Reaksiya: {title}',
    pop: '"Paq!" — vodorod portlab yondi', relit: "Cho'g'langan cho'p alangalanib ketdi — kislorod!", extinguished: "Yonib turgan cho'p o'chdi", flameColor: 'Alanga rangi: {color}',
    paperColor: 'Indikator qog\'ozi rangi: pH ≈ {ph}', lampOn: 'Lampochka yondi', lampDim: 'Lampochka xira yondi', lampOff: 'Lampochka yonmadi',
    splintNothing: "Cho'p bilan sinovda o'zgarish kuzatilmadi", paperDry: "Indikator qog'ozi: idishda suvli eritma yo'q",
  },
  units: { ml: 'ml', g: 'g', mol: 'mol', c: '°C', atm: 'atm', s: 's', V: 'V', M: 'M' },
  hazard: { korroziv: 'Yemiruvchi', zaharli: 'Zaharli', yonuvchan: 'Yonuvchan', oksidlovchi: 'Oksidlovchi', zararli: 'Zararli', 'atrof-muhit': 'Atrof-muhit uchun xavfli', kanserogen: 'Kanserogen', bosim: 'Bosim ostidagi gaz', 'portlash-xavfi': 'Portlash xavfi' },
  storage: { 'tiqinli-sklyanka': 'tiqinli sklyanka', 'shlif-tiqinli-sklyanka': 'shlif tiqinli sklyanka', 'qoramtir-sklyanka': 'qoramtir shishali sklyanka', 'rezina-tiqinli-sklyanka': 'rezina tiqinli sklyanka', 'kerosin-ostida': 'kerosin ostida', ballon: 'ballon', 'germetik-idish': 'germetik idish', 'polietilen-idish': 'polietilen idish', yuvgich: 'yuvgich', 'kipp-apparati': 'Kipp apparatida olinadi', 'yangi-tayyorlanadi': 'ishlatishdan oldin tayyorlanadi', ampula: 'ampula' },
  phase: { aq: 'eritmada', s: 'qattiq', org: 'organik qatlam', g: 'gaz' },
  common: { close: 'Yopish', ok: 'OK', cancel: 'Bekor qilish', yes: 'Ha', no: "Yo'q", more: "Ko'proq", back: 'Orqaga', copy: 'Nusxa olish', open: 'Ochish', none: "yo'q" },
  level: { umumiy: 'Umumiy', litsey: 'Litsey', universitet: 'Universitet' },
  confidence: { yuqori: 'Ishonchli', "o'rta": 'Tekshirilmoqda' },
};

let dict = uz;
export function setLocale(d) { dict = d; }

/** Kalit bo'yicha matn: t('inspector.pour'), t('pour.poured', {v: 2}) */
export function t(key, params) {
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) cur = cur?.[p];
  if (typeof cur !== 'string') return key;
  if (!params) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
}
