// Ionlar: boshlang'ich ma'lumot (frontend/lab/data/ions.json shu fayldan yasaladi).
// color: eritma rangi `ref_M` konsentratsiyada ~1,5 sm qatlamda (taxminiy, ko'rinish uchun).
// flame: alanga rangi (sifat reaksiyasi). pKa_h: akva-ionning kislotaligi (taxminiy, faqat pH ko'rinishi uchun).

export const CATIONS = [
  { f: 'H^+', name: 'vodorod', salt: null },
  { f: 'Li^+', name: 'litiy', flame: '#d81b60', flame_uz: "to'q qizil (karmin)" },
  { f: 'Na^+', name: 'natriy', flame: '#ffb000', flame_uz: 'sariq' },
  { f: 'K^+', name: 'kaliy', flame: '#b07ee0', flame_uz: 'binafsha (och siyohrang)' },
  { f: 'NH4^+', name: 'ammoniy', pKa_h: 9.25 },
  { f: 'Ca^2+', name: 'kalsiy', flame: '#ff5a1f', flame_uz: "g'isht-qizil", pKa_h: 12.7 },
  { f: 'Mg^2+', name: 'magniy', pKa_h: 11.4 },
  { f: 'Ba^2+', name: 'bariy', flame: '#a6d22a', flame_uz: 'sarg\'ish-yashil', pKa_h: 13.4 },
  { f: 'Sr^2+', name: 'stronsiy', flame: '#ff1a2a', flame_uz: 'qizil (karmin)', pKa_h: 13.2 },
  { f: 'Al^3+', name: 'alyuminiy', pKa_h: 5.0 },
  { f: 'Zn^2+', name: 'rux', pKa_h: 9.0 },
  { f: 'Fe^2+', name: 'temir(II)', color: { hex: '#c9e6b4', ref_M: 0.5 }, pKa_h: 9.5 },
  { f: 'Fe^3+', name: 'temir(III)', color: { hex: '#d39a2a', ref_M: 0.1 }, pKa_h: 2.2 },
  { f: 'Cu^2+', name: 'mis(II)', color: { hex: '#4aa3dc', ref_M: 0.5 }, flame: '#21c47a', flame_uz: 'yashil (ko\'kimtir-yashil)', pKa_h: 7.5 },
  { f: 'Ag^+', name: 'kumush', pKa_h: 12.0 },
  { f: 'Pb^2+', name: "qo'rg'oshin(II)", pKa_h: 7.7 },
  { f: 'Mn^2+', name: 'marganes(II)', color: { hex: '#f6dfe4', ref_M: 0.5 }, pKa_h: 10.6 },
  { f: 'Cr^3+', name: 'xrom(III)', color: { hex: '#5f8a6e', ref_M: 0.2 }, pKa_h: 4.0 },
  { f: 'Ni^2+', name: 'nikel(II)', color: { hex: '#62b872', ref_M: 0.5 }, pKa_h: 9.9 },
  { f: 'Co^2+', name: 'kobalt(II)', color: { hex: '#e78fae', ref_M: 0.2 }, pKa_h: 9.6 },
  { f: 'Sn^2+', name: 'qalay(II)', pKa_h: 3.4 },
  // komplekslar va boshqa kationlar
  { f: '[Cu(NH3)4]^2+', name: 'tetraamminmis(II)', color: { hex: '#2346c8', ref_M: 0.05 }, salt: null },
  { f: '[Ag(NH3)2]^+', name: 'diamminkumush', salt: null },
  { f: '[Zn(NH3)4]^2+', name: 'tetraamminrux', salt: null },
  { f: '[Ni(NH3)6]^2+', name: 'geksaamminnikel(II)', color: { hex: '#7a7ae0', ref_M: 0.1 }, salt: null },
  { f: '[Co(NH3)6]^2+', name: 'geksaamminkobalt(II)', color: { hex: '#d9b07a', ref_M: 0.1 }, salt: null },
  { f: '[Fe(SCN)]^2+', name: 'tiotsianatotemir(III)', color: { hex: '#b3101a', ref_M: 0.002 }, salt: null },
  { f: 'Hg^2+', name: 'simob(II)', salt: null },
];

