// Jihozlar katalogi: boshlang'ich ma'lumot -> frontend/lab/data/equipment.json, ports.json
// O'lchamlar millimetrda, koordinatalar: y yuqoriga, (0,0,0) — jihoz tubining markazi.
// Har bir port: id, type, pos [x,y,z], dir [x,y,z] (portdan tashqariga yo'nalish), d_mm / size (shlif).

const up = [0, 1, 0], down = [0, -1, 0], side = [1, 0, 0];
const P = (id, type, pos, dir = up, extra = {}) => ({ id, type, pos, dir, ...extra });

// Idishlarning umumiy portlari
// multi: keng og'izli idish (stakan, kristallizator) — og'izga bir nechta narsa (elektrodlar, tuz ko'prigi, naycha) tushiriladi
function vesselPorts({ H, mouthD, neckR, grip = true, gripY, joint = null, tub = true, multi = false }) {
  const ports = [];
  if (tub) ports.push(P('tub', 'tub', [0, 0, 0], down));
  if (joint) ports.push(P('bogiz', 'shlif-urgochi', [0, H, 0], up, { size: joint }));
  else ports.push(P('ogiz', 'ogiz', [0, H, 0], up, multi ? { d_mm: mouthD, multi: true } : { d_mm: mouthD }));
  if (grip) ports.push(P('qisqich', 'qisqich-joyi', [0, gripY ?? H * 0.85, (neckR ?? mouthD / 2) + 1], [0, 0, 1]));
  return ports;
}

const sizes = (arr) => arr.map((s) => ({ ...s, id: String(s.id) }));

