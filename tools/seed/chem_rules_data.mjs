// Umumiy qoidalar uchun jadvallar: kislota-asos tizimlari, metallar faollik qatori, komplekslar, indikatorlar.
// pKa qiymatlari — 25 °C dagi ma'lumotnoma qiymatlari (yaxlitlangan).

// forms: eng protonlangan shakldan boshlab. Neytral shakllar modda id'si, ionlar — "SO4^2-" ko'rinishidagi kalit.
// strong: true — birinchi bosqich to'liq dissotsilanadi.
// volatile: neytral shakl gazga aylanadi (gas: gaz id, water: ajraladigan suv soni, sol_M: ~1 atm dagi eruvchanlik).
export const ACID_BASE = [
  { id: 'sulfat', forms: ['H2SO4', 'HSO4^-', 'SO4^2-'], pKa: [-3, 1.99] },
  { id: 'fosfat', forms: ['H3PO4', 'H2PO4^-', 'HPO4^2-', 'PO4^3-'], pKa: [2.15, 7.20, 12.35] },
  { id: 'karbonat', forms: ['H2CO3', 'HCO3^-', 'CO3^2-'], pKa: [6.35, 10.33], volatile: { form: 'H2CO3', gas: 'CO2', water: 1, sol_M: 0.033 } },
  { id: 'sulfit', forms: ['H2SO3', 'HSO3^-', 'SO3^2-'], pKa: [1.85, 7.2], volatile: { form: 'H2SO3', gas: 'SO2', water: 1, sol_M: 0.2 } },
  { id: 'sulfid', forms: ['H2S', 'HS^-', 'S^2-'], pKa: [7.0, 12.9], volatile: { form: 'H2S', gas: 'H2S', water: 0, sol_M: 0.1 } },
  { id: 'ammiak', forms: ['NH4^+', 'NH3'], pKa: [9.25], volatile: { form: 'NH3', gas: 'NH3', water: 0, sol_M: 5, heat_only: true } },
  { id: 'atsetat', forms: ['CH3COOH', 'CH3COO^-'], pKa: [4.76] },
  { id: 'formiat', forms: ['HCOOH', 'HCOO^-'], pKa: [3.75] },
  { id: 'propionat', forms: ['C2H5COOH', 'C2H5COO^-'], pKa: [4.87] },
  { id: 'butirat', forms: ['C3H7COOH', 'C3H7COO^-'], pKa: [4.82] },
  { id: 'benzoat', forms: ['C6H5COOH', 'C6H5COO^-'], pKa: [4.20] },
  { id: 'laktat', forms: ['CH3CH(OH)COOH', 'CH3CH(OH)COO^-'], pKa: [3.86] },
  { id: 'salitsilat', forms: ['C6H4(OH)COOH', 'C6H4(OH)COO^-'], pKa: [2.97] },
  { id: 'sitrat', forms: ['C3H5O(COOH)3', 'C3H5O(COOH)2COO^-', 'C3H5O(COOH)(COO)2^2-', 'C3H5O(COO)3^3-'], pKa: [3.13, 4.76, 6.40] },
  { id: 'stearat', forms: ['C17H35COOH', 'C17H35COO^-'], pKa: [4.9] },
  { id: 'oksalat', forms: ['H2C2O4', 'HC2O4^-', 'C2O4^2-'], pKa: [1.25, 4.27] },
  { id: 'ftorid', forms: ['HF', 'F^-'], pKa: [3.17] },
  { id: 'nitrit', forms: ['HNO2', 'NO2^-'], pKa: [3.29] },
  { id: 'gipoxlorit', forms: ['HClO', 'ClO^-'], pKa: [7.53] },
  { id: 'silikat', forms: ['H2SiO3', 'HSiO3^-', 'SiO3^2-'], pKa: [9.8, 12.0] },
  { id: 'fenol', forms: ['C6H5OH', 'C6H5O^-'], pKa: [9.95] },
  { id: 'metilamin', forms: ['CH3NH3^+', 'CH3NH2'], pKa: [10.64] },
  { id: 'etilamin', forms: ['C2H5NH3^+', 'C2H5NH2'], pKa: [10.7] },
  { id: 'anilin', forms: ['C6H5NH3^+', 'C6H5NH2'], pKa: [4.6] },
  { id: 'xromat', forms: ['HCrO4^-', 'CrO4^2-'], pKa: [6.5], skip_species: true },
];