// pKa_sys: shu anion qaysi kislota-asos tizimiga tegishli (acidbase.json)
export const ANIONS = [
  { f: 'OH^-', name: 'gidroksid' },
  { f: 'F^-', name: 'ftorid' },
  { f: 'Cl^-', name: 'xlorid' },
  { f: 'Br^-', name: 'bromid' },
  { f: 'I^-', name: 'yodid' },
  { f: 'S^2-', name: 'sulfid' },
  { f: 'SO3^2-', name: 'sulfit' },
  { f: 'SO4^2-', name: 'sulfat' },
  { f: 'NO3^-', name: 'nitrat' },
  { f: 'NO2^-', name: 'nitrit' },
  { f: 'CO3^2-', name: 'karbonat' },
  { f: 'HCO3^-', name: 'gidrokarbonat' },
  { f: 'PO4^3-', name: 'fosfat' },
  { f: 'HPO4^2-', name: 'gidrofosfat' },
  { f: 'SiO3^2-', name: 'silikat' },
  { f: 'CH3COO^-', name: 'atsetat' },
  { f: 'C2O4^2-', name: 'oksalat' },
  // jadvaldan tashqari anionlar
  { f: 'H2PO4^-', name: 'digidrofosfat' },
  { f: 'HSO4^-', name: 'gidrosulfat' },
  { f: 'HSO3^-', name: 'gidrosulfit' },
  { f: 'HS^-', name: 'gidrosulfid' },
  { f: 'HC2O4^-', name: 'gidrooksalat' },
  { f: 'CrO4^2-', name: 'xromat', color: { hex: '#f2d22e', ref_M: 0.05 } },
  { f: 'Cr2O7^2-', name: 'dixromat', color: { hex: '#ef7d1a', ref_M: 0.05 } },
  { f: 'MnO4^-', name: 'permanganat', color: { hex: '#8e1a8e', ref_M: 0.002 } },
  { f: 'MnO4^2-', name: 'manganat', color: { hex: '#2f8f3a', ref_M: 0.005 } },
  { f: 'ClO3^-', name: 'xlorat' },
  { f: 'ClO^-', name: 'gipoxlorit' },
  { f: 'ClO4^-', name: 'perxlorat' },
  { f: 'S2O3^2-', name: 'tiosulfat' },
  { f: 'SCN^-', name: 'tiotsianat (rodanid)' },
  { f: '[Fe(CN)6]^4-', name: 'geksatsianoferrat(II)', color: { hex: '#f4efc0', ref_M: 0.1 } },
  { f: '[Fe(CN)6]^3-', name: 'geksatsianoferrat(III)', color: { hex: '#e8c93a', ref_M: 0.1 } },
  { f: '[Al(OH)4]^-', name: 'tetragidroksoalyuminat' },
  { f: '[Zn(OH)4]^2-', name: 'tetragidroksosinkat' },
  { f: '[Cr(OH)6]^3-', name: 'geksagidroksoxromat(III)', color: { hex: '#3f9a4a', ref_M: 0.05 } },
  { f: '[Pb(OH)4]^2-', name: 'tetragidroksoplyumbat(II)' },
  { f: '[Sn(OH)4]^2-', name: 'tetragidroksostannat(II)' },
  { f: '[Cu(OH)4]^2-', name: 'tetragidroksokuprat(II)', color: { hex: '#3c6fd0', ref_M: 0.05 } },
  { f: 'I3^-', name: 'triyodid', color: { hex: '#a8561b', ref_M: 0.005 } },
  { f: 'HCOO^-', name: 'formiat' },
  { f: 'C2H5COO^-', name: 'propionat' },
  { f: 'C3H7COO^-', name: 'butirat' },
  { f: 'C6H5COO^-', name: 'benzoat' },
  { f: 'C17H35COO^-', name: 'stearat' },
  { f: 'C6H5O^-', name: 'fenolyat' },
  { f: 'CH3CH(OH)COO^-', name: 'laktat' },
  { f: 'AlO2^-', name: 'metaalyuminat', salt: null },
  { f: '[Ag(S2O3)2]^3-', name: 'ditiosulfatoargentat(I)' },
  { f: '[HgI4]^2-', name: 'tetrayodomerkurat(II)' },
  { f: 'C3H5O(COO)3^3-', name: 'sitrat' },
  { f: 'C6H4(OH)COO^-', name: 'salitsilat' },
];