export const EQUIPMENT = [
  // ------------------------------------------------------------ shisha idishlar
  {
    id: 'probirka', name_uz: 'Probirka', cat: 'shisha', builder: 'probirka',
    sizes: sizes([{ id: 'oddiy', label: '16×150 mm (20 ml)', capacity_mL: 20, p: { R: 8, H: 150, wall: 0.8 } }, { id: 'kichik', label: '12×100 mm (8 ml)', capacity_mL: 8, p: { R: 6, H: 100, wall: 0.7 } }]),
    vessel: { heatable: true, glass_g: 8, graduated: false },
    ports: (p) => [...vesselPorts({ H: p.H, mouthD: p.R * 2 - 2, neckR: p.R, gripY: p.H * 0.78 }), P('tana', 'probirka-tanasi', [0, p.H * 0.3, 0], down)],
    desc_uz: 'Kichik hajmdagi tajribalar uchun; spirt lampasi alangasida qizdirish mumkin.',
  },
  {
    id: 'probirka-yon-naychali', name_uz: 'Yon naychali probirka', cat: 'shisha', builder: 'probirka', p: { R: 10, H: 160, wall: 0.9, sideArm: true },
    vessel: { heatable: true, glass_g: 12, capacity_mL: 30 },
    ports: (p) => [...vesselPorts({ H: p.H, mouthD: p.R * 2 - 2, neckR: p.R, gripY: p.H * 0.7 }), P('yon', 'naycha-uchi', [p.R + 28, p.H * 0.82, 0], side), P('tana', 'probirka-tanasi', [0, p.H * 0.3, 0], down)],
    desc_uz: 'Gaz olish uchun: yon naychaga shlang ulanadi.',
  },
  {
    id: 'kimyoviy-stakan', name_uz: 'Kimyoviy stakan', cat: 'shisha', builder: 'stakan',
    sizes: sizes([
      { id: 50, label: '50 ml', capacity_mL: 50, p: { R: 21, H: 58, wall: 1.1 } },
      { id: 100, label: '100 ml', capacity_mL: 100, p: { R: 25.5, H: 70, wall: 1.2 } },
      { id: 250, label: '250 ml', capacity_mL: 250, p: { R: 34, H: 95, wall: 1.4 } },
      { id: 600, label: '600 ml', capacity_mL: 600, p: { R: 45, H: 125, wall: 1.7 } },
    ]),
    vessel: { heatable: true, glass_g: 40, graduated: true, needsGauze: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.R * 2, grip: false, multi: true }),
    desc_uz: 'Eritmalar tayyorlash, qizdirish (asbest to\'r ustida) va aralashtirish uchun.',
  },
  {
    id: 'konussimon-kolba', name_uz: 'Konussimon kolba (Erlenmeyer)', cat: 'shisha', builder: 'erlenmeyer',
    sizes: sizes([{ id: 100, label: '100 ml', capacity_mL: 100, p: { R: 32, H: 105, neckR: 11, neckH: 25, wall: 1.2 } }, { id: 250, label: '250 ml', capacity_mL: 250, p: { R: 42, H: 140, neckR: 14, neckH: 30, wall: 1.4 } }]),
    vessel: { heatable: true, glass_g: 60, graduated: true, needsGauze: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.neckR * 2 - 2, neckR: p.neckR }),
    desc_uz: 'Titrlash va qizdirish uchun; tor bo\'g\'zi sachrashni kamaytiradi.',
  },
  {
    id: 'yassi-tubli-kolba', name_uz: 'Yassi tubli kolba', cat: 'shisha', builder: 'kolba', p: { R: 42, H: 150, neckR: 13, neckH: 50, flat: true, wall: 1.3 },
    vessel: { heatable: true, glass_g: 80, capacity_mL: 250, needsGauze: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.neckR * 2 - 2, neckR: p.neckR }),
  },
  {
    id: 'dumaloq-tubli-kolba', name_uz: 'Dumaloq tubli kolba', cat: 'shisha', builder: 'kolba', p: { R: 42, H: 150, neckR: 12, neckH: 50, flat: false, wall: 1.3 },
    vessel: { heatable: true, glass_g: 80, capacity_mL: 250, needsSupport: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.neckR * 2 - 2, neckR: p.neckR, joint: '29/32' }).concat([P('halqa', 'halqa-joyi', [0, 6, 0], down)]),
    desc_uz: 'Qizdirish va haydash uchun; shtativga mahkamlanadi, shlif bo\'g\'izli (29/32).',
  },
  {
    id: 'ikki-bogizli-kolba', name_uz: 'Ikki bo\'g\'izli dumaloq kolba', cat: 'shisha', builder: 'kolba', p: { R: 42, H: 150, neckR: 12, neckH: 50, necks: 2, wall: 1.3 },
    vessel: { heatable: true, glass_g: 95, capacity_mL: 250, needsSupport: true },
    ports: (p) => [P('tub', 'tub', [0, 0, 0], down), P('bogiz', 'shlif-urgochi', [0, p.H, 0], up, { size: '29/32' }), P('yon-bogiz', 'shlif-urgochi', [36, p.H - 20, 0], [0.42, 0.9, 0], { size: '19/26' }), P('qisqich', 'qisqich-joyi', [0, p.H * 0.85, p.neckR + 1], [0, 0, 1]), P('halqa', 'halqa-joyi', [0, 6, 0], down)],
  },
  {
    id: 'uch-bogizli-kolba', name_uz: 'Uch bo\'g\'izli dumaloq kolba', cat: 'shisha', builder: 'kolba', p: { R: 45, H: 155, neckR: 12, neckH: 50, necks: 3, wall: 1.3 },
    vessel: { heatable: true, glass_g: 110, capacity_mL: 500, needsSupport: true },
    ports: (p) => [P('tub', 'tub', [0, 0, 0], down), P('bogiz', 'shlif-urgochi', [0, p.H, 0], up, { size: '29/32' }), P('yon-bogiz', 'shlif-urgochi', [38, p.H - 22, 0], [0.42, 0.9, 0], { size: '19/26' }), P('yon-bogiz-2', 'shlif-urgochi', [-38, p.H - 22, 0], [-0.42, 0.9, 0], { size: '19/26' }), P('qisqich', 'qisqich-joyi', [0, p.H * 0.85, p.neckR + 1], [0, 0, 1]), P('halqa', 'halqa-joyi', [0, 6, 0], down)],
  },
  {
    id: 'vyurs-kolbasi', name_uz: 'Vyurs kolbasi', cat: 'shisha', builder: 'kolba', p: { R: 38, H: 170, neckR: 12, neckH: 75, sideArm: true, wall: 1.3 },
    vessel: { heatable: true, glass_g: 85, capacity_mL: 250, needsSupport: true },
    ports: (p) => [...vesselPorts({ H: p.H, mouthD: p.neckR * 2 - 2, neckR: p.neckR, gripY: p.H * 0.8 }), P('yon', 'naycha-uchi', [72, p.H - 52, 0], [0.9, -0.42, 0]), P('halqa', 'halqa-joyi', [0, 6, 0], down)],
    desc_uz: 'Haydash uchun: yon naycha sovutgichga ulanadi.',
  },
  {
    id: 'bunzen-kolbasi', name_uz: 'Bunzen kolbasi', cat: 'shisha', builder: 'erlenmeyer', p: { R: 45, H: 160, neckR: 14, neckH: 35, wall: 2.6, sideBarb: true },
    vessel: { heatable: false, glass_g: 180, capacity_mL: 500, thick: true },
    ports: (p) => [...vesselPorts({ H: p.H, mouthD: p.neckR * 2 - 2, neckR: p.neckR }), P('yon', 'shtutser', [p.neckR + 22, p.H - 22, 0], side)],
    desc_uz: 'Vakuum ostida filtrlash uchun qalin devorli kolba (qizdirilmaydi).',
  },
  {
    id: 'olchov-kolbasi', name_uz: 'O\'lchov kolbasi', cat: 'shisha', builder: 'olchov-kolba',
    sizes: sizes([{ id: 100, label: '100 ml', capacity_mL: 100, p: { R: 30, H: 170, neckR: 7, wall: 1.2 } }, { id: 250, label: '250 ml', capacity_mL: 250, p: { R: 40, H: 215, neckR: 8, wall: 1.3 } }]),
    vessel: { heatable: false, glass_g: 70, graduated: true, measuring: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: 14, neckR: p.neckR, joint: '14/23' }),
    desc_uz: 'Aniq hajmli eritma tayyorlash uchun; qizdirilmaydi.',
  },
  {
    id: 'retorta', name_uz: 'Retorta', cat: 'shisha', builder: 'retorta', p: { R: 40, H: 120 },
    vessel: { heatable: true, glass_g: 90, capacity_mL: 250, needsSupport: true },
    ports: () => [P('tub', 'tub', [0, 0, 0], down), P('ogiz', 'ogiz', [0, 82, 0], up, { d_mm: 18 }), P('jumrak', 'naycha-uchi', [165, 30, 0], [0.9, -0.4, 0]), P('qisqich', 'qisqich-joyi', [0, 60, 41], [0, 0, 1])],
    desc_uz: 'Qadimiy haydash idishi: egilgan bo\'yni sovutgich vazifasini bajaradi.',
  },
  {
    id: 'olchov-silindri', name_uz: 'O\'lchov silindri', cat: 'shisha', builder: 'silindr',
    sizes: sizes([{ id: 10, label: '10 ml', capacity_mL: 10, p: { R: 7, H: 140, wall: 1.0 } }, { id: 50, label: '50 ml', capacity_mL: 50, p: { R: 12, H: 200, wall: 1.2 } }, { id: 100, label: '100 ml', capacity_mL: 100, p: { R: 16, H: 250, wall: 1.3 } }]),
    vessel: { heatable: false, glass_g: 60, graduated: true, measuring: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.R * 2, neckR: p.R }),
    desc_uz: 'Suyuqlik hajmini o\'lchash; qizdirilmaydi.',
  },
  {
    id: 'menzurka', name_uz: 'Menzurka', cat: 'shisha', builder: 'menzurka', p: { R: 32, r: 14, H: 110, wall: 1.3 },
    vessel: { heatable: false, glass_g: 50, capacity_mL: 100, graduated: true, measuring: true },
    ports: (p) => vesselPorts({ H: p.H, mouthD: p.R * 2, grip: false }),
  },
  {
    id: 'byuretka', name_uz: 'Byuretka (jo\'mrakli)', cat: 'shisha', builder: 'byuretka', p: { R: 5.5, H: 600, wall: 1.0 },
    vessel: { heatable: false, glass_g: 70, capacity_mL: 50, graduated: true, measuring: true, dispenser: 'byuretka' },
    ports: (p) => [P('ogiz', 'ogiz', [0, p.H, 0], up, { d_mm: 9 }), P('uchi', 'naycha-uchi', [0, 0, 0], down), P('qisqich', 'qisqich-joyi', [0, p.H * 0.7, 6.5], [0, 0, 1])],
    desc_uz: 'Titrlashda aniq hajm (0,05 ml gacha) quyish uchun.',
  },
  {
    id: 'mor-pipetkasi', name_uz: 'Mor pipetkasi (10 ml)', cat: 'shisha', builder: 'pipetka', p: { bulb: true, H: 330 },
    vessel: { heatable: false, glass_g: 15, capacity_mL: 10, dispenser: 'pipetka', fixed: 10 },
    ports: () => [P('uchi', 'naycha-uchi', [0, 0, 0], down)],
    desc_uz: 'Bitta aniq hajmni (10,00 ml) o\'lchab olish uchun.',
  },
  {
    id: 'darajalangan-pipetka', name_uz: 'Darajalangan pipetka (10 ml)', cat: 'shisha', builder: 'pipetka', p: { bulb: false, H: 330 },
    vessel: { heatable: false, glass_g: 12, capacity_mL: 10, dispenser: 'pipetka' },
    ports: () => [P('uchi', 'naycha-uchi', [0, 0, 0], down)],
  },
  {
    id: 'tomizgich', name_uz: 'Tomizgich', cat: 'shisha', builder: 'tomizgich', p: { H: 120 },
    vessel: { heatable: false, glass_g: 4, capacity_mL: 2, dispenser: 'tomizgich', drop_mL: 0.05 },
    ports: () => [P('uchi', 'naycha-uchi', [0, 0, 0], down)],
    desc_uz: 'Tomchilab qo\'shish uchun (1 tomchi ≈ 0,05 ml).',
  },
  {
    id: 'oddiy-voronka', name_uz: 'Oddiy voronka', cat: 'shisha', builder: 'voronka', p: { R: 35, H: 120 },
    ports: () => [P('oyoq', 'voronka-oyogi', [0, 0, 0], down), P('konus', 'voronka-konus', [0, 75, 0], down), P('ogiz', 'voronka-ogiz', [0, 120, 0], up)],
    desc_uz: 'Quyish va filtrlash (filtr qog\'oz bilan) uchun.',
  },
  {
    id: 'ajratgich-voronka', name_uz: 'Ajratgich voronka', cat: 'shisha', builder: 'ajratgich', p: { R: 32, H: 260 },
    vessel: { heatable: false, glass_g: 90, capacity_mL: 100, dispenser: 'jumrak' },
    ports: () => [P('oyoq', 'voronka-oyogi', [0, 0, 0], down), P('bogiz', 'shlif-urgochi', [0, 260, 0], up, { size: '19/26' }), P('halqa', 'voronka-konus', [0, 150, 0], down), P('qisqich', 'qisqich-joyi', [0, 230, 8], [0, 0, 1])],
    desc_uz: 'Aralashmaydigan suyuqliklarni ajratish va ekstraksiya uchun.',
  },
  {
    id: 'tomchi-voronka', name_uz: 'Tomchi voronka', cat: 'shisha', builder: 'ajratgich', p: { R: 24, H: 230, cyl: true },
    vessel: { heatable: false, glass_g: 70, capacity_mL: 50, dispenser: 'jumrak' },
    ports: () => [P('oyoq', 'naycha-uchi', [0, 0, 0], down), P('ogiz', 'ogiz', [0, 230, 0], up, { d_mm: 16 }), P('qisqich', 'qisqich-joyi', [0, 200, 8], [0, 0, 1])],
    desc_uz: 'Reaksiya kolbasiga suyuqlikni asta-sekin tomizib berish uchun.',
  },
  { id: 'soat-oynasi', name_uz: 'Soat oynasi', cat: 'shisha', builder: 'soat-oynasi', p: { R: 40 }, vessel: { heatable: false, glass_g: 15, capacity_mL: 5 }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('qopqoq', 'qopqoq', [0, 0, 0], down)], desc_uz: 'Qattiq moddalarni tortish va bug\'latish uchun; stakan og\'ziga qopqoq qilib qo\'yiladi (sublimatsiya).' },
  { id: 'petri-kosachasi', name_uz: 'Petri kosachasi', cat: 'shisha', builder: 'petri', p: { R: 45, H: 15 }, vessel: { heatable: false, glass_g: 30, capacity_mL: 60 }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('ogiz', 'ogiz', [0, 15, 0], up, { d_mm: 90 })] },
  { id: 'kristallizator', name_uz: 'Kristallizator', cat: 'shisha', builder: 'stakan', p: { R: 50, H: 55, wall: 1.6 }, vessel: { heatable: false, glass_g: 120, capacity_mL: 400 }, ports: (p) => vesselPorts({ H: p.H, mouthD: p.R * 2, grip: false, multi: true }) },
  { id: 'eksikator', name_uz: 'Eksikator', cat: 'shisha', builder: 'eksikator', p: { R: 80, H: 170 }, vessel: { heatable: false, glass_g: 1500, capacity_mL: 1500 }, ports: () => [P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Moddalarni quritish va namlikdan saqlash uchun.' },
  { id: 'shisha-tayoqcha', name_uz: 'Shisha tayoqcha', cat: 'shisha', builder: 'tayoqcha', p: { L: 200, r: 3 }, tool: 'aralashtirish', ports: () => [] },
  { id: 'gaz-naycha-togri', name_uz: 'Gaz chiqarish naychasi (to\'g\'ri)', cat: 'shisha', builder: 'naycha', p: { path: [[0, 0, 0], [0, 150, 0]] }, ports: () => [P('a', 'naycha-uchi', [0, 0, 0], down), P('b', 'naycha-uchi', [0, 150, 0], up)] },
  {
    id: 'gaz-naycha-egilgan', name_uz: 'Gaz chiqarish naychasi (egilgan)', cat: 'shisha', builder: 'naycha',
    sizes: sizes([
      { id: 'standart', label: 'Qisqa (uchi 60 mm pastga tushadi)', p: { path: [[0, 0, 0], [0, 60, 0], [0, 95, 0], [35, 110, 0], [140, 110, 0], [175, 95, 0], [180, 60, 0], [180, -60, 0]] } },
      { id: 'uzun', label: 'Uzun (uchi 240 mm pastga tushadi)', p: { path: [[0, 0, 0], [0, 60, 0], [0, 95, 0], [35, 110, 0], [140, 110, 0], [175, 95, 0], [180, 60, 0], [180, -240, 0]] } },
    ]),
    ports: (p) => [P('a', 'naycha-uchi', [0, 0, 0], down), P('b', 'naycha-uchi', p.path[p.path.length - 1], down)],
    desc_uz: 'Gazni boshqa idishga o\'tkazish uchun ikki marta egilgan naycha (uzun varianti — qizdirilayotgan probirkadan stol ustidagi idishga yoki pnevmatik vannaga).',
  },
  { id: 'gaz-naycha-toraytirilgan', name_uz: 'Uchi toraytirilgan naycha', cat: 'shisha', builder: 'naycha', p: { path: [[0, 0, 0], [0, 140, 0]], taper: true }, ports: () => [P('a', 'naycha-uchi', [0, 0, 0], down), P('b', 'naycha-uchi-tor', [0, 140, 0], up)], desc_uz: 'Gazni yondirish (vodorod, atsetilen) uchun.' },
  { id: 'u-simon-naycha', name_uz: 'U-simon naycha', cat: 'shisha', builder: 'u-naycha', p: { W: 50, H: 150, r: 7 }, vessel: { heatable: false, glass_g: 25, capacity_mL: 15 }, ports: () => [P('chap', 'ogiz', [-25, 150, 0], up, { d_mm: 13 }), P('ong', 'ogiz', [25, 150, 0], up, { d_mm: 13 }), P('qisqich', 'qisqich-joyi', [0, 110, 9], [0, 0, 1])] },
  { id: 'xlorkalsiyli-naycha', name_uz: 'Xlorkalsiyli naycha', cat: 'shisha', builder: 'xlorkalsiy', p: { H: 150 }, ports: () => [P('a', 'ogiz', [0, 150, 0], up, { d_mm: 16 }), P('b', 'naycha-uchi', [0, 0, 0], down)], desc_uz: 'Gazni quritish (suvsiz CaCl₂ bilan to\'ldiriladi).' },
  {
    id: 'libix-sovutgichi', name_uz: 'Libix sovutgichi', cat: 'shisha', builder: 'sovutgich',
    // standart — shlifli kirish (dumaloq kolba 29/32); tiqinli — kirishiga teshikli rezina tiqin o'rnatilgan (Vyurs kolbasi yon naychasi kiritiladi)
    sizes: sizes([{ id: 'standart', label: 'Shlifli kirish (29/32)', p: { L: 400, kind: 'libix' } }, { id: 'tiqinli', label: 'Tiqinli kirish (Vyurs kolbasi uchun)', p: { L: 400, kind: 'libix', stopperInlet: true } }]),
    ports: (p) => [p.stopperInlet ? P('kirish', 'tiqin-teshik', [0, 0, 0], [-1, 0, 0]) : P('kirish', 'shlif-erkak', [0, 0, 0], [-1, 0, 0], { size: '29/32' }), P('chiqish', 'naycha-uchi', [400, 0, 0], side), P('suv-kirish', 'shtutser', [360, -20, 0], [0, -1, 0]), P('suv-chiqish', 'shtutser', [40, 20, 0], up), P('qisqich', 'qisqich-joyi', [200, 22, 0], [0, 0, 1])],
    desc_uz: 'Bug\'ni kondensatlash: suv pastdan kirib, yuqoridan chiqadi.',
  },
  { id: 'sharikli-sovutgich', name_uz: 'Sharikli qaytar sovutgich', cat: 'shisha', builder: 'sovutgich', p: { L: 350, kind: 'sharikli' }, ports: () => [P('kirish', 'shlif-erkak', [0, 0, 0], [-1, 0, 0], { size: '29/32' }), P('chiqish', 'ogiz', [350, 0, 0], side, { d_mm: 14 }), P('suv-kirish', 'shtutser', [40, -20, 0], [0, -1, 0]), P('suv-chiqish', 'shtutser', [310, 20, 0], up), P('qisqich', 'qisqich-joyi', [175, 22, 0], [0, 0, 1])], desc_uz: 'Qizdirishda bug\'ni qaytarib kolbaga tushiradi (vertikal o\'rnatiladi).' },
  { id: 'deflegmator', name_uz: 'Deflegmator (Vigre kolonkasi)', cat: 'shisha', builder: 'sovutgich', p: { L: 300, kind: 'deflegmator' }, ports: () => [P('kirish', 'shlif-erkak', [0, 0, 0], [-1, 0, 0], { size: '29/32' }), P('chiqish', 'shlif-urgochi', [300, 0, 0], side, { size: '29/32' }), P('yon', 'naycha-uchi', [270, 30, 0], up), P('qisqich', 'qisqich-joyi', [150, 15, 0], [0, 0, 1])], desc_uz: 'Fraksion haydash uchun.' },
  { id: 'alonj', name_uz: 'Alonj', cat: 'shisha', builder: 'alonj', p: {}, ports: () => [P('kirish', 'ogiz', [0, 0, 0], [-1, 0, 0], { d_mm: 16 }), P('chiqish', 'naycha-uchi', [90, -60, 0], down)], desc_uz: 'Sovutgichdan chiqqan distillyatni qabul qiluvchi idishga yo\'naltiradi.' },
  { id: 'dreksel-sklyankasi', name_uz: 'Gaz yuvish (Dreksel) sklyankasi', cat: 'shisha', builder: 'dreksel', p: { R: 30, H: 180 }, vessel: { heatable: false, glass_g: 150, capacity_mL: 250, gasWash: true }, ports: () => [P('kirish', 'naycha-uchi', [-14, 230, 0], up), P('chiqish', 'naycha-uchi', [14, 230, 0], up), P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Gaz suyuqlik orqali o\'tkazilib tozalanadi yoki quritiladi.' },
  { id: 'kipp-apparati', name_uz: 'Kipp apparati', cat: 'shisha', builder: 'kipp', p: {}, vessel: { heatable: false, glass_g: 2500, capacity_mL: 1000, gasSource: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('chiqish', 'shtutser', [95, 230, 0], side)], desc_uz: 'Qattiq modda va suyuqlikdan (Zn + HCl, CaCO₃ + HCl, FeS + HCl) gaz olish; jo\'mrak yopilsa reaksiya to\'xtaydi.' },
  { id: 'gazometr', name_uz: 'Gazometr', cat: 'shisha', builder: 'gazometr', p: {}, vessel: { heatable: false, glass_g: 3000, capacity_mL: 3000 }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('kirish', 'shtutser', [-110, 60, 0], [-1, 0, 0]), P('chiqish', 'shtutser', [0, 320, 0], up)], desc_uz: 'Gazni yig\'ish va saqlash.' },
  { id: 'gaz-silindri', name_uz: 'Gaz yig\'ish silindri', cat: 'shisha', builder: 'silindr', p: { R: 25, H: 160, wall: 1.6, noSpout: true }, vessel: { heatable: false, glass_g: 120, capacity_mL: 250, collector: true }, ports: (p) => [P('tub', 'tub', [0, 0, 0], down), P('ogiz', 'ogiz', [0, p.H, 0], up, { d_mm: 48 })], desc_uz: 'Gazlarni yig\'ish va ularda moddalarni yondirish uchun.' },
  { id: 'reaktiv-sklyankasi', name_uz: 'Reaktiv sklyankasi (tiqinli)', cat: 'shisha', builder: 'sklyanka', p: { R: 30, H: 110, neckR: 11 }, vessel: { heatable: false, glass_g: 150, capacity_mL: 250, bottle: true }, ports: (p) => vesselPorts({ H: p.H, mouthD: 20, neckR: p.neckR, grip: false, joint: '19/26' }) },
  { id: 'tomizgichli-sklyanka', name_uz: 'Tomizgichli sklyanka', cat: 'shisha', builder: 'sklyanka', p: { R: 18, H: 75, neckR: 8, dropper: true }, vessel: { heatable: false, glass_g: 60, capacity_mL: 50, bottle: true, dispenser: 'tomizgich' }, ports: (p) => vesselPorts({ H: p.H, mouthD: 14, neckR: p.neckR, grip: false }) },
  { id: 'qoramtir-sklyanka', name_uz: 'Qoramtir shishali sklyanka', cat: 'shisha', builder: 'sklyanka', p: { R: 30, H: 110, neckR: 11, amber: true }, vessel: { heatable: false, glass_g: 150, capacity_mL: 250, bottle: true }, ports: (p) => vesselPorts({ H: p.H, mouthD: 20, neckR: p.neckR, grip: false, joint: '19/26' }), desc_uz: 'Yorug\'likda parchalanadigan moddalar (AgNO₃, KMnO₄, HNO₃, H₂O₂) uchun.' },
  { id: 'yuvgich', name_uz: 'Yuvgich (distillangan suv)', cat: 'shisha', builder: 'yuvgich', p: { R: 35, H: 150 }, vessel: { heatable: false, glass_g: 60, capacity_mL: 500, bottle: true, source: 'H2O' }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('uchi', 'naycha-uchi', [60, 190, 0], [1, -0.3, 0])], desc_uz: 'Distillangan suv bilan chayish va suv qo\'shish.' },

  // ------------------------------------------------------------ chinni
  { id: 'chinni-kosacha', name_uz: 'Chinni kosacha (bug\'latish uchun)', cat: 'chinni', builder: 'kosacha', p: { R: 45, H: 30 }, vessel: { heatable: true, glass_g: 90, capacity_mL: 60, porcelain: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('ogiz', 'ogiz', [0, 30, 0], up, { d_mm: 90 })], desc_uz: 'Eritmani bug\'latish va kristallash uchun.' },
  { id: 'tigel', name_uz: 'Chinni tigel', cat: 'chinni', builder: 'tigel', p: { R: 16, H: 38 }, vessel: { heatable: true, glass_g: 25, capacity_mL: 15, porcelain: true, maxT: 1100 }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('ogiz', 'ogiz', [0, 38, 0], up, { d_mm: 32 })], desc_uz: 'Qattiq moddalarni kuchli qizdirish (kuydirish) uchun.' },
  { id: 'tigel-qopqogi', name_uz: 'Tigel qopqog\'i', cat: 'chinni', builder: 'qopqoq', p: { R: 18 }, ports: () => [P('qopqoq', 'tiqin', [0, 0, 0], down, { d_min: 28, d_max: 36 })] },
  { id: 'hovoncha', name_uz: 'Chinni hovoncha va dastasi', cat: 'chinni', builder: 'hovoncha', p: { R: 45, H: 45 }, vessel: { heatable: false, glass_g: 300, capacity_mL: 60, porcelain: true, mortar: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Qattiq moddalarni maydalash (kukun qilish) uchun.' },
  { id: 'chinni-uchburchak', name_uz: 'Chinni uchburchak', cat: 'chinni', builder: 'uchburchak', p: { R: 40 }, ports: () => [P('joy', 'uchburchak-joyi', [0, 0, 0], down), P('uchburchak', 'uchburchak', [0, 2, 0], up)], desc_uz: 'Tigelni halqa yoki uchoyoq ustida ushlab turadi.' },
  { id: 'chinni-qayiqcha', name_uz: 'Chinni qayiqcha', cat: 'chinni', builder: 'qayiqcha', p: { L: 70 }, vessel: { heatable: true, glass_g: 15, capacity_mL: 5, porcelain: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down)] },
  { id: 'tomchi-plastinkasi', name_uz: 'Tomchi tahlili plastinkasi', cat: 'chinni', builder: 'tomchi-plastinka', p: { W: 100, D: 70 }, vessel: { heatable: false, glass_g: 150, capacity_mL: 1.5, wells: 12 }, ports: () => [P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Bir necha tomchi bilan sifat reaksiyalari o\'tkazish.' },
  { id: 'byuxner-voronkasi', name_uz: 'Byuxner voronkasi', cat: 'chinni', builder: 'byuxner', p: { R: 40, H: 110 }, ports: () => [P('oyoq', 'voronka-oyogi', [0, 0, 0], down), P('ogiz', 'voronka-ogiz', [0, 110, 0], up)], desc_uz: 'Vakuum ostida filtrlash (Bunzen kolbasi bilan).' },

  // ------------------------------------------------------------ qizdirish
  { id: 'spirt-lampasi', name_uz: 'Spirt lampasi', cat: 'qizdirish', builder: 'spirt-lampa', p: {}, heater: { power_W: 35, maxT: 500, flame: 'spirt', flameH: 45 }, ports: () => [P('olov', 'olov', [0, 110, 0], up), P('asos', 'gorelka-joyi', [0, 0, 0], down)], desc_uz: 'Alanganing yuqori qismi eng issiq; qopqoq bilan o\'chiriladi (puflanmaydi).' },
  { id: 'bunzen-gorelkasi', name_uz: 'Bunzen gorelkasi', cat: 'qizdirish', builder: 'bunzen', p: {}, heater: { power_W: 120, maxT: 900, flame: 'gaz', flameH: 70 }, ports: () => [P('olov', 'olov', [0, 190, 0], up), P('asos', 'gorelka-joyi', [0, 0, 0], down), P('gaz', 'shtutser', [30, 15, 0], side)], desc_uz: 'Havo kirishi rostlanadi: ko\'k (to\'liq yonish) yoki sariq alanga.' },
  { id: 'elektr-plitka', name_uz: 'Elektr plitka', cat: 'qizdirish', builder: 'plitka', p: {}, heater: { power_W: 60, maxT: 350, flame: null }, ports: () => [P('plita', 'plita', [0, 70, 0], up)], desc_uz: 'Ochiq alangasiz qizdirish (yonuvchan suyuqliklar uchun xavfsizroq).' },
  { id: 'suv-hammomi', name_uz: 'Suv hammomi', cat: 'qizdirish', builder: 'hammom', p: { R: 80, H: 90 }, heater: { power_W: 40, maxT: 100, flame: null }, ports: () => [P('hammom', 'hammom', [0, 40, 0], up)], desc_uz: '100 °C dan oshmaydigan bir tekis qizdirish.' },
  { id: 'qum-hammomi', name_uz: 'Qum hammomi', cat: 'qizdirish', builder: 'hammom', p: { R: 80, H: 60, sand: true }, heater: { power_W: 50, maxT: 300, flame: null }, ports: () => [P('hammom', 'hammom', [0, 30, 0], up)], desc_uz: '300 °C gacha bir tekis qizdirish.' },
  { id: 'kolba-isitgich', name_uz: 'Kolba isitgich', cat: 'qizdirish', builder: 'isitgich', p: { R: 55 }, heater: { power_W: 60, maxT: 400, flame: null }, ports: () => [P('uya', 'isitgich-uyasi', [0, 30, 0], up)], desc_uz: 'Dumaloq tubli kolbalarni qizdirish uchun.' },
  { id: 'mufel-pechi', name_uz: 'Mufel pechi', cat: 'qizdirish', builder: 'mufel', p: {}, heater: { power_W: 100, maxT: 1100, flame: null }, ports: () => [P('ichi', 'pech-ichi', [0, 60, 0], up)], desc_uz: 'Tigellarni 1100 °C gacha qizdirish.' },

  // ------------------------------------------------------------ mahkamlash
  { id: 'shtativ', name_uz: 'Laboratoriya shtativi', cat: 'mahkamlash', builder: 'shtativ', p: { H: 600 }, ports: () => [P('ustun', 'ustun', [0, 300, -60], side, { multi: true, slide: [80, 560] })], desc_uz: 'Asos va ustun; mufta orqali qisqich va halqa o\'rnatiladi.' },
  { id: 'mufta', name_uz: 'Mufta', cat: 'mahkamlash', builder: 'mufta', p: {}, ports: () => [P('teshik', 'mufta-teshik', [0, 0, 0], [-1, 0, 0]), P('ilgak', 'mufta-ilgak', [25, 0, 0], side)] },
  { id: 'qisqich-lapka', name_uz: 'Qisqich (lapka)', cat: 'mahkamlash', builder: 'lapka', p: {}, ports: () => [P('dasta', 'dasta', [0, 0, 0], [-1, 0, 0]), P('jag', 'lapka-jag', [150, 0, 0], side)], desc_uz: 'Idishni kerakli balandlik va burchakda ushlab turadi.' },
  { id: 'shtativ-halqasi', name_uz: 'Shtativ halqasi', cat: 'mahkamlash', builder: 'halqa', p: { R: 45 }, ports: () => [P('dasta', 'dasta', [0, 0, 0], [-1, 0, 0]), P('halqa', 'halqa', [110, 0, 0], up)] },
  { id: 'uchoyoq', name_uz: 'Uchoyoq', cat: 'mahkamlash', builder: 'uchoyoq', p: { H: 180, R: 60 }, ports: () => [P('ust', 'uchoyoq-usti', [0, 180, 0], up), P('ost', 'uchoyoq-osti', [0, 0, 0], up)] },
  { id: 'asbest-tor', name_uz: 'Asbestli (keramik) to\'r', cat: 'mahkamlash', builder: 'tor', p: { W: 120 }, ports: () => [P('joy', 'tor-joyi', [0, 0, 0], down), P('ust', 'tor-usti', [0, 3, 0], up)], desc_uz: 'Shisha idish ostiga qo\'yilib, issiqlikni bir tekis tarqatadi.' },
  { id: 'probirka-shtativi', name_uz: 'Probirkalar shtativi', cat: 'mahkamlash', builder: 'probirka-shtativ', p: { slots: 6 }, ports: () => [0, 1, 2, 3, 4, 5].map((i) => P(`uya${i + 1}`, 'uya', [-75 + i * 30, 70, 0], up)) },
  { id: 'probirka-qisqichi', name_uz: 'Probirka qisqichi (ushlagich)', cat: 'mahkamlash', builder: 'probirka-qisqich', p: {}, tool: 'ushlash', ports: () => [P('jag', 'lapka-jag', [0, 0, 0], side)], desc_uz: 'Probirkani qizdirishda qo\'lda ushlash uchun.' },
  { id: 'tigel-qisqichi', name_uz: 'Tigel qisqichi', cat: 'mahkamlash', builder: 'tigel-qisqich', p: {}, tool: 'ushlash', ports: () => [] },
  { id: 'pinset', name_uz: 'Pinset', cat: 'mahkamlash', builder: 'pinset', p: {}, tool: 'ushlash', ports: () => [], desc_uz: 'Ishqoriy metallarni va kichik bo\'laklarni olish uchun.' },

  // ------------------------------------------------------------ o'lchash
  { id: 'elektron-tarozi', name_uz: 'Elektron tarozi', cat: 'olchash', builder: 'tarozi', p: {}, instrument: 'tarozi', ports: () => [P('palla', 'tarozi-palla', [0, 45, 0], up)], desc_uz: '0,01 g aniqlikda tortadi; "TARA" tugmasi idish massasini nolga keltiradi.' },
  { id: 'termometr', name_uz: 'Termometr', cat: 'olchash', builder: 'termometr', p: { L: 260 }, instrument: 'termometr', ports: () => [P('uchi', 'naycha-uchi', [0, 0, 0], down)], desc_uz: '0–360 °C; idish ichiga tushiriladi yoki tiqin teshigiga o\'rnatiladi.' },
  { id: 'ph-metr', name_uz: 'pH-metr', cat: 'olchash', builder: 'ph-metr', p: {}, instrument: 'ph-metr', ports: () => [P('elektrod', 'naycha-uchi', [80, 0, 0], down)] },
  { id: 'indikator-qogozi', name_uz: 'Universal indikator qog\'ozi', cat: 'olchash', builder: 'qogoz', p: {}, instrument: 'indikator-qogoz', ports: () => [] },
  { id: 'areometr', name_uz: 'Areometr', cat: 'olchash', builder: 'areometr', p: {}, instrument: 'areometr', ports: () => [], desc_uz: 'Suyuqlik zichligini o\'lchaydi.' },
  { id: 'sekundomer', name_uz: 'Sekundomer', cat: 'olchash', builder: 'sekundomer', p: {}, instrument: 'sekundomer', ports: () => [] },
  { id: 'konduktometr', name_uz: 'Konduktometr', cat: 'olchash', builder: 'konduktometr', p: {}, instrument: 'konduktometr', ports: () => [P('elektrod', 'naycha-uchi', [80, 0, 0], down)], desc_uz: 'Eritmaning elektr o\'tkazuvchanligini o\'lchaydi.' },

  // ------------------------------------------------------------ elektrokimyo
  { id: 'tok-manbai', name_uz: 'O\'zgarmas tok manbai', cat: 'elektrokimyo', builder: 'tok-manbai', p: {}, instrument: 'tok-manbai', ports: () => [P('plus', 'klemma', [-30, 60, 40], up), P('minus', 'klemma', [30, 60, 40], up)], desc_uz: '0–12 V; "+" anodga, "−" katodga ulanadi.' },
  ...['grafit', 'mis', 'rux', 'temir', 'platina'].map((m) => ({
    id: `elektrod-${m}`, name_uz: `Elektrod (${m})`, cat: 'elektrokimyo', builder: 'elektrod', p: { material: m },
    electrode: { material: { grafit: 'C', mis: 'Cu', rux: 'Zn', temir: 'Fe', platina: 'Pt' }[m] },
    ports: () => [P('uchi', 'elektrod-uchi', [0, 0, 0], down), P('klemma', 'klemma', [0, 110, 0], up)],
  })),
  { id: 'elektrolizyor-u', name_uz: 'U-simon elektrolizyor', cat: 'elektrokimyo', builder: 'u-naycha', p: { W: 60, H: 160, r: 9 }, vessel: { heatable: false, glass_g: 40, capacity_mL: 30, electrolyzer: true }, ports: () => [P('anod-joyi', 'elektrod-joyi', [-30, 160, 0], up), P('katod-joyi', 'elektrod-joyi', [30, 160, 0], up), P('qisqich', 'qisqich-joyi', [0, 120, 11], [0, 0, 1])] },
  { id: 'gofman-apparati', name_uz: 'Gofman apparati', cat: 'elektrokimyo', builder: 'gofman', p: {}, vessel: { heatable: false, glass_g: 300, capacity_mL: 120, electrolyzer: true, gasBurettes: true }, ports: () => [P('anod-joyi', 'elektrod-joyi', [-40, 20, 0], down), P('katod-joyi', 'elektrod-joyi', [40, 20, 0], down), P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Suv elektrolizida gazlar hajmini o\'lchash (H₂ : O₂ = 2 : 1).' },
  { id: 'tuz-koprigi', name_uz: 'Tuz ko\'prigi', cat: 'elektrokimyo', builder: 'tuz-koprigi', p: {}, ports: () => [P('a', 'elektrod-uchi', [-50, 0, 0], down), P('b', 'elektrod-uchi', [50, 0, 0], down)], desc_uz: 'KCl yoki KNO₃ eritmasi shimdirilgan ko\'prik: ikki yarim elementni tutashtiradi.' },
  { id: 'voltmetr', name_uz: 'Voltmetr', cat: 'elektrokimyo', builder: 'voltmetr', p: {}, instrument: 'voltmetr', ports: () => [P('plus', 'klemma', [-25, 50, 35], up), P('minus', 'klemma', [25, 50, 35], up)] },
  { id: 'simlar', name_uz: 'Ulovchi simlar', cat: 'elektrokimyo', builder: 'sim', p: {}, flexible: true, ports: () => [P('a', 'sim-uchi', [0, 0, 0], down), P('b', 'sim-uchi', [200, 0, 0], down)] },
  { id: 'otkazuvchanlik-lampochkasi', name_uz: 'O\'tkazuvchanlikni sinash asbobi (lampochkali)', cat: 'elektrokimyo', builder: 'lampochka', p: {}, instrument: 'otkazuvchanlik', ports: () => [P('elektrod', 'naycha-uchi', [0, 0, 0], down)], desc_uz: 'Elektrodlar eritmaga tushirilganda lampochka yonsa — eritma elektrolit.' },

  // ------------------------------------------------------------ yordamchi
  ...[['kichik', 11, 17], ['orta', 17, 27], ['katta', 27, 45]].flatMap(([s, a, b]) => [
    { id: `rezina-tiqin-yaxlit-${s}`, name_uz: `Rezina tiqin, yaxlit (${s})`, cat: 'yordamchi', builder: 'tiqin', p: { d1: a, d2: b, holes: 0 }, ports: () => [P('tiqin', 'tiqin', [0, 0, 0], down, { d_min: a, d_max: b, seal: true })] },
    { id: `rezina-tiqin-1-teshikli-${s}`, name_uz: `Rezina tiqin, bir teshikli (${s})`, cat: 'yordamchi', builder: 'tiqin', p: { d1: a, d2: b, holes: 1 }, ports: () => [P('tiqin', 'tiqin', [0, 0, 0], down, { d_min: a, d_max: b, seal: true }), P('teshik1', 'tiqin-teshik', [0, 22, 0], up)] },
    { id: `rezina-tiqin-2-teshikli-${s}`, name_uz: `Rezina tiqin, ikki teshikli (${s})`, cat: 'yordamchi', builder: 'tiqin', p: { d1: a, d2: b, holes: 2 }, ports: () => [P('tiqin', 'tiqin', [0, 0, 0], down, { d_min: a, d_max: b, seal: true }), P('teshik1', 'tiqin-teshik', [-b * 0.22, 22, 0], up), P('teshik2', 'tiqin-teshik', [b * 0.22, 22, 0], up)] },
  ]),
  ...['14/23', '19/26', '29/32'].map((sz) => ({ id: `shlif-tiqin-${sz.replace('/', '-')}`, name_uz: `Shlif tiqin ${sz}`, cat: 'yordamchi', builder: 'shlif-tiqin', p: { size: sz }, ports: () => [P('tiqin', 'shlif-erkak', [0, 0, 0], down, { size: sz, seal: true })] })),
  { id: 'rezina-shlang', name_uz: 'Rezina shlang', cat: 'yordamchi', builder: 'shlang', p: { L: 400 }, flexible: true, ports: () => [P('a', 'shlang-uchi', [0, 0, 0], down), P('b', 'shlang-uchi', [400, 0, 0], down)], desc_uz: 'Egiluvchan ulanish: naycha va shtutserlarni bog\'laydi.' },
  { id: 'mor-qisqichi', name_uz: 'Mor qisqichi', cat: 'yordamchi', builder: 'mor-qisqich', p: {}, clampHose: true, ports: () => [] , desc_uz: 'Shlangni siqib, gaz/suyuqlik oqimini to\'xtatadi.' },
  { id: 'gofman-qisqichi', name_uz: 'Gofman qisqichi (vintli)', cat: 'yordamchi', builder: 'gofman-qisqich', p: {}, clampHose: true, ports: () => [] , desc_uz: 'Oqimni vint bilan asta rostlaydi.' },
  { id: 'shpatel', name_uz: 'Shpatel', cat: 'yordamchi', builder: 'shpatel', p: {}, tool: 'qattiq-olish', ports: () => [], desc_uz: 'Qattiq moddalarni olish va solish uchun.' },
  { id: 'yondirish-qoshiqchasi', name_uz: 'Moddalarni yondirish qoshiqchasi', cat: 'yordamchi', builder: 'qoshiqcha', p: {}, vessel: { heatable: true, glass_g: 20, capacity_mL: 2, spoon: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down)], desc_uz: 'Moddani alangada yondirib, gazli idishga tushirish uchun.' },
  { id: 'filtr-qogoz', name_uz: 'Filtr qog\'oz', cat: 'yordamchi', builder: 'filtr', p: {}, filter: true, ports: () => [P('joy', 'filtr-joyi', [0, 0, 0], down)], desc_uz: 'Voronkaga buklab qo\'yiladi; cho\'kmani eritmadan ajratadi.' },
  { id: 'nixrom-sim', name_uz: 'Nixrom sim (alanga sinovi)', cat: 'yordamchi', builder: 'nixrom', p: {}, tool: 'alanga-sinovi', ports: () => [], desc_uz: 'Tuz eritmasiga botirilib alangaga kiritiladi — alanga rangi kationni ko\'rsatadi.' },
  { id: 'chop-yonib-turgan', name_uz: 'Yonib turgan cho\'p', cat: 'yordamchi', builder: 'chop', p: { burning: true }, tool: 'cho\'p-yonuvchi', ports: () => [], desc_uz: 'Vodorodni sinash ("paq" tovushi), CO₂ ni aniqlash (o\'chadi).' },
  { id: 'chop-chogllangan', name_uz: 'Cho\'g\'langan cho\'p', cat: 'yordamchi', builder: 'chop', p: { glowing: true }, tool: 'cho\'p-chog\'', ports: () => [], desc_uz: 'Kislorodni aniqlash: kislorodda alangalanib ketadi.' },
  { id: 'gugurt', name_uz: 'Gugurt', cat: 'yordamchi', builder: 'gugurt', p: {}, tool: 'yoqish', ports: () => [] },
  { id: 'pnevmatik-vanna', name_uz: 'Pnevmatik vanna', cat: 'yordamchi', builder: 'vanna', p: { W: 260, D: 160, H: 110 }, vessel: { heatable: false, glass_g: 1500, capacity_mL: 4000, trough: true }, ports: () => [P('tub', 'tub', [0, 0, 0], down), P('suv-osti', 'suv-osti', [0, 40, 0], up), P('yiggich-joyi', 'yiggich-joyi', [0, 60, 0], up)], desc_uz: 'Gazni suv ostida yig\'ish: suv to\'ldirilgan idish ag\'darib qo\'yiladi.' },
  { id: 'vakuum-nasos', name_uz: 'Suv oqimli vakuum nasos', cat: 'yordamchi', builder: 'nasos', p: {}, pump: true, ports: () => [P('sorish', 'shtutser', [30, 40, 0], side)], desc_uz: 'Jo\'mrakka ulanadi; Bunzen kolbasidagi bosimni pasaytiradi.' },
  { id: 'yoritgich', name_uz: 'Yoritgich (UB lampa)', cat: 'yordamchi', builder: 'yoritgich', p: {}, light: true, ports: () => [], desc_uz: 'Yorug\'lik talab qiladigan reaksiyalar (CH₄ + Cl₂, H₂ + Cl₂) uchun.' },

  // ------------------------------------------------------------ himoya
  { id: 'kozoynak', name_uz: 'Himoya ko\'zoynagi', cat: 'himoya', builder: 'kozoynak', p: {}, safety: true, ports: () => [] },
  { id: 'qolqop', name_uz: 'Himoya qo\'lqoplari', cat: 'himoya', builder: 'qolqop', p: {}, safety: true, ports: () => [] },
  { id: 'xalat', name_uz: 'Laboratoriya xalati', cat: 'himoya', builder: 'xalat', p: {}, safety: true, ports: () => [] },
];

// Port turlari va moslik jadvali
export const PORT_TYPES = {
  ogiz: 'Idish og\'zi (diametri bilan)', tiqin: 'Tiqin tanasi', 'tiqin-teshik': 'Tiqin teshigi', 'naycha-uchi': 'Shisha naycha uchi', 'naycha-uchi-tor': 'Toraytirilgan naycha uchi',
  'shlang-uchi': 'Shlang uchi', shtutser: 'Shlang shtutseri', 'shlif-urgochi': 'Shlif (ichki)', 'shlif-erkak': 'Shlif (tashqi)', 'qisqich-joyi': 'Qisqich ushlaydigan joy',
  'lapka-jag': 'Qisqich jag\'i', ustun: 'Shtativ ustuni', 'mufta-teshik': 'Mufta teshigi', 'mufta-ilgak': 'Mufta ilgagi', dasta: 'Qisqich/halqa dastasi', halqa: 'Shtativ halqasi',
  'halqa-joyi': 'Halqaga qo\'yiladigan joy', tub: 'Idish tubi', olov: 'Alanga', 'tor-usti': 'To\'r usti', 'tor-joyi': 'To\'r asosi', 'uchoyoq-usti': 'Uchoyoq usti', 'uchoyoq-osti': 'Uchoyoq osti',
  'gorelka-joyi': 'Gorelka asosi', plita: 'Plita yuzasi', hammom: 'Hammom', 'isitgich-uyasi': 'Isitgich uyasi', 'pech-ichi': 'Pech ichi', uchburchak: 'Chinni uchburchak',
  'uchburchak-joyi': 'Uchburchak asosi', 'tarozi-palla': 'Tarozi pallasi', uya: 'Shtativ uyasi', 'probirka-tanasi': 'Probirka tanasi', 'voronka-oyogi': 'Voronka oyog\'i',
  'voronka-konus': 'Voronka konusi', 'voronka-ogiz': 'Voronka og\'zi', 'elektrod-uchi': 'Elektrod uchi', 'elektrod-joyi': 'Elektrod joyi', klemma: 'Klemma', 'sim-uchi': 'Sim uchi',
  'suv-osti': 'Suv ostidagi kirish', 'yiggich-joyi': 'Yig\'gich idish joyi', 'filtr-joyi': 'Filtr', qopqoq: 'Qopqoq (og\'izni germetik bo\'lmagan holda yopadi)',
};

// [a, b, qoida]: qoida — null (har doim), "diameter" (tiqin og'izga mos), "size" (shlif o'lchami teng), sealed — germetik ulanish
export const PORT_COMPAT = [
  ['ogiz', 'tiqin', 'diameter', true],
  ['shlif-urgochi', 'shlif-erkak', 'size', true],
  ['tiqin-teshik', 'naycha-uchi', null, true],
  ['tiqin-teshik', 'voronka-oyogi', null, true],
  ['shlang-uchi', 'naycha-uchi', null, true],
  ['shlang-uchi', 'naycha-uchi-tor', null, true],
  ['shlang-uchi', 'shtutser', null, true],
  ['shlang-uchi', 'shlang-uchi', null, true],
  ['qisqich-joyi', 'lapka-jag', null, false],
  ['ustun', 'mufta-teshik', null, false],
  ['mufta-ilgak', 'dasta', null, false],
  ['halqa', 'halqa-joyi', null, false],
  ['halqa', 'voronka-konus', null, false],
  ['halqa', 'tor-joyi', null, false],
  ['halqa', 'uchburchak-joyi', null, false],
  ['tub', 'olov', null, false],
  ['tub', 'tor-usti', null, false],
  ['tub', 'plita', null, false],
  ['tub', 'hammom', null, false],
  ['tub', 'isitgich-uyasi', null, false],
  ['tub', 'pech-ichi', null, false],
  ['tub', 'uchburchak', null, false],
  ['tub', 'tarozi-palla', null, false],
  ['probirka-tanasi', 'uya', null, false],
  ['tor-joyi', 'uchoyoq-usti', null, false],
  ['uchburchak-joyi', 'uchoyoq-usti', null, false],
  ['gorelka-joyi', 'uchoyoq-osti', null, false],
  ['voronka-oyogi', 'ogiz', null, false],
  ['naycha-uchi', 'ogiz', null, false],
  ['naycha-uchi', 'suv-osti', null, false],
  ['ogiz', 'yiggich-joyi', null, false],
  ['elektrod-uchi', 'elektrod-joyi', null, false],
  ['elektrod-uchi', 'ogiz', null, false],
  ['klemma', 'sim-uchi', null, false],
  ['filtr-joyi', 'voronka-ogiz', null, false],
  ['shlif-erkak', 'ogiz', 'diameter-shlif', false],
  ['ogiz', 'qopqoq', null, false],
];

export const SHLIF_D = { '14/23': 14.5, '19/26': 18.8, '24/29': 24, '29/32': 29.2 };