// Kuchli kislotalar (suvda to'liq: H+ + anion) va kuchli asoslar (to'liq: kation + OH-)
export const STRONG_ACIDS = { HCl: 'Cl^-', HBr: 'Br^-', HI: 'I^-', HNO3: 'NO3^-', HClO4: 'ClO4^-', HClO3: 'ClO3^-', HMnO4: 'MnO4^-' };

// Metallar: standart elektrod potensiali E° (V, 25 °C), suvli eritmada hosil qiladigan ioni.
// order — maktab darsligidagi faollik qatori tartibi.
export const METALS = [
  { id: 'Li', ion: 'Li^+', n: 1, E: -3.04, water: 'sovuq' },
  { id: 'K', ion: 'K^+', n: 1, E: -2.93, water: 'sovuq' },
  { id: 'Ba', ion: 'Ba^2+', n: 2, E: -2.91, water: 'sovuq' },
  { id: 'Ca', ion: 'Ca^2+', n: 2, E: -2.87, water: 'sovuq' },
  { id: 'Na', ion: 'Na^+', n: 1, E: -2.71, water: 'sovuq' },
  { id: 'Mg', ion: 'Mg^2+', n: 2, E: -2.37, water: 'issiq' },
  { id: 'Al', ion: 'Al^3+', n: 3, E: -1.66, water: 'yo\'q', film: true },
  { id: 'Mn', ion: 'Mn^2+', n: 2, E: -1.18, water: 'yo\'q' },
  { id: 'Zn', ion: 'Zn^2+', n: 2, E: -0.76, water: 'yo\'q' },
  { id: 'Cr', ion: 'Cr^2+', ion_air: 'Cr^3+', n: 2, E: -0.74, water: 'yo\'q', film: true },
  { id: 'Fe', ion: 'Fe^2+', n: 2, E: -0.44, water: 'yo\'q' },
  { id: 'Co', ion: 'Co^2+', n: 2, E: -0.28, water: 'yo\'q' },
  { id: 'Ni', ion: 'Ni^2+', n: 2, E: -0.25, water: 'yo\'q' },
  { id: 'Sn', ion: 'Sn^2+', n: 2, E: -0.14, water: 'yo\'q' },
  { id: 'Pb', ion: 'Pb^2+', n: 2, E: -0.13, water: 'yo\'q', note_uz: "qo'rg'oshin xlorid va sulfat sirtni qoplab, reaksiyani to'xtatadi" },
  { id: 'H2', ion: 'H^+', n: 1, E: 0.0 },
  { id: 'Cu', ion: 'Cu^2+', n: 2, E: 0.34, water: 'yo\'q' },
  { id: 'Hg', ion: 'Hg^2+', n: 2, E: 0.85, water: 'yo\'q' },
  { id: 'Ag', ion: 'Ag^+', n: 1, E: 0.80, water: 'yo\'q' },
  { id: 'Pt', ion: null, n: 2, E: 1.18, water: 'yo\'q' },
  { id: 'Au', ion: null, n: 3, E: 1.50, water: 'yo\'q' },
];