// Eruvchanlik jadvali (maktab jadvali). Ustunlar tartibi = ANION_ORDER.
// R — eriydi, M — kam eriydi, N — erimaydi, "-" — suvda mavjud emas / parchalanadi yoki laboratoriyada ishlatilmaydi.
export const ANION_ORDER = ['OH^-', 'F^-', 'Cl^-', 'Br^-', 'I^-', 'S^2-', 'SO3^2-', 'SO4^2-', 'NO3^-', 'NO2^-', 'CO3^2-', 'HCO3^-', 'PO4^3-', 'HPO4^2-', 'SiO3^2-', 'CH3COO^-', 'C2O4^2-'];
export const SOLUBILITY = {
  //            OH F  Cl Br I  S  SO3 SO4 NO3 NO2 CO3 HCO3 PO4 HPO4 SiO3 Ac C2O4
  'Li^+':      'R  M  R  R  R  R  R   R   R   R   M   -    M   -    -    R  R',
  'Na^+':      'R  R  R  R  R  R  R   R   R   R   R   R    R   R    R    R  R',
  'K^+':       'R  R  R  R  R  R  R   R   R   R   R   R    R   R    R    R  R',
  'NH4^+':     'R  R  R  R  R  R  R   R   R   R   R   R    R   R    -    R  R',
  'Ba^2+':     'R  M  R  R  R  R  N   N   R   R   N   R    N   N    N    R  N',
  'Ca^2+':     'M  N  R  R  R  M  N   M   R   R   N   R    N   N    N    R  N',
  'Sr^2+':     'M  N  R  R  R  R  N   N   R   R   N   R    N   N    N    R  N',
  'Mg^2+':     'N  N  R  R  R  -  M   R   R   -   M   R    N   M    N    R  M',
  'Al^3+':     'N  M  R  R  R  -  -   R   R   -   -   -    N   -    -    -  -',
  'Cr^3+':     'N  M  R  R  R  -  -   R   R   -   -   -    N   -    -    -  -',
  'Fe^2+':     'N  M  R  R  R  N  N   R   R   -   N   -    N   -    N    R  N',
  'Fe^3+':     'N  M  R  R  -  -  -   R   R   -   -   -    N   -    -    R  -',
  'Zn^2+':     'N  M  R  R  R  N  N   R   R   -   N   -    N   -    N    R  N',
  'Mn^2+':     'N  M  R  R  R  N  N   R   R   -   N   -    N   -    N    R  N',
  'Ni^2+':     'N  M  R  R  R  N  N   R   R   -   N   -    N   -    N    R  N',
  'Co^2+':     'N  M  R  R  R  N  N   R   R   -   N   -    N   -    N    R  N',
  'Cu^2+':     'N  M  R  R  -  N  -   R   R   -   -   -    N   -    N    R  N',
  'Ag^+':      '-  R  N  N  N  N  N   M   R   M   N   -    N   -    -    M  N',
  'Pb^2+':     'N  M  M  M  N  N  N   N   R   -   N   -    N   -    N    R  N',
  'Sn^2+':     'N  R  R  R  M  N  -   R   -   -   -   -    N   -    -    -  -',
};

// Jadvaldan tashqari cho'kmalar (umumiy qoida uchun)
export const EXTRA_INSOLUBLE = [
  { cation: 'Ba^2+', anion: 'CrO4^2-', code: 'N' },
  { cation: 'Pb^2+', anion: 'CrO4^2-', code: 'N' },
  { cation: 'Ag^+', anion: 'CrO4^2-', code: 'N' },
  { cation: 'Sr^2+', anion: 'CrO4^2-', code: 'M' },
  { cation: 'Ca^2+', anion: 'C17H35COO^-', code: 'N' },
  { cation: 'Mg^2+', anion: 'C17H35COO^-', code: 'N' },
  { cation: 'Ba^2+', anion: 'C17H35COO^-', code: 'N' },
  { cation: 'Ag^+', anion: 'SCN^-', code: 'N' },
  { cation: 'Ag^+', anion: 'S2O3^2-', code: 'N' },
  { cation: 'Ag^+', anion: 'C6H5COO^-', code: 'M' },
  { cation: 'Ca^2+', anion: 'C3H5O(COO)3^3-', code: 'M' },
];