// Kompleks hosil bo'lishi (ortiqcha ligand bilan). Dvigatel qattiq modda yoki ion + ligand ortiqcha bo'lsa bajaradi.
// "from": cho'kma yoki ion, "ligand": OH^- yoki NH3, eq: qisqartirilgan ionli tenglama.
export const COMPLEXES = [
  { from: 'Al(OH)3', ligand: 'OH^-', eq: 'Al(OH)3 + OH⁻ = [Al(OH)4]⁻', note_uz: 'amfoter gidroksid ortiqcha ishqorda eriydi' },
  { from: 'Zn(OH)2', ligand: 'OH^-', eq: 'Zn(OH)2 + 2OH⁻ = [Zn(OH)4]²⁻', note_uz: 'amfoter gidroksid ortiqcha ishqorda eriydi' },
  { from: 'Cr(OH)3', ligand: 'OH^-', eq: 'Cr(OH)3 + 3OH⁻ = [Cr(OH)6]³⁻', note_uz: 'amfoter gidroksid ortiqcha ishqorda eriydi (yashil eritma)' },
  { from: 'Pb(OH)2', ligand: 'OH^-', eq: 'Pb(OH)2 + 2OH⁻ = [Pb(OH)4]²⁻', note_uz: 'amfoter gidroksid ortiqcha ishqorda eriydi' },
  { from: 'Sn(OH)2', ligand: 'OH^-', eq: 'Sn(OH)2 + 2OH⁻ = [Sn(OH)4]²⁻', note_uz: 'amfoter gidroksid ortiqcha ishqorda eriydi' },
  { from: 'Cu(OH)2', ligand: 'NH3', eq: 'Cu(OH)2 + 4NH3 = [Cu(NH3)4]²⁺ + 2OH⁻', note_uz: 'ammiak ortiqcha bo\'lganda to\'q ko\'k ammiakat hosil bo\'ladi' },
  { from: 'Zn(OH)2', ligand: 'NH3', eq: 'Zn(OH)2 + 4NH3 = [Zn(NH3)4]²⁺ + 2OH⁻', note_uz: 'rux gidroksid ortiqcha ammiakda eriydi' },
  { from: 'Ni(OH)2', ligand: 'NH3', eq: 'Ni(OH)2 + 6NH3 = [Ni(NH3)6]²⁺ + 2OH⁻', note_uz: 'nikel gidroksid ortiqcha ammiakda ko\'k-binafsha kompleks beradi' },
  { from: 'Ag2O', ligand: 'NH3', eq: 'Ag2O + 4NH3 + H2O = 2[Ag(NH3)2]⁺ + 2OH⁻', note_uz: 'kumush oksid ammiakda eriydi (Tollens reaktivi)' },
  { from: 'AgCl', ligand: 'NH3', eq: 'AgCl + 2NH3 = [Ag(NH3)2]⁺ + Cl⁻', note_uz: 'kumush xlorid ammiakda eriydi (AgBr qisman, AgI erimaydi)' },
];

// Indikatorlar: rang o'tish oraliqlari (pH bo'yicha). stops — [pH, rang]; rang oraliqda chiziqli aralashtiriladi.
export const INDICATORS = [
  { id: 'fenolftalein', ref_M: 0.0003, stops: [[0, null], [8.1, null], [8.6, '#f7b6d8'], [10, '#d81b8c'], [13, '#d81b8c']] },
  { id: 'metiloranj', ref_M: 0.0003, stops: [[0, '#e0312b'], [3.1, '#e0312b'], [3.8, '#f08a1c'], [4.4, '#f2c21b'], [14, '#f2c21b']] },
  { id: 'lakmus', ref_M: 0.0003, stops: [[0, '#d42a3a'], [5.0, '#d42a3a'], [6.5, '#8a4fb3'], [8.0, '#3a55c7'], [14, '#3a55c7']] },
  { id: 'universal-indikator', ref_M: 0.0003, stops: [[0, '#c4141c'], [2, '#e63a1f'], [4, '#f39a1d'], [6, '#f5d324'], [7, '#7cc23a'], [8, '#2f9e5a'], [9, '#2e7fb8'], [10, '#3349a8'], [12, '#4d2f91'], [14, '#3b1f6e']] },
  { id: 'bromtimol-kok', ref_M: 0.0003, stops: [[0, '#e8d02a'], [6.0, '#e8d02a'], [6.8, '#7fa83a'], [7.6, '#2a5fc0'], [14, '#2a5fc0']] },
  { id: 'erioxrom-qora-T', ref_M: 0.0003, stops: [[0, '#b3263a'], [6.3, '#b3263a'], [8, '#3043b0'], [11.5, '#3043b0'], [12.5, '#e07a2a'], [14, '#e07a2a']], note_uz: 'metall ionlari bilan qizil-binafsha, erkin holda (pH≈10) ko\'k' },
];

// Metallar tomonidan qaytariladigan ionlar (yarim reaksiya, E°, V). Metall M ionni qaytaradi, agar E(ion) > E°(M) + 0,1.
// Al³⁺, Mg²⁺ va ishqoriy metallar ionlari suvli eritmada metallgacha qaytarilmaydi — ro'yxatda yo'q.
export const REDUCIBLE_IONS = [
  { ion: 'Fe^3+', to: 'Fe^2+', e: 1, E: 0.77 },
  { ion: 'Hg^2+', to: 'Hg', e: 2, E: 0.85 },
  { ion: 'Ag^+', to: 'Ag', e: 1, E: 0.80 },
  { ion: 'Cu^2+', to: 'Cu', e: 2, E: 0.34 },
  { ion: 'Pb^2+', to: 'Pb', e: 2, E: -0.13 },
  { ion: 'Sn^2+', to: 'Sn', e: 2, E: -0.14 },
  { ion: 'Ni^2+', to: 'Ni', e: 2, E: -0.25 },
  { ion: 'Co^2+', to: 'Co', e: 2, E: -0.28 },
  { ion: 'Fe^2+', to: 'Fe', e: 2, E: -0.44 },
  { ion: 'Zn^2+', to: 'Zn', e: 2, E: -0.76 },
];

// Amfoter metallarning ishqor eritmasi bilan reaksiyasi
export const METAL_ALKALI = [
  { metal: 'Al', eq: '2Al + 2OH⁻ + 6H2O = 2[Al(OH)4]⁻ + 3H2↑', heat: false },
  { metal: 'Zn', eq: 'Zn + 2OH⁻ + 2H2O = [Zn(OH)4]²⁻ + H2↑', heat: false },
  { metal: 'Sn', eq: 'Sn + 2OH⁻ + 2H2O = [Sn(OH)4]²⁻ + H2↑', heat: true },
];

// Taxminiy molyar eruvchanlik (mol/L) — faqat bir nechta cho'kma raqobatlashganda tartibni aniqlash uchun.
export const PPT_ORDER_HINT = {
  Ag2S: 1e-17, CuS: 1e-18, PbS: 1e-14, HgS: 1e-26, AgI: 9e-9, AgBr: 7e-7, AgSCN: 1e-6, AgCl: 1.3e-5, Ag2CrO4: 6.5e-5,
  BaSO4: 1e-5, PbSO4: 1.3e-4, SrSO4: 5e-4, CaSO4: 1.5e-2, BaCrO4: 1.1e-5, PbCrO4: 1.3e-7, CaC2O4: 5e-5, CaCO3: 7e-5, BaCO3: 9e-5,
  'Fe(OH)3': 1e-10, 'Al(OH)3': 1e-9, 'Cu(OH)2': 2e-7, PbI2: 1.5e-3, CaF2: 2e-4,
};

// Elektroliz qoidalari (inert elektrodlar). Kationlar katodda, anionlar anodda.
// cathode: "metal" — metall ajraladi; "metal+H2" — metall va vodorod; "H2" — faqat vodorod (suv qaytariladi).
export const ELECTROLYSIS = {
  cathode: {
    'Li^+': 'H2', 'K^+': 'H2', 'Ba^2+': 'H2', 'Ca^2+': 'H2', 'Na^+': 'H2', 'Mg^2+': 'H2', 'Al^3+': 'H2', 'NH4^+': 'H2',
    'Mn^2+': 'metal+H2', 'Zn^2+': 'metal', 'Cr^3+': 'metal+H2', 'Fe^2+': 'metal+H2', 'Ni^2+': 'metal', 'Co^2+': 'metal', 'Sn^2+': 'metal', 'Pb^2+': 'metal',
    'H^+': 'H2', 'Cu^2+': 'metal', 'Ag^+': 'metal', 'Hg^2+': 'metal',
  },
  cathode_eq: {
    H2_water: '2H2O + 2e⁻ = H2↑ + 2OH⁻',
    H2_acid: '2H⁺ + 2e⁻ = H2↑',
  },
  anode_priority: ['S^2-', 'I^-', 'Br^-', 'Cl^-', 'OH^-'],
  anode_eq: {
    'S^2-': 'S²⁻ − 2e⁻ = S',
    'I^-': '2I⁻ − 2e⁻ = I2',
    'Br^-': '2Br⁻ − 2e⁻ = Br2',
    'Cl^-': '2Cl⁻ − 2e⁻ = Cl2↑',
    'OH^-': '4OH⁻ − 4e⁻ = O2↑ + 2H2O',
    water: '2H2O − 4e⁻ = O2↑ + 4H⁺',
  },
  note_uz: "Kislorodli anionlar (SO₄²⁻, NO₃⁻, PO₄³⁻, CO₃²⁻) va F⁻ suvli eritmada oksidlanmaydi — anodda suv oksidlanib kislorod ajraladi.",
};