// "M" (kam eriydi) birikmalar uchun taxminiy eruvchanlik, g/L (20–25 °C); yo'q bo'lsa 1 g/L olinadi.
export const SLIGHT_SOLUBILITY_GL = {
  'Ca(OH)2': 1.7, CaSO4: 2.0, 'Sr(OH)2': 8, PbCl2: 10, PbBr2: 9, Ag2SO4: 8, Li2CO3: 13, LiF: 1.3,
  BaF2: 1.6, MgSO3: 5, MgCO3: 0.1, MgC2O4: 0.4, MgHPO4: 0.25, SnI2: 9, CH3COOAg: 10, AgNO2: 3.4, Li3PO4: 0.27,
  CaS: 0.2, PbF2: 0.6, SrCrO4: 1.2, ZnF2: 16, FeF2: 0.6, FeF3: 9, AlF3: 6, CrF3: 5, MnF2: 1, NiF2: 25, CoF2: 14, CuF2: 7.5,
};

// Eruvchanlik jadvalidagi "-" kataklari uchun ma'lum natijalar (birgalikdagi gidroliz, oksidlanish-qaytarilish).
// Dvigatel bu juftlar uchrashganda shu tenglama bo'yicha reaksiya bajaradi.
export const SPECIAL_PAIRS = [
  { cation: 'Al^3+', anion: 'CO3^2-', eq: '2Al³⁺ + 3CO3²⁻ + 3H2O = 2Al(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Al^3+', anion: 'HCO3^-', eq: 'Al³⁺ + 3HCO3⁻ = Al(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Al^3+', anion: 'S^2-', eq: '2Al³⁺ + 3S²⁻ + 6H2O = 2Al(OH)3↓ + 3H2S↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Al^3+', anion: 'SO3^2-', eq: '2Al³⁺ + 3SO3²⁻ + 3H2O = 2Al(OH)3↓ + 3SO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Cr^3+', anion: 'CO3^2-', eq: '2Cr³⁺ + 3CO3²⁻ + 3H2O = 2Cr(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Cr^3+', anion: 'S^2-', eq: '2Cr³⁺ + 3S²⁻ + 6H2O = 2Cr(OH)3↓ + 3H2S↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Cr^3+', anion: 'HCO3^-', eq: 'Cr³⁺ + 3HCO3⁻ = Cr(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Fe^3+', anion: 'CO3^2-', eq: '2Fe³⁺ + 3CO3²⁻ + 3H2O = 2Fe(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Fe^3+', anion: 'HCO3^-', eq: 'Fe³⁺ + 3HCO3⁻ = Fe(OH)3↓ + 3CO2↑', note_uz: 'birgalikdagi gidroliz' },
  { cation: 'Fe^3+', anion: 'S^2-', eq: '2Fe³⁺ + 3S²⁻ = 2FeS↓ + S↓', note_uz: 'oksidlanish-qaytarilish va cho\'kma' },
  { cation: 'Fe^3+', anion: 'I^-', eq: '2Fe³⁺ + 2I⁻ = 2Fe²⁺ + I2', note_uz: 'oksidlanish-qaytarilish' },
  { cation: 'Fe^3+', anion: 'SO3^2-', eq: '2Fe³⁺ + SO3²⁻ + H2O = 2Fe²⁺ + SO4²⁻ + 2H⁺', note_uz: 'oksidlanish-qaytarilish' },
  { cation: 'Cu^2+', anion: 'I^-', eq: '2Cu²⁺ + 4I⁻ = 2CuI↓ + I2', note_uz: 'oksidlanish-qaytarilish va cho\'kma' },
  { cation: 'Cu^2+', anion: 'CO3^2-', eq: '2Cu²⁺ + 2CO3²⁻ + H2O = (CuOH)2CO3↓ + CO2↑', note_uz: 'asosli tuz (malaxit) hosil bo\'ladi' },
  { cation: 'Ag^+', anion: 'OH^-', eq: '2Ag⁺ + 2OH⁻ = Ag2O↓ + H2O', note_uz: 'AgOH beqaror, darhol Ag₂O ga aylanadi' },
  { cation: 'Mg^2+', anion: 'S^2-', eq: 'Mg²⁺ + S²⁻ + 2H2O = Mg(OH)2↓ + H2S↑', note_uz: 'birgalikdagi gidroliz' },
];
